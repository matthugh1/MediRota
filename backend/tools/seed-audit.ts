#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuditResult {
  name: string;
  status: 'PASS' | 'FAIL';
  details: string;
  expected?: any;
  actual?: any;
}

async function auditSeedData(): Promise<AuditResult[]> {
  const results: AuditResult[] = [];

  console.log('🔍 AUDITING SEED DATA COMPLETENESS');
  console.log('=' .repeat(60));

  // 1. Check Wards
  try {
    const wards = await prisma.ward.findMany();
    const wardNames = wards.map(w => w.name);
    const hasRequiredWards = wardNames.includes('Emergency Ward') && 
                           wardNames.includes('Radiology Ward') && 
                           wardNames.includes('ICU Ward');
    
    results.push({
      name: 'Wards',
      status: hasRequiredWards ? 'PASS' : 'FAIL',
      details: `Found ${wards.length} wards`,
      expected: 'Emergency Ward, Radiology Ward, ICU Ward',
      actual: wardNames.join(', ')
    });
  } catch (error) {
    results.push({
      name: 'Wards',
      status: 'FAIL',
      details: `Error: ${error}`
    });
  }

  // 2. Check Shift Types
  try {
    const shiftTypes = await prisma.shiftType.findMany();
    const hasDayShift = shiftTypes.some(st => st.code === 'DAY' && st.durationMinutes === 480);
    const hasEveningShift = shiftTypes.some(st => st.code === 'EVENING' && st.durationMinutes === 480);
    const hasNightShift = shiftTypes.some(st => st.code === 'NIGHT' && st.durationMinutes === 480);
    
    results.push({
      name: 'Shift Types',
      status: (hasDayShift && hasEveningShift && hasNightShift) ? 'PASS' : 'FAIL',
      details: `Found ${shiftTypes.length} shift types`,
      expected: 'DAY, EVENING, NIGHT (480min each)',
      actual: shiftTypes.map(st => `${st.code}(${st.durationMinutes}min)`).join(', ')
    });
  } catch (error) {
    results.push({
      name: 'Shift Types',
      status: 'FAIL',
      details: `Error: ${error}`
    });
  }

  // 3. Check Skills
  try {
    const skills = await prisma.skill.findMany();
    const skillCodes = skills.map(s => s.code);
    const requiredSkills = ['MRI', 'XRay', 'Bloods', 'GeneralCare', 'DoctorMRI', 'DoctorXRay'];
    const hasAllSkills = requiredSkills.every(skill => skillCodes.includes(skill));
    
    results.push({
      name: 'Skills',
      status: hasAllSkills ? 'PASS' : 'FAIL',
      details: `Found ${skills.length} skills`,
      expected: requiredSkills.join(', '),
      actual: skillCodes.join(', ')
    });
  } catch (error) {
    results.push({
      name: 'Skills',
      status: 'FAIL',
      details: `Error: ${error}`
    });
  }

  // 4. Check Staff Count and Distribution
  try {
    const staff = await prisma.staff.findMany({
      include: {
        job: true,
        skills: true,
        wards: true
      }
    });
    
    const staffByJob = staff.reduce((acc, s) => {
      acc[s.job.name] = (acc[s.job.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const staffBySkill = staff.reduce((acc, s) => {
      s.skills.forEach(skill => {
        acc[skill.name] = (acc[skill.name] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
    
    results.push({
      name: 'Staff Count',
      status: staff.length >= 12 ? 'PASS' : 'FAIL',
      details: `Found ${staff.length} staff members`,
      expected: '>= 12',
      actual: staff.length.toString()
    });

    results.push({
      name: 'Staff by Job',
      status: 'PASS',
      details: 'Job distribution',
      actual: JSON.stringify(staffByJob)
    });

    results.push({
      name: 'Staff by Skill',
      status: 'PASS',
      details: 'Skill distribution',
      actual: JSON.stringify(staffBySkill)
    });
  } catch (error) {
    results.push({
      name: 'Staff',
      status: 'FAIL',
      details: `Error: ${error}`
    });
  }

  // 5. Check Policies
  try {
    const policies = await prisma.policy.findMany({
      where: { isActive: true }
    });
    
    const orgPolicy = policies.find(p => p.scope === 'ORG');
    const wardPolicies = policies.filter(p => p.scope === 'WARD');
    
    results.push({
      name: 'Policies',
      status: orgPolicy ? 'PASS' : 'FAIL',
      details: `Found ${policies.length} active policies`,
      expected: 'At least 1 ORG policy',
      actual: `ORG: ${orgPolicy ? 'YES' : 'NO'}, WARD: ${wardPolicies.length}`
    });
  } catch (error) {
    results.push({
      name: 'Policies',
      status: 'FAIL',
      details: `Error: ${error}`
    });
  }

  // 6. Check Schedule
  try {
    const schedules = await prisma.schedule.findMany({
      where: {
        horizonStart: { gte: new Date('2025-01-01') },
        horizonEnd: { lte: new Date('2025-01-14') }
      }
    });
    
    const demoSchedule = schedules.find(s => 
      s.horizonStart.getTime() === new Date('2025-01-01').getTime() &&
      s.horizonEnd.getTime() === new Date('2025-01-14').getTime()
    );
    
    results.push({
      name: 'Demo Schedule',
      status: demoSchedule ? 'PASS' : 'FAIL',
      details: `Found ${schedules.length} schedules in Jan 1-14 range`,
      expected: 'Schedule covering Jan 1-14 exists',
      actual: demoSchedule ? 'Found' : 'Not found'
    });
  } catch (error) {
    results.push({
      name: 'Demo Schedule',
      status: 'FAIL',
      details: `Error: ${error}`
    });
  }

  // 7. Check Demand
  try {
    const demand = await prisma.demand.findMany({
      where: {
        date: {
          gte: new Date('2025-01-01'),
          lte: new Date('2025-01-14')
        }
      }
    });
    
    const expectedDemandRows = 14 * 3 * 3; // 14 days × 3 wards × 3 shifts
    const hasExpectedDemand = demand.length >= expectedDemandRows * 0.8; // Allow some flexibility
    
    results.push({
      name: 'Demand',
      status: hasExpectedDemand ? 'PASS' : 'FAIL',
      details: `Found ${demand.length} demand rows`,
      expected: `~${expectedDemandRows} (14×3×3)`,
      actual: demand.length.toString()
    });
  } catch (error) {
    results.push({
      name: 'Demand',
      status: 'FAIL',
      details: `Error: ${error}`
    });
  }

  // 8. Check Rules (if they exist in the schema)
  try {
    // Check if RuleSet model exists and has rules for demo schedule
    const ruleSets = await prisma.ruleSet.findMany({
      where: {
        ward: {
          schedules: {
            some: {
              horizonStart: { gte: new Date('2025-01-01') },
              horizonEnd: { lte: new Date('2025-01-14') }
            }
          }
        }
      },
      include: {
        rules: true
      }
    });
    
    const hasRules = ruleSets.length > 0 && ruleSets.some(rs => rs.rules.length > 0);
    
    results.push({
      name: 'Schedule Rules',
      status: hasRules ? 'PASS' : 'FAIL',
      details: `Found ${ruleSets.length} rule sets for demo schedule`,
      expected: 'At least 1 rule set with rules',
      actual: hasRules ? 'Found' : 'Not found'
    });
  } catch (error) {
    results.push({
      name: 'Schedule Rules',
      status: 'FAIL',
      details: `Error: ${error}`
    });
  }

  return results;
}

async function main() {
  try {
    const results = await auditSeedData();
    
    console.log('\n📊 AUDIT RESULTS');
    console.log('=' .repeat(60));
    
    let passCount = 0;
    let failCount = 0;
    
    for (const result of results) {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      const color = result.status === 'PASS' ? '\x1b[32m' : '\x1b[31m';
      const reset = '\x1b[0m';
      
      console.log(`${icon} ${color}${result.name}${reset}: ${result.details}`);
      
      if (result.expected && result.actual) {
        console.log(`   Expected: ${result.expected}`);
        console.log(`   Actual:   ${result.actual}`);
      }
      
      if (result.status === 'PASS') {
        passCount++;
      } else {
        failCount++;
      }
      
      console.log('');
    }
    
    console.log('=' .repeat(60));
    console.log(`📈 SUMMARY: ${passCount} PASS, ${failCount} FAIL`);
    
    if (failCount === 0) {
      console.log('🎉 All checks passed! Seed data is complete.');
    } else {
      console.log('⚠️  Some checks failed. Consider running seed extensions.');
    }
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Always run main
main();

export { auditSeedData };

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePolicyDto, UpdatePolicyDto } from './dto/index.js';
import { Policy } from '@prisma/client';
import { SCOPE_LEVELS } from '../common/constants.js';

@Injectable()
export class PolicyService {
  private readonly logger = new Logger(PolicyService.name);
  private policyCache = new Map<string, Policy>();

  constructor(private prisma: PrismaService) {}

  async create(createPolicyDto: CreatePolicyDto): Promise<Policy> {
    this.logger.log(`Creating policy: ${createPolicyDto.label}`);
    this.invalidateCache();
    
    const { rules, ...policyData } = createPolicyDto;
    
    return this.prisma.policy.create({
      data: {
        ...policyData,
        weights: policyData.weights as any,
        limits: policyData.limits as any,
        toggles: policyData.toggles as any,
        substitution: policyData.substitution as any,
        rules: rules as any,
        trustId: null,
        hospitalId: null,
      },
    });
  }

  async findAll(): Promise<Policy[]> {
    return this.prisma.policy.findMany({
      orderBy: [
        { scope: 'asc' },
        { createdAt: 'desc' }
      ],
    });
  }

  async findOne(id: string): Promise<Policy> {
    return this.prisma.policy.findUniqueOrThrow({
      where: { id },
    });
  }

  async update(id: string, updatePolicyDto: UpdatePolicyDto): Promise<Policy> {
    this.logger.log(`Updating policy: ${id}`);
    this.invalidateCache();
    
    const updateData: any = { ...updatePolicyDto };
    if (updatePolicyDto.weights) updateData.weights = updatePolicyDto.weights as any;
    if (updatePolicyDto.limits) updateData.limits = updatePolicyDto.limits as any;
    if (updatePolicyDto.toggles) updateData.toggles = updatePolicyDto.toggles as any;
    if (updatePolicyDto.substitution) updateData.substitution = updatePolicyDto.substitution as any;
    
    return this.prisma.policy.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string): Promise<Policy> {
    this.logger.log(`Deactivating policy: ${id}`);
    this.invalidateCache();
    
    return this.prisma.policy.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getEffectivePolicy(args: { 
    wardId?: string; 
  }): Promise<Policy> {
    const cacheKey = `${args.wardId || 'none'}`;
    
    if (this.policyCache.has(cacheKey)) {
      return this.policyCache.get(cacheKey)!;
    }

    let policy: Policy | null = null;

    // 1. Try WARD level (highest precedence)
    if (args.wardId) {
      policy = await this.prisma.policy.findFirst({
        where: {
          scope: SCOPE_LEVELS.WARD,
          wardId: args.wardId,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // 2. Fall back to TRUST level (lowest precedence)
    if (!policy) {
      policy = await this.prisma.policy.findFirst({
        where: {
          scope: SCOPE_LEVELS.TRUST,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // 3. If no policy exists, return default values
    if (!policy) {
      this.logger.warn('No active policy found, using defaults');
      policy = this.getDefaultPolicy();
    }

    this.policyCache.set(cacheKey, policy);
    return policy;
  }

  private getDefaultPolicy(): Policy {
    return {
      id: 'default',
      scope: SCOPE_LEVELS.TRUST,
      orgId: null,
      wardId: null,
      trustId: null,
      hospitalId: null,
      rules: [],
      weights: {
        unmet: 1000000,
        overtime: 10000,
        fairness: 100,
        prefs: 1,
        substitutes: 50000,
        flex: 5000
      },
      limits: {
        maxOvertimePerWeekMinutes: 480,
        maxFlexShiftsPerWeek: 1
      },
      toggles: {
        enableWardFlex: true,
        enableSubstitution: true
      },
      substitution: {
        MRI: ["MRI", "DoctorMRI"],
        XRay: ["XRay", "DoctorXRay"],
        Bloods: ["Bloods", "GeneralCare"]
      },
      timeBudgetMs: 60000,
      label: "Default Policy",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Policy;
  }

  private invalidateCache(): void {
    this.policyCache.clear();
  }




}

#!/usr/bin/env python3
"""
Minimal test script for the rota solver
Tests with 1 ward, 3 staff, 1 shift type, 2 days
"""

import requests
import json
from datetime import datetime, timedelta

# Test data
def create_minimal_test_data():
    """Create minimal test data for solver validation"""
    
    # Calculate dates for next 2 days
    today = datetime.now()
    date1 = (today + timedelta(days=1)).strftime('%Y-%m-%d')
    date2 = (today + timedelta(days=2)).strftime('%Y-%m-%d')
    
    test_data = {
        "wardId": "test-ward-1",
        "horizonStart": date1,
        "horizonEnd": date2,
        "staff": [
            {
                "id": "staff-1",
                "role": "nurse",
                "skills": ["resus", "ventilator"],
                "wards": ["test-ward-1"],
                "contractHoursPerWeek": 37.5
            },
            {
                "id": "staff-2", 
                "role": "nurse",
                "skills": ["resus"],
                "wards": ["test-ward-1"],
                "contractHoursPerWeek": 37.5
            },
            {
                "id": "staff-3",
                "role": "doctor", 
                "skills": ["ventilator"],
                "wards": ["test-ward-1"],
                "contractHoursPerWeek": 40.0
            }
        ],
        "demands": [
            {
                "date": date1,
                "slot": "night",
                "requiredBySkill": {
                    "resus": 1,
                    "ventilator": 1
                }
            },
            {
                "date": date2,
                "slot": "night", 
                "requiredBySkill": {
                    "resus": 1,
                    "ventilator": 1
                }
            }
        ],
        "shiftTypes": [
            {
                "id": "night-shift",
                "code": "night",
                "startTime": "20:00",
                "endTime": "08:00", 
                "isNight": True,
                "durationMinutes": 720
            }
        ],
        "rules": [
            {
                "key": "minRestHours",
                "value": "11"
            },
            {
                "key": "maxConsecutiveNights", 
                "value": "3"
            },
            {
                "key": "oneShiftPerDay",
                "value": "true"
            }
        ],
        "preferences": [],
        "locks": [],
        "timeBudgetMs": 30000
    }
    
    return test_data

def test_solver():
    """Test the solver with minimal data"""
    
    print("🧪 Testing Rota Solver with Minimal Data")
    print("=" * 50)
    
    # Create test data
    test_data = create_minimal_test_data()
    
    print(f"📋 Test Data:")
    print(f"   - Ward: {test_data['wardId']}")
    print(f"   - Staff: {len(test_data['staff'])} members")
    print(f"   - Demands: {len(test_data['demands'])} days")
    print(f"   - Shift Types: {len(test_data['shiftTypes'])}")
    print(f"   - Rules: {len(test_data['rules'])}")
    
    # Test solver endpoint
    try:
        print(f"\n🚀 Calling solver endpoint...")
        response = requests.post(
            "http://localhost:8090/solve_full",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Solver succeeded!")
            
            print(f"\n📊 Results:")
            print(f"   - Status: {result['diagnostics']['status']}")
            print(f"   - Assignments: {len(result['assignments'])}")
            print(f"   - Solve Time: {result['metrics']['solveTimeMs']}ms")
            print(f"   - Objective: {result['metrics']['objective']}")
            print(f"   - Unfilled Demand: {result['metrics']['unfilledDemand']}")
            print(f"   - Fairness Score: {result['metrics']['fairnessScore']:.3f}")
            print(f"   - Preference Score: {result['metrics']['preferenceScore']:.3f}")
            
            print(f"\n👥 Assignments:")
            for assignment in result['assignments']:
                print(f"   - {assignment['staffId']} -> {assignment['date']} {assignment['slot']}")
                
            # Validate solution
            validate_solution(test_data, result)
            
        else:
            print(f"❌ Solver failed with status {response.status_code}")
            print(f"Error: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def validate_solution(input_data, result):
    """Validate the solver solution"""
    print(f"\n🔍 Validating Solution:")
    
    # Check if all demands are met
    demands_met = True
    for demand in input_data['demands']:
        date = demand['date']
        slot = demand['slot']
        
        for skill, required_count in demand['requiredBySkill'].items():
            assigned_count = 0
            for assignment in result['assignments']:
                if assignment['date'] == date and assignment['slot'] == slot:
                    # Check if assigned staff has the required skill
                    for staff in input_data['staff']:
                        if staff['id'] == assignment['staffId'] and skill in staff['skills']:
                            assigned_count += 1
                            break
            
            if assigned_count < required_count:
                print(f"   ❌ Demand not met: {date} {slot} {skill} (required: {required_count}, assigned: {assigned_count})")
                demands_met = False
            else:
                print(f"   ✅ Demand met: {date} {slot} {skill} (required: {required_count}, assigned: {assigned_count})")
    
    # Check one shift per day constraint
    one_shift_per_day = True
    for staff in input_data['staff']:
        shifts_per_day = {}
        for assignment in result['assignments']:
            if assignment['staffId'] == staff['id']:
                if assignment['date'] not in shifts_per_day:
                    shifts_per_day[assignment['date']] = 0
                shifts_per_day[assignment['date']] += 1
                
                if shifts_per_day[assignment['date']] > 1:
                    print(f"   ❌ Multiple shifts per day: {staff['id']} on {assignment['date']}")
                    one_shift_per_day = False
    
    if one_shift_per_day:
        print(f"   ✅ One shift per day constraint satisfied")
    
    # Overall validation
    if demands_met and one_shift_per_day:
        print(f"   🎉 Solution is valid!")
    else:
        print(f"   ⚠️  Solution has issues")

if __name__ == "__main__":
    test_solver()

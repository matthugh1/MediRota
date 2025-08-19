#!/usr/bin/env python3
"""
End-to-end test harness for MediRota solver pipeline.

Generates realistic test data, calls the solver API, and validates results
to create a self-contained test package for analysis.
"""

import argparse
import json
import os
import sys
import subprocess
import requests
from datetime import datetime, date, timedelta
from typing import Dict, List, Any
import random


def generate_test_payload() -> Dict[str, Any]:
    """Generate a realistic test JSON payload for the solver."""
    print("Generating test payload...")
    
    # Set up test parameters
    start_date = date(2025, 1, 1)
    end_date = start_date + timedelta(days=13)  # 14 days
    
    # Define wards
    wards = [
        {"id": "WardA", "name": "Emergency Ward"},
        {"id": "WardB", "name": "Radiology Ward"}
    ]
    
    # Define shift types with realistic durations
    shift_types = [
        {
            "id": "day",
            "code": "DAY",
            "start": "08:00",
            "end": "16:00",
            "isNight": False,
            "durationMinutes": 480  # 8 hours
        },
        {
            "id": "evening",
            "code": "EVENING", 
            "start": "16:00",
            "end": "00:00",
            "isNight": False,
            "durationMinutes": 480  # 8 hours
        },
        {
            "id": "night",
            "code": "NIGHT",
            "start": "00:00",
            "end": "08:00",
            "isNight": True,
            "durationMinutes": 480  # 8 hours
        }
    ]
    
    # Define staff with varied contract hours and skills
    staff = []
    
    # Doctors (40h/week)
    for i in range(1, 5):
        staff.append({
            "id": f"doc{i}",
            "fullName": f"Doctor {i}",
            "job": "doctor",
            "contractHoursPerWeek": 40.0,
            "skills": ["MRI", "XRay", "General"],
            "eligibleWards": ["WardA", "WardB"]
        })
    
    # Nurses (37.5h/week)
    for i in range(1, 6):
        staff.append({
            "id": f"nurse{i}",
            "fullName": f"Nurse {i}",
            "job": "nurse",
            "contractHoursPerWeek": 37.5,
            "skills": ["General"],
            "eligibleWards": ["WardA", "WardB"]
        })
    
    # Radiographers (20h/week - part-time)
    for i in range(1, 4):
        staff.append({
            "id": f"radio{i}",
            "fullName": f"Radiographer {i}",
            "job": "radiographer",
            "contractHoursPerWeek": 20.0,
            "skills": ["MRI", "XRay"],
            "eligibleWards": ["WardB"]  # Only radiology ward
        })
    
    # Generate demand for each day
    demand = []
    current_date = start_date
    
    while current_date <= end_date:
        date_str = current_date.isoformat()
        
        # WardA demand (Emergency - more general skills needed)
        for shift in shift_types:
            # Vary demand based on day of week and shift
            if current_date.weekday() < 5:  # Weekdays
                if shift["code"] == "DAY":
                    demand.append({
                        "wardId": "WardA",
                        "date": date_str,
                        "slot": shift["code"],
                        "requirements": {"General": 2, "MRI": 1}
                    })
                elif shift["code"] == "EVENING":
                    demand.append({
                        "wardId": "WardA",
                        "date": date_str,
                        "slot": shift["code"],
                        "requirements": {"General": 2}
                    })
                else:  # NIGHT
                    demand.append({
                        "wardId": "WardA",
                        "date": date_str,
                        "slot": shift["code"],
                        "requirements": {"General": 1}
                    })
            else:  # Weekends - reduced demand
                if shift["code"] == "DAY":
                    demand.append({
                        "wardId": "WardA",
                        "date": date_str,
                        "slot": shift["code"],
                        "requirements": {"General": 1}
                    })
                elif shift["code"] == "EVENING":
                    demand.append({
                        "wardId": "WardA",
                        "date": date_str,
                        "slot": shift["code"],
                        "requirements": {"General": 1}
                    })
                else:  # NIGHT
                    demand.append({
                        "wardId": "WardA",
                        "date": date_str,
                        "slot": shift["code"],
                        "requirements": {"General": 1}
                    })
        
        # WardB demand (Radiology - more specialized skills)
        for shift in shift_types:
            if current_date.weekday() < 5:  # Weekdays
                if shift["code"] == "DAY":
                    demand.append({
                        "wardId": "WardB",
                        "date": date_str,
                        "slot": shift["code"],
                        "requirements": {"MRI": 1, "XRay": 1}
                    })
                elif shift["code"] == "EVENING":
                    demand.append({
                        "wardId": "WardB",
                        "date": date_str,
                        "slot": shift["code"],
                        "requirements": {"XRay": 1}
                    })
                else:  # NIGHT
                    demand.append({
                        "wardId": "WardB",
                        "date": date_str,
                        "slot": shift["code"],
                        "requirements": {"MRI": 1}
                    })
            else:  # Weekends - minimal radiology demand
                if shift["code"] == "DAY":
                    demand.append({
                        "wardId": "WardB",
                        "date": date_str,
                        "slot": shift["code"],
                        "requirements": {"MRI": 1}
                    })
                elif shift["code"] == "EVENING":
                    demand.append({
                        "wardId": "WardB",
                        "date": date_str,
                        "slot": shift["code"],
                        "requirements": {"XRay": 1}
                    })
                else:  # NIGHT
                    demand.append({
                        "wardId": "WardB",
                        "date": date_str,
                        "slot": shift["code"],
                        "requirements": {"XRay": 1}
                    })
        
        current_date += timedelta(days=1)
    
    # Build the complete payload
    payload = {
        "horizon": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat()
        },
        "wards": wards,
        "shiftTypes": shift_types,
        "staff": staff,
        "demand": demand,
        "rules": {
            "minRestHours": 11,
            "maxConsecutiveNights": 3,
            "oneShiftPerDay": True
        },
        "locks": [],
        "preferences": [],
        "objective": "min_soft_penalties",
        "timeBudgetMs": 300000,
        "hints": []
    }
    
    return payload


def call_solver_api(payload: Dict[str, Any], api_url: str) -> Dict[str, Any]:
    """Call the solver API with the test payload."""
    print(f"Calling solver API at {api_url}...")
    
    try:
        response = requests.post(
            api_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=600  # 10 minute timeout
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Failed to call solver API: {e}")
        sys.exit(1)


def get_solver_debug_info(debug_url: str) -> Dict[str, Any]:
    """Get the solver's debug information."""
    print("Getting solver debug information...")
    
    try:
        response = requests.get(debug_url, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"WARNING: Failed to get debug info: {e}")
        return {"error": str(e)}


def run_validator(request_path: str, response_path: str, outdir: str) -> str:
    """Run the validation script and capture output."""
    print("Running validator...")
    
    try:
        # Create CSV subdirectory
        csv_dir = os.path.join(outdir, "csv")
        os.makedirs(csv_dir, exist_ok=True)
        
        # Run the validator
        result = subprocess.run([
            sys.executable, "validate_solution.py",
            "--request", request_path,
            "--response", response_path,
            "--outdir", csv_dir
        ], capture_output=True, text=True, cwd=".")
        
        if result.returncode not in [0, 2]:  # 0=success, 2=unmet demand (expected)
            print(f"ERROR: Validator failed with return code {result.returncode}")
            print(f"STDOUT: {result.stdout}")
            print(f"STDERR: {result.stderr}")
            sys.exit(1)
        
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"ERROR: Failed to run validator: {e}")
        sys.exit(1)


def create_schedule_in_backend(schedule_id: str) -> bool:
    """No-op: schedule creation is disabled for demo runs."""
    print(f"Skipping schedule creation for: {schedule_id}")
    return True

def main():
    """Main test harness function."""
    parser = argparse.ArgumentParser(description='End-to-end test harness for MediRota solver')
    parser.add_argument('--outdir', default='./e2e_tests', help='Output directory for test files')
    parser.add_argument('--api-url', default='http://localhost:8090/solve_full', help='Solver API URL')
    parser.add_argument('--debug-url', default='http://localhost:8090/_debug/last', help='Solver debug URL')
    parser.add_argument('--schedule', default='sched-demo-14d', help='Schedule ID to use for testing')
    
    args = parser.parse_args()
    
    # Create output directory
    os.makedirs(args.outdir, exist_ok=True)
    
    print("=" * 60)
    print("MEDIROTA END-TO-END TEST HARNESS")
    print("=" * 60)
    print(f"Output directory: {args.outdir}")
    print(f"Solver API: {args.api_url}")
    print(f"Debug URL: {args.debug_url}")
    print(f"Schedule ID: {args.schedule}")
    print()
    
    # Step 0: Schedule creation intentionally skipped
    
    # Step 1: Generate test payload
    payload = generate_test_payload()
    
    # Save request JSON
    request_path = os.path.join(args.outdir, "solver_request.json")
    with open(request_path, 'w') as f:
        json.dump(payload, f, indent=2)
    print(f"✅ Saved request to: {request_path}")
    
    # Step 2: Call solver API
    response_data = call_solver_api(payload, args.api_url)
    
    # Save response JSON
    response_path = os.path.join(args.outdir, "solver_response.json")
    with open(response_path, 'w') as f:
        json.dump(response_data, f, indent=2)
    print(f"✅ Saved response to: {response_path}")
    
    # Step 3: Get debug information
    debug_data = get_solver_debug_info(args.debug_url)
    
    # Save debug JSON
    debug_path = os.path.join(args.outdir, "solver_debug_last.json")
    with open(debug_path, 'w') as f:
        json.dump(debug_data, f, indent=2)
    print(f"✅ Saved debug info to: {debug_path}")
    
    # Step 4: Run validator
    validator_output = run_validator(request_path, response_path, args.outdir)
    
    # Save validator output
    summary_path = os.path.join(args.outdir, "summary.txt")
    with open(summary_path, 'w') as f:
        f.write(validator_output)
    print(f"✅ Saved validator summary to: {summary_path}")
    
    # Print validator output to console
    print("\n" + "=" * 60)
    print("VALIDATOR OUTPUT")
    print("=" * 60)
    print(validator_output)
    
    # Verify all required files exist
    print("\n" + "=" * 60)
    print("TEST PACKAGE VERIFICATION")
    print("=" * 60)
    
    required_files = [
        "solver_request.json",
        "solver_response.json", 
        "solver_debug_last.json",
        "summary.txt"
    ]
    
    csv_files = [
        "csv/staff_hours.csv",
        "csv/per_cell_coverage.csv",
        "csv/per_date_coverage.csv"
    ]
    
    all_files_exist = True
    
    for file_name in required_files:
        file_path = os.path.join(args.outdir, file_name)
        if os.path.exists(file_path):
            print(f"✅ {file_name}")
        else:
            print(f"❌ {file_name} - MISSING")
            all_files_exist = False
    
    print("\nCSV Files:")
    for file_name in csv_files:
        file_path = os.path.join(args.outdir, file_name)
        if os.path.exists(file_path):
            print(f"✅ {file_name}")
        else:
            print(f"❌ {file_name} - MISSING")
            all_files_exist = False
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)
    
    if all_files_exist:
        print("✅ All required files created successfully!")
        print(f"📁 Test package location: {os.path.abspath(args.outdir)}")
        print("\nFiles ready for analysis:")
        print("  - solver_request.json: Test payload")
        print("  - solver_response.json: Solver response")
        print("  - solver_debug_last.json: Solver debug info")
        print("  - summary.txt: Validation report")
        print("  - csv/: Detailed CSV analysis files")
    else:
        print("❌ Some required files are missing!")
        sys.exit(1)


if __name__ == "__main__":
    main()

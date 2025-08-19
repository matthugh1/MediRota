#!/usr/bin/env python3
"""
Standalone solution validation utility for MediRota solver.

Analyzes solver request/response JSON files and generates comprehensive reports
including coverage analysis, fairness metrics, and CSV snapshots.

Usage:
    python validate_solution.py
    python validate_solution.py --request ./debug/bundle-YYYYMMDD/solver_request.json --response ./debug/bundle-YYYYMMDD/solver_response.json --outdir ./debug_out
"""

import argparse
import json
import os
import sys
from collections import defaultdict
from typing import Dict, List, Tuple, Optional
import math


def load_json(path: str) -> dict:
    """Load JSON file with robust error handling."""
    try:
        with open(path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"ERROR: File not found: {path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON in {path}: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: Failed to load {path}: {e}")
        sys.exit(1)


def build_demand_index(request: dict) -> Tuple[Dict[Tuple[str, str, str], int], Dict[str, int]]:
    """Build demand index and shift type mapping."""
    demand_index = {}  # (date, wardId, slot) -> total_required
    shift_types = {}   # shiftTypeId -> durationMinutes
    
    # Build shift type mapping
    for shift_type in request.get('shiftTypes', []):
        shift_types[shift_type['id']] = shift_type.get('durationMinutes', 0)
    
    # Build demand index
    for demand in request.get('demand', []):
        cell_key = (demand['date'], demand['wardId'], demand['slot'])
        requirements = demand.get('requirements', {})
        
        # Sum all skill requirements for this cell
        total_required = sum(requirements.values()) if isinstance(requirements, dict) else 0
        
        if cell_key in demand_index:
            demand_index[cell_key] += total_required
        else:
            demand_index[cell_key] = total_required
    
    return demand_index, shift_types


def summarize_assignments(request: dict, response: dict) -> Tuple[Dict[str, int], Dict[Tuple[str, str, str], int]]:
    """Summarize assignments by staff and by cell."""
    staff_minutes = defaultdict(int)  # staffId -> total_minutes
    cell_assignments = defaultdict(int)  # (date, wardId, slot) -> assigned_count
    
    # Build shift type mapping for slot resolution
    shift_type_map = {}  # shiftTypeId -> slot
    for shift_type in request.get('shiftTypes', []):
        shift_type_map[shift_type['id']] = shift_type.get('code', shift_type['id'])
    
    assignments = response.get('assignments', [])
    
    for assignment in assignments:
        staff_id = assignment['staffId']
        date = assignment['date']
        ward_id = assignment['wardId']
        shift_type_id = assignment.get('shiftTypeId', '')
        
        # Resolve slot from shiftTypeId
        slot = shift_type_map.get(shift_type_id, shift_type_id)
        
        # Add to staff minutes
        duration_minutes = 0
        for shift_type in request.get('shiftTypes', []):
            if shift_type['id'] == shift_type_id:
                duration_minutes = shift_type.get('durationMinutes', 0)
                break
        
        staff_minutes[staff_id] += duration_minutes
        
        # Add to cell assignments
        cell_key = (date, ward_id, slot)
        cell_assignments[cell_key] += 1
    
    return dict(staff_minutes), dict(cell_assignments)


def fairness_stats(hours_by_staff: Dict[str, float]) -> Dict[str, float]:
    """Calculate fairness statistics including Gini coefficient."""
    if not hours_by_staff:
        return {
            'max_hours': 0.0, 'min_hours': 0.0, 'range_hours': 0.0,
            'mean_hours': 0.0, 'stddev_hours': 0.0, 'gini': 0.0
        }
    
    hours_list = list(hours_by_staff.values())
    hours_list.sort()
    
    max_hours = max(hours_list)
    min_hours = min(hours_list)
    range_hours = max_hours - min_hours
    mean_hours = sum(hours_list) / len(hours_list)
    
    # Population standard deviation
    variance = sum((x - mean_hours) ** 2 for x in hours_list) / len(hours_list)
    stddev_hours = math.sqrt(variance)
    
    # Gini coefficient
    n = len(hours_list)
    if n == 0 or sum(hours_list) == 0:
        gini = 0.0
    else:
        cumsum = 0
        for i, x in enumerate(hours_list):
            cumsum += (i + 1) * x
        gini = (2 * cumsum) / (n * sum(hours_list)) - (n + 1) / n
    
    return {
        'max_hours': max_hours,
        'min_hours': min_hours,
        'range_hours': range_hours,
        'mean_hours': mean_hours,
        'stddev_hours': stddev_hours,
        'gini': gini
    }


def write_csv(rows: List[Dict], path: str):
    """Write rows to CSV file."""
    if not rows:
        return
    
    os.makedirs(os.path.dirname(path), exist_ok=True)
    
    with open(path, 'w') as f:
        # Write header
        headers = list(rows[0].keys())
        f.write(','.join(headers) + '\n')
        
        # Write rows
        for row in rows:
            values = [str(row.get(header, '')) for header in headers]
            f.write(','.join(values) + '\n')


def fmt_hours(minutes: int) -> str:
    """Format minutes as hours with 1 decimal place."""
    hours = minutes / 60.0
    return f"{hours:.1f}"


def main():
    """Main validation function."""
    parser = argparse.ArgumentParser(description='Validate MediRota solver solution')
    parser.add_argument('--request', default='./solver_request.json', help='Path to request JSON')
    parser.add_argument('--response', default='./solver_response.json', help='Path to response JSON')
    parser.add_argument('--outdir', default='./debug_out', help='Output directory for CSV files')
    
    args = parser.parse_args()
    
    # Load JSON files
    print(f"Loading request from: {args.request}")
    print(f"Loading response from: {args.response}")
    print()
    
    request = load_json(args.request)
    response = load_json(args.response)
    
    # Build demand index and shift type mapping
    demand_index, shift_types = build_demand_index(request)
    
    # Summarize assignments
    staff_minutes, cell_assignments = summarize_assignments(request, response)
    
    # Calculate totals
    total_required = sum(demand_index.values())
    total_assigned = sum(cell_assignments.values())
    total_unmet = max(0, total_required - total_assigned)
    
    # Get distinct values
    distinct_dates = set()
    distinct_wards = set()
    distinct_slots = set()
    
    for (date, ward_id, slot) in demand_index.keys():
        distinct_dates.add(date)
        distinct_wards.add(ward_id)
        distinct_slots.add(slot)
    
    # Print OVERVIEW section
    print("=" * 60)
    print("OVERVIEW")
    print("=" * 60)
    print(f"Total Required:     {total_required:>8}")
    print(f"Total Assigned:     {total_assigned:>8}")
    print(f"Total Unmet:        {total_unmet:>8}")
    print(f"Distinct Dates:     {len(distinct_dates):>8}")
    print(f"Distinct Wards:     {len(distinct_wards):>8}")
    print(f"Distinct Slots:     {len(distinct_slots):>8}")
    print()
    
    # Print FAIRNESS section
    print("=" * 60)
    print("FAIRNESS")
    print("=" * 60)
    
    # Convert minutes to hours for staff
    staff_hours = {staff_id: minutes / 60.0 for staff_id, minutes in staff_minutes.items()}
    
    if staff_hours:
        fairness = fairness_stats(staff_hours)
        
        print(f"Max Hours:          {fairness['max_hours']:>8.1f}")
        print(f"Min Hours:          {fairness['min_hours']:>8.1f}")
        print(f"Range Hours:        {fairness['range_hours']:>8.1f}")
        print(f"Mean Hours:         {fairness['mean_hours']:>8.1f}")
        print(f"Std Dev Hours:      {fairness['stddev_hours']:>8.1f}")
        print(f"Gini Coefficient:   {fairness['gini']:>8.3f}")
        print()
        
        # Top 10 staff by hours
        print("Top 10 Staff by Hours:")
        sorted_staff = sorted(staff_hours.items(), key=lambda x: x[1], reverse=True)
        for i, (staff_id, hours) in enumerate(sorted_staff[:10], 1):
            minutes = staff_minutes[staff_id]
            print(f"  {i:2d}. {staff_id:<15} {hours:>6.1f}h ({minutes:>5d}m)")
    else:
        print("No assignments found - all fairness metrics are 0")
        fairness = fairness_stats({})
    
    print()
    
    # Print TOP UNMET CELLS section
    print("=" * 60)
    print("TOP UNMET CELLS")
    print("=" * 60)
    
    # Calculate unmet per cell
    cell_unmet = []
    for (date, ward_id, slot), required in demand_index.items():
        assigned = cell_assignments.get((date, ward_id, slot), 0)
        unmet = max(0, required - assigned)
        if unmet > 0:
            cell_unmet.append((date, ward_id, slot, required, assigned, unmet))
    
    # Sort by unmet desc, then date
    cell_unmet.sort(key=lambda x: (-x[5], x[0]))
    
    print(f"{'Date':<12} {'Ward':<8} {'Slot':<8} {'Required':>8} {'Assigned':>8} {'Unmet':>8}")
    print("-" * 60)
    
    for date, ward_id, slot, required, assigned, unmet in cell_unmet[:15]:
        print(f"{date:<12} {ward_id:<8} {slot:<8} {required:>8} {assigned:>8} {unmet:>8}")
    
    if len(cell_unmet) > 15:
        print(f"... and {len(cell_unmet) - 15} more cells with unmet demand")
    
    print()
    
    # Print PER-DATE SUMMARY section
    print("=" * 60)
    print("PER-DATE SUMMARY")
    print("=" * 60)
    
    # Aggregate by date
    date_summary = defaultdict(lambda: {'required': 0, 'assigned': 0})
    
    for (date, ward_id, slot), required in demand_index.items():
        assigned = cell_assignments.get((date, ward_id, slot), 0)
        date_summary[date]['required'] += required
        date_summary[date]['assigned'] += assigned
    
    print(f"{'Date':<12} {'Required':>8} {'Assigned':>8} {'Unmet':>8}")
    print("-" * 40)
    
    for date in sorted(date_summary.keys()):
        summary = date_summary[date]
        unmet = max(0, summary['required'] - summary['assigned'])
        print(f"{date:<12} {summary['required']:>8} {summary['assigned']:>8} {unmet:>8}")
    
    print()
    
    # Write CSV files
    print("=" * 60)
    print("CSV SNAPSHOTS")
    print("=" * 60)
    
    # Staff hours CSV
    staff_csv_rows = []
    for staff_id, minutes in staff_minutes.items():
        staff_csv_rows.append({
            'staffId': staff_id,
            'minutes': minutes,
            'hours': round(minutes / 60.0, 1)
        })
    
    staff_csv_path = os.path.join(args.outdir, 'staff_hours.csv')
    write_csv(staff_csv_rows, staff_csv_path)
    print(f"Staff hours: {staff_csv_path}")
    
    # Per-cell coverage CSV
    cell_csv_rows = []
    for (date, ward_id, slot), required in demand_index.items():
        assigned = cell_assignments.get((date, ward_id, slot), 0)
        unmet = max(0, required - assigned)
        cell_csv_rows.append({
            'date': date,
            'wardId': ward_id,
            'slot': slot,
            'required': required,
            'assigned': assigned,
            'unmet': unmet
        })
    
    cell_csv_path = os.path.join(args.outdir, 'per_cell_coverage.csv')
    write_csv(cell_csv_rows, cell_csv_path)
    print(f"Per-cell coverage: {cell_csv_path}")
    
    # Per-date coverage CSV
    date_csv_rows = []
    for date in sorted(date_summary.keys()):
        summary = date_summary[date]
        unmet = max(0, summary['required'] - summary['assigned'])
        date_csv_rows.append({
            'date': date,
            'required': summary['required'],
            'assigned': summary['assigned'],
            'unmet': unmet
        })
    
    date_csv_path = os.path.join(args.outdir, 'per_date_coverage.csv')
    write_csv(date_csv_rows, date_csv_path)
    print(f"Per-date coverage: {date_csv_path}")
    
    print()
    print("=" * 60)
    print("VALIDATION COMPLETE")
    print("=" * 60)
    
    if total_unmet > 0:
        print(f"❌ Solution has {total_unmet} unmet demand items")
        sys.exit(2)
    else:
        print("✅ Solution fully satisfies all demand requirements")
        sys.exit(0)


if __name__ == "__main__":
    main()

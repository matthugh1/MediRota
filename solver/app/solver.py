import time
from typing import List, Dict, Tuple, Optional, Set
from datetime import datetime, timedelta
from ortools.sat.python import cp_model
import math

from .models import (
    SolverRequestModel, RepairRequestModel, AssignmentModel, 
    MetricsModel, DiagnosticsModel, SolverResponseModel
)

class RotaSolver:
    def __init__(self):
        self.model = None
        self.solver = None
        self.variables = {}
        self.staff_map = {}
        self.demand_map = {}
        self.shift_map = {}
        self.skill_map = {}
        
    def solve(self, request: SolverRequestModel, time_budget_ms: int = 300000) -> SolverResponseModel:
        """Solve the rota problem"""
        start_time = time.time()
        
        # Create model
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()
        self.solver.parameters.max_time_in_seconds = time_budget_ms / 1000
        
        # Build variables and constraints
        self._build_model(request)
        
        # Solve
        status = self.solver.Solve(self.model)
        solve_time_ms = int((time.time() - start_time) * 1000)
        
        # Debug logging
        print(f"DEBUG: Solver status = {status}")
        print(f"DEBUG: Number of variables = {len(self.variables)}")
        print(f"DEBUG: Variables created: {list(self.variables.keys())[:5]}...")
        
        # Process results
        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            assignments = self._extract_assignments(request)
            print(f"DEBUG: Extracted {len(assignments)} assignments")
            metrics = self._calculate_metrics(assignments, request, solve_time_ms)
            diagnostics = DiagnosticsModel(
                status="optimal" if status == cp_model.OPTIMAL else "feasible",
                message="Solution found"
            )
        else:
            assignments = []
            metrics = self._create_empty_metrics(solve_time_ms)
            diagnostics = DiagnosticsModel(
                status="infeasible" if status == cp_model.INFEASIBLE else "timeout",
                message="No solution found"
            )
        
        return SolverResponseModel(
            assignments=assignments,
            metrics=metrics,
            diagnostics=diagnostics
        )
        
    def repair(self, request: RepairRequestModel, time_budget_ms: int = 60000) -> SolverResponseModel:
        """Repair the rota after events"""
        return self.solve(request, time_budget_ms)
        
    def _build_model(self, request: SolverRequestModel):
        """Build the CP-SAT model"""
        # Create mappings for efficient lookup
        self._create_mappings(request)
        
        # Create decision variables
        self._create_variables(request)
        
        # Add constraints
        self._add_coverage_constraints(request)
        self._add_staff_constraints(request)
        self._add_fairness_constraints(request)
        self._add_preference_constraints(request)
        self._add_lock_constraints(request)
        
        # Set objective function
        self._set_objective(request)
        
    def _create_mappings(self, request: SolverRequestModel):
        """Create efficient lookup mappings"""
        # Staff mapping
        for i, staff in enumerate(request.staff):
            self.staff_map[staff.id] = i
            
        # Demand mapping by date and slot
        for demand in request.demands:
            key = (demand.date, demand.slot)
            if key not in self.demand_map:
                self.demand_map[key] = []
            self.demand_map[key].append(demand)
            
        # Shift type mapping
        for i, shift in enumerate(request.shiftTypes):
            self.shift_map[shift.id] = i
            
        # Skill mapping
        all_skills = set()
        for staff in request.staff:
            all_skills.update(staff.skills)
        for i, skill in enumerate(all_skills):
            self.skill_map[skill] = i
            
    def _create_variables(self, request: SolverRequestModel):
        """Create decision variables"""
        # x[staff_idx][date][slot] = 1 if staff is assigned to date/slot
        for staff_idx, staff in enumerate(request.staff):
            for demand in request.demands:
                var_name = f"x_{staff_idx}_{demand.date}_{demand.slot}"
                self.variables[var_name] = self.model.NewBoolVar(var_name)
                
    def _add_coverage_constraints(self, request: SolverRequestModel):
        """Add coverage constraints to meet demand"""
        for (date, slot), demands in self.demand_map.items():
            for demand in demands:
                for skill, required_count in demand.requiredBySkill.items():
                    # Find staff with this skill
                    skilled_staff = []
                    for staff_idx, staff in enumerate(request.staff):
                        if skill in staff.skills:
                            var_name = f"x_{staff_idx}_{date}_{slot}"
                            if var_name in self.variables:
                                skilled_staff.append(self.variables[var_name])
                    
                    # Ensure enough staff with this skill are assigned
                    if skilled_staff:
                        self.model.Add(sum(skilled_staff) >= required_count)
                        
        # Add constraint to ensure at least some assignments are made
        all_assignments = []
        for var_name, var in self.variables.items():
            if var_name.startswith('x_'):
                all_assignments.append(var)
        
        if all_assignments:
            # Require at least one assignment per demand
            total_required = sum(
                sum(demand.requiredBySkill.values()) 
                for demands in self.demand_map.values() 
                for demand in demands
            )
            self.model.Add(sum(all_assignments) >= total_required)
                        
    def _add_staff_constraints(self, request: SolverRequestModel):
        """Add staff-specific constraints"""
        for staff_idx, staff in enumerate(request.staff):
            # One shift per day constraint
            for date in set(demand.date for demand in request.demands):
                day_shifts = []
                for demand in request.demands:
                    if demand.date == date:
                        var_name = f"x_{staff_idx}_{date}_{demand.slot}"
                        if var_name in self.variables:
                            day_shifts.append(self.variables[var_name])
                
                if day_shifts:
                    self.model.Add(sum(day_shifts) <= 1)
                    
            # Contract hours constraint (simplified - max shifts per week)
            max_shifts_per_week = int(staff.contractHoursPerWeek / 8)  # Assume 8-hour shifts
            for week_start in self._get_week_starts(request):
                week_shifts = []
                for demand in request.demands:
                    if self._is_in_week(demand.date, week_start):
                        var_name = f"x_{staff_idx}_{demand.date}_{demand.slot}"
                        if var_name in self.variables:
                            week_shifts.append(self.variables[var_name])
                
                if week_shifts:
                    self.model.Add(sum(week_shifts) <= max_shifts_per_week)
                    
    def _add_fairness_constraints(self, request: SolverRequestModel):
        """Add fairness constraints"""
        # Count night shifts per staff
        night_shift_counts = []
        for staff_idx, staff in enumerate(request.staff):
            night_shifts = []
            for demand in request.demands:
                # Find if this is a night shift
                for shift in request.shiftTypes:
                    if shift.isNight and demand.slot == shift.code:
                        var_name = f"x_{staff_idx}_{demand.date}_{demand.slot}"
                        if var_name in self.variables:
                            night_shifts.append(self.variables[var_name])
                        break
            
            if night_shifts:
                count_var = self.model.NewIntVar(0, len(night_shifts), f"night_count_{staff_idx}")
                self.model.Add(count_var == sum(night_shifts))
                night_shift_counts.append(count_var)
                
        # Minimize variance in night shift distribution
        if night_shift_counts:
            min_nights = self.model.NewIntVar(0, max(len(request.demands), 1), "min_nights")
            max_nights = self.model.NewIntVar(0, max(len(request.demands), 1), "max_nights")
            
            for count in night_shift_counts:
                self.model.Add(count >= min_nights)
                self.model.Add(count <= max_nights)
                
            # Store for objective
            self.variables['night_variance'] = max_nights - min_nights
            
    def _add_preference_constraints(self, request: SolverRequestModel):
        """Add preference constraints"""
        for preference in request.preferences:
            staff_idx = self.staff_map.get(preference.staffId)
            if staff_idx is not None:
                for demand in request.demands:
                    if demand.date == preference.date:
                        var_name = f"x_{staff_idx}_{demand.date}_{demand.slot}"
                        if var_name in self.variables:
                            if preference.preferOff:
                                # Soft constraint - prefer not to assign
                                self.variables[var_name].SetCoefficient(1)
                            elif preference.preferOn:
                                # Soft constraint - prefer to assign
                                self.variables[var_name].SetCoefficient(-1)
                                
    def _add_lock_constraints(self, request: SolverRequestModel):
        """Add lock constraints for fixed assignments"""
        for lock in request.locks:
            staff_idx = self.staff_map.get(lock.staffId)
            if staff_idx is not None:
                var_name = f"x_{staff_idx}_{lock.date}_{lock.slot}"
                if var_name in self.variables:
                    self.model.Add(self.variables[var_name] == 1)
                    
    def _set_objective(self, request: SolverRequestModel):
        """Set the objective function"""
        # Minimize total assignments (efficiency)
        total_assignments = []
        for var_name, var in self.variables.items():
            if var_name.startswith('x_'):
                total_assignments.append(var)
                
        # Add fairness penalty
        fairness_penalty = self.variables.get('night_variance', 0)
        
        # Set objective
        self.model.Minimize(sum(total_assignments) + 10 * fairness_penalty)
        
    def _extract_assignments(self, request: SolverRequestModel) -> List[AssignmentModel]:
        """Extract assignments from solver solution"""
        assignments = []
        
        for staff_idx, staff in enumerate(request.staff):
            for demand in request.demands:
                var_name = f"x_{staff_idx}_{demand.date}_{demand.slot}"
                if var_name in self.variables:
                    if self.solver.Value(self.variables[var_name]) == 1:
                        # Find the shift type for this slot
                        shift_type_id = None
                        for shift in request.shiftTypes:
                            if shift.code == demand.slot:
                                shift_type_id = shift.id
                                break
                                
                        if shift_type_id:
                            assignments.append(AssignmentModel(
                                staffId=staff.id,
                                date=demand.date,
                                slot=demand.slot,
                                shiftTypeId=shift_type_id
                            ))
                            
        return assignments
        
    def _calculate_metrics(self, assignments: List[AssignmentModel], request: SolverRequestModel, solve_time_ms: int) -> MetricsModel:
        """Calculate solution metrics"""
        # Count unfilled demand
        unfilled_demand = 0
        for (date, slot), demands in self.demand_map.items():
            for demand in demands:
                for skill, required_count in demand.requiredBySkill.items():
                    assigned_count = 0
                    for assignment in assignments:
                        if assignment.date == date and assignment.slot == slot:
                            # Check if assigned staff has the required skill
                            for staff in request.staff:
                                if staff.id == assignment.staffId and skill in staff.skills:
                                    assigned_count += 1
                                    break
                    unfilled_demand += max(0, required_count - assigned_count)
                    
        # Calculate fairness score (inverse of night shift variance)
        night_shifts_per_staff = {}
        for assignment in assignments:
            # Check if this is a night shift
            for shift in request.shiftTypes:
                if shift.id == assignment.shiftTypeId and shift.isNight:
                    night_shifts_per_staff[assignment.staffId] = night_shifts_per_staff.get(assignment.staffId, 0) + 1
                    break
                    
        if night_shifts_per_staff:
            night_counts = list(night_shifts_per_staff.values())
            fairness_std = self._calculate_std(night_counts)
            fairness_score = 1.0 / (1.0 + fairness_std)  # Higher is better
        else:
            fairness_score = 1.0
            
        # Calculate preference satisfaction
        satisfied_preferences = 0
        total_preferences = len(request.preferences)
        
        for preference in request.preferences:
            for assignment in assignments:
                if (assignment.staffId == preference.staffId and 
                    assignment.date == preference.date):
                    if preference.preferOn:
                        satisfied_preferences += 1
                    elif preference.preferOff:
                        satisfied_preferences -= 1
                    break
                    
        preference_satisfaction = max(0, satisfied_preferences / max(1, total_preferences))
        
        return MetricsModel(
            objective=float(self.solver.ObjectiveValue()),
            unfilledDemand=unfilled_demand,
            hardViolations=0,  # Would need to track constraint violations
            fairnessScore=fairness_score,
            preferenceScore=preference_satisfaction,
            solveTimeMs=solve_time_ms,
            fairnessNightStd=self._calculate_std(list(night_shifts_per_staff.values())) if night_shifts_per_staff else 0.0,
            preferenceSatisfaction=preference_satisfaction
        )
        
    def _create_empty_metrics(self, solve_time_ms: int) -> MetricsModel:
        """Create empty metrics for failed solves"""
        return MetricsModel(
            objective=float('inf'),
            unfilledDemand=0,
            hardViolations=0,
            fairnessScore=0.0,
            preferenceScore=0.0,
            solveTimeMs=solve_time_ms,
            fairnessNightStd=0.0,
            preferenceSatisfaction=0.0
        )
        
    def _get_week_starts(self, request: SolverRequestModel) -> List[str]:
        """Get list of week start dates"""
        dates = sorted(set(demand.date for demand in request.demands))
        week_starts = []
        for date in dates:
            dt = datetime.fromisoformat(date.replace('Z', '+00:00'))
            week_start = dt - timedelta(days=dt.weekday())
            week_start_str = week_start.strftime('%Y-%m-%d')
            if week_start_str not in week_starts:
                week_starts.append(week_start_str)
        return week_starts
        
    def _is_in_week(self, date_str: str, week_start: str) -> bool:
        """Check if date is in the specified week"""
        date_dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        week_start_dt = datetime.fromisoformat(week_start)
        week_end_dt = week_start_dt + timedelta(days=6)
        return week_start_dt <= date_dt <= week_end_dt
        
    def _calculate_std(self, values: List[float]) -> float:
        """Calculate standard deviation"""
        if not values:
            return 0.0
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return math.sqrt(variance)

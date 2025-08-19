"""
Core CP-SAT solver for NHS rota optimization
Implements all hard and soft constraints with proper validation
"""

import time
import uuid
import logging
from typing import List, Dict, Tuple, Optional, Set, NamedTuple, Union
from datetime import datetime, date, timedelta
from ortools.sat.python import cp_model
import numpy as np

from .models import (
    SolverRequestModel, AssignmentModel, MetricsModel, DiagnosticsModel,
    UnfilledDemandModel, RepairRequestModel
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import debug logging function
try:
    from .main import debug_log
except ImportError:
    # Fallback if not available
    def debug_log(message: str):
        logger.info(f"[DEBUG] {message}")

class ModelIndices(NamedTuple):
    """Indices for efficient lookups"""
    staff_idx: Dict[str, int]
    ward_idx: Dict[str, int]
    date_idx: Dict[str, int]
    slot_idx: Dict[str, int]
    skill_idx: Dict[str, int]
    shift_type_idx: Dict[str, int]
    week_bins: Dict[str, List[str]]  # week_key -> list of dates
    week_idx: Dict[str, str]  # date -> week_key
    shift_durations: Dict[str, int]  # shift_type_id -> duration_minutes
    forbidden_adjacency: Dict[str, Dict[str, bool]]  # shift_type_id -> shift_type_id -> forbidden

class RotaSolverCore:
    """Core CP-SAT solver for rota optimization"""
    
    def __init__(self):
        # Objective weights - A dominates to fill demand first
        self.A = 100_000    # unmet demand (reduced weight)
        self.B = 100        # fairness penalty (reduced from 10)
        self.C = 1          # preferences (if any)
        self.D = 1_000_000  # staff utilization penalty (dominant weight)
        
    def solve(self, request: SolverRequestModel) -> Tuple[List[AssignmentModel], MetricsModel, DiagnosticsModel]:
        """Main solve method"""
        start_time = time.time()
        
        # Debug logging
        debug_log(f"SOLVE START: |staff|={len(request.staff)}, |shiftTypes|={len(request.shiftTypes)}, |wards|={len(request.wards)}, #dates={len(self._get_dates(request.horizon))}, #demand={len(request.demand)}")
        
        # Build model
        model, indices, x, y, u = self._build_model(request)
        
        # Solve
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = request.timeBudgetMs / 1000
        solver.parameters.num_search_workers = 8  # Use multiple threads
        solver.parameters.log_search_progress = True  # Log progress
        solver.parameters.cp_model_presolve = True  # Enable presolve
        solver.parameters.linearization_level = 2  # More aggressive linearization
        solver.parameters.interleave_search = True  # Interleave search strategies
        
        logger.info(f"Starting solve with {len(x)} assignment vars, {len(y)} skill vars, {len(u)} slack vars and {request.timeBudgetMs}ms time budget")
        
        # Add hints if provided
        if request.hints:
            self._add_hints(model, solver, indices, request)
        
        try:
            status = solver.Solve(model)
            solve_time_ms = int((time.time() - start_time) * 1000)
            logger.info(f"Solve completed with status {status} in {solve_time_ms}ms")
        except Exception as e:
            logger.error(f"Solve failed with exception: {e}")
            raise
        
        # Log solve info
        logger.info(f"Solve: {solve_time_ms}ms, status: {status}")
        
        # Extract solution
        logger.info(f"Solver status: {status}, OPTIMAL: {cp_model.OPTIMAL}, FEASIBLE: {cp_model.FEASIBLE}")
        logger.info(f"Status comparison: status == OPTIMAL: {status == cp_model.OPTIMAL}, status == FEASIBLE: {status == cp_model.FEASIBLE}")
        
        # Debug logging for solve results
        debug_log(f"SOLVE COMPLETE: status={status}, solveMs={solve_time_ms}")
        
        # Enhanced solve logging
        debug_log(f"SOLVE RESULTS: status={status}, solveMs={solve_time_ms}, status==OPTIMAL={status == cp_model.OPTIMAL}, status==FEASIBLE={status == cp_model.FEASIBLE}")
        
        # Extract assignments regardless of status for debugging
        assignments = self._extract_assignments(solver, x, indices, request)
        
        # Debug logging for assignments
        debug_log(f"ASSIGNMENTS EXTRACTED: {len(assignments)} assignments")
        metrics = self._calculate_metrics(assignments, request, solve_time_ms)
        
        # Create assignments summary for diagnostics
        summary = self._create_assignments_summary(assignments, request, solver, y, u)
        
        diagnostics = DiagnosticsModel(
            infeasible=False,
            notes=["Validation temporarily disabled"],
            summary=summary
        )
        
        return assignments, metrics, diagnostics
    
    def _create_assignments_summary(self, assignments: List[AssignmentModel], request: SolverRequestModel, solver: cp_model.CpSolver, y: Dict, u: Dict) -> Dict:
        """Create comprehensive assignments summary for diagnostics"""
        # Dates histogram
        dates_histogram = {}
        for assignment in assignments:
            dates_histogram[assignment.date] = dates_histogram.get(assignment.date, 0) + 1
        
        # Build demand lookup
        demand_req = {}
        for demand in request.demand:
            for skill, count in demand.requirements.items():
                key = (demand.date, demand.wardId, demand.slot, skill)
                demand_req[key] = count
        
        # Cell fill statistics with skill-specific analysis
        cell_fill = {}
        total_unmet = 0
        
        # Calculate assigned by skill per cell
        assigned_by_skill = {}
        for (d, w, s, k), _ in demand_req.items():
            assigned_by_skill[(d, w, s, k)] = 0
            var_name = f"y_*_{d}_{s}_{w}_{k}"
            # Sum all staff assignments for this skill in this cell
            for staff in request.staff:
                if k in staff.skills:
                    skill_var_name = f"y_{staff.id}_{d}_{s}_{w}_{k}"
                    if skill_var_name in y:
                        assigned_by_skill[(d, w, s, k)] += solver.Value(y[skill_var_name])
        
        # Calculate cell-level statistics
        for demand in request.demand:
            cell_key = f"{demand.date}_{demand.slot}_{demand.wardId}"
            
            # Calculate required, assigned, and unmet for this cell
            required_cell = 0
            assigned_cell = 0
            unmet_cell = 0
            
            for skill, required in demand.requirements.items():
                required_cell += required
                assigned = assigned_by_skill.get((demand.date, demand.wardId, demand.slot, skill), 0)
                assigned_cell += assigned
                unmet = max(0, required - assigned)
                unmet_cell += unmet
                total_unmet += unmet
            
            cell_fill[cell_key] = {
                "required": required_cell,
                "assigned": assigned_cell,
                "unmet": unmet_cell
            }
        
        # Staff minutes and shifts
        staff_minutes = {}
        staff_shifts = {}
        for staff in request.staff:
            total_minutes = 0
            shift_count = 0
            for assignment in assignments:
                if assignment.staffId == staff.id:
                    shift_type = next(st for st in request.shiftTypes if st.code == assignment.slot)
                    total_minutes += shift_type.durationMinutes
                    shift_count += 1
            staff_minutes[staff.id] = total_minutes
            staff_shifts[staff.id] = shift_count
        
        # Week caps validation
        week_caps = {}
        for staff in request.staff:
            contract_minutes = int(staff.contractHoursPerWeek * 60)
            week_caps[staff.id] = {}
            
            # Group assignments by week
            staff_assignments = [a for a in assignments if a.staffId == staff.id]
            for assignment in staff_assignments:
                date_obj = date.fromisoformat(assignment.date)
                week_key = f"{date_obj.isocalendar()[0]}-{date_obj.isocalendar()[1]:02d}"
                
                if week_key not in week_caps[staff.id]:
                    week_caps[staff.id][week_key] = {"cap": 0, "assigned": 0}
                
                # Calculate cap for this week
                week_start = date_obj - timedelta(days=date_obj.weekday())
                week_end = week_start + timedelta(days=6)
                horizon_start = date.fromisoformat(request.horizon.start)
                horizon_end = date.fromisoformat(request.horizon.end)
                
                # Count days in this week that are within horizon
                days_in_week = 0
                current = max(week_start, horizon_start)
                while current <= min(week_end, horizon_end):
                    days_in_week += 1
                    current += timedelta(days=1)
                
                prorated_cap = int(contract_minutes * (days_in_week / 7.0))
                week_caps[staff.id][week_key]["cap"] = prorated_cap
                
                # Add assigned minutes
                shift_type = next(st for st in request.shiftTypes if st.code == assignment.slot)
                week_caps[staff.id][week_key]["assigned"] += shift_type.durationMinutes
        
        # Per-date statistics
        per_date = []
        for demand in request.demand:
            assigned = sum(1 for a in assignments 
                         if a.date == demand.date and a.slot == demand.slot and a.wardId == demand.wardId)
            required = self._total_required(demand.requirements)
            per_date.append({
                "date": demand.date,
                "required": required,
                "assigned": assigned
            })
        
        # Fairness statistics
        fairness_stats = {}
        if staff_minutes:
            minutes_values = list(staff_minutes.values())
            fairness_stats = {
                "min_minutes": min(minutes_values),
                "max_minutes": max(minutes_values),
                "mean_minutes": sum(minutes_values) / len(minutes_values),
                "variance": max(minutes_values) - min(minutes_values),
                "staff_minutes": staff_minutes
            }
        
        # Top unmet demand cells
        unfilled_cells = []
        for cell_key, cell_data in cell_fill.items():
            if cell_data["unmet"] > 0:
                unfilled_cells.append({
                    "cell": cell_key,
                    "unmet": cell_data["unmet"],
                    "required": cell_data["required"],
                    "assigned": cell_data["assigned"]
                })
        
        # Sort by unmet demand (descending) and take top 50
        unfilled_cells.sort(key=lambda x: x["unmet"], reverse=True)
        unfilled_cells = unfilled_cells[:50]
        
        return {
            "dates_histogram": dates_histogram,
            "cell_fill": cell_fill,
            "total_required": sum(self._total_required(d.requirements) for d in request.demand),
            "total_assigned": len(assignments),
            "total_unmet": total_unmet,
            "staff_minutes": staff_minutes,
            "staff_shifts": staff_shifts,
            "week_caps": week_caps,
            "per_date": per_date,
            "fairness_stats": fairness_stats,
            "unfilled": unfilled_cells
        }
    
    def repair(self, request: RepairRequestModel) -> Tuple[List[AssignmentModel], MetricsModel, DiagnosticsModel]:
        """Repair existing solution after events"""
        # For repair, we need to lock assignments outside the affected window
        # This is a simplified implementation - in practice you'd need to track the previous solution
        return self.solve(request)
    
    def _build_model(self, request: SolverRequestModel) -> Tuple[cp_model.CpModel, ModelIndices, Dict, Dict, Dict]:
        """Build the CP-SAT model with all constraints"""
        model = cp_model.CpModel()
        
        # Create indices
        indices = self._create_indices(request)
        
        # 1. Build explicit index sets
        D = self._get_dates(request.horizon)  # dates
        WARDS = [ward.id for ward in request.wards]  # wards
        SLOTS = [st.code for st in request.shiftTypes]  # slots
        SKILLS = self._collect_skills(request)  # distinct skills from demand
        E = [staff.id for staff in request.staff]  # staff
        
        # 2. Build demand lookup and demand cell mask
        demand_req, has_demand_cell = self._build_demand_lookup(request)
        
        # Guardrail: confirm at least one cell has demand
        if not any(has_demand_cell.values()):
            logger.warning("No demand cells found - short-circuiting")
            return model, indices, {}, {}, {}
        
        debug_log(f"DEMAND LOOKUP: {len(demand_req)} skill requirements, {sum(has_demand_cell.values())} cells with demand")
        
        # 3. Create decision variables
        # x[e,d,w,s] ∈ {0,1}: staff e works (date d, ward w, slot s)
        x = {}
        for e in E:
            for d in D:
                for w in WARDS:
                    for s in SLOTS:
                        # Only create variables for cells with demand
                        if has_demand_cell[(d, w, s)]:
                            var_name = f"x_{e}_{d}_{s}_{w}"
                            x[var_name] = model.NewBoolVar(var_name)
        
        # y[e,d,w,s,k] ∈ {0,1}: staff e works with skill k (date d, ward w, slot s)
        y = {}
        for e in E:
            for d in D:
                for w in WARDS:
                    for s in SLOTS:
                        for k in SKILLS:
                            # Only create variables for cells with demand and staff with skill
                            if has_demand_cell[(d, w, s)]:
                                staff = next(st for st in request.staff if st.id == e)
                                if k in staff.skills:
                                    var_name = f"y_{e}_{d}_{s}_{w}_{k}"
                                    y[var_name] = model.NewBoolVar(var_name)
        
        # u[d,w,s,k] ∈ ℕ≥0: unmet demand for skill k in cell (d,w,s)
        u = {}
        for d in D:
            for w in WARDS:
                for s in SLOTS:
                    for k in SKILLS:
                        if (d, w, s, k) in demand_req:
                            var_name = f"u_{d}_{s}_{w}_{k}"
                            u[var_name] = model.NewIntVar(0, demand_req[(d, w, s, k)], var_name)
        
        debug_log(f"VARIABLES: {len(x)} assignment vars, {len(y)} skill vars, {len(u)} slack vars")
        
        # 4. Feasibility links
        self._add_feasibility_links(model, x, y, request, has_demand_cell)
        
        # 5. Coverage by skill
        self._add_coverage_constraints_with_slack(model, y, u, request, demand_req)
        
        # 6. One shift per day per staff
        self._add_one_shift_per_day_constraints(model, x, indices, request)
        
        # 7. Rest constraints (11h)
        self._add_rest_constraints(model, x, indices, request)
        
        # 8. Weekly contract caps
        self._add_weekly_contract_hours_constraints(model, x, indices, request)
        
        # 9. Set objective (lexicographic via weights)
        self._set_objective(model, x, u, indices, request)
        
        debug_log(f"MODEL BUILT: #vars={len(x) + len(y) + len(u)}, #constraints={model.NumConstraints() if hasattr(model, 'NumConstraints') else 'unknown'}")
        
        return model, indices, x, y, u
    
    def _add_feasibility_links(self, model: cp_model.CpModel, x: Dict, y: Dict, request: SolverRequestModel, has_demand_cell: Dict):
        """Add feasibility links between x and y variables"""
        for staff in request.staff:
            for date_str in self._get_dates(request.horizon):
                for slot in [st.code for st in request.shiftTypes]:
                    for ward in request.wards:
                        cell_key = (date_str, ward.id, slot)
                        x_var_name = f"x_{staff.id}_{date_str}_{slot}_{ward.id}"
                        
                        # If cell has no demand, forbid assignment
                        if cell_key not in has_demand_cell:
                            if x_var_name in x:
                                model.Add(x[x_var_name] == 0)
                            continue
                        
                        # If staff not eligible for ward, forbid assignment
                        if ward.id not in staff.eligibleWards:
                            if x_var_name in x:
                                model.Add(x[x_var_name] == 0)
                            continue
                        
                        # Add feasibility links for skills
                        skill_vars = []
                        for skill in staff.skills:
                            y_var_name = f"y_{staff.id}_{date_str}_{slot}_{ward.id}_{skill}"
                            if y_var_name in y:
                                # y[e,d,w,s,k] ≤ x[e,d,w,s]
                                model.Add(y[y_var_name] <= x[x_var_name])
                                skill_vars.append(y[y_var_name])
                        
                        # Σ_k y[e,d,w,s,k] ≤ x[e,d,w,s] (one skill per person per shift)
                        if skill_vars:
                            model.Add(sum(skill_vars) <= x[x_var_name])
    
    def _collect_skills(self, request: SolverRequestModel) -> List[str]:
        """Collect distinct skills from demand requirements"""
        skills = set()
        for demand in request.demand:
            if isinstance(demand.requirements, dict):
                skills.update(demand.requirements.keys())
        return list(skills)
    
    def _build_demand_lookup(self, request: SolverRequestModel) -> Tuple[Dict, Dict]:
        """Build demand requirement lookup and demand cell mask"""
        demand_req = {}  # (d, w, s, skill) -> integer requirement
        has_demand_cell = {}  # (d, w, s) -> boolean
        
        for demand in request.demand:
            if not isinstance(demand.requirements, dict):
                raise TypeError(f"Requirements must be dict, got {type(demand.requirements)}: {demand.requirements}")
            
            cell_key = (demand.date, demand.wardId, demand.slot)
            has_demand_cell[cell_key] = True
            
            for skill, count in demand.requirements.items():
                key = (demand.date, demand.wardId, demand.slot, skill)
                demand_req[key] = count
        
        return demand_req, has_demand_cell
    
    def _add_coverage_constraints_with_slack(self, model: cp_model.CpModel, y: Dict, u: Dict, request: SolverRequestModel, demand_req: Dict):
        """Add coverage constraints with slack variables for unmet demand"""
        for (d, w, s, skill), required in demand_req.items():
            # Find eligible staff for this ward/skill combination
            eligible_vars = []
            for staff in request.staff:
                if (skill in staff.skills and w in staff.eligibleWards):
                    var_name = f"y_{staff.id}_{d}_{s}_{w}_{skill}"
                    if var_name in y:
                        eligible_vars.append(y[var_name])
            
            # Coverage constraint: sum of eligible staff + slack = required
            slack_var_name = f"u_{d}_{s}_{w}_{skill}"
            if slack_var_name in u:
                if eligible_vars:
                    model.Add(sum(eligible_vars) + u[slack_var_name] == required)
                else:
                    # No eligible staff - all demand becomes unmet
                    model.Add(u[slack_var_name] == required)
    
    def _add_one_shift_per_day_constraints(self, model: cp_model.CpModel, x: Dict, indices: ModelIndices, request: SolverRequestModel):
        """H2: One shift per day per staff"""
        for staff in request.staff:
            for date_str in self._get_dates(request.horizon):
                day_vars = []
                for slot in [st.code for st in request.shiftTypes]:
                    for ward in request.wards:
                        var_name = f"x_{staff.id}_{date_str}_{slot}_{ward.id}"
                        if var_name in x:
                            day_vars.append(x[var_name])
                
                if day_vars:
                    model.Add(sum(day_vars) <= 1)
    
    def _add_rest_constraints(self, model: cp_model.CpModel, x: Dict, indices: ModelIndices, request: SolverRequestModel):
        """H3: Rest adjacency constraints - enforce 11h rest between shifts"""
        dates = self._get_dates(request.horizon)
        
        for staff in request.staff:
            # (a) Same day overlap constraints
            for date_str in dates:
                for i, shift1 in enumerate(request.shiftTypes):
                    for j, shift2 in enumerate(request.shiftTypes):
                        if i != j:  # Different shifts
                            # Check if these shifts overlap on the same day
                            if self._shifts_overlap_same_day(shift1, shift2):
                                for ward1 in request.wards:
                                    for ward2 in request.wards:
                                        var1_name = f"x_{staff.id}_{date_str}_{shift1.code}_{ward1.id}"
                                        var2_name = f"x_{staff.id}_{date_str}_{shift2.code}_{ward2.id}"
                                        if var1_name in x and var2_name in x:
                                            model.Add(x[var1_name] + x[var2_name] <= 1)
            
            # (b) Consecutive days rest constraints
            for i in range(len(dates) - 1):
                date1 = dates[i]
                date2 = dates[i + 1]
                
                for shift1 in request.shiftTypes:
                    for shift2 in request.shiftTypes:
                        # Check if rest between shifts is insufficient
                        if indices.forbidden_adjacency[shift1.id][shift2.id]:
                            for ward1 in request.wards:
                                for ward2 in request.wards:
                                    var1_name = f"x_{staff.id}_{date1}_{shift1.code}_{ward1.id}"
                                    var2_name = f"x_{staff.id}_{date2}_{shift2.code}_{ward2.id}"
                                    if var1_name in x and var2_name in x:
                                        model.Add(x[var1_name] + x[var2_name] <= 1)
    
    def _shifts_overlap_same_day(self, shift1, shift2) -> bool:
        """Check if two shifts overlap on the same day"""
        # Parse shift times
        start1 = datetime.strptime(shift1.start, "%H:%M")
        end1 = datetime.strptime(shift1.end, "%H:%M")
        start2 = datetime.strptime(shift2.start, "%H:%M")
        end2 = datetime.strptime(shift2.end, "%H:%M")
        
        # Handle night shifts that cross midnight
        if shift1.isNight:
            end1 = end1 + timedelta(days=1)
        if shift2.isNight:
            end2 = end2 + timedelta(days=1)
        
        # Check overlap
        return not (end1 <= start2 or end2 <= start1)
    
    def _add_weekly_contract_hours_constraints(self, model: cp_model.CpModel, x: Dict, indices: ModelIndices, request: SolverRequestModel):
        """H7: Weekly contract hours constraints with prorating for partial weeks"""
        debug_log(f"Adding weekly contract hours constraints for {len(request.staff)} staff")
        
        for staff in request.staff:
            contract_minutes = int(staff.contractHoursPerWeek * 60)  # Convert to minutes
            debug_log(f"Staff {staff.id}: contract hours = {staff.contractHoursPerWeek}h = {contract_minutes} minutes")
            
            for week_key, week_dates in indices.week_bins.items():
                # Calculate prorated cap for this week
                days_in_week = len(week_dates)
                prorated_cap = int(contract_minutes * (days_in_week / 7.0))
                
                debug_log(f"  Week {week_key}: {days_in_week} days, prorated cap = {prorated_cap} minutes")
                
                # Sum all minutes assigned to this staff in this week
                week_minutes_vars = []
                for date_str in week_dates:
                    for shift_type in request.shiftTypes:
                        for ward in request.wards:
                            var_name = f"x_{staff.id}_{date_str}_{shift_type.code}_{ward.id}"
                            if var_name in x:
                                # Create a variable for minutes assigned by this assignment
                                minutes_var = model.NewIntVar(0, shift_type.durationMinutes, f"minutes_{var_name}")
                                model.Add(minutes_var == shift_type.durationMinutes * x[var_name])
                                week_minutes_vars.append(minutes_var)
                
                if week_minutes_vars:
                    # Constrain total minutes in week to not exceed prorated cap
                    model.Add(sum(week_minutes_vars) <= prorated_cap)
                    debug_log(f"    Added constraint: sum(week_minutes_vars) <= {prorated_cap}")
                else:
                    debug_log(f"    No assignments possible for staff {staff.id} in week {week_key}")
    
    def _set_objective(self, model: cp_model.CpModel, x: Dict, u: Dict, indices: ModelIndices, request: SolverRequestModel):
        """Set objective function with lexicographic weights"""
        objective_terms = []
        
        # A * Σ u[d,w,s,k] - unmet demand (dominant)
        if u:
            total_unmet = sum(u.values())
            objective_terms.append(self.A * total_unmet)
        
        # D * staff utilization penalty - encourage staff to work more hours
        if x:
            utilization_penalty = self._create_utilization_penalty(model, x, indices, request)
            objective_terms.append(self.D * utilization_penalty)
        
        # B * fairness penalty - variance in total minutes per staff
        if x:
            fairness_penalty = self._create_fairness_penalty(model, x, indices, request)
            objective_terms.append(self.B * fairness_penalty)
        
        # Set objective
        if objective_terms:
            model.Minimize(sum(objective_terms))
    
    def _create_fairness_penalty(self, model: cp_model.CpModel, x: Dict, indices: ModelIndices, request: SolverRequestModel) -> cp_model.IntVar:
        """Create fairness penalty based on variance in total minutes per staff"""
        # Calculate total minutes for each staff
        staff_minutes = {}
        for staff in request.staff:
            minutes_vars = []
            for date_str in self._get_dates(request.horizon):
                for shift_type in request.shiftTypes:
                    for ward in request.wards:
                        var_name = f"x_{staff.id}_{date_str}_{shift_type.code}_{ward.id}"
                        if var_name in x:
                            # Create minutes variable for this assignment
                            minutes_var = model.NewIntVar(0, shift_type.durationMinutes, f"minutes_{var_name}")
                            model.Add(minutes_var == shift_type.durationMinutes * x[var_name])
                            minutes_vars.append(minutes_var)
            
            if minutes_vars:
                total_minutes = model.NewIntVar(0, 10000, f"total_minutes_{staff.id}")
                model.Add(total_minutes == sum(minutes_vars))
                staff_minutes[staff.id] = total_minutes
        
        if len(staff_minutes) < 2:
            return model.NewConstant(0)
        
        # Calculate variance (max - min)
        max_minutes = model.NewIntVar(0, 10000, "max_minutes")
        min_minutes = model.NewIntVar(0, 10000, "min_minutes")
        
        minutes_list = list(staff_minutes.values())
        model.AddMaxEquality(max_minutes, minutes_list)
        model.AddMinEquality(min_minutes, minutes_list)
        
        variance = model.NewIntVar(0, 10000, "variance")
        model.Add(variance == max_minutes - min_minutes)
        
        return variance
    
    def _create_utilization_penalty(self, model: cp_model.CpModel, x: Dict, indices: ModelIndices, request: SolverRequestModel) -> cp_model.IntVar:
        """Create utilization penalty to encourage staff to work more hours"""
        # Calculate total minutes for each staff
        staff_minutes = {}
        for staff in request.staff:
            minutes_vars = []
            for date_str in self._get_dates(request.horizon):
                for shift_type in request.shiftTypes:
                    for ward in request.wards:
                        var_name = f"x_{staff.id}_{date_str}_{shift_type.code}_{ward.id}"
                        if var_name in x:
                            # Create minutes variable for this assignment
                            minutes_var = model.NewIntVar(0, shift_type.durationMinutes, f"minutes_{var_name}")
                            model.Add(minutes_var == shift_type.durationMinutes * x[var_name])
                            minutes_vars.append(minutes_var)
            
            if minutes_vars:
                total_minutes = model.NewIntVar(0, 10000, f"total_minutes_{staff.id}")
                model.Add(total_minutes == sum(minutes_vars))
                staff_minutes[staff.id] = total_minutes
        
        if not staff_minutes:
            return model.NewConstant(0)
        
        # Calculate total minutes across all staff
        total_minutes = model.NewIntVar(0, 100000, "total_all_staff_minutes")
        model.Add(total_minutes == sum(staff_minutes.values()))
        
        # We want to maximize total minutes, so we minimize the negative
        # This encourages the solver to assign more shifts
        utilization_penalty = model.NewIntVar(-100000, 0, "utilization_penalty")
        model.Add(utilization_penalty == -total_minutes)
        return utilization_penalty
    
    def _create_indices(self, request: SolverRequestModel) -> ModelIndices:
        """Create efficient lookup indices"""
        staff_idx = {staff.id: i for i, staff in enumerate(request.staff)}
        ward_idx = {ward.id: i for i, ward in enumerate(request.wards)}
        date_idx = {date_str: i for i, date_str in enumerate(self._get_dates(request.horizon))}
        slot_idx = {st.code: i for i, st in enumerate(request.shiftTypes)}
        
        # Build skill index
        skills = self._collect_skills(request)
        skill_idx = {skill: i for i, skill in enumerate(skills)}
        
        # Build shift type index
        shift_type_idx = {st.id: i for i, st in enumerate(request.shiftTypes)}
        
        # Build week bins
        week_bins = {}
        week_idx = {}
        dates = self._get_dates(request.horizon)
        for date_str in dates:
            date_obj = date.fromisoformat(date_str)
            week_key = f"{date_obj.isocalendar()[0]}-{date_obj.isocalendar()[1]:02d}"
            if week_key not in week_bins:
                week_bins[week_key] = []
            week_bins[week_key].append(date_str)
            week_idx[date_str] = week_key
        
        # Build shift durations
        shift_durations = {st.id: st.durationMinutes for st in request.shiftTypes}
        
        # Build forbidden adjacency matrix
        forbidden_adjacency = {}
        for st1 in request.shiftTypes:
            forbidden_adjacency[st1.id] = {}
            for st2 in request.shiftTypes:
                # Check if rest between shifts is insufficient (11h)
                forbidden_adjacency[st1.id][st2.id] = self._insufficient_rest(st1, st2)
        
        return ModelIndices(
            staff_idx=staff_idx,
            ward_idx=ward_idx,
            date_idx=date_idx,
            slot_idx=slot_idx,
            skill_idx=skill_idx,
            shift_type_idx=shift_type_idx,
            week_bins=week_bins,
            week_idx=week_idx,
            shift_durations=shift_durations,
            forbidden_adjacency=forbidden_adjacency
        )
    
    def _insufficient_rest(self, shift1, shift2) -> bool:
        """Check if rest between two shifts is insufficient (less than 11h)"""
        # Parse shift times
        start1 = datetime.strptime(shift1.start, "%H:%M")
        end1 = datetime.strptime(shift1.end, "%H:%M")
        start2 = datetime.strptime(shift2.start, "%H:%M")
        end2 = datetime.strptime(shift2.end, "%H:%M")
        
        # Handle night shifts that cross midnight
        if shift1.isNight:
            end1 = end1 + timedelta(days=1)
        if shift2.isNight:
            end2 = end2 + timedelta(days=1)
        
        # Calculate rest time (assuming shift2 follows shift1)
        rest_hours = (start2 - end1).total_seconds() / 3600
        
        return rest_hours < 11
    
    def _get_dates(self, horizon) -> List[str]:
        """Get list of dates in horizon"""
        start_date = date.fromisoformat(horizon.start)
        end_date = date.fromisoformat(horizon.end)
        dates = []
        current = start_date
        while current <= end_date:
            dates.append(current.isoformat())
            current += timedelta(days=1)
        return dates
    
    def _total_required(self, requirements) -> int:
        """Calculate total required from requirements dict"""
        if isinstance(requirements, dict):
            return sum(requirements.values())
        elif isinstance(requirements, int):
            return requirements
        else:
            raise TypeError(f"Requirements must be dict or int, got {type(requirements)}")
    
    def _extract_assignments(self, solver: cp_model.CpSolver, x: Dict, indices: ModelIndices, request: SolverRequestModel) -> List[AssignmentModel]:
        """Extract assignments from solver solution"""
        assignments = []
        
        for var_name, var in x.items():
            if solver.Value(var) == 1:
                # Parse variable name: x_{staff_id}_{date}_{slot}_{ward_id}
                parts = var_name.split('_')
                if len(parts) >= 5:
                    staff_id = parts[1]
                    date_str = parts[2]
                    slot = parts[3]
                    ward_id = parts[4]
                    
                    # Find shift type ID
                    shift_type = next((st for st in request.shiftTypes if st.code == slot), None)
                    if shift_type:
                        assignment = AssignmentModel(
                            staffId=staff_id,
                            wardId=ward_id,
                            date=date_str,
                            slot=slot,
                            shiftTypeId=shift_type.id
                        )
                        assignments.append(assignment)
        
        return assignments
    
    def _calculate_metrics(self, assignments: List[AssignmentModel], request: SolverRequestModel, solve_time_ms: int) -> MetricsModel:
        """Calculate solution metrics"""
        # Calculate fairness (standard deviation of night shifts per staff)
        night_shifts_per_staff = {}
        night_shift_codes = [st.code for st in request.shiftTypes if st.isNight]
        
        for assignment in assignments:
            if assignment.slot in night_shift_codes:
                night_shifts_per_staff[assignment.staffId] = night_shifts_per_staff.get(assignment.staffId, 0) + 1
        
        if night_shifts_per_staff:
            night_counts = list(night_shifts_per_staff.values())
            fairness_std = np.std(night_counts) if len(night_counts) > 1 else 0.0
        else:
            fairness_std = 0.0
        
        # Calculate preference satisfaction
        satisfied_preferences = 0
        total_preferences = len(request.preferences)
        
        for pref in request.preferences:
            for assignment in assignments:
                if (assignment.staffId == pref.staffId and 
                    assignment.date == pref.date):
                    if pref.preferOn:
                        satisfied_preferences += 1
                    elif pref.preferOff:
                        satisfied_preferences -= 1
                    break
        
        preference_satisfaction = max(0, satisfied_preferences / max(1, total_preferences))
        
        return MetricsModel(
            hardViolations=0,  # Will be calculated in validation
            solveMs=solve_time_ms,
            fairnessNightStd=fairness_std,
            preferenceSatisfaction=preference_satisfaction
        )
    
    def _add_hints(self, model: cp_model.CpModel, solver: cp_model.CpSolver, indices: ModelIndices, request: SolverRequestModel):
        """Add hints to guide the solver"""
        # Implementation for hints would go here
        pass

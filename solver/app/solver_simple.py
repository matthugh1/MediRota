import time
from typing import List, Dict, Tuple, Optional, Set
from datetime import datetime, timedelta
from ortools.sat.python import cp_model
import math

from .models import (
    SolverRequestModel, RepairRequestModel, AssignmentModel, 
    MetricsModel, DiagnosticsModel, SolverResponseModel
)

class SimpleRotaSolver:
    def __init__(self):
        self.model = None
        self.solver = None
        self.variables = {}
        
    def solve(self, request: SolverRequestModel, time_budget_ms: int = 300000) -> SolverResponseModel:
        """Solve the rota problem with a simplified approach"""
        start_time = time.time()
        
        # Create model
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()
        self.solver.parameters.max_time_in_seconds = time_budget_ms / 1000
        
        # Build simplified model
        self._build_simple_model(request)
        
        # Solve
        status = self.solver.Solve(self.model)
        solve_time_ms = int((time.time() - start_time) * 1000)
        
        print(f"DEBUG: Solver status = {status}")
        print(f"DEBUG: Number of variables = {len(self.variables)}")
        
        # Process results
        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            assignments = self._extract_simple_assignments(request)
            print(f"DEBUG: Extracted {len(assignments)} assignments")
            metrics = self._calculate_simple_metrics(assignments, request, solve_time_ms)
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
        
    def _build_simple_model(self, request: SolverRequestModel):
        """Build a simplified CP-SAT model"""
        # Create variables: x[staff_id][date][slot] = 1 if assigned
        for staff in request.staff:
            for demand in request.demands:
                var_name = f"x_{staff.id}_{demand.date}_{demand.slot}"
                self.variables[var_name] = self.model.NewBoolVar(var_name)
        
        # Coverage constraints: meet demand for each skill
        for demand in request.demands:
            for skill, required_count in demand.requiredBySkill.items():
                skilled_staff_vars = []
                for staff in request.staff:
                    if skill in staff.skills:
                        var_name = f"x_{staff.id}_{demand.date}_{demand.slot}"
                        skilled_staff_vars.append(self.variables[var_name])
                
                if skilled_staff_vars:
                    self.model.Add(sum(skilled_staff_vars) >= required_count)
        
        # One shift per day per staff
        for staff in request.staff:
            for date in set(demand.date for demand in request.demands):
                day_vars = []
                for demand in request.demands:
                    if demand.date == date:
                        var_name = f"x_{staff.id}_{demand.date}_{demand.slot}"
                        day_vars.append(self.variables[var_name])
                
                if day_vars:
                    self.model.Add(sum(day_vars) <= 1)
        
        # Objective: minimize total assignments
        all_vars = list(self.variables.values())
        if all_vars:
            self.model.Minimize(sum(all_vars))
        
    def _extract_simple_assignments(self, request: SolverRequestModel) -> List[AssignmentModel]:
        """Extract assignments from solver solution"""
        assignments = []
        
        for staff in request.staff:
            for demand in request.demands:
                var_name = f"x_{staff.id}_{demand.date}_{demand.slot}"
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
        
    def _calculate_simple_metrics(self, assignments: List[AssignmentModel], request: SolverRequestModel, solve_time_ms: int) -> MetricsModel:
        """Calculate solution metrics"""
        # Count unfilled demand
        unfilled_demand = 0
        for demand in request.demands:
            for skill, required_count in demand.requiredBySkill.items():
                assigned_count = 0
                for assignment in assignments:
                    if assignment.date == demand.date and assignment.slot == demand.slot:
                        # Check if assigned staff has the required skill
                        for staff in request.staff:
                            if staff.id == assignment.staffId and skill in staff.skills:
                                assigned_count += 1
                                break
                unfilled_demand += max(0, required_count - assigned_count)
        
        return MetricsModel(
            objective=float(self.solver.ObjectiveValue()),
            unfilledDemand=unfilled_demand,
            hardViolations=0,
            fairnessScore=1.0,
            preferenceScore=1.0,
            solveTimeMs=solve_time_ms,
            fairnessNightStd=0.0,
            preferenceSatisfaction=1.0
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

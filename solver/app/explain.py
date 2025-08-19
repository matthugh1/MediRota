"""
Explain module for rota assignments
Provides rationale for assignments and alternative options
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta
import numpy as np

from .models import (
    AssignmentModel, ExplainReasonModel, ExplainAlternativeModel, 
    ExplainResponseModel, SolverRequestModel
)

class RotaExplainer:
    """Explains rota assignments and provides alternatives"""
    
    def explain_assignment(self, 
                          assignment: AssignmentModel,
                          all_assignments: List[AssignmentModel],
                          request: SolverRequestModel) -> ExplainResponseModel:
        """Explain why a specific assignment was made"""
        
        reasons = []
        alternatives = []
        
        # Find the assigned staff
        assigned_staff = None
        for staff in request.staff:
            if staff.id == assignment.staffId:
                assigned_staff = staff
                break
        
        if not assigned_staff:
            return ExplainResponseModel(reasons=[], alternatives=[])
        
        # Reason 1: Skill match
        shift_type = None
        for st in request.shiftTypes:
            if st.id == assignment.shiftTypeId:
                shift_type = st
                break
        
        if shift_type:
            # Check what skills are needed for this assignment
            required_skills = []
            for demand in request.demand:
                if (demand.wardId == assignment.wardId and 
                    demand.date == assignment.date and 
                    demand.slot == assignment.slot):
                    required_skills.extend(demand.requirements.keys())
            
            matching_skills = [skill for skill in required_skills if skill in assigned_staff.skills]
            if matching_skills:
                reasons.append(ExplainReasonModel(
                    type="skill_match",
                    description=f"Staff has required skills: {', '.join(matching_skills)}",
                    weight=0.8
                ))
        
        # Reason 2: Ward eligibility
        if assignment.wardId in assigned_staff.eligibleWards:
            reasons.append(ExplainReasonModel(
                type="ward_eligibility",
                description=f"Staff is eligible for {assignment.wardId}",
                weight=0.6
            ))
        
        # Reason 3: Fairness consideration
        night_shifts_per_staff = self._count_night_shifts(all_assignments, request)
        if assignment.slot in [st.code for st in request.shiftTypes if st.isNight]:
            staff_night_count = night_shifts_per_staff.get(assignment.staffId, 0)
            avg_night_count = np.mean(list(night_shifts_per_staff.values())) if night_shifts_per_staff else 0
            
            if staff_night_count <= avg_night_count:
                reasons.append(ExplainReasonModel(
                    type="fairness",
                    description=f"Staff has {staff_night_count} night shifts (avg: {avg_night_count:.1f})",
                    weight=0.7
                ))
        
        # Reason 4: Preference satisfaction
        for pref in request.preferences:
            if (pref.staffId == assignment.staffId and 
                pref.date == assignment.date):
                if pref.preferOn:
                    reasons.append(ExplainReasonModel(
                        type="preference",
                        description="Staff preferred to work this shift",
                        weight=0.9
                    ))
                elif pref.preferOff:
                    reasons.append(ExplainReasonModel(
                        type="constraint",
                        description="Staff preferred not to work but was required",
                        weight=0.3
                    ))
        
        # Find alternatives
        alternatives = self._find_alternatives(assignment, all_assignments, request)
        
        return ExplainResponseModel(reasons=reasons, alternatives=alternatives)
    
    def _count_night_shifts(self, assignments: List[AssignmentModel], request: SolverRequestModel) -> Dict[str, int]:
        """Count night shifts per staff"""
        night_shifts_per_staff = {}
        night_shift_codes = [st.code for st in request.shiftTypes if st.isNight]
        
        for assignment in assignments:
            if assignment.slot in night_shift_codes:
                night_shifts_per_staff[assignment.staffId] = night_shifts_per_staff.get(assignment.staffId, 0) + 1
        
        return night_shifts_per_staff
    
    def _find_alternatives(self, 
                          assignment: AssignmentModel,
                          all_assignments: List[AssignmentModel],
                          request: SolverRequestModel) -> List[ExplainAlternativeModel]:
        """Find alternative staff for this assignment"""
        alternatives = []
        
        # Find staff with required skills
        required_skills = []
        for demand in request.demand:
            if (demand.wardId == assignment.wardId and 
                demand.date == assignment.date and 
                demand.slot == assignment.slot):
                required_skills.extend(demand.requirements.keys())
        
        # Find eligible staff
        eligible_staff = []
        for staff in request.staff:
            if (staff.id != assignment.staffId and  # Not the currently assigned staff
                assignment.wardId in staff.eligibleWards and
                any(skill in staff.skills for skill in required_skills)):
                eligible_staff.append(staff)
        
        # Calculate current fairness metrics
        current_night_shifts = self._count_night_shifts(all_assignments, request)
        current_std = np.std(list(current_night_shifts.values())) if current_night_shifts else 0
        
        # Evaluate each alternative
        for staff in eligible_staff[:3]:  # Limit to 3 alternatives
            # Check if this staff is already assigned on this date
            already_assigned = any(
                a.staffId == staff.id and a.date == assignment.date 
                for a in all_assignments
            )
            
            if already_assigned:
                continue
            
            # Calculate fairness impact
            alternative_night_shifts = current_night_shifts.copy()
            if assignment.slot in [st.code for st in request.shiftTypes if st.isNight]:
                # Remove night shift from current staff
                if assignment.staffId in alternative_night_shifts:
                    alternative_night_shifts[assignment.staffId] -= 1
                # Add night shift to alternative staff
                alternative_night_shifts[staff.id] = alternative_night_shifts.get(staff.id, 0) + 1
            
            alternative_std = np.std(list(alternative_night_shifts.values())) if alternative_night_shifts else 0
            fairness_delta = alternative_std - current_std
            
            # Check for risk breaches
            risk_breaches = []
            
            # Check if alternative would violate one shift per day
            if any(a.staffId == staff.id and a.date == assignment.date for a in all_assignments):
                risk_breaches.append("Already assigned on this date")
            
            # Check if alternative would violate rest constraints
            if self._would_violate_rest(staff.id, assignment, all_assignments, request):
                risk_breaches.append("Would violate rest constraints")
            
            # Check if alternative would violate consecutive nights
            if self._would_violate_consecutive_nights(staff.id, assignment, all_assignments, request):
                risk_breaches.append("Would violate consecutive nights limit")
            
            alternatives.append(ExplainAlternativeModel(
                staffId=staff.id,
                why=f"Has required skills: {', '.join([s for s in staff.skills if s in required_skills])}",
                fairnessDelta=fairness_delta,
                riskBreaches=risk_breaches
            ))
        
        return alternatives
    
    def _would_violate_rest(self, 
                           staff_id: str,
                           assignment: AssignmentModel,
                           all_assignments: List[AssignmentModel],
                           request: SolverRequestModel) -> bool:
        """Check if assignment would violate rest constraints"""
        # Simplified check - in practice you'd need proper time arithmetic
        min_rest_hours = request.rules.minRestHours
        
        # Check assignments on adjacent days
        assignment_date = datetime.strptime(assignment.date, "%Y-%m-%d")
        
        for other_assignment in all_assignments:
            if other_assignment.staffId == staff_id:
                other_date = datetime.strptime(other_assignment.date, "%Y-%m-%d")
                days_diff = abs((assignment_date - other_date).days)
                
                # If assignments are on consecutive days and one is a night shift
                if days_diff <= 1:
                    shift_types = {st.id: st for st in request.shiftTypes}
                    current_shift = shift_types.get(assignment.shiftTypeId)
                    other_shift = shift_types.get(other_assignment.shiftTypeId)
                    
                    if current_shift and other_shift:
                        if current_shift.isNight or other_shift.isNight:
                            return True
        
        return False
    
    def _would_violate_consecutive_nights(self,
                                        staff_id: str,
                                        assignment: AssignmentModel,
                                        all_assignments: List[AssignmentModel],
                                        request: SolverRequestModel) -> bool:
        """Check if assignment would violate consecutive nights limit"""
        max_consecutive = request.rules.maxConsecutiveNights
        
        # Get all night shift assignments for this staff
        night_assignments = []
        night_shift_codes = [st.code for st in request.shiftTypes if st.isNight]
        
        for a in all_assignments:
            if a.staffId == staff_id and a.slot in night_shift_codes:
                night_assignments.append(a)
        
        # Add the potential new assignment
        if assignment.slot in night_shift_codes:
            night_assignments.append(assignment)
        
        # Check for consecutive nights
        if len(night_assignments) >= max_consecutive + 1:
            dates = [datetime.strptime(a.date, "%Y-%m-%d") for a in night_assignments]
            dates.sort()
            
            for i in range(len(dates) - max_consecutive):
                consecutive_dates = dates[i:i + max_consecutive + 1]
                if all((consecutive_dates[j+1] - consecutive_dates[j]).days == 1 
                       for j in range(len(consecutive_dates) - 1)):
                    return True
        
        return False

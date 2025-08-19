from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional, Any, Union
from datetime import datetime
from enum import Enum

class StaffRole(str, Enum):
    DOCTOR = "doctor"
    NURSE = "nurse"
    RADIOGRAPHER = "radiographer"

class EventType(str, Enum):
    SICKNESS = "sickness"
    DEMAND_CHANGE = "demand_change"
    RULE_CHANGE = "rule_change"

class HorizonModel(BaseModel):
    start: str
    end: str

class WardModel(BaseModel):
    id: str
    name: str

class ShiftTypeModel(BaseModel):
    id: str
    code: str
    start: str
    end: str
    isNight: bool
    durationMinutes: int

class StaffModel(BaseModel):
    id: str
    fullName: str
    job: str
    contractHoursPerWeek: float
    skills: List[str]
    eligibleWards: List[str]

class DemandModel(BaseModel):
    wardId: str
    date: str
    slot: str
    requirements: Dict[str, int]
    
    @validator('requirements', pre=True)
    def validate_requirements(cls, v):
        """Validate and coerce requirements to dict of {skill: int}"""
        if isinstance(v, dict):
            # Coerce all values to int
            return {str(k): int(v) for k, v in v.items()}
        elif isinstance(v, int):
            # Convert single int to {"default": int}
            return {"default": int(v)}
        else:
            raise TypeError(f"Requirements must be dict or int, got {type(v)}: {v}")

class RulesModel(BaseModel):
    minRestHours: int
    maxConsecutiveNights: int
    oneShiftPerDay: bool

class LockModel(BaseModel):
    staffId: str
    wardId: str
    date: str
    slot: str

class PreferenceModel(BaseModel):
    staffId: str
    date: str
    preferOff: bool = False
    preferOn: bool = False

class HintModel(BaseModel):
    staffId: str
    wardId: str
    date: str
    slot: str

class RepairEventModel(BaseModel):
    type: EventType
    staffId: str
    wardId: str
    date: str
    slot: str

class ObjectiveModel(str, Enum):
    MIN_SOFT_PENALTIES = "min_soft_penalties"
    MIN_TOTAL_ASSIGNMENTS = "min_total_assignments"

class SolverRequestModel(BaseModel):
    horizon: HorizonModel
    wards: List[WardModel]
    shiftTypes: List[ShiftTypeModel]
    staff: List[StaffModel]
    demand: List[DemandModel]
    rules: RulesModel
    locks: List[LockModel] = []
    preferences: List[PreferenceModel] = []
    objective: ObjectiveModel = ObjectiveModel.MIN_SOFT_PENALTIES
    timeBudgetMs: int = Field(default=180000, ge=10000, le=600000)
    hints: List[HintModel] = []

class RepairRequestModel(SolverRequestModel):
    events: List[RepairEventModel]

class AssignmentModel(BaseModel):
    staffId: str
    wardId: str
    date: str
    slot: str
    shiftTypeId: str

class UnfilledDemandModel(BaseModel):
    wardId: str
    date: str
    slot: str
    skill: str
    required: int
    filled: int

class MetricsModel(BaseModel):
    hardViolations: int
    solveMs: int
    fairnessNightStd: float
    preferenceSatisfaction: float

class DiagnosticsModel(BaseModel):
    unfilled: List[UnfilledDemandModel] = []
    infeasible: bool = False
    notes: List[str] = []
    violationSamples: List[str] = []
    summary: Optional[Dict] = None

class SolverResponseModel(BaseModel):
    solutionId: str
    assignments: List[AssignmentModel]
    metrics: MetricsModel
    diagnostics: DiagnosticsModel

class ExplainReasonModel(BaseModel):
    type: str
    description: str
    weight: float

class ExplainAlternativeModel(BaseModel):
    staffId: str
    why: str
    fairnessDelta: float
    riskBreaches: List[str] = []

class ExplainResponseModel(BaseModel):
    reasons: List[ExplainReasonModel]
    alternatives: List[ExplainAlternativeModel]

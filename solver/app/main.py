"""
MediRota Solver - FastAPI endpoints for NHS rota optimization

Control Flow:
API Request → Validate Input → Build CP-SAT Model → Solve → Validate Solution → Respond

Endpoints:
- POST /solve_full: Solve complete rota problem
- POST /solve_repair: Repair existing solution after events  
- GET /explain: Explain assignment rationale and alternatives
- GET /healthz: Health check
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import time
import uuid
import json
import logging
from pydantic import ValidationError
from typing import Dict, Any, List

from .models import (
    SolverRequestModel, RepairRequestModel, SolverResponseModel,
    ExplainResponseModel, AssignmentModel
)
from .solver_core import RotaSolverCore
from .explain import RotaExplainer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MediRota Solver", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory debug store
LAST = {"request": None, "response": None, "log": []}

def debug_log(message: str):
    """Append message to debug log"""
    LAST["log"].append(message)
    logger.info(f"[DEBUG] {message}")

# Initialize components
solver = RotaSolverCore()
explainer = RotaExplainer()

# In-memory storage for solutions (in production, use database)
solutions = {}

@app.get("/healthz")
async def health_check():
    """Health check endpoint"""
    return {"ok": True}

@app.get("/_debug/last")
async def get_debug_last():
    """Get last request/response and debug log"""
    return {
        "request": LAST["request"],
        "response": LAST["response"], 
        "log": LAST["log"][-100:]  # Last 100 log entries
    }

@app.post("/solve_full")
async def solve_full(request_data: dict):
    """Solve full rota problem"""
    try:
        # Parse and validate request
        request = SolverRequestModel(**request_data)
        
        # Save request for debugging
        LAST["request"] = request_data
        
        # Log request summary
        debug_log(f"=== SOLVER REQUEST SUMMARY ===")
        debug_log(f"Staff: {len(request.staff)} members")
        debug_log(f"ShiftTypes: {len(request.shiftTypes)} types")
        debug_log(f"Wards: {len(request.wards)} wards")
        debug_log(f"Demand: {len(request.demand)} items")
        if len(request.demand) > 0:
            debug_log(f"First demand requirements type: {type(request.demand[0].requirements)}")
            debug_log(f"First demand requirements: {request.demand[0].requirements}")
            debug_log(f"First demand requirements keys: {list(request.demand[0].requirements.keys())}")
            debug_log(f"First demand requirements values: {list(request.demand[0].requirements.values())}")
        else:
            debug_log("No demand items")
        debug_log(f"=================================")
        
        # Solve
        solver = RotaSolverCore()
        assignments, metrics, diagnostics = solver.solve(request)
        
        # Create response
        response = SolverResponseModel(
            solutionId=f"sol_{hash(str(assignments)) % 100000000:08x}",
            assignments=assignments,
            metrics=metrics,
            diagnostics=diagnostics
        )
        
        # Save response for debugging
        LAST["response"] = response.dict()
        
        return response
        
    except ValidationError as e:
        debug_log(f"Validation error: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        debug_log(f"Solver error: {e}")
        raise HTTPException(status_code=500, detail=f"Solver error: {e}")

@app.post("/solve_repair")
async def solve_repair(request_data: dict):
    """Solve repair problem"""
    try:
        # Parse and validate request
        request = SolverRequestModel(**request_data)
        
        # Save request for debugging
        LAST["request"] = request_data
        
        # Log request summary
        debug_log(f"=== SOLVER REPAIR REQUEST SUMMARY ===")
        debug_log(f"Staff: {len(request.staff)} members")
        debug_log(f"ShiftTypes: {len(request.shiftTypes)} types")
        debug_log(f"Wards: {len(request.wards)} wards")
        debug_log(f"Demand: {len(request.demand)} items")
        if len(request.demand) > 0:
            debug_log(f"First demand requirements type: {type(request.demand[0].requirements)}")
            debug_log(f"First demand requirements: {request.demand[0].requirements}")
            debug_log(f"First demand requirements keys: {list(request.demand[0].requirements.keys())}")
            debug_log(f"First demand requirements values: {list(request.demand[0].requirements.values())}")
        else:
            debug_log("No demand items")
        debug_log(f"======================================")
        
        # Solve repair (same as full for now)
        solver = RotaSolverCore()
        assignments, metrics, diagnostics = solver.solve(request)
        
        # Create response
        response = SolverResponseModel(
            solutionId=f"repair_{hash(str(assignments)) % 100000000:08x}",
            assignments=assignments,
            metrics=metrics,
            diagnostics=diagnostics
        )
        
        # Save response for debugging
        LAST["response"] = response.dict()
        
        return response
        
    except ValidationError as e:
        debug_log(f"Validation error: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        debug_log(f"Solver error: {e}")
        raise HTTPException(status_code=500, detail=f"Solver error: {e}")

@app.get("/explain", response_model=ExplainResponseModel)
async def explain_assignment(
    scheduleId: str = Query(..., description="Solution ID"),
    staffId: str = Query(..., description="Staff ID"),
    date: str = Query(..., description="Date (YYYY-MM-DD)"),
    slot: str = Query(..., description="Shift slot")
):
    """
    Explain why a specific assignment was made and provide alternatives
    
    - **scheduleId**: Solution ID from solve_full or solve_repair
    - **staffId**: Staff member ID
    - **date**: Assignment date
    - **slot**: Shift slot
    """
    try:
        # Get solution from storage
        if scheduleId not in solutions:
            raise HTTPException(
                status_code=404,
                detail="Solution not found"
            )
        
        solution = solutions[scheduleId]
        assignments = solution["assignments"]
        request = solution["request"]
        
        # Find the specific assignment
        target_assignment = None
        for assignment in assignments:
            if (assignment.staffId == staffId and 
                assignment.date == date and 
                assignment.slot == slot):
                target_assignment = assignment
                break
        
        if not target_assignment:
            raise HTTPException(
                status_code=404,
                detail="Assignment not found"
            )
        
        # Explain the assignment
        explanation = explainer.explain_assignment(
            target_assignment, assignments, request
        )
        
        return explanation
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Explain error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Explain error: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8090)


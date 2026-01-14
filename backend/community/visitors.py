from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta
import random
import string

router = APIRouter()

class Visitor(BaseModel):
    id: int
    name: str
    arrival_date: datetime
    access_code: str

class VisitorCreate(BaseModel):
    name: str
    arrival_date: datetime

# Mock Database
mock_visitors = []

def generate_code():
    return ''.join(random.choices(string.digits, k=6))

@router.get("/", response_model=List[Visitor])
async def get_visitors():
    return mock_visitors

@router.post("/", response_model=Visitor)
async def register_visitor(visitor: VisitorCreate):
    new_visit = {
        "id": len(mock_visitors) + 1,
        "name": visitor.name,
        "arrival_date": visitor.arrival_date,
        "access_code": generate_code()
    }
    mock_visitors.append(new_visit)
    return new_visit

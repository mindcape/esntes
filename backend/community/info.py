from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()

class BoardMember(BaseModel):
    name: str
    position: str
    email: str

class CommunityInfo(BaseModel):
    name: str
    address: str
    city_state_zip: str
    phone: str
    email: str

# Mock Data
mock_community_info = CommunityInfo(
    name="ESNTES Community Association",
    address="100 Community Way",
    city_state_zip="Springfield, IL 62704",
    phone="(555) 123-4567",
    email="management@esntes.com"
)

mock_board_members = [
    {"name": "Jane Smith", "position": "President", "email": "jane.pres@esntes.com"},
    {"name": "Robert Brown", "position": "Treasurer", "email": "rob.treas@esntes.com"},
    {"name": "Emily White", "position": "Secretary", "email": "emily.sec@esntes.com"}
]

@router.get("/info", response_model=CommunityInfo)
async def get_community_info():
    return mock_community_info

@router.get("/board", response_model=List[BoardMember])
async def get_board_members():
    return mock_board_members

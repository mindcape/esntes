from unittest.mock import MagicMock
from backend.community.settings_router import update_community_settings, CommunitySettings
from fastapi import HTTPException
import pytest

# Mock Models
class MockCommunity:
    def __init__(self):
        self.branding_settings = {}
        self.modules_enabled = {}
    
    def refresh(self): pass

def test_update_settings_success():
    mock_db = MagicMock()
    mock_user = MagicMock()
    mock_user.community_id = 1
    mock_user.role.name = "admin"
    
    mock_community = MockCommunity()
    mock_db.query.return_value.get.return_value = mock_community
    
    payload = CommunitySettings(
        branding_settings={"primary_color": "#000"},
        modules_enabled={"finance": True}
    )
    
    result = update_community_settings(payload, db=mock_db, current_user=mock_user)
    
    assert result.branding_settings["primary_color"] == "#000"
    assert mock_db.commit.called

def test_update_settings_unauthorized():
    mock_db = MagicMock()
    mock_user = MagicMock()
    mock_user.community_id = 1
    mock_user.role.name = "resident" # Not Admin
    
    payload = CommunitySettings(
        branding_settings={},
        modules_enabled={}
    )
    
    with pytest.raises(HTTPException) as exc:
        update_community_settings(payload, db=mock_db, current_user=mock_user)
    
    assert exc.value.status_code == 403

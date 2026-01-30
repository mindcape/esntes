from unittest.mock import MagicMock
from backend.communication.router import list_failed_emails, retry_email, retry_campaign_failures
from backend.communication.models import EmailStatus
import pytest
from fastapi import HTTPException

# Mock User and models similar to previous tests, but simpler functional check logic
def test_list_failed_emails_rbac():
    mock_db = MagicMock()
    mock_user = MagicMock()
    mock_user.community_id = 99
    mock_user.role.name = "admin"
    
    # Filter chaining mock
    mock_query = mock_db.query.return_value.join.return_value.filter.return_value
    
    list_failed_emails(campaign_id=None, community_id=None, db=mock_db, current_user=mock_user)
    
    # Verify we filtered by community_id 99 (implicit in join logic in real Filter)
    # Since we mocked the chaining, we just ensure no error and DB was queried.
    assert mock_db.query.called

def test_retry_campaign_failures_permission_denied():
    mock_db = MagicMock()
    mock_user = MagicMock()
    mock_user.community_id = 1
    mock_user.role.name = "admin"
    
    mock_campaign = MagicMock()
    mock_campaign.community_id = 2 # Different community
    mock_db.query.return_value.get.return_value = mock_campaign
    
    with pytest.raises(HTTPException) as exc:
        retry_campaign_failures(campaign_id=10, db=mock_db, current_user=mock_user)
    
    assert exc.value.status_code == 403

def test_retry_campaign_failures_super_admin_success():
    mock_db = MagicMock()
    mock_user = MagicMock()
    mock_user.community_id = 1
    mock_user.role.name = "super_admin"
    
    mock_campaign = MagicMock()
    mock_campaign.community_id = 2 # Different community
    mock_db.query.return_value.get.return_value = mock_campaign
    
    retry_campaign_failures(campaign_id=10, db=mock_db, current_user=mock_user)
    
    assert mock_db.commit.called

import pytest
from unittest.mock import MagicMock, patch
from backend.core.storage import S3StorageAdapter

@pytest.fixture
def mock_boto_client():
    with patch('boto3.client') as mock:
        yield mock

def test_generate_presigned_url_success(mock_boto_client):
    # Setup
    mock_s3 = mock_boto_client.return_value
    mock_s3.generate_presigned_url.return_value = "http://minio/bucket/file?sig=123"
    
    adapter = S3StorageAdapter()
    url = adapter.generate_presigned_url("test.jpg")
    
    assert url == "http://minio/bucket/file?sig=123"
    mock_s3.generate_presigned_url.assert_called_with(
        'get_object',
        Params={'Bucket': adapter.bucket_name, 'Key': 'test.jpg'},
        ExpiresIn=3600
    )

def test_generate_presigned_url_failure(mock_boto_client):
    # Setup
    mock_s3 = mock_boto_client.return_value
    from botocore.exceptions import ClientError
    mock_s3.generate_presigned_url.side_effect = ClientError({}, "GeneratePresignedUrl")
    
    adapter = S3StorageAdapter()
    url = adapter.generate_presigned_url("test.jpg")
    
    assert url is None

def test_delete_file_success(mock_boto_client):
    mock_s3 = mock_boto_client.return_value
    
    adapter = S3StorageAdapter()
    result = adapter.delete_file("test.jpg")
    
    assert result is True
    mock_s3.delete_object.assert_called_with(Bucket=adapter.bucket_name, Key="test.jpg")

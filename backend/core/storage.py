import boto3
from botocore.exceptions import ClientError
from backend.core.config import settings
import logging
import os
import shutil
from pathlib import Path
from tempfile import NamedTemporaryFile

logger = logging.getLogger(__name__)

class StorageAdapter:
    """Abstract base for storage adapters"""
    def generate_presigned_url(self, object_name: str, expiration: int = 3600, method: str = 'get') -> str:
        raise NotImplementedError

    def generate_presigned_post(self, object_name: str, expiration: int = 3600) -> dict:
        raise NotImplementedError

    def delete_file(self, object_name: str) -> bool:
        raise NotImplementedError

    def save_file(self, file_obj, object_name: str, sub_folder: str = None) -> str:
        """Save a file object to storage and return its public URL or path"""
        raise NotImplementedError

class S3StorageAdapter(StorageAdapter):
    def __init__(self):
        # Build config dict, filtering out None values to let boto3 auto-resolve
        boto_config = {
            'service_name': 's3',
            'region_name': settings.AWS_REGION,
            'endpoint_url': settings.S3_ENDPOINT_URL
        }
        
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            boto_config['aws_access_key_id'] = settings.AWS_ACCESS_KEY_ID
            boto_config['aws_secret_access_key'] = settings.AWS_SECRET_ACCESS_KEY
            
        self.s3_client = boto3.client(**boto_config)
        self.bucket_name = settings.S3_BUCKET_NAME

    def generate_presigned_url(self, object_name: str, expiration: int = 3600, method: str = 'get') -> str:
        """Generate a presigned URL to share an S3 object"""
        try:
            response = self.s3_client.generate_presigned_url(
                'get_object' if method == 'get' else 'put_object',
                Params={'Bucket': self.bucket_name, 'Key': object_name},
                ExpiresIn=expiration
            )
        except ClientError as e:
            logger.error(e)
            return None
        return response

    def generate_presigned_post(self, object_name: str, expiration: int = 3600) -> dict:
        """Generate a presigned URL to upload a file"""
        try:
            response = self.s3_client.generate_presigned_post(
                self.bucket_name,
                object_name,
                ExpiresIn=expiration
            )
        except ClientError as e:
            logger.error(e)
            return None
        return response

    def delete_file(self, object_name: str) -> bool:
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=object_name)
        except ClientError as e:
            logger.error(e)
            return False
        return True

    def save_file(self, file_obj, object_name: str, sub_folder: str = None) -> str:
        """Uploads file object to S3"""
        try:
            full_key = f"{sub_folder}/{object_name}" if sub_folder else object_name
            self.s3_client.upload_fileobj(file_obj, self.bucket_name, full_key)
            return full_key
        except ClientError as e:
            logger.error(e)
            raise e

class LocalStorageAdapter(StorageAdapter):
    def __init__(self):
        self.base_path = Path(settings.LOCAL_STORAGE_PATH)
        self.base_path.mkdir(parents=True, exist_ok=True)
        self.base_url = f"{settings.FRONTEND_URL}/uploads" # Or backend serving URL

    def generate_presigned_url(self, object_name: str, expiration: int = 3600, method: str = 'get') -> str:
        # Local storage doesn't support expiration, just return static URL
        # For local dev, we serve files from /static/uploads or similar
        return f"/static/{object_name}"

    def generate_presigned_post(self, object_name: str, expiration: int = 3600) -> dict:
        # Not supported for local - frontend should use direct upload endpoint
        return None

    def delete_file(self, object_name: str) -> bool:
        file_path = self.base_path / object_name
        try:
            if file_path.exists():
                os.remove(file_path)
                return True
        except OSError as e:
            logger.error(f"Error checking/deleting file {file_path}: {e}")
        return False

    def save_file(self, file_obj, object_name: str, sub_folder: str = None) -> str:
        if sub_folder:
            file_path = self.base_path / sub_folder / object_name
        else:
            file_path = self.base_path / object_name
            
        # Ensure directory exists for nested paths
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file_obj, buffer)
            
        if sub_folder:
            return f"{sub_folder}/{object_name}"
        return object_name

# Singleton instance based on config
if settings.STORAGE_TYPE == "s3":
    storage = S3StorageAdapter()
else:
    storage = LocalStorageAdapter()

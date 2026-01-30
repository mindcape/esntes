import boto3
from botocore.exceptions import ClientError
from backend.core.config import settings
import logging

logger = logging.getLogger(__name__)

class StorageAdapter:
    """Abstract base for storage adapters"""
    def generate_presigned_url(self, object_name: str, expiration: int = 3600, method: str = 'get') -> str:
        raise NotImplementedError

    def generate_presigned_post(self, object_name: str, expiration: int = 3600) -> dict:
        raise NotImplementedError

    def delete_file(self, object_name: str) -> bool:
        raise NotImplementedError

class S3StorageAdapter(StorageAdapter):
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            endpoint_url=settings.S3_ENDPOINT_URL
        )
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

# Singleton instance
storage = S3StorageAdapter()

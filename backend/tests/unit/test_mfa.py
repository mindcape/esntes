import pytest
from unittest.mock import MagicMock, patch
from backend.core.security_mfa import MFASecurity

def test_mfa_generate_secret():
    mfa = MFASecurity()
    secret = mfa.generate_secret()
    assert len(secret) == 32
    assert isinstance(secret, str)

def test_mfa_verify_success():
    mfa = MFASecurity()
    # Mock pyotp.TOTP
    with patch('pyotp.TOTP') as MockTOTP:
        instance = MockTOTP.return_value
        instance.verify.return_value = True
        
        valid = mfa.verify_totp("SECRET", "123456")
        assert valid is True

def test_mfa_verify_failure():
    mfa = MFASecurity()
    with patch('pyotp.TOTP') as MockTOTP:
        instance = MockTOTP.return_value
        instance.verify.return_value = False
        
        valid = mfa.verify_totp("SECRET", "WRONG")
        assert valid is False

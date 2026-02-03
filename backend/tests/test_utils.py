import pytest
from app.utils.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_token,
    generate_admin_code,
    verify_admin_code
)


class TestSecurityUtils:
    """Test security utility functions."""
    
    def test_password_hashing(self):
        """Test password hashing and verification."""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        assert hashed != password
        assert verify_password(password, hashed) is True
        assert verify_password("wrongpassword", hashed) is False
    
    def test_jwt_token_creation_and_decode(self):
        """Test JWT token creation and decoding."""
        user_id = "test-user-id-123"
        token = create_access_token({"sub": user_id})
        
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == user_id
    
    def test_jwt_token_invalid(self):
        """Test decoding invalid token returns None."""
        payload = decode_token("invalid-token")
        assert payload is None
    
    def test_admin_code_generation_and_verification(self):
        """Test admin code generation and verification."""
        code = generate_admin_code()
        
        assert code is not None
        assert len(code) == 8  # 4 bytes hex = 8 characters
        assert verify_admin_code(code) is True
        assert verify_admin_code("wrongcode") is False

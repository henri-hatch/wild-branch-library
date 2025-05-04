from fastapi import APIRouter, Depends, HTTPException, status, Body
from datetime import timedelta
from auth.models.token import Token
from sqlalchemy.orm import Session

from auth.services.auth_service import authenticate_user, create_access_token
from core.database import get_db

auth_router = APIRouter(
    prefix='/login',
    tags=['Auth'],
)

@auth_router.post('/access-token', summary="Simplified login for family members")
async def access_token(
    email: str = Body(...),
    password: str = Body(...),
    db: Session = Depends(get_db)
) -> Token:
    """
    A simplified login endpoint for family members.
    Just provide email and password directly in the request body.
    """
    user = authenticate_user(email, password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    # For family use, set token to expire after 30 days
    access_token_expires = timedelta(days=30)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return Token(access_token=access_token, token_type="bearer")

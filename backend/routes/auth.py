from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from datetime import timedelta, datetime
from typing import Annotated
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import EmailStr
import traceback
import logging
import sys

from models.user import UserCreate, User, Token
from utils.auth import (
    authenticate_user,
    create_access_token,
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_active_user
)
from database import get_database

# Get logger
logger = logging.getLogger("global_estates")

router = APIRouter()

@router.post("/register", response_model=User)
async def register_user(user_data: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    # Check if user already exists
    if await db.users.find_one({"email": user_data.email}):
        logger.warning(f"Registration attempt with existing email: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.model_dump()
    user_dict.pop("password")
    user_dict["hashed_password"] = hashed_password
    
    result = await db.users.insert_one(user_dict)
    logger.info(f"New user registered: {user_data.email}")
    
    # Get the created user
    created_user = await db.users.find_one({"_id": result.inserted_id})
    
    return {
        "id": str(created_user["_id"]),
        "email": created_user["email"],
        "name": created_user["name"],
        "is_active": created_user.get("is_active", True),
        "created_at": created_user.get("created_at")
    }

@router.post("/token", response_model=Token)
async def login_for_access_token(
    response: Response,
    request: Request,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        logger.info(f"Login attempt for user: {form_data.username}")
        
        # Add explicit CORS headers for the requesting origin
        origin = request.headers.get("origin")
        if origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
        
        if db is None:
            logger.error("Database connection is None!")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection failed",
            )
            
        user = await authenticate_user(db, form_data.username, form_data.password)
        if not user:
            logger.warning(f"Authentication failed for user: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        logger.info(f"Login successful for user: {form_data.username}")
        
        # Create response with token
        token_response = {"access_token": access_token, "token_type": "bearer"}
        
        return token_response
    except Exception as e:
        logger.error(f"Error in login_for_access_token: {str(e)}")
        logger.error(traceback.format_exc())
        raise

@router.options("/token")
async def options_token(response: Response, request: Request):
    # Handle preflight request for the token endpoint
    origin = request.headers.get("origin")
    if origin:
        # Add CORS headers for preflight request
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma, Expires"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Max-Age"] = "86400"  # 24 hours
    
    logger.debug(f"Handled OPTIONS request for /token from origin: {origin}")
    return {}

# Special no-CORS token endpoint for direct form submission
@router.post("/token-nocors")
async def login_no_cors(request: Request, db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        form_data = await request.form()
        username = form_data.get("username")
        password = form_data.get("password")
        
        logger.info(f"No-CORS login attempt for user: {username}")
        
        if db is None:
            logger.error("Database connection is None!")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": "Database connection failed"},
            )
            
        user = await authenticate_user(db, username, password)
        if not user:
            logger.warning(f"No-CORS authentication failed for user: {username}")
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Incorrect email or password"},
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        response = JSONResponse(
            content={"access_token": access_token, "token_type": "bearer"}
        )
        
        # Add CORS headers to allow any origin
        origin = request.headers.get("origin")
        if origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma, Expires"
        else:
            response.headers["Access-Control-Allow-Origin"] = "*"
        
        logger.info(f"No-CORS login successful for user: {username}")
        return response
    except Exception as e:
        logger.error(f"Error in login_no_cors: {str(e)}")
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": str(e)},
        )

@router.get("/me", response_model=User)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db = Depends(get_database)
):
    """Get current user profile"""
    try:
        logger.info(f"User profile accessed: {current_user.email}")
        
        # Get fresh user data from database
        user = await db.users.find_one({"email": current_user.email})
        if not user:
            logger.error(f"User not found in database: {current_user.email}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Ensure created_at is a datetime object
        if not user.get("created_at"):
            user["created_at"] = datetime.utcnow()
        elif isinstance(user["created_at"], str):
            try:
                user["created_at"] = datetime.fromisoformat(user["created_at"])
            except ValueError:
                user["created_at"] = datetime.utcnow()
        
        # Convert to User model
        return User(
            id=str(user["_id"]),
            email=user["email"],
            name=user["name"],
            is_active=user.get("is_active", True),
            created_at=user["created_at"],
            address=user.get("address")
        )
    except Exception as e:
        logger.error(f"Error in read_users_me: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        ) 
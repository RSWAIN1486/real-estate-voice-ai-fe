from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from typing import Annotated, List
import logging
from datetime import datetime

from models.user import User, Address
from utils.auth import get_current_active_user
from database import get_database

# Get logger
logger = logging.getLogger("dontminos")

router = APIRouter()

@router.post("/address", response_model=User)
async def update_user_address(
    request: Request,
    response: Response,
    address: Address,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db = Depends(get_database)
):
    """Update the current user's delivery address"""
    try:
        logger.info(f"Updating address for user: {current_user.email}")
        logger.debug(f"Address data received: {address.model_dump()}")
        
        # Add CORS headers
        origin = request.headers.get("origin")
        if origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Cache-Control, Pragma, Expires, X-Requested-With"
            response.headers["Access-Control-Max-Age"] = "86400"  # Cache preflight response for 24 hours
        
        # Check if database connection is available
        if db is None:
            logger.error("Database connection is None")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection failed"
            )

        # Validate address data
        address_dict = address.model_dump()
        logger.debug(f"Converted address to dict: {address_dict}")
        
        # Update user in database
        try:
            result = await db.users.update_one(
                {"email": current_user.email},
                {"$set": {"address": address_dict}}
            )
            logger.debug(f"Update result: {result.raw_result}")
        except Exception as db_error:
            logger.error(f"Database update error: {str(db_error)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database update failed: {str(db_error)}"
            )
        
        if result.modified_count == 0:
            # Check if the document exists but no changes were made
            existing_user = await db.users.find_one({"email": current_user.email})
            if not existing_user:
                logger.error(f"User not found during update: {current_user.email}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            else:
                logger.info("No changes made to address (data might be the same)")
        
        # Get updated user
        updated_user = await db.users.find_one({"email": current_user.email})
        if not updated_user:
            logger.error(f"User not found after update: {current_user.email}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Convert to User model with proper datetime handling
        user_data = {
            "id": str(updated_user["_id"]),
            "email": updated_user["email"],
            "name": updated_user["name"],
            "is_active": updated_user.get("is_active", True),
            "created_at": updated_user.get("created_at", datetime.utcnow()),  # Provide default if missing
            "address": updated_user.get("address")
        }
        
        logger.info(f"Address updated successfully for user: {current_user.email}")
        logger.debug(f"Returning user data: {user_data}")
        return user_data
    
    except HTTPException as http_ex:
        logger.error(f"HTTP Exception in update_user_address: {str(http_ex)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in update_user_address: {str(e)}")
        logger.error(f"Error traceback:", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating address: {str(e)}"
        )

@router.get("/address", response_model=Address)
async def get_user_address(
    request: Request,
    response: Response,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db = Depends(get_database)
):
    """Get the current user's delivery address"""
    try:
        logger.info(f"Fetching address for user: {current_user.email}")
        
        # Add CORS headers
        origin = request.headers.get("origin")
        if origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Cache-Control, Pragma, Expires, X-Requested-With"
            response.headers["Access-Control-Max-Age"] = "86400"  # Cache preflight response for 24 hours
        
        # Get user from database
        user = await db.users.find_one({"email": current_user.email})
        if not user:
            logger.error(f"User not found: {current_user.email}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if address exists
        if not user.get("address"):
            logger.info(f"No address found for user: {current_user.email}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No address found"
            )
        
        logger.info(f"Address retrieved successfully for user: {current_user.email}")
        return user["address"]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching address: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching address: {str(e)}"
        )

@router.options("/address")
async def options_address(response: Response, request: Request):
    """Handle OPTIONS request for the address endpoint"""
    origin = request.headers.get("origin")
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Cache-Control, Pragma, Expires, X-Requested-With"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Max-Age"] = "86400"  # Cache preflight response for 24 hours
    return {} 
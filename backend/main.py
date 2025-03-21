from fastapi import FastAPI, Request, Response, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import os
import json
import logging
import coloredlogs
import socket
from typing import List
from dotenv import load_dotenv
from pydantic import BaseModel

# Load environment variables
load_dotenv()

from database import connect_to_mongodb, close_mongodb_connection

# Configure logging
logger = logging.getLogger("dontminos")
coloredlogs.install(level='INFO', logger=logger, 
                   fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Server configuration
SERVER_PORT = 8000
SERVER_HOST = "0.0.0.0"

# Get local IP for better logging
def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "127.0.0.1"

# CORS configuration from environment
def get_cors_origins() -> List[str]:
    # Get CORS origins from environment variable
    cors_origins_env = os.getenv("CORS_ORIGINS", "[]")
    try:
        # Parse the JSON array from environment
        cors_origins = json.loads(cors_origins_env)
        if not cors_origins:  # If empty, use default development origins
            return generate_default_origins()
        return cors_origins
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing CORS_ORIGINS from environment: {e}")
        return generate_default_origins()

# Generate default development origins as fallback
def generate_default_origins() -> List[str]:
    client_ports = [5173, 5174, 5175]
    client_hosts = ["localhost", "127.0.0.1"]
    origins = []
    for host in client_hosts:
        for port in client_ports:
            origins.append(f"http://{host}:{port}")
    return origins

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB
    logger.info("Starting Dontminos API server...")
    await connect_to_mongodb()
    
    # Log server information
    local_ip = get_local_ip()
    logger.info(f"Server running at: http://{local_ip}:{SERVER_PORT}")
    logger.info(f"API documentation available at: http://{local_ip}:{SERVER_PORT}/docs")
    
    # Log CORS configuration
    cors_origins = get_cors_origins()
    logger.info(f"CORS configured for origins: {cors_origins}")
    
    # Check environment variables
    ultravox_key = os.getenv("ULTRAVOX_API_KEY")
    jwt_secret = os.getenv("JWT_SECRET")
    
    # Log environment variable status (securely)
    logger.info(f"ULTRAVOX_API_KEY configured: {'Yes' if ultravox_key else 'No'}")
    if ultravox_key:
        masked_key = ultravox_key[:4] + "****" + ultravox_key[-2:] if len(ultravox_key) > 6 else "***"
        logger.info(f"ULTRAVOX_API_KEY: {masked_key}")
    
    logger.info(f"JWT_SECRET configured: {'Yes' if jwt_secret else 'No'}")
    
    # Check if menu items file exists
    menu_file_path = os.path.join(os.path.dirname(__file__), "public", "menuitems.json")
    if os.path.exists(menu_file_path):
        logger.info(f"Menu items file found at: {menu_file_path}")
    else:
        logger.warning(f"Menu items file NOT found at: {menu_file_path}")
    
    # Check if images directory exists
    images_dir = os.path.join(os.path.dirname(__file__), "public", "imagedump")
    if os.path.exists(images_dir):
        image_count = len([f for f in os.listdir(images_dir) if f.endswith(('.jpg', '.jpeg', '.png'))])
        logger.info(f"Image directory found at: {images_dir} with {image_count} images")
    else:
        logger.warning(f"Image directory NOT found at: {images_dir}")
    
    yield
    
    # Shutdown: Close MongoDB connection
    logger.info("Shutting down Dontminos API server...")
    await close_mongodb_connection()

app = FastAPI(title="Dontminos API", lifespan=lifespan)

# Configure CORS using origins from environment
origins = get_cors_origins()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Explicitly specify frontend origin
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:[0-9]+)?",  # Allow localhost with any port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "cache-control", "pragma", "expires", "content-type", "authorization"],
)

# Add trusted host middleware
app.add_middleware(
    TrustedHostMiddleware, allowed_hosts=["*"]
)

# Add CORS headers middleware
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    response = await call_next(request)
    
    # Get origin from request headers
    origin = request.headers.get("origin")
    
    # Only add CORS headers if origin is present and matches our allowed origins
    if origin and (origin == "http://localhost:5173" or origin.startswith("http://localhost:") or origin.startswith("http://127.0.0.1:")):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Cache-Control, Pragma, Expires, X-Requested-With"
        response.headers["Access-Control-Max-Age"] = "86400"  # Cache preflight response for 24 hours
    
    return response

# Mount static files directory with proper caching headers
public_dir = os.path.join(os.path.dirname(__file__), "public")
logger.info(f"Mounting static files from: {public_dir}")

# Create a custom StaticFiles class that adds caching headers for images
class CachingStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        response = await super().get_response(path, scope)
        
        # Add caching headers for image files
        if path.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
            # Cache images for 24 hours
            response.headers['Cache-Control'] = 'public, max-age=86400'
            response.headers['Pragma'] = 'cache'
        
        return response

app.mount("/public", CachingStaticFiles(directory=public_dir), name="public")

# Include routers
from routes import menu, order, auth, users, voice_agent
app.include_router(menu.router, prefix="/api/menu", tags=["menu"])
app.include_router(order.router, prefix="/api/orders", tags=["orders"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(voice_agent.router, prefix="/api/voice-agent", tags=["voice-agent"])

# Root endpoint for API health check
@app.get("/")
async def root():
    return {
        "status": "online",
        "api": "Dontminos API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "menu": "/api/menu",
            "orders": "/api/orders",
            "auth": "/api/auth",
            "users": "/api/users",
            "voice-agent": "/api/voice-agent"
        }
    }

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting server on {SERVER_HOST}:{SERVER_PORT}")
    uvicorn.run("main:app", host=SERVER_HOST, port=SERVER_PORT, reload=True) 
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from dotenv import load_dotenv
import os
from fastapi import Depends
import traceback

# Load environment variables
load_dotenv()

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "global_estates")
client = None
db = None

async def connect_to_mongodb():
    global client, db
    try:
        print(f"Connecting to MongoDB at {MONGODB_URL} (database: {DATABASE_NAME})")
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        # Test the connection
        await client.admin.command('ping')
        # Create users collection if it doesn't exist
        if 'users' not in await db.list_collection_names():
            await db.create_collection('users')
        print("Successfully connected to MongoDB")
    except Exception as e:
        print(f"Warning: MongoDB connection failed: {e}")
        print(traceback.format_exc())
        print("Continuing with JSON file storage...")

async def close_mongodb_connection():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")

def get_database() -> AsyncIOMotorDatabase:
    if db is None:
        print("Warning: Database connection is None. Make sure connect_to_mongodb() was called.")
    return db 
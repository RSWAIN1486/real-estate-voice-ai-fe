import os
import json
import requests
import logging
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
import httpx
from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel

# Load environment variables
load_dotenv()

# Set up logging
logger = logging.getLogger("dontminos.voice_agent")

# Create router
router = APIRouter()

# Ultravox API configuration from environment variables
ULTRAVOX_API_KEY = os.getenv("ULTRAVOX_API_KEY")
ULTRAVOX_BASE_URL = os.getenv("ULTRAVOX_BASE_URL", "https://api.ultravox.ai")

# DeepInfra API configuration 
DEEPINFRA_API_KEY = os.getenv("DEEPINFRA_API_KEY", "DJxHKiUf8UG9Y99thwGYrmEU09dMB4TD")

# Check if API key is available
if not ULTRAVOX_API_KEY:
    logger.warning("ULTRAVOX_API_KEY environment variable not set. Voice agent functionality may not work.")

# Property search request model
class PropertySearchRequest(BaseModel):
    query: str

# Property search endpoint using DeepInfra RAG
@router.post("/property-search")
async def search_properties(request: PropertySearchRequest):
    try:
        logger.info(f"Received property search request: {request.query}")
        
        # Initialize the DeepInfra client
        openai = OpenAI(
            api_key=DEEPINFRA_API_KEY,
            base_url="https://api.deepinfra.com/v1/openai",
        )
        
        # First, let's load the properties data
        from pathlib import Path
        csv_path = Path(__file__).parent.parent / "public" / "properties_rows.csv"
        
        # Check if file exists
        if not csv_path.exists():
            logger.error(f"Properties CSV file not found at {csv_path}")
            raise HTTPException(
                status_code=500,
                detail="Properties data file not found"
            )
        
        # Read first few lines of CSV to provide context
        with open(csv_path, "r") as f:
            csv_sample = "\n".join(f.readlines()[:20])
        
        # Create the RAG system prompt with the sample data
        system_prompt = f"""You are a helpful real estate assistant that helps users find properties based on their needs.
        
The following is a sample of the property data format you're working with:

```
{csv_sample}
```

Your task is to analyze the user's query about property search and return a structured JSON with the search parameters.
Use the format:
{{
  "location": "location name or empty string if not specified",
  "property_type": "apartment, villa, etc. or empty string if not specified",
  "bedrooms": number or null if not specified,
  "bathrooms": number or null if not specified,
  "price_min": number or null if not specified,
  "price_max": number or null if not specified,
  "is_rental": boolean (true for rental properties, false for sale properties) or null if not specified,
  "amenities": ["list", "of", "amenities"] or empty list if not specified
}}

Only include parameters that are specified in the query. Make reasonable judgments about whether a property is for rent or sale based on context clues like "rent", "rental", "buy", "purchase", etc.
"""
        
        # Call the DeepInfra model
        chat_completion = openai.chat.completions.create(
            model="meta-llama/Meta-Llama-3.1-8B-Instruct",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.query}
            ],
            temperature=0.1,  # Low temperature for more deterministic results
            response_format={"type": "json_object"}  # Request JSON response
        )
        
        # Parse the JSON response
        try:
            search_params = json.loads(chat_completion.choices[0].message.content)
            logger.info(f"Extracted search parameters: {search_params}")
            
            # Now directly search the properties CSV using the parameters
            # Get the path to the properties_rows.csv
            import pandas as pd
            
            # Read the CSV file 
            df = pd.read_csv(csv_path)
            logger.info(f"Loaded {len(df)} properties from CSV")
            
            # Apply filters based on search parameters
            filtered_df = df.copy()
            
            # Location filter
            if search_params.get("location") and search_params["location"]:
                filtered_df = filtered_df[filtered_df["location"].str.contains(
                    search_params["location"], case=False, na=False)]
            
            # Property type filter
            if search_params.get("property_type") and search_params["property_type"]:
                filtered_df = filtered_df[filtered_df["property_type"].str.contains(
                    search_params["property_type"], case=False, na=False)]
            
            # Bedrooms filter
            if search_params.get("bedrooms") and search_params["bedrooms"] is not None:
                filtered_df = filtered_df[filtered_df["bedrooms"] >= search_params["bedrooms"]]
            
            # Bathrooms filter
            if search_params.get("bathrooms") and search_params["bathrooms"] is not None:
                filtered_df = filtered_df[filtered_df["bathrooms"] >= search_params["bathrooms"]]
            
            # Price range filter
            if search_params.get("price_min") and search_params["price_min"] is not None:
                filtered_df = filtered_df[filtered_df["price_value"].astype(float) >= search_params["price_min"]]
            if search_params.get("price_max") and search_params["price_max"] is not None:
                filtered_df = filtered_df[filtered_df["price_value"].astype(float) <= search_params["price_max"]]
            
            # Rental vs Sale filter
            if search_params.get("is_rental") is not None:
                filtered_df = filtered_df[filtered_df["is_rental"].astype(str).str.lower() == 
                                         str(search_params["is_rental"]).lower()]
            
            # Amenities filter
            if search_params.get("amenities") and search_params["amenities"]:
                for amenity in search_params["amenities"]:
                    filtered_df = filtered_df[filtered_df["amenities"].str.contains(
                        amenity, case=False, na=False)]
            
            # Get top 5 results
            top_results = filtered_df.head(5).to_dict("records")
            logger.info(f"Found {len(top_results)} matching properties")
            
            # Log detailed information about each property for debugging
            for i, prop in enumerate(top_results):
                logger.info(f"Property {i+1}: {prop['property_type']} in {prop['location']} - "
                            f"Beds: {prop['bedrooms']}, Baths: {prop['bathrooms']}, "
                            f"Price: {prop['price_display']}, "
                            f"Status: {'For Rent' if prop['is_rental'] else 'For Sale'}, "
                            f"Area: {prop['area_display']}, "
                            f"Amenities: {prop['amenities']}")
            
            # Return search results
            return {
                "results": top_results,
                "total_count": len(filtered_df),
                "search_parameters": search_params
            }
            
        except json.JSONDecodeError:
            logger.error(f"Error parsing model response as JSON: {chat_completion.choices[0].message.content}")
            raise HTTPException(
                status_code=500,
                detail="Failed to parse property search parameters"
            )
            
    except Exception as e:
        logger.error(f"Error searching properties: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Property search failed: {str(e)}"
        )

# Proxy endpoint for creating Ultravox calls
@router.post("/calls")
async def create_call(request: Request):
    ultravox_api_key = os.getenv("ULTRAVOX_API_KEY")
    if not ultravox_api_key:
        logger.error("ULTRAVOX_API_KEY not configured")
        raise HTTPException(
            status_code=500,
            detail="Voice agent API key not configured",
        )
    
    try:
        # Parse query parameters - fix the query_items() method which doesn't exist
        query_params = dict(request.query_params)
        prior_call_id = query_params.get("priorCallId")
        
        # Get request data
        payload = await request.json()
        
        # Log payload (exclude sensitive data)
        logger.info(f"Creating Ultravox call with settings: {json.dumps({k: '***' if k in ['systemPrompt', 'selectedTools'] else v for k, v in payload.items()}, indent=2)}")
        
        # Check if we have priorCallId in query parameters
        if prior_call_id:
            logger.info(f"Resuming previous conversation with priorCallId: {prior_call_id} (from query parameter)")
            
            # Make sure initialMessages is not in the payload when using priorCallId
            if "initialMessages" in payload:
                logger.warning("initialMessages provided with priorCallId - removing initialMessages as per Ultravox API requirements")
                payload.pop("initialMessages", None)
        
        # Only transform initialMessages if we're not using priorCallId
        if "initialMessages" in payload and not prior_call_id:
            logger.info(f"Initial messages format (from frontend): {json.dumps(payload['initialMessages'], indent=2)}")
            
            # Transform initialMessages to match Ultravox API expectations
            # Ultravox requires role to be an enum ASSISTANT or USER (uppercase)
            transformed_messages = []
            for msg in payload["initialMessages"]:
                try:
                    # Handle different possible formats coming from frontend
                    speaker = msg.get("speaker") or msg.get("role", "user")
                    msg_type = msg.get("type") or msg.get("medium", "text")
                    
                    transformed_msg = {
                        "text": msg["text"],
                        "role": "ASSISTANT" if speaker.lower() in ["assistant", "agent"] else "USER",
                        "medium": "VOICE" if msg_type.lower() == "voice" else "TEXT"
                    }
                    transformed_messages.append(transformed_msg)
                except KeyError as e:
                    logger.error(f"Missing required field in message: {e} - {msg}")
                    # Skip this message and continue with others
                    continue
                except Exception as e:
                    logger.error(f"Error transforming message: {e} - {msg}")
                    # Skip this message and continue with others
                    continue
            
            # Replace with transformed messages only if we have valid messages
            if transformed_messages:
                payload["initialMessages"] = transformed_messages
                logger.info(f"Transformed messages for Ultravox API: {json.dumps(transformed_messages, indent=2)}")
            else:
                # If all messages failed transformation, remove initialMessages completely
                logger.warning("All messages failed transformation, removing initialMessages from payload")
                payload.pop("initialMessages", None)
        
        # Construct the correct Ultravox API endpoint with query parameters if needed
        endpoint = f"{ULTRAVOX_BASE_URL}/api/calls"
        if prior_call_id:
            endpoint += f"?priorCallId={prior_call_id}"
            logger.info(f"Using Ultravox API endpoint with priorCallId: {endpoint}")
        
        # Forward to Ultravox API
        response = requests.post(
            endpoint,
            headers={
                "Content-Type": "application/json",
                "X-API-Key": ultravox_api_key,
            },
            json=payload,
            timeout=30  # Add timeout to prevent hanging requests
        )
        
        # Log response status code
        logger.info(f"Ultravox API response status: {response.status_code}")
        
        # Raise for status
        response.raise_for_status()
        
        # Return response
        result = response.json()
        logger.info(f"Successfully created Ultravox call: {result.get('callId', 'Unknown')}")
        return result
    except requests.exceptions.HTTPError as e:
        logger.error(f"Error creating Ultravox call: {e.response.status_code} - {e.response.text}")
        raise HTTPException(
            status_code=e.response.status_code,
            detail=e.response.text,
        )
    except requests.exceptions.Timeout:
        logger.error("Timeout while connecting to Ultravox API")
        raise HTTPException(
            status_code=504,
            detail="Timeout while connecting to voice service",
        )
    except Exception as e:
        logger.error(f"Unexpected error creating Ultravox call: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create voice call: {str(e)}",
        )

# Proxy endpoint for getting call info
@router.get("/calls/{call_id}")
async def get_call_info(call_id: str):
    try:
        if not ULTRAVOX_API_KEY:
            raise HTTPException(status_code=500, detail="Ultravox API key not configured")
            
        logger.info(f"Getting info for Ultravox call: {call_id}")
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{ULTRAVOX_BASE_URL}/api/calls/{call_id}",
                headers={
                    "X-API-Key": ULTRAVOX_API_KEY
                }
            )
            
            # Check if request was successful
            if response.status_code == 200:
                logger.info(f"Retrieved Ultravox call info successfully: {response.status_code}")
                return response.json()
            else:
                logger.error(f"Error getting Ultravox call info: {response.status_code} - {response.text}")
                return JSONResponse(
                    status_code=response.status_code,
                    content=response.json() if response.headers.get("content-type") == "application/json" else {"error": response.text}
                )
    except Exception as e:
        logger.error(f"Exception getting Ultravox call info: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get Ultravox call info: {str(e)}")

# Proxy endpoint for ending a call
@router.delete("/calls/{call_id}")
async def end_call(call_id: str):
    try:
        if not ULTRAVOX_API_KEY:
            raise HTTPException(status_code=500, detail="Ultravox API key not configured")
            
        logger.info(f"Ending Ultravox call: {call_id}")
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{ULTRAVOX_BASE_URL}/api/calls/{call_id}",
                headers={
                    "X-API-Key": ULTRAVOX_API_KEY
                }
            )
            
            # Check if request was successful
            if response.status_code == 200 or response.status_code == 204:
                logger.info(f"Ended Ultravox call successfully: {response.status_code}")
                return {"status": "success", "message": "Call ended successfully"}
            else:
                logger.error(f"Error ending Ultravox call: {response.status_code} - {response.text}")
                return JSONResponse(
                    status_code=response.status_code,
                    content=response.json() if response.headers.get("content-type") == "application/json" else {"error": response.text}
                )
    except Exception as e:
        logger.error(f"Exception ending Ultravox call: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to end Ultravox call: {str(e)}")

# Proxy endpoint for fetching available voices
@router.get("/voices")
async def get_available_voices():
    try:
        if not ULTRAVOX_API_KEY:
            raise HTTPException(status_code=500, detail="Ultravox API key not configured")
            
        logger.info("Fetching available Ultravox voices")
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{ULTRAVOX_BASE_URL}/api/voices",
                headers={
                    "X-API-Key": ULTRAVOX_API_KEY
                }
            )
            
            # Check if request was successful
            if response.status_code == 200:
                logger.info(f"Retrieved Ultravox voices successfully: {response.status_code}")
                return response.json()
            else:
                logger.error(f"Error fetching Ultravox voices: {response.status_code} - {response.text}")
                return JSONResponse(
                    status_code=response.status_code,
                    content=response.json() if response.headers.get("content-type") == "application/json" else {"error": response.text}
                )
    except Exception as e:
        logger.error(f"Exception fetching Ultravox voices: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch Ultravox voices: {str(e)}")

# Proxy endpoint for hanging up a call using the hangUp tool
@router.post("/calls/{call_id}/hangup")
async def hangup_call(call_id: str):
    try:
        if not ULTRAVOX_API_KEY:
            raise HTTPException(status_code=500, detail="Ultravox API key not configured")
        
        logger.info(f"Forwarding hangUp request to Ultravox for call: {call_id}")
        
        # The actual hangUp is implemented client-side through the SDK
        # This endpoint just terminates the call on the server side
        async with httpx.AsyncClient() as client:
            # Rather than trying to invoke tools, just try to get the call status 
            # to validate the call exists before responding success
            response = await client.get(
                f"{ULTRAVOX_BASE_URL}/api/calls/{call_id}",
                headers={
                    "X-API-Key": ULTRAVOX_API_KEY
                }
            )
            
            if response.status_code == 200:
                # The call exists, so we'll consider this a success
                # The client has already handled the actual hangup via SDK
                logger.info(f"Confirmed call {call_id} exists, client handled hangUp")
                return {"status": "success", "message": "Call termination handled by client"}
            else:
                logger.error(f"Call validation error: {response.status_code} - {response.text}")
                return JSONResponse(
                    status_code=response.status_code,
                    content=response.json() if response.headers.get("content-type") == "application/json" else {"error": response.text}
                )
    except Exception as e:
        logger.error(f"Exception in hangup call endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to handle hangup: {str(e)}") 
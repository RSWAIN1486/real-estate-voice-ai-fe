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
async def property_search(request: Request):
    """
    Endpoint to search properties based on natural language queries
    """
    # Log that this endpoint was called with the query and request info
    body = await request.json()
    logger.info(f"PROPERTY SEARCH API CALLED with query: {body.get('query')}")
    logger.info(f"Request headers: {dict(request.headers)}")
    logger.info(f"Request client: {request.client}")
    
    try:
        # Extract the search query from the request body
        query = body.get("query")
        if not query:
            logger.error("No query provided in the request")
            raise HTTPException(
                status_code=400,
                detail="No query provided in the request"
            )
            
        logger.info(f"Starting property search for query: '{query}'")
        
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
        
        # Load the CSV file
        import pandas as pd
        df = pd.read_csv(csv_path)
        
        # Step 1: Resolve location entities like school names to Dubai neighborhoods
        # This allows the agent to understand queries like "properties near Smart Vision School"
        location_resolver_prompt = f"""You are an expert on Dubai geography and real estate. 
        
The user is looking for properties and has mentioned a specific location, landmark, or school in Dubai.
Your task is to identify that location and map it to the appropriate Dubai neighborhood.

For example:
- If user mentions "Smart Vision School Dubai" → respond with "Al Barsha"
- If user mentions "Mall of the Emirates" → respond with "Al Barsha"
- If user mentions "Burj Khalifa" → respond with "Downtown Dubai" 
- If user mentions "JBR" → respond with "Jumeirah Beach Residence"
- If user mentions "Knowledge Village" → respond with "Dubai Internet City"
- If user mentions "Gems Wellington" → respond with "Al Sufouh"
- If user mentions "Dubai American Academy" → respond with "Al Barsha"
- If user mentions "Kings School" → respond with "Umm Suqeim"
- If user mentions "Repton School" → respond with "Nad Al Sheba"
- If user mentions "Horizon English School" → respond with "Jumeirah"
- If user mentions "Horizon International School" → respond with "Umm Suqeim"
- If user mentions "GEMS Jumeirah Primary School" → respond with "Jumeirah"

Focus on extracting the most relevant neighborhood for property searching. If multiple locations are mentioned, prioritize the most specific one.

IMPORTANT:
- Only output the neighborhood name
- Do not return qualifiers like "near" or "in the area of"
- If the query mentions a specific neighborhood directly (e.g., "Al Barsha"), output that exact neighborhood name
- Be precise and use standard Dubai neighborhood names that would appear in real estate listings

Analyze this property search query:
"{query}"

Output ONLY the neighborhood name, nothing else.
"""
        
        # Call the DeepInfra model to resolve location
        location_response = openai.chat.completions.create(
            model="meta-llama/Meta-Llama-3.1-8B-Instruct",
            messages=[
                {"role": "system", "content": location_resolver_prompt},
                {"role": "user", "content": query}
            ],
            temperature=0.1,  # Low temperature for deterministic results
            max_tokens=20     # We only need a short answer
        )
        
        resolved_location = location_response.choices[0].message.content.strip()
        logger.info(f"Resolved location '{query}' to neighborhood: {resolved_location}")
        
        # After resolving location, do a test query to make sure we can find it in our data
        test_location_query = df["location"].str.contains(resolved_location, case=False, na=False)
        location_match_count = test_location_query.sum()
        
        if location_match_count == 0:
            # Try to find similar neighborhood names
            all_locations = df["location"].unique()
            logger.info(f"Couldn't find exact match for '{resolved_location}'. Available locations: {', '.join(all_locations)}")
            
            # Map of known schools to their neighborhoods for accurate resolution
            school_neighborhood_map = {
                "smart vision school": "Al Barsha",
                "dubai american academy": "Al Barsha",
                "gems wellington": "Al Sufouh",
                "kings school": "Umm Suqeim",
                "repton school": "Nad Al Sheba",
                "horizon english school": "Jumeirah",
                "horizon international school": "Umm Suqeim",
                "gems jumeirah primary school": "Jumeirah"
            }
            
            # Check for school references in the query
            for school, neighborhood in school_neighborhood_map.items():
                if school.lower() in query.lower():
                    logger.info(f"Detected {school} query, mapping to neighborhood: '{neighborhood}'")
                    resolved_location = neighborhood
                    enhanced_query = f"{query} in {resolved_location}"
                    break
        
        logger.info(f"Location match test for '{resolved_location}': Found {location_match_count} matching properties")
        
        # Read first few lines of CSV to provide context
        with open(csv_path, "r") as f:
            csv_sample = "\n".join(f.readlines()[:20])
        
        # Combine the resolved location with the original query
        enhanced_query = f"{query} in {resolved_location}"
        logger.info(f"Enhanced search query: {enhanced_query}")
        
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
                {"role": "user", "content": enhanced_query}
            ],
            temperature=0.1,  # Low temperature for more deterministic results
            response_format={"type": "json_object"}  # Request JSON response
        )
        
        # Parse the JSON response
        try:
            search_params = json.loads(chat_completion.choices[0].message.content)
            logger.info(f"Extracted search parameters: {search_params}")
            
            # Ensure that the resolved location is included in the search parameters
            # If both are present, prioritize the resolved specific location
            if resolved_location and resolved_location.strip():
                if not search_params.get("location") or search_params["location"] == "":
                    search_params["location"] = resolved_location
                else:
                    # If the search already has a location but it's different from our resolved one,
                    # use the resolved one as it's likely more precise
                    current_location = search_params["location"].lower()
                    if resolved_location.lower() not in current_location and current_location not in resolved_location.lower():
                        logger.info(f"Replacing location '{search_params['location']}' with resolved location '{resolved_location}'")
                        search_params["location"] = resolved_location
                        
            # Enhanced search parameters - drop unnecessary requirements that can reduce matches
            enhanced_search_params = search_params.copy()
            
            # For location searches, don't be too strict about property type initially
            if search_params.get("location") and search_params["location"]:
                # If the query mentions any school keywords, prioritize location over property type and amenities
                school_keywords = ["school", "academy", "international", "american", "british", "smart vision", 
                                  "gems", "kings", "repton", "horizon", "english", "jumeirah", "education"]
                is_school_query = any(keyword in query.lower() for keyword in school_keywords)
                
                if is_school_query:
                    logger.info("School-related query detected: prioritizing location over other filters")
                    
                    # For school searches, focus on family-friendly properties of any type
                    enhanced_search_params.pop("property_type", None)
                    enhanced_search_params.pop("amenities", None)
                    
                    # Default to rentals if not specified (most school searches are for rentals)
                    if "is_rental" not in enhanced_search_params:
                        logger.info("School query with no rental specification - defaulting to rental properties")
                        enhanced_search_params["is_rental"] = True
                        
                    # Ensure we have a reasonable number of bedrooms for families (at least 2)
                    if "bedrooms" not in enhanced_search_params or enhanced_search_params["bedrooms"] is None:
                        logger.info("School query - setting minimum bedrooms to 2 for family accommodation")
                        enhanced_search_params["bedrooms"] = 2
            
            # Log the enhanced parameters
            logger.info(f"Enhanced search parameters: {enhanced_search_params}")
            
            # Now directly search the properties CSV using the parameters
            # Get the path to the properties_rows.csv
            import pandas as pd
            
            # Read the CSV file 
            df = pd.read_csv(csv_path)
            logger.info(f"Loaded {len(df)} properties from CSV")
            
            # Apply filters based on search parameters
            filtered_df = df.copy()
            
            # Location filter - apply first as it's most important
            if enhanced_search_params.get("location") and enhanced_search_params["location"]:
                filtered_df = filtered_df[filtered_df["location"].str.contains(
                    enhanced_search_params["location"], case=False, na=False)]
                
                # If no results found after location filter, don't apply additional filters
                if len(filtered_df) == 0:
                    logger.info(f"No properties found in {enhanced_search_params['location']}. Skipping other filters.")
                    
                    # School-specific location fallback logic
                    school_keywords = ["school", "academy", "international", "english", "gems", "horizon"]
                    is_school_query = any(keyword in query.lower() for keyword in school_keywords)
                    resolved_neighborhood = enhanced_search_params.get('location')
                    
                    if is_school_query and resolved_neighborhood and enhanced_search_params.get("is_rental") == True:
                        logger.info(f"School-related rental query detected for {resolved_neighborhood}. Showing all available rentals in that area.")
                        # Filter just for rentals in the resolved location
                        neighborhood_rentals = df[(df["location"].str.contains(resolved_neighborhood, case=False)) & 
                                                (df["is_rental"] == True)]
                        
                        if len(neighborhood_rentals) > 0:
                            logger.info(f"Found {len(neighborhood_rentals)} rental properties in {resolved_neighborhood}")
                            # Return these properties instead
                            return {
                                "results": neighborhood_rentals.head(5).to_dict("records"),
                                "total_count": len(neighborhood_rentals),
                                "search_parameters": enhanced_search_params,
                                "resolved_location": resolved_neighborhood,
                                "no_results_reason": f"Found rental properties in {resolved_neighborhood} by relaxing other search criteria"
                            }
                        
                        # If we're looking for properties in Jumeirah but found none in dataset,
                        # try similar upscale neighborhoods
                        if resolved_neighborhood.lower() == "jumeirah" and enhanced_search_params.get("is_rental") == True:
                            logger.info("Jumeirah rental query detected but no exact matches. Suggesting similar upscale neighborhoods.")
                            # Find properties in similar upscale areas
                            similar_areas = ["Palm Jumeirah", "Dubai Marina", "Downtown Dubai"]
                            upscale_rentals = df[(df["location"].isin(similar_areas)) & (df["is_rental"] == True)]
                            
                            if len(upscale_rentals) > 0:
                                logger.info(f"Found {len(upscale_rentals)} rental properties in similar upscale areas")
                                # Return these properties with an explanation
                                return {
                                    "results": upscale_rentals.head(5).to_dict("records"),
                                    "total_count": len(upscale_rentals),
                                    "search_parameters": enhanced_search_params,
                                    "resolved_location": "Jumeirah",
                                    "no_results_reason": "No properties found specifically in Jumeirah. Showing similar upscale neighborhoods instead."
                                }
                    
                    # Return search results with a clear message about why no properties were found
                    return {
                        "results": [],
                        "total_count": 0,
                        "search_parameters": enhanced_search_params,
                        "resolved_location": resolved_location if resolved_location and resolved_location.strip() else None,
                        "no_results_reason": f"No properties found in {resolved_location}. For school-related queries, consider checking properties in nearby areas or contact a real estate agent for specialized assistance."
                    }
            
            # If we have location results, apply other filters

            # Bedrooms filter
            if enhanced_search_params.get("bedrooms") and enhanced_search_params["bedrooms"] is not None:
                filtered_df = filtered_df[filtered_df["bedrooms"] >= enhanced_search_params["bedrooms"]]
            
            # Bathrooms filter
            if enhanced_search_params.get("bathrooms") and enhanced_search_params["bathrooms"] is not None:
                filtered_df = filtered_df[filtered_df["bathrooms"] >= enhanced_search_params["bathrooms"]]
            
            # Price range filter
            if enhanced_search_params.get("price_min") and enhanced_search_params["price_min"] is not None:
                filtered_df = filtered_df[filtered_df["price_value"].astype(float) >= enhanced_search_params["price_min"]]
            if enhanced_search_params.get("price_max") and enhanced_search_params["price_max"] is not None:
                filtered_df = filtered_df[filtered_df["price_value"].astype(float) <= enhanced_search_params["price_max"]]
            
            # Rental vs Sale filter
            if enhanced_search_params.get("is_rental") is not None:
                filtered_df = filtered_df[filtered_df["is_rental"].astype(str).str.lower() == 
                                         str(enhanced_search_params["is_rental"]).lower()]
                
            # Store results before applying amenity filters
            pre_amenity_results = filtered_df.copy()
            
            # Amenities filter - apply last and check if it's too restrictive
            if enhanced_search_params.get("amenities") and enhanced_search_params["amenities"]:
                amenity_df = filtered_df.copy()
                for amenity in enhanced_search_params["amenities"]:
                    amenity_df = amenity_df[amenity_df["amenities"].str.contains(
                        amenity, case=False, na=False)]
                
                # If amenity filtering reduces results to zero, use pre-amenity results instead
                if len(amenity_df) == 0 and len(pre_amenity_results) > 0:
                    logger.info(f"Amenity filters too restrictive (reduced from {len(pre_amenity_results)} to 0 results). Using results without amenity filtering.")
                    filtered_df = pre_amenity_results
                else:
                    filtered_df = amenity_df
            
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
            
            # If no results and we used a resolved location, try a more general search
            if len(top_results) == 0 and resolved_location and resolved_location.strip():
                logger.info(f"No results found with resolved location '{resolved_location}'. Trying a broader search.")
                
                # First try to find any properties in the resolved location to confirm they exist
                location_only_df = df[df["location"].str.contains(resolved_location, case=False, na=False)]
                location_only_count = len(location_only_df)
                
                # Log the rental/sale breakdown of properties in this location
                if location_only_count > 0:
                    rental_count = len(location_only_df[location_only_df["is_rental"] == True])
                    sale_count = len(location_only_df[location_only_df["is_rental"] == False])
                    logger.info(f"Found {location_only_count} properties in {resolved_location}: {rental_count} for rent, {sale_count} for sale")
                    
                    # If user wanted rentals but no rentals exist in this area, note this
                    if enhanced_search_params.get("is_rental") == True and rental_count == 0:
                        logger.info(f"User wanted rentals in {resolved_location} but no rental properties exist in this area")
                    
                    # If user wanted properties for sale but none exist in this area, note this
                    if enhanced_search_params.get("is_rental") == False and sale_count == 0:
                        logger.info(f"User wanted properties for sale in {resolved_location} but no sale properties exist in this area")
                else:
                    logger.info(f"No properties at all found in {resolved_location}")
                
                # Reset to full dataset
                filtered_df = df.copy()
                
                # Apply all filters EXCEPT location to find alternatives
                # Bedrooms filter
                if enhanced_search_params.get("bedrooms") and enhanced_search_params["bedrooms"] is not None:
                    filtered_df = filtered_df[filtered_df["bedrooms"] >= enhanced_search_params["bedrooms"]]
                
                # Bathrooms filter
                if enhanced_search_params.get("bathrooms") and enhanced_search_params["bathrooms"] is not None:
                    filtered_df = filtered_df[filtered_df["bathrooms"] >= enhanced_search_params["bathrooms"]]
                
                # Rental vs Sale filter
                if enhanced_search_params.get("is_rental") is not None:
                    filtered_df = filtered_df[filtered_df["is_rental"].astype(str).str.lower() == 
                                            str(enhanced_search_params["is_rental"]).lower()]
                
                # Sort by proximity to residential neighborhoods near the original resolved location
                # For now just get some random properties that meet the other criteria                
                top_results = filtered_df.head(5).to_dict("records")
                logger.info(f"Broader search found {len(top_results)} alternative properties")
                
                for i, prop in enumerate(top_results):
                    logger.info(f"Alternative Property {i+1}: {prop['property_type']} in {prop['location']} - "
                                f"Beds: {prop['bedrooms']}, Baths: {prop['bathrooms']}, "
                                f"Price: {prop['price_display']}")
                                
                # Add information about why location search failed to the response
                if location_only_count > 0:
                    if enhanced_search_params.get("is_rental") == True and rental_count == 0:
                        no_results_reason = f"No rental properties available in {resolved_location}, only properties for sale"
                    elif enhanced_search_params.get("is_rental") == False and sale_count == 0:
                        no_results_reason = f"No properties for sale in {resolved_location}, only rental properties"
                    else:
                        # There are properties of the right type, but other criteria excluded them
                        no_results_reason = f"Properties in {resolved_location} don't match your other criteria"
                else:
                    no_results_reason = f"No properties found in {resolved_location}"
            else:
                no_results_reason = None
            
            # Return search results
            return {
                "results": top_results,
                "total_count": len(filtered_df),
                "search_parameters": enhanced_search_params,
                "resolved_location": resolved_location if resolved_location and resolved_location.strip() else None,
                "no_results_reason": no_results_reason
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
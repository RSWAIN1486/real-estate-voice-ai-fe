from fastapi import APIRouter, HTTPException, Response
from typing import List, Dict, Any
import json
import os
import logging
from pathlib import Path

# Get logger
logger = logging.getLogger("dontminos")

router = APIRouter()

def load_menu_items() -> List[Dict[str, Any]]:
    """Load menu items from the JSON file in the public directory"""
    try:
        # Get the absolute path to public/menuitems.json
        menu_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "menuitems.json")
        logger.info(f"Loading menu items from: {menu_file_path}")
        
        with open(menu_file_path, "r", encoding='utf-8') as f:
            menu_data = json.load(f)
            
            # Check if the JSON has a categories structure or is a flat list
            if "categories" in menu_data:
                # Extract items from categories structure
                items = []
                for category_name, category_items in menu_data["categories"].items():
                    items.extend(category_items)
                logger.info(f"Successfully loaded {len(items)} menu items from categories structure")
                return items
            elif "items" in menu_data:
                # Return the items array from the JSON
                items = menu_data["items"]
                logger.info(f"Successfully loaded {len(items)} menu items from items array")
                return items
            else:
                # Assume the JSON is already a list of items
                if isinstance(menu_data, list):
                    logger.info(f"Successfully loaded {len(menu_data)} menu items from direct list")
                    return menu_data
                else:
                    logger.error(f"Unexpected JSON structure: {list(menu_data.keys())}")
                    return []
    except FileNotFoundError as e:
        logger.error(f"Menu file not found: {e}")
        return []
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing menu JSON: {e}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error loading menu items: {e}")
        return []

def add_cors_headers(response: Response):
    """Add CORS headers to a response"""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

@router.get("/")
async def get_menu_items(response: Response):
    """Get all menu items"""
    # Add CORS headers directly to this response
    add_cors_headers(response)
    
    menu_items = load_menu_items()
    if not menu_items:
        logger.warning("No menu items found")
        raise HTTPException(status_code=404, detail="Menu items not found")
    
    logger.info(f"Returning {len(menu_items)} menu items")
    return menu_items

@router.get("/categories")
async def get_categories(response: Response):
    """Get all unique categories"""
    # Add CORS headers directly to this response
    add_cors_headers(response)
    
    menu_items = load_menu_items()
    categories = sorted(list(set(item.get('category', '') for item in menu_items)))
    logger.info(f"Available categories: {categories}")
    return {"categories": categories}

@router.get("/category/{category}")
async def get_items_by_category(category: str, response: Response):
    """Get menu items by category"""
    # Add CORS headers directly to this response
    add_cors_headers(response)
    
    menu_items = load_menu_items()
    items = [item for item in menu_items if item.get('category', '').lower() == category.lower()]
    
    if not items:
        logger.warning(f"No items found in category: {category}")
        raise HTTPException(status_code=404, detail=f"No items found in category: {category}")
    
    logger.info(f"Returning {len(items)} items for category: {category}")
    return items

@router.options("/{path:path}")
async def options_route(path: str, response: Response):
    """Handle OPTIONS requests for CORS preflight"""
    add_cors_headers(response)
    return {"status": "ok"} 
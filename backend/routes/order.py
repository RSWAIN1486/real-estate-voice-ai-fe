from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime
import json

router = APIRouter()

class OrderItem(BaseModel):
    id: str
    quantity: int
    price: float
    name: str

class Order(BaseModel):
    items: List[OrderItem]
    total: float
    customer_name: str
    customer_phone: str
    delivery_address: str
    payment_method: str

# In-memory storage for orders (replace with MongoDB later)
orders = []

@router.post("/")
async def create_order(order: Order):
    """Create a new order"""
    order_dict = order.dict()
    order_dict["order_id"] = f"ORD{len(orders) + 1:04d}"
    order_dict["status"] = "pending"
    order_dict["created_at"] = datetime.now().isoformat()
    orders.append(order_dict)
    return order_dict

@router.get("/{order_id}")
async def get_order(order_id: str):
    """Get order by ID"""
    order = next((order for order in orders if order["order_id"] == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/{order_id}/status")
async def update_order_status(order_id: str, status: str):
    """Update order status"""
    order = next((order for order in orders if order["order_id"] == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if status not in ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    order["status"] = status
    return order 
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, ClassVar, Any, Annotated
from datetime import datetime
from bson import ObjectId
from pydantic_core import core_schema

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls,
        _source_type,
        _handler,
    ):
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.chain_schema([
                core_schema.str_schema(),
                core_schema.no_info_plain_validator_function(cls.validate),
            ]),
        ])

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, _schema_generator, _field_schema):
        return {"type": "string"}

class Address(BaseModel):
    street: str
    city: str
    state: str
    zipCode: str
    phone: str
    landmark: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    name: str
    
class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    address: Optional[Address] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class User(UserBase):
    id: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    address: Optional[Address] = None

    class Config:
        from_attributes = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None 
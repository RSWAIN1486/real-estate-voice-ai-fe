import pytest
from httpx import AsyncClient
from unittest.mock import patch, MagicMock
import json
import asyncio

# Import the app correctly
from main import app

# Create a fixture for the async client
@pytest.fixture
async def async_client():
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture
def mock_ultravox_response():
    """Mock successful response from Ultravox API"""
    return {
        "callId": "test-call-123",
        "joinUrl": "https://example.com/join/test-call-123"
    }

@pytest.fixture
def mock_requests_post():
    """Fixture to mock requests.post"""
    with patch("requests.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "callId": "test-call-123",
            "joinUrl": "https://example.com/join/test-call-123"
        }
        mock_post.return_value = mock_response
        yield mock_post

@pytest.fixture
def mock_httpx_post():
    """Fixture to mock httpx.AsyncClient.post"""
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "success"}
        mock_response.text = '{"status": "success"}'
        mock_post.return_value = mock_response
        yield mock_post

# Make the test functions async
@pytest.mark.asyncio
async def test_create_call_basic(async_client, mock_requests_post):
    """Test creating a new call without prior call ID"""
    payload = {
        "model": "test-model",
        "voice": "test-voice",
        "systemPrompt": "Test prompt",
        "temperature": 0.7,
        "recordingEnabled": False
    }
    
    response = await async_client.post("/api/voice-agent/calls", json=payload)
    
    assert response.status_code == 200
    assert "callId" in response.json()
    assert "joinUrl" in response.json()
    
    # Verify the request was made correctly
    mock_requests_post.assert_called_once()
    called_url = mock_requests_post.call_args[0][0]
    assert called_url.endswith("/api/calls")

@pytest.mark.asyncio
async def test_create_call_with_prior_call_id(async_client, mock_requests_post):
    """Test creating a call with a prior call ID in query params"""
    payload = {
        "model": "test-model",
        "voice": "test-voice",
        "systemPrompt": "Test prompt",
        "temperature": 0.7
    }
    
    response = await async_client.post("/api/voice-agent/calls?priorCallId=prior-123", json=payload)
    
    assert response.status_code == 200
    assert "callId" in response.json()
    
    # Verify the request was made with the correct query parameter
    mock_requests_post.assert_called_once()
    called_url = mock_requests_post.call_args[0][0]
    assert "priorCallId=prior-123" in called_url

@pytest.mark.asyncio
async def test_create_call_with_initial_messages(async_client, mock_requests_post):
    """Test creating a call with initial messages that get transformed"""
    payload = {
        "model": "test-model",
        "voice": "test-voice",
        "systemPrompt": "Test prompt",
        "initialMessages": [
            {"text": "Hello", "speaker": "user", "medium": "text"},
            {"text": "Hi there", "speaker": "agent", "medium": "voice"}
        ]
    }
    
    response = await async_client.post("/api/voice-agent/calls", json=payload)
    
    assert response.status_code == 200
    
    # Verify transformation occurred correctly
    called_json = mock_requests_post.call_args[1]["json"]
    assert "initialMessages" in called_json
    transformed = called_json["initialMessages"]
    
    assert len(transformed) == 2
    assert transformed[0]["role"] == "USER"
    assert transformed[1]["role"] == "ASSISTANT"
    assert transformed[0]["medium"] == "TEXT"
    assert transformed[1]["medium"] == "VOICE"

@pytest.mark.asyncio
@patch("os.getenv")
async def test_missing_api_key(mock_getenv, async_client, mock_requests_post):
    """Test error handling when API key is missing"""
    # Configure the mock to return None for ULTRAVOX_API_KEY
    mock_getenv.side_effect = lambda key, default=None: None if key == "ULTRAVOX_API_KEY" else default
    
    response = await async_client.post("/api/voice-agent/calls", json={"model": "test"})
    
    assert response.status_code == 500
    assert "not configured" in response.json()["detail"]

@pytest.mark.asyncio
async def test_hangup_call(async_client, mock_httpx_post):
    """Test hanging up a call using the hangUp tool"""
    payload = {
        "toolName": "hangUp",
        "responseType": "hang-up"
    }
    
    response = await async_client.post("/api/voice-agent/calls/test-call-123/hangup", json=payload)
    
    assert response.status_code == 200
    assert "success" in response.json()["message"].lower()
    
    # Verify the request was made with the correct payload
    mock_httpx_post.assert_called_once()
    called_url = mock_httpx_post.call_args[0][0]
    called_json = mock_httpx_post.call_args[1]["json"]
    
    assert called_url.endswith("/calls/test-call-123/tools")
    assert called_json["toolName"] == "hangUp"
    assert called_json["responseType"] == "hang-up" 
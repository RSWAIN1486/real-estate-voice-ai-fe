# Serverless API Functions

This directory contains serverless functions that will be deployed by Vercel.

## Files:

- `ultravox-proxy.js`: A proxy function that forwards requests to the Ultravox API. This is used to avoid CORS issues when making direct API calls from the browser.

## How it works:

1. The function receives requests at `/api/ultravox-proxy`
2. It extracts the `url` query parameter, which contains the path to forward to the Ultravox API
3. It adds the API key from environment variables to the request
4. It forwards the request to the Ultravox API and returns the response

This approach allows the frontend to make API calls to Ultravox without exposing the API key in the browser. 
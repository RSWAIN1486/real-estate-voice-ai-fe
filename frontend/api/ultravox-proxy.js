// Vercel Serverless Function to proxy requests to Ultravox API
export default async function handler(req, res) {
  // Get the URL parameter from the query string
  const { url } = req.query;
  
  // Get the API key from environment variables
  const API_KEY = process.env.VITE_ULTRAVOX_API_KEY;
  
  // Check if URL parameter is provided
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  
  // Check if API key is available
  if (!API_KEY) {
    return res.status(500).json({ error: 'API key is not configured' });
  }

  try {
    // Construct the target URL
    const targetUrl = `https://api.ultravox.ai${url}`;
    
    // Log information about the request
    console.log(`Proxying ${req.method} request to: ${targetUrl}`);
    
    // Parse the request body if present
    let body;
    if (req.body) {
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch (e) {
        body = req.body;
      }
    }
    
    // Set up headers for the request
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    };
    
    // Make the request to the Ultravox API
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && body ? JSON.stringify(body) : undefined
    });
    
    // Check if the response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response from Ultravox API: ${response.status} - ${errorText}`);
      return res.status(response.status).json({ 
        error: `Ultravox API error (${response.status})`, 
        message: errorText 
      });
    }
    
    // Get response data
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Return the response
    return res.status(response.status).json(
      typeof data === 'object' ? data : { data }
    );
  } catch (error) {
    // Log and return any errors
    console.error('Proxy request failed:', error);
    return res.status(500).json({ 
      error: 'Proxy request failed',
      message: error.message
    });
  }
} 
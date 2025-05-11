// api/ultravox-proxy.js
export default async function handler(req, res) {
  // Parse the request body if it's JSON
  let body;
  try {
    body = req.body ? JSON.parse(req.body) : undefined;
  } catch (e) {
    body = req.body;
  }

  const { url } = req.query;
  const API_KEY = process.env.VITE_ULTRAVOX_API_KEY;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    const targetUrl = `https://api.ultravox.ai${url}`;
    console.log(`Proxying request to: ${targetUrl}`);
    
    // Forward the request to Ultravox API
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: req.method !== 'GET' && body ? JSON.stringify(body) : undefined
    });

    // Get response data
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Return the proxied response
    return res.status(response.status).json(
      typeof data === 'object' ? data : { data }
    );
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Proxy request failed',
      message: error.message
    });
  }
} 
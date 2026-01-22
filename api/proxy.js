// Vercel Serverless Function - Proxy to backend
export default async function handler(req, res) {
  const { method, body, headers } = req;
  const path = req.url.replace('/api/proxy', '');
  
  const backendUrl = `http://157.245.155.77:8080${path}`;
  
  try {
    const response = await fetch(backendUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': headers.authorization || '',
      },
      body: method !== 'GET' && method !== 'HEAD' ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

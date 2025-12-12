// n8nProxy.js
// Proxy endpoint untuk menghindari CORS issue dengan n8n

const proxyToN8N = async (request, h) => {
  try {
    const { message, chatInput, ...otherData } = request.payload || {};
    
    // URL n8n webhook - ganti dengan URL webhook Anda
    const n8nUrl = 'https://n8n.optiminev.site/webhook-test/chat';
    
    console.log('🔄 Proxying to n8n:', n8nUrl);
    console.log('📨 Payload:', { message, chatInput });

    // Forward request ke n8n
    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message || chatInput,
        chatInput: chatInput || message,
        ...otherData,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ n8n error:', response.status, errorText);
      throw new Error(`n8n returned status ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ n8n response:', data);
    
    // Return response dengan CORS headers
    return h
      .response(data)
      .code(200)
      .header('Access-Control-Allow-Origin', '*')
      .header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
      .header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
  } catch (err) {
    console.error('❌ Error proxying to n8n:', err);
    return h
      .response({
        error: true,
        message: 'Failed to connect to AI service',
        details: err.message
      })
      .code(500)
      .header('Access-Control-Allow-Origin', '*')
      .header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
      .header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
};

// Handle OPTIONS request untuk CORS preflight
const handleOptions = (request, h) => {
  return h
    .response()
    .code(200)
    .header('Access-Control-Allow-Origin', '*')
    .header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    .header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

module.exports = { proxyToN8N, handleOptions };

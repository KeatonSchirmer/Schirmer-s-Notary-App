// api.js - Reusable API utility for React Native/Expo frontend

const BASE_URL = 'https://schirmer-s-notary-backend.onrender.com';

async function apiRequest(endpoint, method = 'GET', data = null, headers = {}) {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  if (data) {
    config.body = JSON.stringify(data);
  }
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type');
    let result;
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      result = await response.text();
      // If not JSON, log the raw response for debugging
      console.error('API Non-JSON Response:', result);
      if (!response.ok) {
        throw new Error('API Error: Non-JSON response received.');
      }
      return result;
    }
    if (!response.ok) {
      console.error('API Error:', result);
      throw new Error(result.detail || result.error || 'API Error');
    }
    return result;
  } catch (err) {
    console.error('Network/API Request Failed:', err);
    throw err;
  }
}

export default apiRequest;

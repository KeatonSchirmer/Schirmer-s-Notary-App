// api.js - Reusable API utility for React Native/Expo frontend

const BASE_URL = 'http://192.168.0.218:5000';

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
  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.detail || 'API Error');
  }
  return result;
}

// Example usage:
// apiRequest('/auth/login', 'POST', { email, password, role })
//   .then(data => ...)
//   .catch(err => ...);

export default apiRequest;

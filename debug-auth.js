// Debug auth issues
const API_BASE_URL = 'https://resume-bknd.onrender.com';

console.log('=== Auth Debug Script ===');

// Check localStorage tokens
const accessToken = localStorage.getItem('access_token');
const refreshToken = localStorage.getItem('refresh_token');

console.log('Access Token exists:', !!accessToken);
console.log('Refresh Token exists:', !!refreshToken);

if (accessToken) {
  console.log('Access Token length:', accessToken.length);
  console.log('Access Token starts with:', accessToken.substring(0, 20) + '...');
  
  // Try to decode JWT payload (if it's a JWT)
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    console.log('Token payload:', payload);
    console.log('Token expires:', new Date(payload.exp * 1000));
    console.log('Token expired?', payload.exp * 1000 < Date.now());
  } catch (e) {
    console.log('Token is not a valid JWT or cannot decode');
  }
}

// Test auth endpoint with current token
async function testAuth() {
  if (!accessToken) {
    console.log('No access token to test');
    return;
  }
  
  console.log('\n=== Testing /auth/me endpoint ===');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const data = await response.json();
    console.log('Response data:', data);
    
  } catch (error) {
    console.error('Error testing auth:', error);
  }
}

testAuth();
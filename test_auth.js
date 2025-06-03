const axios = require('axios');

// Test authentication endpoint
async function testAuth() {
  try {
    console.log("Testing authentication with admin/admin credentials...");
    
    // Create form data
    const formData = new FormData();
    formData.append('username', 'admin');
    formData.append('password', 'admin');
    
    // Try the direct axios approach
    console.log("Attempt 1: Using axios with FormData");
    try {
      const response = await axios.post('http://localhost:8003/api/auth/token', 
        formData,
        { 
          headers: { 
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      
      console.log("Login successful!");
      console.log("Status:", response.status);
      console.log("Token:", response.data.access_token);
      return response.data.access_token;
    } catch (err) {
      console.error("Axios FormData attempt failed:", err.message);
      if (err.response) {
        console.error("Status:", err.response.status);
        console.error("Response data:", err.response.data);
      }
      
      // Try the fetch API approach
      console.log("\nAttempt 2: Using fetch with URLSearchParams");
      try {
        const params = new URLSearchParams();
        params.append('username', 'admin');
        params.append('password', 'admin');
        
        const fetchResponse = await fetch('http://localhost:8003/api/auth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params
        });
        
        if (fetchResponse.ok) {
          const data = await fetchResponse.json();
          console.log("Fetch attempt successful!");
          console.log("Token:", data.access_token);
          return data.access_token;
        } else {
          console.error("Fetch attempt failed:", fetchResponse.status);
          const errorData = await fetchResponse.text();
          console.error("Error data:", errorData);
        }
      } catch (fetchErr) {
        console.error("Fetch attempt error:", fetchErr);
      }
    }
    
    // If we get here, all attempts failed
    console.error("All login attempts failed");
    return null;
  } catch (error) {
    console.error("Test failed:", error);
    return null;
  }
}

// Run the test and then try to get user info if login succeeded
async function runFullTest() {
  const token = await testAuth();
  
  if (token) {
    try {
      console.log("\nTesting /api/auth/me endpoint with token");
      const userResponse = await axios.get('http://localhost:8003/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("User info retrieved successfully!");
      console.log("User data:", userResponse.data);
    } catch (err) {
      console.error("Failed to get user info:", err.message);
      if (err.response) {
        console.error("Status:", err.response.status);
        console.error("Response data:", err.response.data);
      }
    }
  }
}

runFullTest().catch(console.error);

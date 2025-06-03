const axios = require('axios');

// Test the study sheet generation endpoint directly
async function testStudySheetEndpoint() {
  try {
    // Test with the problematic topic ID
    const topicId = '683c28374a2585cf8cee0ed8'; // Problem topic ID
    console.log(`Testing endpoint: http://localhost:8003/api/test/studysheet/${topicId}`);
    
    const response = await axios.get(`http://localhost:8003/api/test/studysheet/${topicId}`);
    
    console.log('API Response Status:', response.status);
    console.log('API Response Data:', JSON.stringify(response.data, null, 2).substring(0, 300) + '...');
    
    return 'Success';
  } catch (error) {
    console.error('Error testing API:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
    }
    
    return 'Failed';
  }
}

// Test a known-working topic ID for comparison
async function testWorkingTopicId() {
  try {
    const workingTopicId = '683c1595d29b7268315d3c60'; // Known working topic ID
    console.log(`\nTesting with known-working topic ID: ${workingTopicId}`);
    
    const response = await axios.get(`http://localhost:8003/api/test/studysheet/${workingTopicId}`);
    console.log('Working Topic Response Status:', response.status);
    return 'Working topic test succeeded';
  } catch (error) {
    console.error('Error testing working topic:', error.message);
    return 'Working topic test failed';
  }
}

// Run both tests
async function runAllTests() {
  console.log('=== Testing problematic topic ID ===');
  const result1 = await testStudySheetEndpoint();
  console.log(result1);
  
  console.log('\n=== Testing known-working topic ID ===');
  const result2 = await testWorkingTopicId();
  console.log(result2);
}

runAllTests().catch(err => console.error('Test failed:', err));

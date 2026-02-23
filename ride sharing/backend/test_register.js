const axios = require('axios');

async function testRegister() {
    try {
        const response = await axios.post('http://localhost:5001/api/auth/register', {
            name: 'Test User',
            email: 'test@gmail.com',
            phone: '1234567890',
            password: 'password123',
            role: 'PASSENGER'
        });
        console.log('Success:', response.status);
    } catch (error) {
        console.log('Error Status:', error.response?.status);
        console.log('Error Data:', error.response?.data);
    }
}

testRegister();

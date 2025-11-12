/**
 * Test Admin Login Functionality
 * 
 * This script tests if the admin login works with the credentials from .env
 */

async function testAdminLogin() {
  const API_URL = 'http://localhost:3000/api/auth/login';
  const ME_URL = 'http://localhost:3000/api/auth/me';
  
  const credentials = {
    email: 'emamajbargh@gmail.com',
    password: 'Admin!Passw0rd#2025'
  };

  console.log('='.repeat(60));
  console.log('TESTING ADMIN LOGIN');
  console.log('='.repeat(60));
  console.log('Email:', credentials.email);
  console.log('Password:', credentials.password);
  console.log('');

  try {
    // Step 1: Login
    console.log('Step 1: Logging in...');
    const loginResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const loginData = await loginResponse.json();
    const cookies = loginResponse.headers.get('set-cookie');

    console.log('Login Status:', loginResponse.status);
    console.log('Login Response:', JSON.stringify(loginData, null, 2));
    console.log('');

    if (!loginData.success) {
      console.log('❌ ADMIN LOGIN FAILED!');
      console.log('Error:', loginData.message);
      return;
    }

    console.log('✅ Login Successful!');
    console.log('User is admin:', loginData.user?.is_admin);
    console.log('Admin name:', loginData.user?.first_name, loginData.user?.last_name);
    console.log('');

    // Step 2: Check auth status with /api/auth/me
    console.log('Step 2: Checking auth status with /api/auth/me...');
    
    if (!cookies) {
      console.log('❌ No cookies received from login!');
      return;
    }

    const meResponse = await fetch(ME_URL, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
      },
    });

    const meData = await meResponse.json();

    console.log('Auth Check Status:', meResponse.status);
    console.log('Auth Check Response:', JSON.stringify(meData, null, 2));
    console.log('');

    if (meResponse.status === 200 && meData.success) {
      console.log('✅ AUTH CHECK SUCCESSFUL!');
      console.log('User is admin:', meData.user?.isAdmin);
      console.log('User name:', meData.user?.name);
      console.log('User email:', meData.user?.email);
      console.log('');
      console.log('='.repeat(60));
      console.log('🎉 ALL TESTS PASSED! Admin login is working correctly!');
      console.log('='.repeat(60));
    } else {
      console.log('❌ AUTH CHECK FAILED!');
      console.log('Error:', meData.message);
      console.log('');
      console.log('This means login worked but session validation failed.');
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('');
    console.log('Make sure the development server is running on http://localhost:3000');
  }
}

testAdminLogin();

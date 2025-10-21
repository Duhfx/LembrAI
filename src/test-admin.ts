/**
 * Test script for Admin Panel
 * Tests the admin API endpoints
 */

async function testAdminAPI() {
  const BASE_URL = 'http://localhost:3000';

  console.log('🧪 Testing Admin API...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣  Testing health endpoint...');
    const healthRes = await fetch(`${BASE_URL}/admin/health`);
    const health = await healthRes.json();
    console.log('✅ Health:', health);
    console.log('');

    // Test 2: Dashboard stats
    console.log('2️⃣  Testing dashboard stats...');
    const statsRes = await fetch(`${BASE_URL}/admin/stats`);
    const stats = await statsRes.json();
    console.log('✅ Stats:', JSON.stringify(stats, null, 2));
    console.log('');

    // Test 3: Users list
    console.log('3️⃣  Testing users list...');
    const usersRes = await fetch(`${BASE_URL}/admin/users?page=1&limit=5`);
    const users = await usersRes.json();
    console.log(`✅ Found ${users.users.length} users`);
    console.log('');

    // Test 4: Reminders list
    console.log('4️⃣  Testing reminders list...');
    const remindersRes = await fetch(`${BASE_URL}/admin/reminders?page=1&limit=5`);
    const reminders = await remindersRes.json();
    console.log(`✅ Found ${reminders.reminders.length} reminders`);
    console.log('');

    console.log('🎉 All tests passed!');
    console.log('\n📊 Access the admin dashboard at: http://localhost:3000/admin/');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.log('\n⚠️  Make sure the server is running: npm run dev');
  }
}

// Run tests
testAdminAPI();

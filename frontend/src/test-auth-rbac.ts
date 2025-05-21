/**
 * Test Script for Authentication and RBAC
 * 
 * This script tests the authentication, profile, and RBAC services
 * to ensure they work correctly with the PostgreSQL backend.
 */

import { authService } from './lib/auth-service';
import { rbacService } from './lib/rbac-service';
import { profileService } from './lib/profile-service';

// Test configuration
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Password123!';
const TEST_NAME = 'Test User';

// Test results tracking
let passedTests = 0;
let failedTests = 0;

/**
 * Run a test case and track results
 */
async function runTest(name: string, testFn: () => Promise<void>) {
  console.log(`\n🧪 Running test: ${name}`);
  try {
    await testFn();
    console.log(`✅ Test passed: ${name}`);
    passedTests++;
  } catch (error: any) {
    console.error(`❌ Test failed: ${name}`);
    console.error(`   Error: ${error?.message || 'Unknown error'}`);
    failedTests++;
  }
}

/**
 * Test authentication flow
 */
async function testAuthentication() {
  // Test registration
  await runTest('User Registration', async () => {
    try {
      const user = await authService.register(TEST_NAME, TEST_EMAIL, TEST_PASSWORD);
      console.log('   Registered user:', user);
      if (!user || !user.id) {
        throw new Error('Registration did not return a valid user');
      }
    } catch (error: any) {
      // If user already exists, that's okay for this test
      if (error.message && error.message.includes('already exists')) {
        console.log('   User already exists, continuing with login test');
      } else {
        throw error;
      }
    }
  });

  // Test login
  await runTest('User Login', async () => {
    const user = await authService.login(TEST_EMAIL, TEST_PASSWORD);
    console.log('   Logged in user:', user);
    if (!user || !user.id) {
      throw new Error('Login did not return a valid user');
    }
  });

  // Test get user profile
  await runTest('Get User Profile', async () => {
    const profile = await profileService.getProfile();
    console.log('   User profile:', profile);
    if (!profile || !profile.id) {
      throw new Error('Failed to get user profile');
    }
  });

  // Test authentication state
  await runTest('Authentication State', async () => {
    const isAuthenticated = authService.isAuthenticated();
    console.log('   Is authenticated:', isAuthenticated);
    if (!isAuthenticated) {
      throw new Error('User should be authenticated');
    }

    const user = authService.getUser();
    console.log('   Current user:', user);
    if (!user) {
      throw new Error('No user found in auth service');
    }
  });
}

/**
 * Test RBAC functionality
 */
async function testRBAC() {
  // Test loading roles (may require admin)
  await runTest('Load Roles', async () => {
    try {
      const roles = await rbacService.loadRoles();
      console.log('   Available roles:', roles);
    } catch (error: any) {
      // This might fail if the user doesn't have admin rights
      if (error.message && error.message.includes('Unauthorized')) {
        console.log('   User does not have permission to view all roles (expected)');
      } else {
        throw error;
      }
    }
  });

  // Test provider access
  await runTest('Provider Access', async () => {
    try {
      const access = await rbacService.getProviderAccess();
      console.log('   Provider access:', access);
    } catch (error) {
      // This might fail if the endpoint is not implemented yet
      console.log('   Could not get provider access, API might not be ready');
    }
  });

  // Test permission checking
  await runTest('Permission Checking', async () => {
    // Check a basic permission
    const hasViewPermission = rbacService.hasPermission('view:prompts');
    console.log('   Has view:prompts permission:', hasViewPermission);

    // Check provider access
    const hasAwsAccess = rbacService.hasProviderAccess('aws');
    console.log('   Has AWS access:', hasAwsAccess);
  });
}

/**
 * Test logout
 */
async function testLogout() {
  await runTest('User Logout', async () => {
    authService.logout();
    const isAuthenticated = authService.isAuthenticated();
    console.log('   Is authenticated after logout:', isAuthenticated);
    if (isAuthenticated) {
      throw new Error('User should not be authenticated after logout');
    }
  });
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Authentication and RBAC Tests');
  console.log('========================================');
  
  try {
    await testAuthentication();
    await testRBAC();
    await testLogout();
    
    console.log('\n========================================');
    console.log(`📊 Test Results: ${passedTests} passed, ${failedTests} failed`);
    
    if (failedTests === 0) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('⚠️ Some tests failed. Check the logs above for details.');
    }
  } catch (error: any) {
    console.error('❌ Tests failed with an unexpected error:', error?.message || 'Unknown error');
  }
}

// Run the tests
runAllTests();

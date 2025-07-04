const { createClient } = require('@supabase/supabase-js')

// Test with the actual anon key from .env
const supabaseAnon = createClient(
  'https://puppogbxzkppdesjvhev.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1cHBvZ2J4emtwcGRlc2p2aGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NzA3MTYsImV4cCI6MjA2NzA0NjcxNn0.5WGs3Bdlgm3N9kY5j9csVD3r5bNDKpOhYWjja4ET4J8'
)

// Test with service role for comparison
const supabaseService = createClient(
  'https://puppogbxzkppdesjvhev.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1cHBvZ2J4emtwcGRlc2p2aGV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ3MDcxNiwiZXhwIjoyMDY3MDQ2NzE2fQ.FRN7Z5BP7YtQ3i974Ev1CJ0XtbSlYzlN11T5lu5KCgY',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function testUserCreationPermissions() {
  const testEmail = 'permission.test@transmedicgroup.com'
  const testPassword = 'TestPassword123!'

  console.log('Testing user creation permissions...')
  console.log('Test email:', testEmail)

  try {
    // Test 1: Try with anon key
    console.log('\n1. Testing with ANON key (what frontend uses)...')
    try {
      const { data: anonData, error: anonError } = await supabaseAnon.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            name: 'Permission Test',
            username: 'permission.test'
          }
        }
      })

      if (anonError) {
        console.error('❌ Anon key failed:', anonError.message)
      } else {
        console.log('✅ Anon key worked! User ID:', anonData.user?.id)
        // Cleanup if successful
        await supabaseService.auth.admin.deleteUser(anonData.user.id)
      }
    } catch (err) {
      console.error('❌ Anon key exception:', err.message)
    }

    // Test 2: Try with service role key
    console.log('\n2. Testing with SERVICE ROLE key (admin privileges)...')
    try {
      const { data: serviceData, error: serviceError } = await supabaseService.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        user_metadata: {
          name: 'Permission Test',
          username: 'permission.test'
        },
        email_confirm: true
      })

      if (serviceError) {
        console.error('❌ Service role failed:', serviceError.message)
      } else {
        console.log('✅ Service role worked! User ID:', serviceData.user.id)
        // Cleanup
        await supabaseService.auth.admin.deleteUser(serviceData.user.id)
        console.log('✅ Cleanup completed')
      }
    } catch (err) {
      console.error('❌ Service role exception:', err.message)
    }

    // Test 3: Check Supabase settings
    console.log('\n3. Checking Supabase auth settings...')
    console.log('This will show if user signup is disabled...')
    
    // Try a basic request to see what happens
    try {
      const response = await fetch('https://puppogbxzkppdesjvhev.supabase.co/auth/v1/settings', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1cHBvZ2J4emtwcGRlc2p2aGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NzA3MTYsImV4cCI6MjA2NzA0NjcxNn0.5WGs3Bdlgm3N9kY5j9csVD3r5bNDKpOhYWjja4ET4J8'
        }
      })
      
      if (response.ok) {
        const settings = await response.json()
        console.log('Auth settings:', settings)
      } else {
        console.log('Settings request failed:', response.status, response.statusText)
      }
    } catch (err) {
      console.log('Settings check failed:', err.message)
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testUserCreationPermissions()
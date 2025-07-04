const { createClient } = require('@supabase/supabase-js')

// Use the exact same configuration as the React app
const supabase = createClient(
  'https://puppogbxzkppdesjvhev.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1cHBvZ2J4emtwcGRlc2p2aGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NzA3MTYsImV4cCI6MjA2NzA0NjcxNn0.5WGs3Bdlgm3N9kY5j9csVD3r5bNDKpOhYWjja4ET4J8',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    global: {
      headers: {
        'X-Client-Info': 'case-booking-app@1.2.1'
      }
    }
  }
)

// Simulate the exact userOperations.create() function
async function simulateAddUser(userData) {
  console.log('🎯 Testing exact userOperations.create() workflow...')
  console.log('📋 User data:', userData)

  try {
    // Step 1: Validation (lines 240-245 in supabaseService.ts)
    if (!userData.email) {
      throw new Error('Email is required for user creation')
    }
    if (!userData.password) {
      throw new Error('Password is required for user creation')
    }
    console.log('✅ Validation passed')

    // Step 2: Create auth user (lines 248-257)
    console.log('🔐 Creating auth user via supabase.auth.signUp()...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          username: userData.username
        }
      }
    })

    if (authError) {
      console.error('❌ Auth signup failed:', authError)
      throw authError
    }
    if (!authData.user) {
      console.error('❌ No user returned from signUp')
      throw new Error('Failed to create auth user')
    }

    console.log('✅ Auth user created:', {
      id: authData.user.id,
      email: authData.user.email,
      confirmed: authData.user.email_confirmed_at ? 'YES' : 'NO'
    })

    // Step 3: Get role ID (lines 263-270)
    console.log('🎭 Getting role ID for role:', userData.role)
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', userData.role)
      .single()

    if (roleError) {
      console.error('❌ Role query failed:', roleError)
      throw roleError
    }

    console.log('✅ Role found:', roleData.id)

    // Step 4: Create user profile (lines 272-284)
    console.log('👤 Creating user profile in users table...')
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        username: userData.username,
        name: userData.name,
        email: userData.email,
        role_id: roleData.id,
        enabled: userData.enabled ?? true
      })
      .select()
      .single()

    if (error) {
      console.error('❌ User profile creation failed:', error)
      throw error
    }

    console.log('✅ User profile created:', data)

    // Step 5: Handle departments (lines 288-297) - simplified since we're not adding departments
    if (userData.departments && userData.departments.length > 0) {
      console.log('📋 Adding user departments...')
      // This would fail in the current setup because getCountryIdByName requires a default country
      // But let's skip this for now since we're testing with empty departments
    }

    // Step 6: Handle countries (lines 299-311) - simplified since we're not adding countries
    if (userData.countries && userData.countries.length > 0) {
      console.log('🌍 Adding user countries...')
      // This would also fail for the same reason
      // But let's skip this for now since we're testing with empty countries
    }

    console.log('🎉 User creation completed successfully!')
    return data

  } catch (error) {
    console.error('💥 User creation failed:', error)
    throw error
  }
}

// Test the exact workflow that happens when someone clicks "Add User"
async function testAddUserWorkflow() {
  console.log('=== Testing Add User Button Workflow ===')
  
  // This is the exact data structure that comes from the form
  const newUser = {
    username: 'workflow.test',
    password: 'WorkflowTest123!',
    name: 'Workflow Test User',
    role: 'operations', // This should exist in the roles table
    departments: [], // Empty for this test
    countries: [], // Empty for this test
    email: 'workflow.test@transmedicgroup.com',
    enabled: true
  }

  try {
    console.log('🚀 Starting user creation...')
    const result = await simulateAddUser(newUser)
    console.log('✅ SUCCESS! User created with ID:', result.id)
    
    // Cleanup
    console.log('🧹 Cleaning up...')
    const serviceClient = createClient(
      'https://puppogbxzkppdesjvhev.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1cHBvZ2J4emtwcGRlc2p2aGV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ3MDcxNiwiZXhwIjoyMDY3MDQ2NzE2fQ.FRN7Z5BP7YtQ3i974Ev1CJ0XtbSlYzlN11T5lu5KCgY',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    await serviceClient.auth.admin.deleteUser(result.id)
    console.log('✅ Cleanup completed')
    
  } catch (error) {
    console.error('❌ FAILED! Error in Add User workflow:', error.message)
    console.error('Full error:', error)
  }
}

testAddUserWorkflow()
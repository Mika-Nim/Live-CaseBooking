const { createClient } = require('@supabase/supabase-js')

// Use the exact same configuration as the React app
const supabase = createClient(
  'https://puppogbxzkppdesjvhev.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1cHBvZ2J4emtwcGRlc2p2aGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NzA3MTYsImV4cCI6MjA2NzA0NjcxNn0.5WGs3Bdlgm3N9kY5j9csVD3r5bNDKpOhYWjja4ET4J8'
)

// Fixed userOperations.create() function that bypasses role lookup
async function simulateFixedAddUser(userData) {
  console.log('🎯 Testing FIXED userOperations.create() workflow...')
  console.log('📋 User data:', userData)

  try {
    // Step 1: Validation
    if (!userData.email) {
      throw new Error('Email is required for user creation')
    }
    if (!userData.password) {
      throw new Error('Password is required for user creation')
    }
    console.log('✅ Validation passed')

    // Step 2: Create auth user
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

    console.log('✅ Auth user created:', authData.user.id)

    // Step 3: Use hardcoded role ID instead of querying (FIX)
    console.log('🎭 Using hardcoded role ID for operations role...')
    const roleIdMap = {
      'admin': 'ef848918-c11e-4e6d-8ee0-b27f4dd7d81d',
      'operations': '9119921f-5bb5-4be2-a76b-b634181789da',
      'operations-manager': 'dc19cdfd-3aa1-48cc-badd-d550689ea85d',
      'sales': '373e6662-d360-45a9-b321-4bb0304b66bb',
      'sales-manager': 'f71835c4-25f2-4111-b057-4e63ae06434a',
      'driver': 'a9f01292-c14a-4dce-9e26-6e8a0626f350',
      'it': '3a7d5c53-4c13-46e7-8a18-6621063a09ff'
    }

    const roleId = roleIdMap[userData.role]
    if (!roleId) {
      throw new Error(`Unknown role: ${userData.role}`)
    }

    console.log('✅ Role ID found:', roleId)

    // Step 4: Create user profile
    console.log('👤 Creating user profile in users table...')
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        username: userData.username,
        name: userData.name,
        email: userData.email,
        role_id: roleId,
        enabled: userData.enabled ?? true
      })
      .select()
      .single()

    if (error) {
      console.error('❌ User profile creation failed:', error)
      throw error
    }

    console.log('✅ User profile created:', data)
    console.log('🎉 User creation completed successfully!')
    return data

  } catch (error) {
    console.error('💥 User creation failed:', error)
    throw error
  }
}

// Test the fixed workflow
async function testFixedAddUserWorkflow() {
  console.log('=== Testing FIXED Add User Button Workflow ===')
  
  const newUser = {
    username: 'fixed.test',
    password: 'FixedTest123!',
    name: 'Fixed Test User',
    role: 'operations', // This will use hardcoded ID
    departments: [],
    countries: [],
    email: 'fixed.test@transmedicgroup.com',
    enabled: true
  }

  try {
    console.log('🚀 Starting fixed user creation...')
    const result = await simulateFixedAddUser(newUser)
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
    console.error('❌ FAILED! Error in fixed Add User workflow:', error.message)
    console.error('Full error:', error)
  }
}

testFixedAddUserWorkflow()
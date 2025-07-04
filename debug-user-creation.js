const { createClient } = require('@supabase/supabase-js')

// Simulate the exact frontend environment with same config
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || 'https://puppogbxzkppdesjvhev.supabase.co',
  process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1cHBvZ2J4emtwcGRlc2p2aGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NzA3MTYsImV4cCI6MjA2NzA0NjcxNn0.lzD6IqGtPBbPPJ1_c4RrGnT2jfGvnN2KdMFX9hb9n9w'
)

// Simulate the exact userOperations.create function from supabaseService.ts
async function simulateUserCreate(userData) {
  console.log('🚀 Simulating userOperations.create() from frontend...')
  console.log('📋 Input userData:', userData)

  try {
    // Validate required fields (from line 240-245 in supabaseService.ts)
    if (!userData.email) {
      throw new Error('Email is required for user creation')
    }
    if (!userData.password) {
      throw new Error('Password is required for user creation')
    }

    console.log('✅ Validation passed')

    // First create auth user (from line 248-257)
    console.log('🔐 Step 1: Creating auth user...')
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
      console.error('❌ Auth error:', authError)
      throw authError
    }
    if (!authData.user) {
      console.error('❌ No auth user returned')
      throw new Error('Failed to create auth user')
    }

    console.log('✅ Auth user created:', authData.user.id)

    // Get role ID (from line 263-270)
    console.log('🎭 Step 2: Getting role ID...')
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', userData.role)
      .single()

    if (roleError) {
      console.error('❌ Role error:', roleError)
      throw roleError
    }

    console.log('✅ Role found:', roleData.id)

    // Create user profile (from line 272-284)
    console.log('👤 Step 3: Creating user profile...')
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
      console.error('❌ Profile creation error:', error)
      throw error
    }

    console.log('✅ User profile created:', data.id)

    console.log('🎉 User creation completed successfully!')
    return data

  } catch (err) {
    console.error('💥 User creation failed:', err)
    throw err
  }
}

// Test with the same data that would come from the form
async function testFrontendUserCreation() {
  const newUser = {
    username: 'frontend.test',
    password: 'TestPassword123!',
    name: 'Frontend Test User',
    role: 'operations',
    departments: [],
    countries: [],
    email: 'frontend.test@transmedicgroup.com',
    enabled: true
  }

  console.log('Testing frontend user creation simulation...')
  console.log('Environment check:')
  console.log('- REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL || 'NOT SET (using fallback)')
  console.log('- REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET (using fallback)')

  try {
    const result = await simulateUserCreate(newUser)
    console.log('✅ Frontend simulation successful!')
    
    // Cleanup
    console.log('🧹 Cleaning up test user...')
    const serviceRoleClient = createClient(
      'https://puppogbxzkppdesjvhev.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1cHBvZ2J4emtwcGRlc2p2aGV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ3MDcxNiwiZXhwIjoyMDY3MDQ2NzE2fQ.FRN7Z5BP7YtQ3i974Ev1CJ0XtbSlYzlN11T5lu5KCgY',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    await serviceRoleClient.auth.admin.deleteUser(result.id)
    console.log('✅ Cleanup completed')
    
  } catch (error) {
    console.error('❌ Frontend simulation failed:', error)
  }
}

testFrontendUserCreation()
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  'https://puppogbxzkppdesjvhev.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1cHBvZ2J4emtwcGRlc2p2aGV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ3MDcxNiwiZXhwIjoyMDY3MDQ2NzE2fQ.FRN7Z5BP7YtQ3i974Ev1CJ0XtbSlYzlN11T5lu5KCgY',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function testUserCreation() {
  const testUser = {
    username: 'test.user',
    email: 'test.user@transmedicgroup.com',
    password: 'TestPassword123!',
    name: 'Test User',
    role: 'operations'
  }

  console.log('Testing user creation workflow...')
  console.log('Test user data:', testUser)

  try {
    // Step 1: Check if user already exists in auth
    console.log('\n1. Checking if user exists in auth...')
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers.users.find(u => u.email === testUser.email)
    
    if (existingUser) {
      console.log('✓ User already exists in auth with ID:', existingUser.id)
      // Clean up existing user
      console.log('Cleaning up existing user...')
      await supabase.auth.admin.deleteUser(existingUser.id)
      console.log('✓ Existing user cleaned up')
    }

    // Step 2: Create auth user
    console.log('\n2. Creating auth user...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      user_metadata: {
        name: testUser.name,
        username: testUser.username
      },
      email_confirm: true
    })

    if (authError) {
      console.error('❌ Auth creation failed:', authError)
      return
    }

    console.log('✓ Auth user created successfully')
    console.log('User ID:', authData.user.id)

    // Step 3: Get role ID
    console.log('\n3. Getting role ID for:', testUser.role)
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id, name')
      .eq('name', testUser.role)
      .single()

    if (roleError) {
      console.error('❌ Role fetch failed:', roleError)
      return
    }

    console.log('✓ Role found:', roleData)

    // Step 4: Create user profile
    console.log('\n4. Creating user profile...')
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        username: testUser.username,
        name: testUser.name,
        email: testUser.email,
        role_id: roleData.id,
        enabled: true
      })
      .select()
      .single()

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError)
      return
    }

    console.log('✓ User profile created successfully')
    console.log('Profile data:', profileData)

    // Step 5: Test authentication
    console.log('\n5. Testing authentication...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    })

    if (loginError) {
      console.error('❌ Authentication test failed:', loginError)
    } else {
      console.log('✓ Authentication test successful')
      console.log('Login user ID:', loginData.user?.id)
    }

    // Step 6: Cleanup
    console.log('\n6. Cleaning up test user...')
    await supabase.auth.admin.deleteUser(authData.user.id)
    console.log('✓ Test user cleaned up')

    console.log('\n✅ User creation workflow test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testUserCreation()
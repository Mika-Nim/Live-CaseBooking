const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  'https://puppogbxzkppdesjvhev.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1cHBvZ2J4emtwcGRlc2p2aGV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ3MDcxNiwiZXhwIjoyMDY3MDQ2NzE2fQ.FRN7Z5BP7YtQ3i974Ev1CJ0XtbSlYzlN11T5lu5KCgY'
)

async function testAuth() {
  const username = 'anrong.low'
  const password = 'NewPassword123!'
  const email = `${username}@transmedicgroup.com`

  console.log('Testing authentication...')
  console.log(`Email: ${email}`)
  console.log(`Password: ${password}`)

  try {
    // Test basic auth
    console.log('\n1. Testing basic auth...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (authError) {
      console.error('Auth error:', authError)
      return
    }

    console.log('✓ Basic auth successful')
    console.log('User ID:', authData.user?.id)

    // Test user profile fetch
    console.log('\n2. Testing user profile fetch...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user?.id)
      .single()

    if (userError) {
      console.error('User fetch error:', userError)
      return
    }

    console.log('✓ User profile fetched')
    console.log('Username:', userData.username)
    console.log('Role ID:', userData.role_id)

    // Test role fetch
    console.log('\n3. Testing role fetch...')
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('id', userData.role_id)
      .single()

    if (roleError) {
      console.error('Role fetch error:', roleError)
      return
    }

    console.log('✓ Role fetched')
    console.log('Role name:', roleData.name)

    console.log('\n✅ All tests passed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testAuth()
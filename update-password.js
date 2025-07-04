const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client with service role key
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

async function updateUserPassword() {
  const username = 'anrong.low'
  const email = `${username}@transmedicgroup.com`
  const newPassword = 'NewPassword123!'

  try {
    console.log(`Updating password for user: ${username}`)
    console.log(`Email: ${email}`)
    
    // Update user password using admin API
    const { data, error } = await supabase.auth.admin.updateUserById(
      // We need to find the user ID first
      await getUserId(email),
      {
        password: newPassword
      }
    )

    if (error) {
      console.error('Error updating password:', error)
      return
    }

    console.log('Password updated successfully!')
    console.log('New credentials:')
    console.log(`Username: ${username}`)
    console.log(`Email: ${email}`)
    console.log(`Password: ${newPassword}`)
    
  } catch (error) {
    console.error('Error:', error)
  }
}

async function getUserId(email) {
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      throw error
    }

    const user = users.find(u => u.email === email)
    if (!user) {
      throw new Error(`User with email ${email} not found`)
    }

    return user.id
  } catch (error) {
    console.error('Error finding user:', error)
    throw error
  }
}

// Run the update
updateUserPassword()
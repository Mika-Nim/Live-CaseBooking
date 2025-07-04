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

async function listUsers() {
  try {
    // List users from auth table
    console.log('=== Auth Users ===')
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error listing auth users:', authError)
    } else {
      console.log('Auth users found:', authData.users.length)
      authData.users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}, Email: ${user.email}, Username: ${user.user_metadata?.username || 'N/A'}`)
      })
    }

    // List users from database table
    console.log('\n=== Database Users ===')
    const { data: dbData, error: dbError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (dbError) {
      console.error('Error listing database users:', dbError)
    } else {
      console.log('Database users found:', dbData.length)
      dbData.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Name: ${user.name}`)
      })
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the list
listUsers()
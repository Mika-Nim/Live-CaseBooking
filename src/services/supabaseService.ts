import { supabase, supabaseAdmin } from './supabase'
import type { 
  CaseBooking, 
  User, 
  Notification
} from '../types'
import { CASE_STATUSES } from '../constants/statuses'
import { DEFAULT_COUNTRY } from '../types'
import { withErrorHandling, withRetry, DatabaseError } from '../utils/errorHandler'

// AuditLogEntry interface definition since it's not in types
export interface AuditLogEntry {
  id: string
  timestamp: string
  user: string
  action: string
  category: string
  target: string
  details: string
  ipAddress?: string
  status: 'success' | 'warning' | 'error'
}

// =============================================================================
// TYPE DEFINITIONS FOR SUPABASE TABLES
// =============================================================================

export interface Country {
  id: string
  code: string
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Role {
  id: string
  name: string
  display_name: string
  description: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CaseStatus {
  id: string
  status_key: string
  display_name: string
  description: string
  color: string
  icon: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Hospital {
  id: string
  name: string
  country_id: string
  department_id: string
  is_active: boolean
  created_at: string
}

export interface Department {
  id: string
  name: string
  country_id: string
  is_active: boolean
  created_at: string
}

export interface ProcedureType {
  id: string
  name: string
  country_id: string
  is_active: boolean
  is_hidden: boolean
  created_at: string
}

export interface SurgerySet {
  id: string
  name: string
  country_id: string
  is_active: boolean
  created_at: string
}

export interface ImplantBox {
  id: string
  name: string
  country_id: string
  is_active: boolean
  created_at: string
}

// =============================================================================
// COUNTRY OPERATIONS
// =============================================================================

export const countryOperations = {
  async getAll(): Promise<Country[]> {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async getByCode(code: string): Promise<Country | null> {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data || null
  }
}


// =============================================================================
// USER OPERATIONS
// =============================================================================

export const userOperations = {
  async getAll(): Promise<User[]> {
    console.log('👥 Fetching all users from Supabase...')
    
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select(`
          *,
          role:roles(name, display_name),
          selected_country:countries(code, name),
          user_departments(department_name),
          user_countries(country:countries(code, name))
        `)
        .eq('enabled', true)
        .order('name')
      
      console.log('👥 User query result:', { data, error, count: data?.length })
      if (error) {
        console.error('👥 User query error:', error)
        throw error
      }
      
      // Transform the data to match expected User interface
      return (data || []).map((user: any) => ({
        id: user.id,
        username: user.username || '',
        password: '', // Never expose password
        role: user.role?.name || 'user',
        name: user.name || '',
        email: user.email || '',
        enabled: user.enabled !== false,
        departments: user.user_departments?.map((d: any) => d.department_name) || [],
        countries: user.user_countries?.map((c: any) => c.country?.name) || [],
        selectedCountry: user.selected_country?.name || DEFAULT_COUNTRY
      }))
    } catch (error) {
      console.error('👥 User operations error:', error)
      throw error
    }
    
    /* ORIGINAL CODE - COMMENTED OUT DUE TO HANGING SUPABASE CLIENT
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        role:roles(name, display_name),
        selected_country:countries(code, name),
        user_departments(department_name),
        user_countries(country:countries(code, name))
      `)
      .eq('enabled', true)
      .order('name')
    
    if (error) throw error
    
    // Transform the data to match expected User interface
    return (data || []).map((user: any) => ({
      ...user,
      role: user.role?.name || 'unknown',
      departments: user.user_departments?.map((d: any) => d.department_name) || [],
      countries: user.user_countries?.map((c: any) => c.country?.name) || []
    }))
    */
  },

  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        role:roles(name, display_name),
        selected_country:countries(code, name),
        user_departments(department_name),
        user_countries(country:countries(code, name))
      `)
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    
    // Transform the data to match expected User interface
    if (data) {
      const transformedUser = {
        ...data,
        role: data.role?.name || 'unknown',
        departments: data.user_departments?.map((d: any) => d.department_name) || [],
        countries: data.user_countries?.map((c: any) => c.country?.name) || []
      }
      return transformedUser
    }
    
    return null
  },

  async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    return withErrorHandling(async () => {
      // Validate required fields
      if (!userData.email) {
        throw new DatabaseError({ message: 'Email is required for user creation' }, 'create user', false)
      }
      if (!userData.password) {
        throw new DatabaseError({ message: 'Password is required for user creation' }, 'create user', false)
      }

      // First create auth user
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
        // Handle rate limiting specifically
        if (authError.message.includes('For security purposes') || authError.message.includes('rate')) {
          throw new DatabaseError(
            { 
              message: 'Too many user creation attempts. Please wait a minute before trying again.',
              details: authError.message 
            }, 
            'create auth user', 
            true // Make it retryable after delay
          )
        }
        throw new DatabaseError(authError, 'create auth user', false)
      }
      if (!authData.user) {
        throw new DatabaseError({ message: 'Failed to create auth user' }, 'create auth user', false)
      }

      // Get role ID with better error handling
      let { data: roleData, error: roleError } = await supabaseAdmin
        .from('roles')
        .select('id, name, is_active')
        .eq('name', userData.role)
        .eq('is_active', true)
        .single()
      
      if (roleError || !roleData) {
        console.error('Role lookup failed:', { 
          role: userData.role, 
          error: roleError,
          availableRoles: await supabaseAdmin.from('roles').select('name').eq('is_active', true) 
        })
        
        // Try to find operations role as fallback
        const { data: fallbackRole } = await supabaseAdmin
          .from('roles')
          .select('id')
          .eq('name', 'operations')
          .eq('is_active', true)
          .single()
        
        if (fallbackRole) {
          console.warn(`Using fallback role 'operations' for user ${userData.username}`)
          roleData = fallbackRole
        } else {
          throw new DatabaseError({ 
            message: `Role '${userData.role}' not found and no fallback role available. Please ensure the role exists in the database.` 
          }, 'find user role', false)
        }
      }

      // Create user profile using admin client to bypass RLS
      const { data: userProfile, error: profileError } = await supabaseAdmin
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

      if (profileError) {
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id)
        throw new DatabaseError(profileError, 'create user profile', false)
      }

      // Add departments and countries
      if (userData.departments?.length || userData.countries?.length) {
        const countryId = await this.getCountryIdByName(userData.countries?.[0] || DEFAULT_COUNTRY)
        
        // Add departments
        if (userData.departments?.length) {
          const deptInserts = userData.departments.map(dept => ({
            user_id: authData.user!.id,
            department_name: dept,
            country_id: countryId
          }))
          
          const { error: deptError } = await supabaseAdmin
            .from('user_departments')
            .insert(deptInserts)
          
          if (deptError) {
            console.warn('Failed to assign departments:', deptError)
          }
        }

        // Add countries
        if (userData.countries?.length) {
          const countryInserts = await Promise.all(
            userData.countries.map(async (countryName) => {
              const countryId = await this.getCountryIdByName(countryName)
              return {
                user_id: authData.user!.id,
                country_id: countryId
              }
            })
          )
          
          const { error: countryError } = await supabaseAdmin
            .from('user_countries')
            .insert(countryInserts)
          
          if (countryError) {
            console.warn('Failed to assign countries:', countryError)
          }
        }
      }

      return {
        id: userProfile.id,
        username: userProfile.username,
        password: '',
        role: userData.role,
        name: userProfile.name,
        email: userProfile.email,
        enabled: userProfile.enabled,
        departments: userData.departments || [],
        countries: userData.countries || [],
        selectedCountry: userData.countries?.[0] || DEFAULT_COUNTRY
      }
    }, {
      operation: 'create user',
      showToUser: true
    })
  },

  async update(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getCountryIdByName(countryName: string): Promise<string> {
    console.log('🔍 userOperations.getCountryIdByName: Looking up country:', countryName)
    
    // Fallback mapping to avoid hanging queries
    const countryMapping: { [key: string]: string } = {
      'Singapore': 'c4b50cb5-f84e-4a2c-99ff-ec31396a18d0',
      'Malaysia': '4ea4fdf4-41f9-4220-87f4-6dd4e1f227ee',
      'Philippines': '59cec463-e095-4c78-99b4-5e526c3f0b45',
      'Indonesia': '6d9edebc-3425-4ea5-a937-9814f2254319',
      'Vietnam': '4bfdd908-9e3e-4f45-91cb-021f698a9c97',
      'Hong Kong': '73c11bc6-a311-4eb8-94d7-00d68ed9a9ff',
      'Thailand': 'f685d4e4-0688-453e-91c6-4379954c9821'
    }
    
    if (countryMapping[countryName]) {
      console.log('🔍 userOperations.getCountryIdByName: Using cached ID for:', countryName, countryMapping[countryName])
      return countryMapping[countryName]
    }
    
    // Try database query with timeout if not in cache
    try {
      const queryPromise = supabaseAdmin
        .from('countries')
        .select('id')
        .eq('name', countryName)
        .single()
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Country lookup timeout for: ${countryName}`)), 3000)
      )
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any
      
      console.log('🔍 userOperations.getCountryIdByName: Query result:', { data, error })
      if (error) {
        console.error('🔍 userOperations.getCountryIdByName: Error:', error)
        throw error
      }
      console.log('🔍 userOperations.getCountryIdByName: Returning ID:', data.id)
      return data.id
    } catch (timeoutError) {
      console.error('🔍 userOperations.getCountryIdByName: Query failed, no fallback available:', timeoutError)
      throw new Error(`Could not resolve country ID for: ${countryName}`)
    }
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ enabled: false })
      .eq('id', id)

    if (error) throw error
  },

  async authenticate(username: string, password: string, country: string): Promise<{ user: User | null; error?: string }> {
    return withErrorHandling(async () => {
      console.log('🔐 Starting authentication process...')
      
      
      const email = username.includes('@') ? username : `${username}@transmedicgroup.com`
      console.log('📧 Authentication: Using email:', email)
      
      // Skip connectivity test - proceed directly to authentication
      console.log('🔑 Authentication: Proceeding with Supabase authentication...')
      
      // Use Supabase auth directly
      console.log('🔑 Authentication: About to call supabase.auth.signInWithPassword...')
      console.log('🔑 Authentication: Email:', email)
      console.log('🔑 Authentication: Password length:', password?.length)
      
      let authData, authError
      try {
        const result = await supabase.auth.signInWithPassword({
          email,
          password
        })
        authData = result.data
        authError = result.error
        console.log('🔑 Authentication: signInWithPassword completed')
        console.log('🔑 Authentication: Data:', { hasUser: !!authData?.user, hasSession: !!authData?.session })
        console.log('🔑 Authentication: Error:', authError)
      } catch (exception) {
        console.error('🔑 Authentication: Exception during signInWithPassword:', exception)
        const errorMessage = exception instanceof Error ? exception.message : 'Unknown error'
        return { user: null, error: "Authentication failed: " + errorMessage }
      }
      
      if (authError) {
        console.log('❌ Authentication: Auth error:', authError)
        if (authError.message?.includes('Invalid login credentials')) {
          return { user: null, error: "Invalid username or password. Please check your credentials." }
        }
        return { user: null, error: "Authentication failed: " + authError.message }
      }
      
      if (!authData?.user) {
        console.log('❌ Authentication: No user data returned')
        return { user: null, error: "Authentication failed" }
      }
      
      console.log('✅ Authentication: Supabase auth successful, user ID:', authData.user.id)
      
      // Get user profile
      console.log('👤 Authentication: About to fetch user profile from database...')
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          role:roles(name),
          user_departments(department_name),
          user_countries(country:countries(code, name))
        `)
        .eq('id', authData.user.id)
        .eq('enabled', true)
        .single()
      console.log('👤 Authentication: User profile query result:', { userData: !!userData, userError })
      
      if (userError || !userData) {
        console.log('❌ Authentication: User profile error:', userError)
        return { user: null, error: "User profile not found or account disabled" }
      }
      
      console.log('👤 Authentication: User profile found, creating user object...')
      
      // Create user object
      const userCountries = userData.user_countries?.map((c: any) => c.country?.name) || []
      
      // Determine selectedCountry based on user's assigned countries and login selection
      console.log('🌍 Authentication: Login country selection:', country)
      console.log('🌍 Authentication: User assigned countries:', userCountries)
      
      let selectedCountry = country // Default to login form selection
      if (userCountries.length === 1) {
        // If user has only one country, use that
        selectedCountry = userCountries[0]
        console.log('🌍 Authentication: User has single country, using:', selectedCountry)
      } else if (userCountries.length > 1 && userCountries.includes(country)) {
        // If user has multiple countries and login selection is valid, use login selection
        selectedCountry = country
        console.log('🌍 Authentication: User has multiple countries, login selection is valid, using:', selectedCountry)
      } else if (userCountries.length > 0) {
        // If user has countries but login selection is invalid, use first assigned country
        selectedCountry = userCountries[0]
        console.log('🌍 Authentication: User has countries but login selection invalid, using first assigned:', selectedCountry)
      } else {
        console.log('🌍 Authentication: User has no assigned countries, using login selection:', selectedCountry)
      }
      
      const userProfile: User = {
        id: userData.id,
        username: userData.username,
        password: '',
        role: userData.role?.name || 'user',
        name: userData.name,
        email: userData.email,
        enabled: userData.enabled,
        departments: userData.user_departments?.map((d: any) => d.department_name) || [],
        countries: userCountries,
        selectedCountry: selectedCountry
      }
      
      console.log('✅ Authentication successful! User profile:', userProfile)
      return { user: userProfile }
    }, {
      operation: 'user authentication',
      showToUser: true,
      fallbackMessage: 'Authentication failed. Please check your credentials and try again.'
    })
  }
}

// =============================================================================
// CASE OPERATIONS
// =============================================================================

export const caseOperations = {
  async getAll(filters?: {
    country?: string
    status?: string
    submitter?: string
    hospital?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<CaseBooking[]> {
    console.log('🏥 Fetching all cases from Supabase...')
    
    try {
      let query = supabaseAdmin
        .from('cases')
        .select(`
          *,
          hospital:hospitals(name),
          procedure_type:procedure_types(name),
          status:case_statuses(status_key, display_name, color, icon),
          submitted_by_user:users!cases_submitted_by_fkey(name),
          processed_by_user:users!cases_processed_by_fkey(name),
          country:countries(code, name),
          case_surgery_sets(surgery_set_name),
          case_implant_boxes(implant_box_name)
        `)
        .order('created_at', { ascending: false })
      
      // Apply filters
      if (filters?.country) {
        const countryId = await userOperations.getCountryIdByName(filters.country)
        query = query.eq('country_id', countryId)
      }

      if (filters?.status) {
        const { data: statusData } = await supabaseAdmin
          .from('case_statuses')
          .select('id')
          .eq('status_key', filters.status)
          .single()
        
        if (statusData) {
          query = query.eq('status_id', statusData.id)
        }
      }

      if (filters?.submitter) {
        query = query.eq('submitted_by', filters.submitter)
      }

      if (filters?.dateFrom) {
        query = query.gte('date_of_surgery', filters.dateFrom)
      }

      if (filters?.dateTo) {
        query = query.lte('date_of_surgery', filters.dateTo)
      }

      const { data, error } = await query
      console.log('🏥 Case query result:', { data, error, count: data?.length })
      
      if (error) {
        console.error('🏥 Case query error:', error)
        throw error
      }
      
      return data || []
    } catch (error) {
      console.error('🏥 Case operations error:', error)
      throw error
    }
    
    /* ORIGINAL CODE - COMMENTED OUT DUE TO HANGING SUPABASE CLIENT
    return withRetry(async () => {
      console.log('🏥 Fetching all cases from Supabase...')
      
      let query = supabase
        .from('cases')
        .select(`
          *,
          hospital:hospitals(name),
          procedure_type:procedure_types(name),
          status:case_statuses(status_key, display_name, color, icon),
          submitted_by_user:users!cases_submitted_by_fkey(name),
          processed_by_user:users!cases_processed_by_fkey(name),
          country:countries(code, name),
          case_surgery_sets(surgery_set_name),
          case_implant_boxes(implant_box_name)
        `)
        .order('created_at', { ascending: false })
      
      // Apply filters
      if (filters?.country) {
        const { data: countryData } = await supabase
          .from('countries')
          .select('id')
          .eq('name', filters.country)
          .single()
        
        if (countryData) {
          query = query.eq('country_id', countryData.id)
        }
      }

      if (filters?.status) {
        query = query.eq('status_key', filters.status)
      }

      if (filters?.submitter) {
        query = query.eq('submitted_by', filters.submitter)
      }

      if (filters?.dateFrom) {
        query = query.gte('date_of_surgery', filters.dateFrom)
      }

      if (filters?.dateTo) {
        query = query.lte('date_of_surgery', filters.dateTo)
      }
      
      const { data, error } = await query
      
      if (error) {
        throw new DatabaseError(error, 'fetch cases', true)
      }
      
      // Transform to match CaseBooking interface
      return (data || []).map((caseItem: any) => ({
        id: caseItem.id,
        caseReferenceNumber: caseItem.case_reference_number,
        hospital: caseItem.hospital?.name || caseItem.hospital_name || 'Unknown Hospital',
        department: caseItem.department_name || 'Unknown Department',
        dateOfSurgery: caseItem.date_of_surgery,
        procedureType: caseItem.procedure_type?.name || caseItem.procedure_type_name || 'Unknown Procedure',
        procedureName: caseItem.procedure_name || '',
        doctorName: caseItem.doctor_name || '',
        timeOfProcedure: caseItem.time_of_procedure || '',
        specialInstruction: caseItem.special_instruction || '',
        status: caseItem.status?.status_key || caseItem.status_key || CASE_STATUSES.CASE_BOOKED,
        submittedBy: caseItem.submitted_by_user?.name || caseItem.submitted_by || 'Unknown User',
        submittedAt: caseItem.submitted_at || caseItem.created_at,
        country: caseItem.country?.name || DEFAULT_COUNTRY,
        surgerySetSelection: caseItem.case_surgery_sets?.map((s: any) => s.surgery_set_name) || [],
        implantBox: caseItem.case_implant_boxes?.map((b: any) => b.implant_box_name) || []
      }))
    }, {
      operation: 'fetch cases',
      showToUser: true,
      maxRetries: 3
    })
    
    /* ORIGINAL CODE - COMMENTED OUT DUE TO HANGING SUPABASE CLIENT
    let query = supabase
      .from('cases')
      .select(`
        *,
        hospital:hospitals(name),
        procedure_type:procedure_types(name),
        status:case_statuses(status_key, display_name, color, icon),
        submitted_by_user:users!cases_submitted_by_fkey(name),
        processed_by_user:users!cases_processed_by_fkey(name),
        country:countries(code, name),
        case_surgery_sets(surgery_set_name),
        case_implant_boxes(implant_box_name),
        case_status_history(
          status_key,
          timestamp,
          processed_by_user:users(name),
          details,
          attachments(file_name, file_path)
        ),
        amendment_history(
          amendment_id,
          timestamp,
          amended_by_user:users(name),
          changes,
          reason
        ),
        attachments(file_name, file_path, file_type, uploaded_at, is_delivery_image)
      `)
      .order('created_at', { ascending: false })
    */

    /* REST OF ORIGINAL CODE - COMMENTED OUT DUE TO HANGING SUPABASE CLIENT
    if (filters?.country) {
      const { data: countryData } = await supabase
        .from('countries')
        .select('id')
        .eq('name', filters.country)
        .single()
      
      if (countryData) {
        query = query.eq('country_id', countryData.id)
      }
    }

    if (filters?.status) {
      const { data: statusData } = await supabase
        .from('case_statuses')
        .select('id')
        .eq('status_key', filters.status)
        .single()
      
      if (statusData) {
        query = query.eq('status_id', statusData.id)
      }
    }

    if (filters?.submitter) {
      query = query.eq('submitted_by', filters.submitter)
    }

    if (filters?.dateFrom) {
      query = query.gte('date_of_surgery', filters.dateFrom)
    }

    if (filters?.dateTo) {
      query = query.lte('date_of_surgery', filters.dateTo)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
    */
  },

  async getById(id: string): Promise<CaseBooking | null> {
    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        hospital:hospitals(name),
        procedure_type:procedure_types(name),
        status:case_statuses(status_key, display_name, color, icon),
        submitted_by_user:users!cases_submitted_by_fkey(name),
        processed_by_user:users!cases_processed_by_fkey(name),
        country:countries(code, name),
        case_surgery_sets(surgery_set_name),
        case_implant_boxes(implant_box_name),
        case_status_history(
          status_key,
          timestamp,
          processed_by_user:users(name),
          details,
          attachments(file_name, file_path)
        ),
        amendment_history(*),
        attachments(*)
      `)
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  async create(caseData: Omit<CaseBooking, 'id' | 'created_at' | 'updated_at'>): Promise<CaseBooking> {
    return withErrorHandling(async () => {
      console.log('📝 Creating new case in Supabase...')
      
      // Get required IDs
      const countryId = await this.getCountryIdByName(caseData.country || DEFAULT_COUNTRY)
      
      // Get hospital ID (optional - might not exist yet)
      let hospitalId = null
      try {
        const { data: hospitalData } = await supabase
          .from('hospitals')
          .select('id')
          .eq('name', caseData.hospital)
          .eq('country_id', countryId)
          .single()
        hospitalId = hospitalData?.id
      } catch {
        // Hospital might not exist in database yet
      }
      
      // Get procedure type ID (optional)
      let procedureTypeId = null
      try {
        const { data: procedureData } = await supabase
          .from('procedure_types')
          .select('id')
          .eq('name', caseData.procedureType)
          .eq('country_id', countryId)
          .single()
        procedureTypeId = procedureData?.id
      } catch {
        // Procedure type might not exist in database yet
      }
      
      // Get status ID
      const { data: statusData, error: statusError } = await supabase
        .from('case_statuses')
        .select('id')
        .eq('status_key', CASE_STATUSES.CASE_BOOKED)
        .single()
      
      if (statusError) {
        throw new DatabaseError(statusError, 'find case status', false)
      }
      
      // Generate case reference number
      const referenceNumber = `CASE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      
      // Create case
      const { data, error } = await supabase
        .from('cases')
        .insert({
          case_reference_number: referenceNumber,
          hospital_id: hospitalId,
          hospital_name: caseData.hospital, // Fallback for display
          department_name: caseData.department,
          date_of_surgery: caseData.dateOfSurgery,
          procedure_type_id: procedureTypeId,
          procedure_type_name: caseData.procedureType, // Fallback for display
          procedure_name: caseData.procedureName,
          doctor_name: caseData.doctorName,
          time_of_procedure: caseData.timeOfProcedure,
          special_instruction: caseData.specialInstruction,
          status_id: statusData.id,
          status_key: CASE_STATUSES.CASE_BOOKED,
          submitted_by: caseData.submittedBy,
          country_id: countryId
        })
        .select()
        .single()
      
      if (error) {
        throw new DatabaseError(error, 'create case', false)
      }
      
      // Add surgery sets
      if (caseData.surgerySetSelection?.length) {
        const setsInserts = caseData.surgerySetSelection.map(setName => ({
          case_id: data.id,
          surgery_set_name: setName
        }))
        
        const { error: setsError } = await supabase
          .from('case_surgery_sets')
          .insert(setsInserts)
        
        if (setsError) {
          console.warn('Failed to add surgery sets:', setsError)
        }
      }
      
      // Add implant boxes
      if (caseData.implantBox?.length) {
        const boxesInserts = caseData.implantBox.map(boxName => ({
          case_id: data.id,
          implant_box_name: boxName
        }))
        
        const { error: boxesError } = await supabase
          .from('case_implant_boxes')
          .insert(boxesInserts)
        
        if (boxesError) {
          console.warn('Failed to add implant boxes:', boxesError)
        }
      }
      
      // Add initial status history
      await this.addStatusHistory(data.id, CASE_STATUSES.CASE_BOOKED, caseData.submittedBy, 'Case created')
      
      return {
        id: data.id,
        caseReferenceNumber: data.case_reference_number,
        hospital: caseData.hospital,
        department: caseData.department,
        dateOfSurgery: caseData.dateOfSurgery,
        procedureType: caseData.procedureType,
        procedureName: caseData.procedureName,
        doctorName: caseData.doctorName,
        timeOfProcedure: caseData.timeOfProcedure,
        specialInstruction: caseData.specialInstruction,
        status: CASE_STATUSES.CASE_BOOKED,
        submittedBy: caseData.submittedBy,
        country: caseData.country,
        surgerySetSelection: caseData.surgerySetSelection || [],
        implantBox: caseData.implantBox || [],
        submittedAt: data.created_at
      }
    }, {
      operation: 'create case',
      showToUser: true
    })
    
    /* ORIGINAL CODE - COMMENTED OUT DUE TO HANGING SUPABASE CLIENT
    // Get country ID
    const countryId = await this.getCountryIdByName(caseData.country)
    
    // Get hospital ID
    const { data: hospitalData } = await supabase
      .from('hospitals')
      .select('id')
      .eq('name', caseData.hospital)
      .eq('country_id', countryId)
      .single()

    // Get procedure type ID  
    const { data: procedureData } = await supabase
      .from('procedure_types')
      .select('id')
      .eq('name', caseData.procedureType)
      .eq('country_id', countryId)
      .single()

    // Get status ID
    const { data: statusData } = await supabase
      .from('case_statuses')
      .select('id')
      .eq('status_key', caseData.status)
      .single()

    // Generate case reference number
    const { data: refNumber } = await supabase.rpc('generate_case_reference_number', {
      p_country_id: countryId
    })

    // Create case
    const { data, error } = await supabase
      .from('cases')
      .insert({
        case_reference_number: refNumber,
        hospital_id: hospitalData?.id,
        department_name: caseData.department,
        date_of_surgery: caseData.dateOfSurgery,
        procedure_type_id: procedureData?.id,
        procedure_name: caseData.procedureName,
        doctor_name: caseData.doctorName,
        time_of_procedure: caseData.timeOfProcedure,
        special_instruction: caseData.specialInstruction,
        status_id: statusData?.id,
        submitted_by: caseData.submittedBy,
        country_id: countryId
      })
      .select()
      .single()

    if (error) throw error

    // Add surgery sets
    if (caseData.surgerySetSelection?.length) {
      const setsInserts = caseData.surgerySetSelection.map(setName => ({
        case_id: data.id,
        surgery_set_name: setName
      }))
      
      await supabase.from('case_surgery_sets').insert(setsInserts)
    }

    // Add implant boxes
    if (caseData.implantBox?.length) {
      const boxesInserts = caseData.implantBox.map(boxName => ({
        case_id: data.id,
        implant_box_name: boxName
      }))
      
      await supabase.from('case_implant_boxes').insert(boxesInserts)
    }

    // Add initial status history
    await this.addStatusHistory(data.id, caseData.status, caseData.submittedBy, 'Case created')

    return data
    */
  },

  async update(id: string, updates: Partial<CaseBooking>): Promise<CaseBooking> {
    const { data, error } = await supabase
      .from('cases')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateStatus(
    caseId: string, 
    newStatus: string, 
    processedBy: string, 
    details?: string
  ): Promise<void> {
    const { data: statusData } = await supabase
      .from('case_statuses')
      .select('id')
      .eq('status_key', newStatus)
      .single()

    if (!statusData) throw new Error(`Status ${newStatus} not found`)

    // Update case status
    await supabase
      .from('cases')
      .update({ 
        status_id: statusData.id,
        processed_by: processedBy,
        processed_at: new Date().toISOString()
      })
      .eq('id', caseId)

    // Add status history
    await this.addStatusHistory(caseId, newStatus, processedBy, details)
  },

  async addStatusHistory(
    caseId: string,
    status: string,
    processedBy: string,
    details?: string
  ): Promise<void> {
    const { data: statusData } = await supabase
      .from('case_statuses')
      .select('id')
      .eq('status_key', status)
      .single()

    const { data: userData } = await supabase
      .from('users')
      .select('name')
      .eq('id', processedBy)
      .single()

    await supabase
      .from('case_status_history')
      .insert({
        case_id: caseId,
        status_id: statusData?.id,
        status_key: status,
        processed_by: processedBy,
        user_name: userData?.name,
        details
      })
  },

  async addAmendment(
    caseId: string,
    amendedBy: string,
    changes: Array<{field: string, oldValue: string, newValue: string}>,
    reason?: string
  ): Promise<void> {
    const amendmentId = `AMD-${Date.now()}`
    
    const { data: userData } = await supabase
      .from('users')
      .select('name')
      .eq('id', amendedBy)
      .single()

    await supabase
      .from('amendment_history')
      .insert({
        case_id: caseId,
        amendment_id: amendmentId,
        amended_by: amendedBy,
        amended_by_name: userData?.name,
        changes,
        reason
      })

    // Update case amended flags
    await supabase
      .from('cases')
      .update({
        is_amended: true,
        amended_by: amendedBy,
        amended_at: new Date().toISOString()
      })
      .eq('id', caseId)
  },

  async getCountryIdByName(countryName: string): Promise<string> {
    console.log('🔍 userOperations.getCountryIdByName: Looking up country:', countryName)
    
    // Fallback mapping to avoid hanging queries
    const countryMapping: { [key: string]: string } = {
      'Singapore': 'c4b50cb5-f84e-4a2c-99ff-ec31396a18d0',
      'Malaysia': '4ea4fdf4-41f9-4220-87f4-6dd4e1f227ee',
      'Philippines': '59cec463-e095-4c78-99b4-5e526c3f0b45',
      'Indonesia': '6d9edebc-3425-4ea5-a937-9814f2254319',
      'Vietnam': '4bfdd908-9e3e-4f45-91cb-021f698a9c97',
      'Hong Kong': '73c11bc6-a311-4eb8-94d7-00d68ed9a9ff',
      'Thailand': 'f685d4e4-0688-453e-91c6-4379954c9821'
    }
    
    if (countryMapping[countryName]) {
      console.log('🔍 userOperations.getCountryIdByName: Using cached ID for:', countryName, countryMapping[countryName])
      return countryMapping[countryName]
    }
    
    // Try database query with timeout if not in cache
    try {
      const queryPromise = supabaseAdmin
        .from('countries')
        .select('id')
        .eq('name', countryName)
        .single()
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Country lookup timeout for: ${countryName}`)), 3000)
      )
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any
      
      console.log('🔍 userOperations.getCountryIdByName: Query result:', { data, error })
      if (error) {
        console.error('🔍 userOperations.getCountryIdByName: Error:', error)
        throw error
      }
      console.log('🔍 userOperations.getCountryIdByName: Returning ID:', data.id)
      return data.id
    } catch (timeoutError) {
      console.error('🔍 userOperations.getCountryIdByName: Query failed, no fallback available:', timeoutError)
      throw new Error(`Could not resolve country ID for: ${countryName}`)
    }
  },

  async delete(caseId: string): Promise<void> {
    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', caseId)

    if (error) throw error
  }
}

// =============================================================================
// LOOKUP DATA OPERATIONS
// =============================================================================

export const lookupOperations = {
  async getCountries(): Promise<Country[]> {
    console.log('🌍 lookupOperations.getCountries: Starting real Supabase query...')
    
    try {
      const { data, error } = await supabaseAdmin
        .from('countries')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      console.log('🌍 lookupOperations.getCountries: Query result:', { data, error, count: data?.length })
      if (error) {
        console.error('🌍 lookupOperations.getCountries: Error:', error)
        throw error
      }
      return data || []
    } catch (error) {
      console.error('🌍 lookupOperations.getCountries: Exception:', error)
      throw error
    }
  },

  async getHospitals(countryName?: string): Promise<Hospital[]> {
    console.log('🏥 lookupOperations.getHospitals: Starting real Supabase query for country:', countryName)
    
    try {
      let query = supabaseAdmin
        .from('hospitals')
        .select(`
          *,
          country:countries(name)
        `)
        .eq('is_active', true)
        .order('name')

      if (countryName) {
        console.log('🏥 lookupOperations.getHospitals: Getting country ID for:', countryName)
        const countryId = await userOperations.getCountryIdByName(countryName)
        console.log('🏥 lookupOperations.getHospitals: Using country ID:', countryId)
        query = query.eq('country_id', countryId)
      }

      const { data, error } = await query
      console.log('🏥 lookupOperations.getHospitals: Query result:', { data, error, count: data?.length })
      if (error) {
        console.error('🏥 lookupOperations.getHospitals: Error:', error)
        throw error
      }
      return data || []
    } catch (error) {
      console.error('🏥 lookupOperations.getHospitals: Exception:', error)
      throw error
    }
  },

  async getDepartments(countryName?: string): Promise<Department[]> {
    console.log('🏥 lookupOperations.getDepartments: Starting real Supabase query for country:', countryName)
    
    try {
      let query = supabaseAdmin
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (countryName) {
        console.log('🏥 lookupOperations.getDepartments: Getting country ID for:', countryName)
        const countryId = await userOperations.getCountryIdByName(countryName)
        console.log('🏥 lookupOperations.getDepartments: Using country ID:', countryId)
        query = query.eq('country_id', countryId)
      }

      const { data, error } = await query
      console.log('🏥 lookupOperations.getDepartments: Query result:', { data, error, count: data?.length })
      if (error) {
        console.error('🏥 lookupOperations.getDepartments: Error:', error)
        throw error
      }
      return data || []
    } catch (error) {
      console.error('🏥 lookupOperations.getDepartments: Exception:', error)
      throw error
    }
  },

  async getProcedureTypes(countryName?: string, includeHidden = false): Promise<ProcedureType[]> {
    console.log('🔬 lookupOperations.getProcedureTypes: Starting real Supabase query for country:', countryName)
    
    try {
      let query = supabaseAdmin
        .from('procedure_types')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (!includeHidden) {
        query = query.eq('is_hidden', false)
      }

      if (countryName) {
        console.log('🔬 lookupOperations.getProcedureTypes: Getting country ID for:', countryName)
        const countryId = await userOperations.getCountryIdByName(countryName)
        console.log('🔬 lookupOperations.getProcedureTypes: Using country ID:', countryId)
        query = query.eq('country_id', countryId)
      }

      const { data, error } = await query
      console.log('🔬 lookupOperations.getProcedureTypes: Query result:', { data, error, count: data?.length })
      if (error) {
        console.error('🔬 lookupOperations.getProcedureTypes: Error:', error)
        throw error
      }
      return data || []
    } catch (error) {
      console.error('🔬 lookupOperations.getProcedureTypes: Exception:', error)
      throw error
    }
  },

  async getSurgerySets(countryName?: string): Promise<SurgerySet[]> {
    let query = supabaseAdmin
      .from('surgery_sets')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (countryName) {
      const countryId = await userOperations.getCountryIdByName(countryName)
      query = query.eq('country_id', countryId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getImplantBoxes(countryName?: string): Promise<ImplantBox[]> {
    let query = supabaseAdmin
      .from('implant_boxes')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (countryName) {
      const countryId = await userOperations.getCountryIdByName(countryName)
      query = query.eq('country_id', countryId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getCaseStatuses(): Promise<CaseStatus[]> {
    const { data, error } = await supabaseAdmin
      .from('case_statuses')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    if (error) throw error
    return data || []
  },

  async getProcedureMappings(procedureTypeName: string, countryName: string) {
    const countryId = await userOperations.getCountryIdByName(countryName)
    
    const { data: procedureData } = await supabase
      .from('procedure_types')
      .select('id')
      .eq('name', procedureTypeName)
      .eq('country_id', countryId)
      .single()

    if (!procedureData) return { surgerySets: [], implantBoxes: [] }

    const { data, error } = await supabase
      .from('procedure_mappings')
      .select(`
        surgery_set:surgery_sets(name),
        implant_box:implant_boxes(name)
      `)
      .eq('procedure_type_id', procedureData.id)
      .eq('country_id', countryId)

    if (error) throw error

    const surgerySetNames = data?.map((item: any) => item.surgery_set?.name).filter(Boolean) || []
    const implantBoxNames = data?.map((item: any) => item.implant_box?.name).filter(Boolean) || []
    const surgerySets = Array.from(new Set(surgerySetNames))
    const implantBoxes = Array.from(new Set(implantBoxNames))

    return { surgerySets, implantBoxes }
  },

  async createSurgerySet(name: string, countryName: string): Promise<string> {
    const countryId = await userOperations.getCountryIdByName(countryName)
    
    const { data, error } = await supabaseAdmin
      .from('surgery_sets')
      .insert({
        name: name.trim(),
        country_id: countryId,
        is_active: true
      })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  },

  async createImplantBox(name: string, countryName: string): Promise<string> {
    const countryId = await userOperations.getCountryIdByName(countryName)
    
    const { data, error } = await supabaseAdmin
      .from('implant_boxes')
      .insert({
        name: name.trim(),
        country_id: countryId,
        is_active: true
      })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  },

  async createProcedureMapping(procedureTypeName: string, surgerySetId: string | null, implantBoxId: string | null, countryName: string): Promise<void> {
    const countryId = await userOperations.getCountryIdByName(countryName)
    
    const { data: procedureData } = await supabase
      .from('procedure_types')
      .select('id')
      .eq('name', procedureTypeName)
      .eq('country_id', countryId)
      .single()

    if (!procedureData) throw new Error(`Procedure type '${procedureTypeName}' not found`)

    const { error } = await supabaseAdmin
      .from('procedure_mappings')
      .insert({
        procedure_type_id: procedureData.id,
        surgery_set_id: surgerySetId,
        implant_box_id: implantBoxId,
        country_id: countryId
      })

    if (error) throw error
  }
}

// =============================================================================
// NOTIFICATION OPERATIONS
// =============================================================================

export const notificationOperations = {
  async getUserNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async createNotification(
    userId: string,
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    duration?: number
  ): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        duration
      })

    if (error) throw error
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) throw error
  }
}

// =============================================================================
// AUDIT LOG OPERATIONS
// =============================================================================

export const auditOperations = {
  async logAction(
    userId: string,
    action: string,
    category: string,
    target?: string,
    details?: string,
    status: 'success' | 'warning' | 'error' = 'success'
  ): Promise<void> {
    const { data: userData } = await supabase
      .from('users')
      .select('name')
      .eq('id', userId)
      .single()

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        user_name: userData?.name,
        action,
        category,
        target,
        details,
        status
      })

    if (error) throw error
  },

  async getAuditLogs(filters?: {
    userId?: string
    category?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<AuditLogEntry[]> {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }
}

// =============================================================================
// FILE OPERATIONS
// =============================================================================

export const fileOperations = {
  async uploadCaseAttachment(
    caseId: string,
    file: File,
    uploadedBy: string,
    isDeliveryImage = false
  ): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${caseId}/${Date.now()}.${fileExt}`
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('case-attachments')
      .upload(fileName, file)

    if (error) throw error

    // Save attachment metadata
    await supabase
      .from('attachments')
      .insert({
        case_id: caseId,
        file_name: file.name,
        file_path: data.path,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: uploadedBy,
        is_delivery_image: isDeliveryImage
      })

    return data.path
  },

  async getCaseAttachments(caseId: string) {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('case_id', caseId)
      .order('uploaded_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getFileUrl(filePath: string): Promise<string> {
    const { data } = supabase.storage
      .from('case-attachments')
      .getPublicUrl(filePath)

    return data.publicUrl
  }
}

// =============================================================================
// REAL-TIME SUBSCRIPTIONS
// =============================================================================

export const subscriptions = {
  subscribeToCases(callback: (payload: any) => void) {
    return supabase
      .channel('cases')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, callback)
      .subscribe()
  },

  subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }
}

const supabaseService = {
  countryOperations,
  userOperations,
  caseOperations,
  lookupOperations,
  notificationOperations,
  auditOperations,
  fileOperations,
  subscriptions
}

export default supabaseService
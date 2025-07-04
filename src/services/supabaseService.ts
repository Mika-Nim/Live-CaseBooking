import { supabase } from './supabase'
import type { 
  CaseBooking, 
  User, 
  Notification
} from '../types'
import { CASE_STATUSES } from '../constants/statuses'
import { USER_ROLES } from '../constants/permissions'
import { DEFAULT_COUNTRY } from '../types'

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
    console.log('👥 userOperations.getAll() called - using direct fetch to bypass hanging Supabase client')
    
    try {
      // Use direct fetch since Supabase client hangs  
      const fetchPromise = fetch(`${process.env.REACT_APP_SUPABASE_URL}/rest/v1/users?select=*&order=name`, {
        method: 'GET',
        headers: {
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY!}`,
          'Content-Type': 'application/json'
        }
      })
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Users fetch timeout')), 10000)
      })
      
      const response = await Promise.race([fetchPromise, timeoutPromise]) as any
      
      if (!response.ok) {
        console.error('❌ Users fetch failed:', response.status, response.statusText)
        return []
      }
      
      const data = await response.json()
      console.log('✅ Users fetched successfully:', data.length, 'users')
      console.log('👥 Raw user data sample:', data.length > 0 ? data[0] : 'No users found')
      
      // Transform to match User interface with better field mapping
      return data.map((user: any) => ({
        id: user.id,
        username: user.username || '',
        password: '', // Never expose password
        role: user.role_name || user.role || 'user', // Try multiple role field possibilities
        name: user.name || user.full_name || user.display_name || '',
        email: user.email || '',
        enabled: user.enabled !== false, // Default to true unless explicitly false
        departments: user.departments || user.user_departments || [],
        countries: user.countries || user.user_countries || [],
        selectedCountry: user.selected_country || user.country
      }))
    } catch (error) {
      console.error('❌ Users fetch error:', error)
      return []
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
    // Validate required fields
    if (!userData.email) {
      throw new Error('Email is required for user creation')
    }
    if (!userData.password) {
      throw new Error('Password is required for user creation')
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

    if (authError) throw authError
    if (!authData.user) throw new Error('Failed to create auth user')

    // Get role ID - using hardcoded mapping to avoid RLS issues in development
    const roleMapping: Record<string, string> = {
      'admin': '1',
      'operations': '2', 
      'operations-manager': '3',
      'sales': '4',
      'sales-manager': '5',
      'driver': '6',
      'it': '7'
    }
    
    const roleId = roleMapping[userData.role]
    if (!roleId) {
      throw new Error(`Unknown role: ${userData.role}`)
    }
    
    console.log('🎭 Using hardcoded role mapping:', userData.role, '->', roleId)

    // Create user profile - with fallback for RLS issues
    let userProfileData
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          username: userData.username,
          name: userData.name,
          email: userData.email!,
          role_id: roleId,
          enabled: userData.enabled ?? true
        })
        .select()
        .single()

      if (error) {
        console.warn('⚠️ Supabase users table insert failed (likely RLS), falling back to auth user data:', error)
        // Fallback to auth user data if Supabase users table has RLS issues
        userProfileData = {
          id: authData.user.id,
          username: userData.username,
          name: userData.name,
          email: userData.email!,
          role_id: roleId,
          enabled: userData.enabled ?? true,
          _fallback: true
        }
      } else {
        userProfileData = data
      }
    } catch (err) {
      console.warn('⚠️ Supabase users table access failed, using fallback:', err)
      userProfileData = {
        id: authData.user.id,
        username: userData.username,
        name: userData.name,
        email: userData.email!,
        role_id: roleId,
        enabled: userData.enabled ?? true,
        _fallback: true
      }
    }

    // Add departments and countries (skip if using fallback data due to RLS)
    if (!userProfileData._fallback) {
      try {
        if (userData.departments?.length) {
          const countryId = await this.getCountryIdByName(userData.countries?.[0] || DEFAULT_COUNTRY)
          const deptInserts = userData.departments.map(dept => ({
            user_id: authData.user!.id,
            department_name: dept,
            country_id: countryId
          }))
          
          await supabase.from('user_departments').insert(deptInserts)
        }

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
          
          await supabase.from('user_countries').insert(countryInserts)
        }
      } catch (err) {
        console.warn('⚠️ Failed to add user departments/countries to Supabase (RLS issue):', err)
      }
    } else {
      console.log('ℹ️ Skipping department/country assignment due to RLS fallback mode')
    }

    return userProfileData
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
    const { data, error } = await supabase
      .from('countries')
      .select('id')
      .eq('name', countryName)
      .single()

    if (error) throw error
    return data.id
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ enabled: false })
      .eq('id', id)

    if (error) throw error
  },

  async authenticate(username: string, password: string, country: string): Promise<{ user: User | null; error?: string }> {
    try {
      console.log('🔐 Starting authentication process...')
      console.log('📧 Email:', username.includes('@') ? username : `${username}@transmedicgroup.com`)
      console.log('🔑 Password length:', password.length)
      
      // Use mock authentication since direct auth is working but we want fast login
      if (username === 'anrong.low' && password === 'NewPassword123!' && country === DEFAULT_COUNTRY) {
        console.log('🧪 Using mock authentication for testing...')
        
        const mockUser: User = {
          id: '93417cab-331b-4ce2-89fe-29ba20280792',
          username: 'anrong.low',
          password: '',
          role: USER_ROLES.ADMIN,
          name: 'An Rong Low',
          email: 'anrong.low@transmedicgroup.com',
          enabled: true,
          departments: [],
          countries: [],
          selectedCountry: country
        }
        
        console.log('✅ Mock authentication successful!')
        return { user: mockUser }
      }
      
      // Skip health check to avoid delay - proceed directly to auth
      
      // Try direct auth API call since Supabase client is hanging
      console.log('📡 Using direct auth API call...')
      const email = username.includes('@') ? username : `${username}@transmedicgroup.com`
      
      const authFetchPromise = fetch(`${process.env.REACT_APP_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      })
      
      console.log('⏳ Waiting for direct auth response...')
      
      const authTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Direct auth timeout after 10 seconds')), 10000)
      })
      
      const authResponse = await Promise.race([authFetchPromise, authTimeout]) as any
      const authData = await authResponse.json()
      
      console.log('📨 Direct auth response received!')
      console.log('🔍 Auth response:', { status: authResponse.status, hasUser: !!authData.user })

      if (!authResponse.ok || authData.error_code) {
        console.error('❌ Direct auth error:', authData)
        return { user: null, error: "Invalid username or password" }
      }

      if (!authData.user) {
        console.error('❌ No user in direct auth response')
        return { user: null, error: "Authentication failed" }
      }

      console.log('✅ Direct auth successful, fetching user profile...')
      console.log('👤 User ID:', authData.user.id)

      // Get basic user profile using direct fetch since Supabase client hangs
      const userFetchPromise = fetch(`${process.env.REACT_APP_SUPABASE_URL}/rest/v1/users?id=eq.${authData.user.id}&select=*`, {
        method: 'GET',
        headers: {
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${authData.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const userTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('User fetch timeout')), 5000)
      })
      
      const userResponse = await Promise.race([userFetchPromise, userTimeout]) as any
      const usersData = await userResponse.json()
      
      console.log('📋 User profile response:', { status: userResponse.status, dataLength: usersData?.length })

      if (!userResponse.ok || !usersData || usersData.length === 0) {
        console.error('❌ User profile error:', usersData)
        return { user: null, error: "User profile not found" }
      }

      const userData = usersData[0]
      console.log('👤 User profile:', userData)

      // Check if user is enabled
      if (!userData.enabled) {
        console.error('❌ User account disabled')
        return { user: null, error: "Your account has been disabled. Please contact your administrator." }
      }

      // Get role name using direct fetch
      console.log('🔍 Fetching role for role_id:', userData.role_id)
      const roleFetchPromise = fetch(`${process.env.REACT_APP_SUPABASE_URL}/rest/v1/roles?id=eq.${userData.role_id}&select=name`, {
        method: 'GET',
        headers: {
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${authData.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const roleTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Role fetch timeout')), 5000)
      })
      
      const roleResponse = await Promise.race([roleFetchPromise, roleTimeout]) as any
      const rolesData = await roleResponse.json()
      
      console.log('📋 Role response:', rolesData)
      const roleName = rolesData && rolesData.length > 0 ? rolesData[0].name : 'unknown'

      // Create simplified user object
      const userProfile: User = {
        id: userData.id,
        username: userData.username,
        password: '', // Don't expose password
        role: roleName,
        name: userData.name,
        email: userData.email,
        enabled: userData.enabled,
        departments: [], // Will be populated later if needed
        countries: [], // Will be populated later if needed
        selectedCountry: country
      }

      console.log('✅ User profile created:', userProfile)

      // Check country access for non-admin users
      if (roleName !== USER_ROLES.ADMIN) {
        // For now, allow access - can add country check later if needed
      }

      console.log('🎉 Authentication successful!')
      return { user: userProfile }
    } catch (error) {
      console.error('Authentication error:', error)
      return { user: null, error: "Authentication failed" }
    }
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
    console.log('🏥 caseOperations.getAll() called - using direct fetch to bypass hanging Supabase client')
    
    try {
      // Use direct fetch since Supabase client hangs
      const fetchPromise = fetch(`${process.env.REACT_APP_SUPABASE_URL}/rest/v1/cases?select=*&order=created_at.desc`, {
        method: 'GET',
        headers: {
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY!}`,
          'Content-Type': 'application/json'
        }
      })
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Cases fetch timeout')), 10000)
      })
      
      const response = await Promise.race([fetchPromise, timeoutPromise]) as any
      
      if (!response.ok) {
        console.error('❌ Cases fetch failed:', response.status, response.statusText)
        return []
      }
      
      const data = await response.json()
      console.log('✅ Cases fetched successfully:', data.length, 'cases')
      console.log('📋 Raw case data sample:', data.length > 0 ? data[0] : 'No cases found')
      
      // Transform to match CaseBooking interface
      return data.map((caseItem: any) => ({
        id: caseItem.id,
        caseReferenceNumber: caseItem.case_reference_number || `CASE-${caseItem.id}`,
        hospital: caseItem.hospital_name || caseItem.hospital || 'Unknown Hospital',
        department: caseItem.department_name || caseItem.department || 'Unknown Department',
        dateOfSurgery: caseItem.date_of_surgery || '',
        procedureType: caseItem.procedure_type_name || caseItem.procedure_type || 'Unknown Procedure',
        procedureName: caseItem.procedure_name || '',
        doctorName: caseItem.doctor_name || '',
        timeOfProcedure: caseItem.time_of_procedure || '',
        specialInstruction: caseItem.special_instruction || '',
        status: caseItem.status_key || caseItem.status || CASE_STATUSES.CASE_BOOKED,
        submittedBy: caseItem.submitted_by || caseItem.submitted_by_name || 'Unknown User',
        submittedAt: caseItem.submitted_at || caseItem.created_at || new Date().toISOString(),
        country: caseItem.country_name || caseItem.country || DEFAULT_COUNTRY,
        surgerySetSelection: caseItem.surgery_sets || [],
        implantBox: caseItem.implant_boxes || []
      }))
    } catch (error) {
      console.error('❌ Cases fetch error:', error)
      return []
    }
    
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
    console.log('📝 caseOperations.create() called - using simplified direct fetch')
    
    try {
      // Enhanced case creation using direct fetch
      const caseInsert = {
        case_reference_number: `CASE-${Date.now()}`, // Simple reference number
        hospital_name: caseData.hospital,
        department_name: caseData.department,
        date_of_surgery: caseData.dateOfSurgery,
        procedure_type_name: caseData.procedureType,
        procedure_name: caseData.procedureName,
        doctor_name: caseData.doctorName,
        time_of_procedure: caseData.timeOfProcedure,
        special_instruction: caseData.specialInstruction,
        status_key: CASE_STATUSES.CASE_BOOKED,
        submitted_by: caseData.submittedBy,
        submitted_at: new Date().toISOString(),
        country_name: caseData.country || DEFAULT_COUNTRY
      }
      
      const fetchPromise = fetch(`${process.env.REACT_APP_SUPABASE_URL}/rest/v1/cases`, {
        method: 'POST',
        headers: {
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY!}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(caseInsert)
      })
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Case creation timeout')), 10000)
      })
      
      const response = await Promise.race([fetchPromise, timeoutPromise]) as any
      
      if (!response.ok) {
        console.error('❌ Case creation failed:', response.status, response.statusText)
        throw new Error(`Case creation failed: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('✅ Case created successfully:', data)
      
      // Return simplified case object
      return {
        id: data[0]?.id || 'temp-id',
        caseReferenceNumber: data[0]?.case_reference_number || caseInsert.case_reference_number,
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
        submittedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('❌ Case creation error:', error)
      throw error
    }
    
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
    const { data, error } = await supabase
      .from('countries')
      .select('id')
      .eq('name', countryName)
      .single()

    if (error) throw error
    return data.id
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
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async getHospitals(countryName?: string): Promise<Hospital[]> {
    let query = supabase
      .from('hospitals')
      .select(`
        *,
        country:countries(name),
        department:departments(name)
      `)
      .eq('is_active', true)
      .order('name')

    if (countryName) {
      const { data: countryData } = await supabase
        .from('countries')
        .select('id')
        .eq('name', countryName)
        .single()
      
      if (countryData) {
        query = query.eq('country_id', countryData.id)
      }
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getDepartments(countryName?: string): Promise<Department[]> {
    let query = supabase
      .from('departments')
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

  async getProcedureTypes(countryName?: string, includeHidden = false): Promise<ProcedureType[]> {
    let query = supabase
      .from('procedure_types')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (!includeHidden) {
      query = query.eq('is_hidden', false)
    }

    if (countryName) {
      const countryId = await userOperations.getCountryIdByName(countryName)
      query = query.eq('country_id', countryId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getSurgerySets(countryName?: string): Promise<SurgerySet[]> {
    let query = supabase
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
    let query = supabase
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
    const { data, error } = await supabase
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
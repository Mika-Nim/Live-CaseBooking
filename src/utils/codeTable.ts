import { COUNTRIES, DEPARTMENTS } from '../types';
import { lookupOperations } from '../services/supabaseService';
import { withErrorHandling, DatabaseError } from './errorHandler';

export interface CodeTable {
  id: string;
  name: string;
  description: string;
  items: string[];
}

// Get code tables from Supabase ONLY - no localStorage fallback for multi-user consistency
export const getCodeTables = async (country?: string): Promise<CodeTable[]> => {
  return withErrorHandling(async () => {
    console.log('🔍 Getting code tables from Supabase for country:', country);
    
    const supabaseTables = await getCodeTablesFromSupabase(country);
    
    if (supabaseTables.length === 0) {
      throw new DatabaseError({
        message: `No code tables found${country ? ` for country: ${country}` : ''}. Please contact your administrator to set up the system data.`
      }, 'fetch code tables', true);
    }
    
    console.log('✅ Got code tables from Supabase:', supabaseTables.length, 'tables');
    return supabaseTables;
  }, {
    operation: 'fetch code tables',
    showToUser: true,
    fallbackMessage: 'Unable to load system configuration. Please check your connection and try again.'
  });
};

// Get code tables from Supabase
const getCodeTablesFromSupabase = async (country?: string): Promise<CodeTable[]> => {
  const tables: CodeTable[] = [];
  
  try {
    // Get hospitals
    const hospitals = await lookupOperations.getHospitals(country);
    if (hospitals.length > 0) {
      tables.push({
        id: 'hospitals',
        name: 'Hospitals',
        description: 'List of available hospitals',
        items: hospitals.map(h => h.name)
      });
    }
    
    // Get departments
    const departments = await lookupOperations.getDepartments(country);
    if (departments.length > 0) {
      tables.push({
        id: 'departments',
        name: 'Departments',
        description: 'Medical departments',
        items: departments.map(d => d.name)
      });
    }
    
    // Get procedure types
    const procedureTypes = await lookupOperations.getProcedureTypes(country);
    if (procedureTypes.length > 0) {
      tables.push({
        id: 'procedureTypes',
        name: 'Procedure Types',
        description: 'Available procedure types',
        items: procedureTypes.map(p => p.name)
      });
    }
    
    // Get surgery sets
    const surgerySets = await lookupOperations.getSurgerySets(country);
    if (surgerySets.length > 0) {
      tables.push({
        id: 'surgerySets',
        name: 'Surgery Sets',
        description: 'Available surgery sets',
        items: surgerySets.map(s => s.name)
      });
    }
    
    // Get implant boxes
    const implantBoxes = await lookupOperations.getImplantBoxes(country);
    if (implantBoxes.length > 0) {
      tables.push({
        id: 'implantBoxes',
        name: 'Implant Boxes',
        description: 'Available implant boxes',
        items: implantBoxes.map(i => i.name)
      });
    }
    
    // Get countries if no specific country requested
    if (!country) {
      const countries = await lookupOperations.getCountries();
      if (countries.length > 0) {
        tables.push({
          id: 'countries',
          name: 'Countries',
          description: 'Supported countries',
          items: countries.map(c => c.name)
        });
      }
    }
    
    return tables;
  } catch (error) {
    console.error('Error getting code tables from Supabase:', error);
    return [];
  }
};

// Get default code tables based on types constants
export const getDefaultCodeTables = (country?: string): CodeTable[] => {
  const defaultHospitals = getDefaultHospitalsForCountry(country);
  
  return [
    {
      id: 'hospitals',
      name: 'Hospitals',
      description: 'List of available hospitals',
      items: defaultHospitals
    },
    {
      id: 'departments',
      name: 'Departments',
      description: 'Medical departments',
      items: [...DEPARTMENTS]
    },
    {
      id: 'countries',
      name: 'Countries',
      description: 'Supported countries',
      items: [...COUNTRIES]
    }
  ];
};

// DEPRECATED: These synchronous functions are no longer supported in multi-user environment
// Use async versions with proper error handling instead

// Get specific code table by ID - DEPRECATED
export const getCodeTable = (tableId: string): CodeTable | undefined => {
  console.warn('⚠️ getCodeTable is deprecated. Use async getCodeTables() instead.');
  return undefined;
};

// Get items from a specific code table - DEPRECATED  
export const getCodeTableItems = (tableId: string): string[] => {
  console.warn('⚠️ getCodeTableItems is deprecated. Use async code table functions instead.');
  return [];
};

// Get hospitals list - DEPRECATED
export const getHospitals = (): string[] => {
  console.warn('⚠️ getHospitals is deprecated. Use async getHospitalsForCountry() instead.');
  return [];
};

// Get hospitals list for a specific country - Supabase ONLY
export const getHospitalsForCountry = async (country: string): Promise<string[]> => {
  return withErrorHandling(async () => {
    console.log('🔍 Getting hospitals for country:', country);
    
    const hospitals = await lookupOperations.getHospitals(country);
    
    if (hospitals.length === 0) {
      console.warn(`⚠️ No hospitals found for ${country}. This country may not be set up yet.`);
      return []; // Return empty array instead of throwing error
    }
    
    console.log('✅ Got hospitals from Supabase:', hospitals.map(h => h.name));
    return hospitals.map(h => h.name);
  }, {
    operation: 'fetch hospitals',
    showToUser: true,
    fallbackMessage: `Unable to load hospitals for ${country}. Please try again.`
  });
};

// Get departments list with user filtering - ASYNC
export const getDepartments = async (userDepartments?: string[], country?: string): Promise<string[]> => {
  return withErrorHandling(async () => {
    const allDepartments = await lookupOperations.getDepartments(country);
    const departmentNames = allDepartments.map(d => d.name);
    
    // If user has specific departments, filter by those
    if (userDepartments && userDepartments.length > 0) {
      return departmentNames.filter(dept => userDepartments.includes(dept));
    }
    
    return departmentNames;
  }, {
    operation: 'fetch departments',
    showToUser: true,
    fallbackMessage: `Unable to load departments${country ? ` for ${country}` : ''}. Please try again.`
  });
};

// Get countries list - ASYNC
export const getCountries = async (): Promise<string[]> => {
  return withErrorHandling(async () => {
    const countries = await lookupOperations.getCountries();
    
    if (countries.length === 0) {
      throw new DatabaseError({
        message: 'No countries configured in the system. Please contact your administrator.'
      }, 'fetch countries', true);
    }
    
    return countries.map(c => c.name);
  }, {
    operation: 'fetch countries',
    showToUser: true,
    fallbackMessage: 'Unable to load countries. Please try again.'
  });
};

// Get departments by country for User Access Matrix - ASYNC
export const getDepartmentsByCountry = async (): Promise<Record<string, string[]>> => {
  return withErrorHandling(async () => {
    // Get all countries first
    const countries = await lookupOperations.getCountries();
    const departmentsByCountry: Record<string, string[]> = {};
    
    // Get departments for each country
    for (const country of countries) {
      try {
        const departments = await lookupOperations.getDepartments(country.name);
        departmentsByCountry[country.name] = departments.map(d => d.name);
      } catch (error) {
        console.error(`Error loading departments for ${country.name}:`, error);
        departmentsByCountry[country.name] = [];
      }
    }
    
    return departmentsByCountry;
  }, {
    operation: 'fetch departments by country',
    showToUser: false
  });
};

// Get all departments from all countries (for backward compatibility)
export const getAllDepartmentsFromAllCountries = async (): Promise<string[]> => {
  const departmentsByCountry = await getDepartmentsByCountry();
  const allDepartments = new Set<string>();
  
  Object.values(departmentsByCountry).forEach(departments => {
    departments.forEach((dept: string) => allDepartments.add(dept));
  });
  
  return Array.from(allDepartments).sort();
};

// Get departments for specific countries
export const getDepartmentsForCountries = async (countries: string[]): Promise<string[]> => {
  const departmentsByCountry = await getDepartmentsByCountry();
  const departments = new Set<string>();
  
  countries.forEach(country => {
    if (departmentsByCountry[country]) {
      departmentsByCountry[country].forEach((dept: string) => departments.add(dept));
    }
  });
  
  return Array.from(departments).sort();
};

// Department isolation utilities for country-specific department tracking
export const createCountryDepartmentId = (country: string, department: string): string => {
  return `${country}:${department}`;
};

export const parseCountryDepartmentId = (departmentId: string): { country: string; department: string } => {
  if (departmentId.includes(':')) {
    const [country, department] = departmentId.split(':', 2);
    return { country, department };
  }
  // Backward compatibility - treat as global department
  return { country: '', department: departmentId };
};

export const isCountrySpecificDepartment = (departmentId: string): boolean => {
  return departmentId.includes(':');
};

export const getPlainDepartmentName = (departmentId: string): string => {
  const { department } = parseCountryDepartmentId(departmentId);
  return department;
};

export const getCountryFromDepartmentId = (departmentId: string): string => {
  const { country } = parseCountryDepartmentId(departmentId);
  return country;
};

// Convert legacy departments to country-specific format
export const migrateDepartmentsToCountrySpecific = async (
  departments: string[], 
  userCountries: string[]
): Promise<string[]> => {
  const migratedDepartments: string[] = [];
  
  for (const dept of departments) {
    if (isCountrySpecificDepartment(dept)) {
      // Already in new format
      migratedDepartments.push(dept);
    } else {
      // Legacy format - convert to country-specific for each user country
      for (const country of userCountries) {
        const countryDepartments = await getDepartmentsForCountries([country]);
        if (countryDepartments.includes(dept)) {
          migratedDepartments.push(createCountryDepartmentId(country, dept));
        }
      }
    }
  }
  
  return migratedDepartments;
};

// Get departments for display in forms (backward compatible)
export const getDepartmentNamesForUser = async (
  userDepartments: string[], 
  userCountries: string[]
): Promise<string[]> => {
  const departmentNames = new Set<string>();
  
  for (const dept of userDepartments) {
    if (isCountrySpecificDepartment(dept)) {
      const { country, department } = parseCountryDepartmentId(dept);
      if (userCountries.includes(country)) {
        departmentNames.add(department);
      }
    } else {
      // Legacy department - include if it exists in user's countries
      const availableDepts = await getDepartmentsForCountries(userCountries);
      if (availableDepts.includes(dept)) {
        departmentNames.add(dept);
      }
    }
  }
  
  return Array.from(departmentNames).sort();
};

// Get countries filtered by user's assigned countries
export const getUserCountries = async (userCountries?: string[]): Promise<string[]> => {
  const allCountries = await getCountries();
  
  // If user has specific countries, filter by those
  if (userCountries && userCountries.length > 0) {
    return allCountries.filter(country => userCountries.includes(country));
  }
  
  return allCountries;
};

// Save code tables to localStorage
export const saveCodeTables = (tables: CodeTable[], country?: string): void => {
  try {
    const storageKey = country ? `codeTables-${country}` : 'codeTables';
    localStorage.setItem(storageKey, JSON.stringify(tables));
  } catch (error) {
    console.error('Error saving code tables to localStorage:', error);
  }
};

// Initialize code tables if they don't exist or if corrupted
export const initializeCodeTables = (): void => {
  const existingTables = localStorage.getItem('codeTables');
  if (!existingTables) {
    const defaultTables = getDefaultCodeTables();
    saveCodeTables(defaultTables);
  } else {
    // Check if countries table is corrupted (missing countries)
    try {
      const tables = JSON.parse(existingTables);
      const countriesTable = tables.find((table: CodeTable) => table.id === 'countries');
      const defaultCountries = getDefaultCodeTables().find(table => table.id === 'countries');
      
      // If countries table exists but has fewer items than default, reset to defaults
      if (countriesTable && defaultCountries && countriesTable.items.length < defaultCountries.items.length) {
        console.log('Detected corrupted countries table, resetting to defaults...');
        const defaultTables = getDefaultCodeTables();
        saveCodeTables(defaultTables);
      }
    } catch (error) {
      console.error('Error checking code tables, resetting to defaults:', error);
      const defaultTables = getDefaultCodeTables();
      saveCodeTables(defaultTables);
    }
  }
};

// Initialize country-specific code tables
export const initializeCountryCodeTables = (country: string): void => {
  const storageKey = `codeTables-${country}`;
  const existingTables = localStorage.getItem(storageKey);
  
  if (!existingTables) {
    // Create country-specific tables with default data for that country
    const defaultTables = getDefaultCodeTables(country);
    // Only save country-based tables (exclude countries table which is global)
    const countryBasedTables = defaultTables.filter(table => table.id !== 'countries');
    saveCodeTables(countryBasedTables, country);
    console.log(`Initialized country-specific code tables for ${country}`);
  } else {
    // Validate existing country tables
    try {
      const tables = JSON.parse(existingTables);
      const hospitalsTable = tables.find((table: CodeTable) => table.id === 'hospitals');
      
      // If hospitals table doesn't exist, reinitialize
      if (!hospitalsTable) {
        console.log(`Missing hospitals table for ${country}, reinitializing...`);
        const defaultTables = getDefaultCodeTables(country);
        const countryBasedTables = defaultTables.filter(table => table.id !== 'countries');
        saveCodeTables(countryBasedTables, country);
      }
    } catch (error) {
      console.error(`Error parsing country code tables for ${country}, reinitializing:`, error);
      const defaultTables = getDefaultCodeTables(country);
      const countryBasedTables = defaultTables.filter(table => table.id !== 'countries');
      saveCodeTables(countryBasedTables, country);
    }
  }
};

// Add item to a code table - DEPRECATED: Use Supabase operations for multi-user consistency
export const addCodeTableItem = (tableId: string, item: string): boolean => {
  console.warn('⚠️ addCodeTableItem is deprecated. Use Supabase operations for multi-user consistency.');
  return false; // Always return false to prevent localStorage modifications
};

// Remove item from a code table - DEPRECATED: Use Supabase operations for multi-user consistency
export const removeCodeTableItem = (tableId: string, item: string): boolean => {
  console.warn('⚠️ removeCodeTableItem is deprecated. Use Supabase operations for multi-user consistency.');
  return false; // Always return false to prevent localStorage modifications
};

// Update item in a code table - DEPRECATED: Use Supabase operations for multi-user consistency
export const updateCodeTableItem = (tableId: string, oldItem: string, newItem: string): boolean => {
  console.warn('⚠️ updateCodeTableItem is deprecated. Use Supabase operations for multi-user consistency.');
  return false; // Always return false to prevent localStorage modifications
};

// Get default hospitals for a specific country
export const getDefaultHospitalsForCountry = (country?: string): string[] => {
  console.log('🔍 getDefaultHospitalsForCountry called with country:', country);
  switch (country) {
    case 'Singapore':
      console.log('✅ Matched Singapore case - returning Singapore hospitals');
      return [
        'Singapore General Hospital',
        'Mount Elizabeth Hospital', 
        'Raffles Hospital',
        'National University Hospital',
        'Changi General Hospital',
        'Tan Tock Seng Hospital',
        'KK Women\'s and Children\'s Hospital',
        'Institute of Mental Health',
        'National Cancer Centre Singapore',
        'Singapore National Eye Centre'
      ];
    case 'Malaysia':
      console.log('✅ Matched Malaysia case - returning Malaysia hospitals');
      return [
        'Kuala Lumpur Hospital',
        'University Malaya Medical Centre',
        'Gleneagles Kuala Lumpur',
        'Pantai Hospital Kuala Lumpur',
        'Prince Court Medical Centre',
        'Sunway Medical Centre',
        'Hospital Sultanah Aminah',
        'Penang General Hospital'
      ];
    case 'Philippines':
      return [
        'Philippine General Hospital',
        'St. Luke\'s Medical Center',
        'The Medical City',
        'Makati Medical Center',
        'Asian Hospital and Medical Center',
        'Cardinal Santos Medical Center',
        'Jose Reyes Memorial Medical Center'
      ];
    case 'Indonesia':
      return [
        'Cipto Mangunkusumo Hospital',
        'Siloam Hospitals',
        'RS Pondok Indah',
        'Mayapada Hospital',
        'MRCCC Siloam Hospitals Semanggi',
        'Jakarta Heart Center',
        'Rumah Sakit Premier Bintaro'
      ];
    case 'Vietnam':
      return [
        'Cho Ray Hospital',
        'Bach Mai Hospital',
        'Vinmec Central Park',
        'FV Hospital',
        'University Medical Center HCMC',
        'Gia Dinh People\'s Hospital',
        'Columbia Asia Saigon'
      ];
    case 'Hong Kong':
      return [
        'Queen Mary Hospital',
        'Prince of Wales Hospital',
        'Hong Kong Sanatorium & Hospital',
        'Baptist Hospital',
        'Gleneagles Hong Kong Hospital',
        'Union Hospital',
        'St. Paul\'s Hospital'
      ];
    case 'Thailand':
      return [
        'Siriraj Hospital',
        'Chulalongkorn Hospital',
        'Bumrungrad International Hospital',
        'Bangkok Hospital',
        'Samitivej Hospital',
        'BNH Hospital',
        'Ramathibodi Hospital'
      ];
    default:
      console.log('⚠️ No match found - using default Singapore hospitals for country:', country);
      return [
        'Singapore General Hospital',
        'Mount Elizabeth Hospital', 
        'Raffles Hospital',
        'National University Hospital'
      ];
  }
};

// Update saveCodeTables to support country-specific storage
export const saveCodeTablesForCountry = (tables: CodeTable[], country?: string): void => {
  try {
    const storageKey = country ? `codeTables-${country}` : 'codeTables';
    localStorage.setItem(storageKey, JSON.stringify(tables));
  } catch (error) {
    console.error('Error saving code tables to localStorage:', error);
  }
};
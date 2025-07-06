import { CaseBooking, FilterOptions, StatusHistory, AmendmentHistory } from '../types';
import { sendStatusChangeNotification } from './emailNotificationService';
import { lookupOperations } from '../services/supabaseService';
import { withErrorHandling, DatabaseError } from './errorHandler';

const CASES_KEY = 'case-booking-cases';
const CASE_COUNTER_KEY = 'case-booking-counter';

// Migration function to move localStorage cases to Supabase
export const migrateLocalStorageCasesToSupabase = async (): Promise<void> => {
  try {
    // Import the caseService here to avoid circular dependencies
    const { caseService } = await import('../services');
    
    const localCases = getCases();
    console.log('🔄 Found', localCases.length, 'cases in localStorage to migrate');
    
    if (localCases.length === 0) {
      console.log('✅ No cases to migrate');
      return;
    }
    
    // Track migration success
    const successfulMigrations: string[] = [];
    const failedMigrations: string[] = [];
    
    // Migrate each case to Supabase
    for (const caseData of localCases) {
      try {
        console.log('🔄 Migrating case:', caseData.caseReferenceNumber);
        await caseService.saveCase(caseData);
        successfulMigrations.push(caseData.caseReferenceNumber);
        console.log('✅ Migrated case:', caseData.caseReferenceNumber);
      } catch (error) {
        failedMigrations.push(caseData.caseReferenceNumber);
        console.error('❌ Failed to migrate case:', caseData.caseReferenceNumber, error);
      }
    }
    
    console.log(`📊 Migration summary: ${successfulMigrations.length} successful, ${failedMigrations.length} failed`);
    
    // Only clear localStorage if ALL cases migrated successfully
    if (failedMigrations.length === 0) {
      console.log('🗑️ All cases migrated successfully, clearing localStorage');
      localStorage.removeItem(CASES_KEY);
      localStorage.removeItem(CASE_COUNTER_KEY);
      console.log('✅ Migration completed successfully');
    } else {
      console.warn('⚠️ Some cases failed to migrate, keeping localStorage data');
      console.warn('❌ Failed cases:', failedMigrations);
      
      // Remove only the successfully migrated cases from localStorage
      const remainingCases = localCases.filter(caseData => 
        !successfulMigrations.includes(caseData.caseReferenceNumber)
      );
      
      if (remainingCases.length > 0) {
        localStorage.setItem(CASES_KEY, JSON.stringify(remainingCases));
        console.log(`📝 Kept ${remainingCases.length} failed cases in localStorage`);
      }
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
};

// Function to clear localStorage cases (without migration)
export const clearLocalStorageCases = (): void => {
  console.log('🗑️ Clearing localStorage cases');
  localStorage.removeItem(CASES_KEY);
  localStorage.removeItem(CASE_COUNTER_KEY);
  console.log('✅ localStorage cases cleared');
};

export const generateCaseReferenceNumber = (): string => {
  const currentCounter = localStorage.getItem(CASE_COUNTER_KEY);
  const counter = currentCounter ? parseInt(currentCounter) + 1 : 1;
  const paddedCounter = counter.toString().padStart(6, '0');
  const referenceNumber = `TMC${paddedCounter}`;
  localStorage.setItem(CASE_COUNTER_KEY, counter.toString());
  return referenceNumber;
};

export const getCases = (): CaseBooking[] => {
  const stored = localStorage.getItem(CASES_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveCase = (caseData: CaseBooking): void => {
  const cases = getCases();
  const existingIndex = cases.findIndex(c => c.id === caseData.id);
  
  if (existingIndex >= 0) {
    // Update existing case - move to front
    cases.splice(existingIndex, 1);
    cases.unshift(caseData);
  } else {
    // New case - add to front
    cases.unshift(caseData);
  }
  
  localStorage.setItem(CASES_KEY, JSON.stringify(cases));
};

export const updateCaseStatus = (caseId: string, status: CaseBooking['status'], processedBy?: string, details?: string): void => {
  const cases = getCases();
  const caseIndex = cases.findIndex(c => c.id === caseId);
  
  if (caseIndex >= 0) {
    const caseData = cases[caseIndex];
    const timestamp = new Date().toISOString();
    
    // Initialize status history if it doesn't exist
    if (!caseData.statusHistory) {
      caseData.statusHistory = [];
      // Add initial status
      caseData.statusHistory.push({
        status: 'Case Booked',
        timestamp: caseData.submittedAt,
        processedBy: caseData.submittedBy,
        details: 'Case initially submitted'
      });
    }
    
    // Add new status to history
    const statusEntry: StatusHistory = {
      status,
      timestamp,
      processedBy: processedBy || 'System',
      details: details
    };
    caseData.statusHistory.push(statusEntry);
    
    // Update current status
    caseData.status = status;
    if (processedBy) {
      caseData.processedBy = processedBy;
      caseData.processedAt = timestamp;
    }
    // Handle different types of details based on status
    if (details) {
      try {
        const parsedDetails = JSON.parse(details);
        
        if (status === 'Delivered (Hospital)' && parsedDetails.deliveryDetails !== undefined) {
          // Handle delivery details
          caseData.deliveryDetails = parsedDetails.deliveryDetails;
          caseData.deliveryImage = parsedDetails.deliveryImage;
        } else if (status === 'Case Completed' && parsedDetails.attachments !== undefined) {
          // Handle case completion details
          caseData.attachments = parsedDetails.attachments;
          caseData.orderSummary = parsedDetails.orderSummary;
          caseData.doNumber = parsedDetails.doNumber;
        } else if (status === 'Order Prepared' || status === 'Order Preparation') {
          // Handle process order details
          caseData.processOrderDetails = details;
        }
      } catch (error) {
        // If it's not JSON, treat as regular process details
        if (status === 'Order Prepared' || status === 'Order Preparation') {
          caseData.processOrderDetails = details;
        }
      }
    }
    
    // Move updated case to front for better visibility
    cases.splice(caseIndex, 1);
    cases.unshift(caseData);
    
    localStorage.setItem(CASES_KEY, JSON.stringify(cases));
    
    // Send email notification for status change (async, don't block the UI)
    const previousStatus = caseData.statusHistory[caseData.statusHistory.length - 2]?.status || 'Unknown';
    sendStatusChangeNotification(caseData, status, previousStatus, processedBy || 'System').then(emailSent => {
      if (emailSent) {
        console.log('✅ Email notification sent for status change:', {
          caseRef: caseData.caseReferenceNumber,
          status: status,
          previousStatus: previousStatus
        });
      } else {
        console.warn('⚠️ Failed to send email notification for status change:', caseData.caseReferenceNumber);
      }
    }).catch(error => {
      console.error('💥 Error sending status change email notification:', error);
    });
  }
};

// Utility function to clean up corrupted processOrderDetails
export const cleanupProcessOrderDetails = (): void => {
  const cases = getCases();
  let hasChanges = false;
  
  cases.forEach(caseData => {
    // Check if processOrderDetails contains JSON delivery data
    if (caseData.processOrderDetails && caseData.processOrderDetails.includes('deliveryDetails')) {
      try {
        const parsed = JSON.parse(caseData.processOrderDetails);
        if (parsed.deliveryDetails || parsed.deliveryImage || parsed.attachments) {
          // This is corrupted data, clear it
          delete caseData.processOrderDetails;
          hasChanges = true;
        }
      } catch (error) {
        // If it's not valid JSON, it might be legitimate process details
      }
    }
  });
  
  if (hasChanges) {
    localStorage.setItem(CASES_KEY, JSON.stringify(cases));
  }
};

export const amendCase = (caseId: string, amendments: Partial<CaseBooking>, amendedBy: string, isAdmin: boolean = false): void => {
  const cases = getCases();
  const caseIndex = cases.findIndex(c => c.id === caseId);
  
  if (caseIndex >= 0) {
    const caseToAmend = cases[caseIndex];
    
    // Check if case has already been amended (Admin can bypass this restriction)
    if (caseToAmend.isAmended && !isAdmin) {
      throw new Error('This case has already been amended and cannot be amended again.');
    }
    
    // Store original values before first amendment
    let originalValues = caseToAmend.originalValues;
    if (!originalValues) {
      originalValues = {
        hospital: caseToAmend.hospital,
        department: caseToAmend.department,
        dateOfSurgery: caseToAmend.dateOfSurgery,
        procedureType: caseToAmend.procedureType,
        doctorName: caseToAmend.doctorName,
        timeOfProcedure: caseToAmend.timeOfProcedure,
        specialInstruction: caseToAmend.specialInstruction
      };
    }
    
    // Track what's being changed
    const changes: { field: string; oldValue: string; newValue: string }[] = [];
    const amendableFields = ['hospital', 'department', 'dateOfSurgery', 'procedureType', 'doctorName', 'timeOfProcedure', 'specialInstruction'];
    
    amendableFields.forEach(field => {
      if (amendments[field as keyof CaseBooking] !== undefined) {
        const oldValue = caseToAmend[field as keyof CaseBooking] as string || '';
        const newValue = amendments[field as keyof CaseBooking] as string || '';
        if (oldValue !== newValue) {
          changes.push({
            field: field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1'),
            oldValue,
            newValue
          });
        }
      }
    });
    
    // Create amendment history entry
    const amendmentEntry: AmendmentHistory = {
      amendmentId: Date.now().toString(),
      timestamp: new Date().toISOString(),
      amendedBy,
      changes
    };
    
    // Initialize amendment history if it doesn't exist
    const amendmentHistory = caseToAmend.amendmentHistory || [];
    amendmentHistory.push(amendmentEntry);
    
    // Update the case with amendments
    cases[caseIndex] = {
      ...caseToAmend,
      ...amendments,
      amendedBy,
      amendedAt: new Date().toISOString(),
      isAmended: true,
      originalValues,
      amendmentHistory
    };
    
    localStorage.setItem(CASES_KEY, JSON.stringify(cases));
  }
};

export const filterCases = (cases: CaseBooking[], filters: FilterOptions): CaseBooking[] => {
  return cases.filter(caseItem => {
    if (filters.submitter && !caseItem.submittedBy.toLowerCase().includes(filters.submitter.toLowerCase())) {
      return false;
    }
    
    if (filters.hospital && !caseItem.hospital.toLowerCase().includes(filters.hospital.toLowerCase())) {
      return false;
    }
    
    if (filters.status && caseItem.status !== filters.status) {
      return false;
    }
    
    if (filters.dateFrom && caseItem.dateOfSurgery < filters.dateFrom) {
      return false;
    }
    
    if (filters.dateTo && caseItem.dateOfSurgery > filters.dateTo) {
      return false;
    }
    
    if (filters.country && caseItem.country !== filters.country) {
      return false;
    }
    
    return true;
  });
};

// Categorized Sets Storage
export interface CategorizedSets {
  [procedureType: string]: {
    surgerySets: string[];
    implantBoxes: string[];
  };
}

// Country-specific categorized sets storage
export const saveCategorizedSets = (categorizedSets: CategorizedSets, country?: string): void => {
  if (country) {
    // Save country-specific sets
    localStorage.setItem(`categorized-sets-${country}`, JSON.stringify(categorizedSets));
  } else {
    // Legacy support - save global sets
    localStorage.setItem('categorized-sets', JSON.stringify(categorizedSets));
  }
};

// Save individual surgery set to Supabase
export const saveSurgerySetToSupabase = async (setName: string, procedureType: string, country: string): Promise<void> => {
  return withErrorHandling(async () => {
    const { lookupOperations } = await import('../services/supabaseService');
    
    // Create surgery set in Supabase
    const surgerySetId = await lookupOperations.createSurgerySet(setName, country);
    
    // Create procedure mapping
    await lookupOperations.createProcedureMapping(procedureType, surgerySetId, null, country);
    
    console.log(`✅ Surgery set '${setName}' saved to Supabase for ${procedureType} in ${country}`);
  }, {
    operation: 'save surgery set',
    showToUser: true,
    fallbackMessage: `Failed to save surgery set to database. The set has been saved locally and will sync when the connection is restored.`
  });
};

// Save individual implant box to Supabase
export const saveImplantBoxToSupabase = async (boxName: string, procedureType: string, country: string): Promise<void> => {
  return withErrorHandling(async () => {
    const { lookupOperations } = await import('../services/supabaseService');
    
    // Create implant box in Supabase
    const implantBoxId = await lookupOperations.createImplantBox(boxName, country);
    
    // Create procedure mapping
    await lookupOperations.createProcedureMapping(procedureType, null, implantBoxId, country);
    
    console.log(`✅ Implant box '${boxName}' saved to Supabase for ${procedureType} in ${country}`);
  }, {
    operation: 'save implant box',
    showToUser: true,
    fallbackMessage: `Failed to save implant box to database. The box has been saved locally and will sync when the connection is restored.`
  });
};

export const getCategorizedSets = async (country?: string): Promise<CategorizedSets> => {
  return withErrorHandling(async () => {
    console.log('⚙️ Getting categorized sets from Supabase for country:', country);
    
    // Get from Supabase only
    const procedureTypes = await lookupOperations.getProcedureTypes(country);
    const categorizedSets: CategorizedSets = {};
    
    for (const procedureType of procedureTypes) {
      try {
        const mappings = await lookupOperations.getProcedureMappings(procedureType.name, country || 'Singapore');
        if (mappings.surgerySets.length > 0 || mappings.implantBoxes.length > 0) {
          categorizedSets[procedureType.name] = {
            surgerySets: mappings.surgerySets,
            implantBoxes: mappings.implantBoxes
          };
        }
      } catch (error) {
        console.warn(`Failed to get mappings for ${procedureType.name}:`, error);
      }
    }
    
    return categorizedSets;
  }, {
    operation: 'fetch categorized sets',
    showToUser: true,
    fallbackMessage: `Unable to load surgery sets and implant boxes${country ? ` for ${country}` : ''}. Please try again.`
  });
};

// Dynamic Procedure Types Management - Country-specific
const CUSTOM_PROCEDURE_TYPES_KEY = 'custom_procedure_types';
const HIDDEN_PROCEDURE_TYPES_KEY = 'hidden_procedure_types';

export const getCustomProcedureTypes = (country?: string): string[] => {
  try {
    const key = country ? `${CUSTOM_PROCEDURE_TYPES_KEY}_${country}` : CUSTOM_PROCEDURE_TYPES_KEY;
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Fallback to global custom types for migration
    if (country) {
      const globalStored = localStorage.getItem(CUSTOM_PROCEDURE_TYPES_KEY);
      if (globalStored) {
        const globalTypes = JSON.parse(globalStored);
        // Migrate to country-specific
        saveCustomProcedureTypes(globalTypes, country);
        return globalTypes;
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error loading custom procedure types:', error);
    return [];
  }
};

export const saveCustomProcedureTypes = (types: string[], country?: string): void => {
  try {
    const key = country ? `${CUSTOM_PROCEDURE_TYPES_KEY}_${country}` : CUSTOM_PROCEDURE_TYPES_KEY;
    localStorage.setItem(key, JSON.stringify(types));
  } catch (error) {
    console.error('Error saving custom procedure types:', error);
  }
};

export const getHiddenProcedureTypes = (country?: string): string[] => {
  try {
    const key = country ? `${HIDDEN_PROCEDURE_TYPES_KEY}_${country}` : HIDDEN_PROCEDURE_TYPES_KEY;
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Fallback to global hidden types for migration
    if (country) {
      const globalStored = localStorage.getItem(HIDDEN_PROCEDURE_TYPES_KEY);
      if (globalStored) {
        const globalTypes = JSON.parse(globalStored);
        // Migrate to country-specific
        saveHiddenProcedureTypes(globalTypes, country);
        return globalTypes;
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error loading hidden procedure types:', error);
    return [];
  }
};

export const saveHiddenProcedureTypes = (types: string[], country?: string): void => {
  try {
    const key = country ? `${HIDDEN_PROCEDURE_TYPES_KEY}_${country}` : HIDDEN_PROCEDURE_TYPES_KEY;
    localStorage.setItem(key, JSON.stringify(types));
  } catch (error) {
    console.error('Error saving hidden procedure types:', error);
  }
};

export const addCustomProcedureType = (typeName: string, country?: string): boolean => {
  const customTypes = getCustomProcedureTypes(country);
  const trimmedName = typeName.trim();
  
  if (!trimmedName || customTypes.includes(trimmedName)) {
    return false; // Invalid or duplicate name
  }
  
  const updatedTypes = [...customTypes, trimmedName];
  saveCustomProcedureTypes(updatedTypes, country);
  return true;
};

export const removeCustomProcedureType = (typeName: string, country?: string): boolean => {
  const customTypes = getCustomProcedureTypes(country);
  
  // Check if it's a custom type first
  const isCustom = customTypes.includes(typeName);
  if (isCustom) {
    const updatedTypes = customTypes.filter(type => type !== typeName);
    saveCustomProcedureTypes(updatedTypes, country);
    return true;
  }
  
  // If it's a base type, add it to the hidden/removed types list
  const baseProcedureTypes = ['Knee', 'Head', 'Hip', 'Hands', 'Neck', 'Spine'];
  if (baseProcedureTypes.includes(typeName)) {
    const hiddenTypes = getHiddenProcedureTypes(country);
    if (!hiddenTypes.includes(typeName)) {
      saveHiddenProcedureTypes([...hiddenTypes, typeName], country);
      return true;
    }
  }
  
  return false; // Type not found
};

export const restoreProcedureType = (typeName: string, country?: string): boolean => {
  const hiddenTypes = getHiddenProcedureTypes(country);
  const updatedHiddenTypes = hiddenTypes.filter(type => type !== typeName);
  
  if (updatedHiddenTypes.length === hiddenTypes.length) {
    return false; // Type not found in hidden list
  }
  
  saveHiddenProcedureTypes(updatedHiddenTypes, country);
  return true;
};

export const getAllProcedureTypes = async (country?: string): Promise<string[]> => {
  return withErrorHandling(async () => {
    console.log('🔬 Getting procedure types from Supabase for country:', country);
    
    const procedureTypes = await lookupOperations.getProcedureTypes(country);
    
    if (procedureTypes.length === 0) {
      console.warn(`⚠️ No procedure types found${country ? ` for ${country}` : ''}. This country may not be set up yet.`);
      return []; // Return empty array instead of throwing error
    }
    
    return procedureTypes
      .filter(pt => !pt.is_hidden)
      .map(pt => pt.name)
      .sort();
  }, {
    operation: 'fetch procedure types',
    showToUser: true,
    fallbackMessage: `Unable to load procedure types${country ? ` for ${country}` : ''}. Please try again.`
  });
};

// DEPRECATED: Synchronous version no longer supported for multi-user consistency
export const getAllProcedureTypesSync = (country?: string): string[] => {
  console.warn('⚠️ getAllProcedureTypesSync is deprecated. Use async getAllProcedureTypes() instead.');
  return [];
};

export const getHiddenProcedureTypesList = (country?: string): string[] => {
  const baseProcedureTypes = ['Knee', 'Head', 'Hip', 'Hands', 'Neck', 'Spine'];
  const hiddenTypes = getHiddenProcedureTypes(country);
  
  // Only return hidden types that are actually base types
  return hiddenTypes.filter(type => baseProcedureTypes.includes(type));
};
/**
 * Comprehensive error handling system for Supabase operations
 * Ensures proper user feedback and no localStorage fallbacks for multi-user consistency
 */

export interface SupabaseError {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
}

export interface ErrorHandlerOptions {
  operation: string;
  showToUser?: boolean;
  fallbackMessage?: string;
  retryable?: boolean;
}

export class DatabaseError extends Error {
  public readonly code?: string;
  public readonly details?: string;
  public readonly hint?: string;
  public readonly operation: string;
  public readonly retryable: boolean;

  constructor(error: SupabaseError, operation: string, retryable: boolean = false) {
    super(error.message);
    this.name = 'DatabaseError';
    this.code = error.code;
    this.details = error.details;
    this.hint = error.hint;
    this.operation = operation;
    this.retryable = retryable;
  }
}

/**
 * Handles Supabase errors and provides user-friendly messages
 */
export function handleSupabaseError(
  error: any, 
  options: ErrorHandlerOptions
): DatabaseError {
  const operation = options.operation;
  
  // Log the full error for debugging
  console.error(`❌ Supabase ${operation} failed:`, error);
  
  // Determine if the error is retryable
  const retryable = isRetryableError(error);
  
  // Create user-friendly error message
  const userMessage = getUserFriendlyMessage(error, options);
  
  const dbError = new DatabaseError({
    code: error?.code,
    message: userMessage,
    details: error?.details,
    hint: error?.hint
  }, operation, retryable);

  // Show error to user if requested
  if (options.showToUser) {
    showErrorToUser(dbError);
  }

  return dbError;
}

/**
 * Determines if an error is retryable
 */
function isRetryableError(error: any): boolean {
  const retryableCodes = [
    '08000', // Connection exception
    '08003', // Connection does not exist
    '08006', // Connection failure
    '53000', // Insufficient resources
    '53100', // Disk full
    '53200', // Out of memory
    '53300', // Too many connections
    'PGRST301', // Connection lost
    'NETWORK_ERROR'
  ];
  
  return retryableCodes.includes(error?.code) || 
         error?.message?.includes('network') ||
         error?.message?.includes('timeout') ||
         error?.message?.includes('connection');
}

/**
 * Generates user-friendly error messages
 */
function getUserFriendlyMessage(error: any, options: ErrorHandlerOptions): string {
  if (options.fallbackMessage) {
    return options.fallbackMessage;
  }

  const operation = options.operation.toLowerCase();
  
  // Handle specific error codes
  switch (error?.code) {
    case '23505': // Unique violation
      return `This ${operation} already exists. Please use a different name or value.`;
    
    case '23503': // Foreign key violation
      return `Cannot ${operation} because it's still being used by other records. Please remove dependencies first.`;
    
    case '23502': // Not null violation
      return `Required information is missing for this ${operation}. Please fill in all required fields.`;
    
    case '42501': // Insufficient privilege
      return `You don't have permission to perform this ${operation}. Please contact your administrator.`;
    
    case 'PGRST116': // Not found
      return `The requested ${operation} was not found. It may have been deleted by another user.`;
    
    case '08000':
    case '08003':
    case '08006':
    case 'PGRST301':
      return `Connection lost. Please check your internet connection and try again.`;
    
    case '53000':
    case '53100':
    case '53200':
    case '53300':
      return `The server is currently overloaded. Please try again in a few moments.`;
    
    default:
      // Generic messages based on operation type
      if (operation.includes('create') || operation.includes('add') || operation.includes('save')) {
        return `Failed to save ${operation}. Please try again.`;
      } else if (operation.includes('update') || operation.includes('edit')) {
        return `Failed to update ${operation}. Please try again.`;
      } else if (operation.includes('delete') || operation.includes('remove')) {
        return `Failed to delete ${operation}. Please try again.`;
      } else if (operation.includes('load') || operation.includes('fetch') || operation.includes('get')) {
        return `Failed to load ${operation}. Please refresh the page.`;
      } else {
        return `Operation failed: ${operation}. Please try again.`;
      }
  }
}

/**
 * Shows error to user (this would integrate with your notification system)
 */
function showErrorToUser(error: DatabaseError): void {
  // This would integrate with your existing notification system
  // For now, we'll use console.error
  console.error(`🚨 User Error [${error.operation}]:`, error.message);
  
  // You could also trigger a toast notification here
  // notificationService.showError(error.message, error.retryable ? 'Try Again' : undefined);
}

/**
 * Wrapper for Supabase operations with automatic error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options: ErrorHandlerOptions
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw handleSupabaseError(error, options);
  }
}

/**
 * Retry wrapper for retryable operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: ErrorHandlerOptions & { maxRetries?: number; retryDelay?: number } = {
    operation: 'unknown operation',
    showToUser: false
  }
): Promise<T> {
  const maxRetries = options.maxRetries || 3;
  const retryDelay = options.retryDelay || 1000;
  
  let lastError: DatabaseError | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await withErrorHandling(operation, options);
    } catch (error) {
      lastError = error as DatabaseError;
      
      if (!lastError.retryable || attempt === maxRetries) {
        throw lastError;
      }
      
      console.log(`⏳ Retrying ${options.operation} (attempt ${attempt + 1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }
  }
  
  throw lastError;
}

/**
 * Connection status checker
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    // Simple ping to check connectivity
    const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY!,
      }
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Data consistency validator
 */
export function validateDataConsistency<T>(
  localData: T[],
  remoteData: T[], 
  keyField: keyof T
): {
  consistent: boolean;
  conflicts: T[];
  missing: T[];
} {
  const localMap = new Map(localData.map(item => [item[keyField], item]));
  const remoteMap = new Map(remoteData.map(item => [item[keyField], item]));
  
  const conflicts: T[] = [];
  const missing: T[] = [];
  
  // Check for conflicts
  Array.from(localMap.entries()).forEach(([key, localItem]) => {
    const remoteItem = remoteMap.get(key);
    if (remoteItem && JSON.stringify(localItem) !== JSON.stringify(remoteItem)) {
      conflicts.push(localItem);
    }
  });
  
  // Check for missing items
  Array.from(localMap.entries()).forEach(([key, localItem]) => {
    if (!remoteMap.has(key)) {
      missing.push(localItem);
    }
  });
  
  return {
    consistent: conflicts.length === 0 && missing.length === 0,
    conflicts,
    missing
  };
}

/**
 * Operation status for UI feedback
 */
export interface OperationStatus {
  loading: boolean;
  error: DatabaseError | null;
  retrying: boolean;
  retryCount: number;
}

export function createOperationStatus(): OperationStatus {
  return {
    loading: false,
    error: null,
    retrying: false,
    retryCount: 0
  };
}
/**
 * Case Service - Centralized case management
 * Reduces code duplication and improves performance
 */

import { CaseBooking, CaseStatus } from '../types';
import userService from './userService';
import notificationService from './notificationService';
import { caseOperations } from './database';

class CaseService {
  private static instance: CaseService;
  private casesCache: Map<string, CaseBooking> = new Map();
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): CaseService {
    if (!CaseService.instance) {
      CaseService.instance = new CaseService();
    }
    return CaseService.instance;
  }

  /**
   * Get all cases with caching
   */
  async getAllCases(forceRefresh = false): Promise<CaseBooking[]> {
    const now = Date.now();
    const cacheValid = (now - this.lastFetchTime) < this.CACHE_DURATION;

    if (!forceRefresh && cacheValid && this.casesCache.size > 0) {
      return Array.from(this.casesCache.values());
    }

    try {
      const cases = await caseOperations.getAll();
      
      // Update cache
      this.casesCache.clear();
      cases.forEach(caseItem => {
        this.casesCache.set(caseItem.id, caseItem);
      });
      
      this.lastFetchTime = now;
      return cases;
    } catch (error) {
      console.error('Error loading cases:', error);
      return [];
    }
  }

  /**
   * Get case by ID
   */
  async getCaseById(id: string): Promise<CaseBooking | null> {
    if (this.casesCache.has(id)) {
      return this.casesCache.get(id)!;
    }

    const cases = await this.getAllCases();
    return cases.find(c => c.id === id) || null;
  }

  /**
   * Save case
   */
  async saveCase(caseData: CaseBooking): Promise<boolean> {
    console.log('📁 caseService.saveCase called with:', caseData);
    try {
      const existingCase = await this.getCaseById(caseData.id);
      console.log('📁 Existing case found:', existingCase ? 'Yes' : 'No');
      
      if (existingCase) {
        console.log('📁 Updating existing case via caseOperations.update');
        await caseOperations.update(caseData.id, caseData);
      } else {
        console.log('📁 Creating new case via caseOperations.create');
        await caseOperations.create(caseData);
      }
      
      this.casesCache.set(caseData.id, caseData);
      console.log('📁 Case saved successfully to cache and Supabase');
      return true;
    } catch (error) {
      console.error('📁 Error saving case:', error);
      return false;
    }
  }

  /**
   * Update case status with history tracking
   */
  async updateCaseStatus(
    caseId: string, 
    newStatus: CaseStatus, 
    details?: string,
    attachments?: string[]
  ): Promise<boolean> {
    try {
      const caseItem = await this.getCaseById(caseId);
      if (!caseItem) {
        console.error('Case not found:', caseId);
        return false;
      }

      const currentUser = userService.getCurrentUser();
      if (!currentUser) {
        console.error('No current user found');
        return false;
      }

      // Use Supabase service to update status
      await caseOperations.updateStatus(caseId, newStatus, currentUser.name, details);
      
      // Update cache
      this.casesCache.delete(caseId);
      
      // Send notification
      notificationService.addNotification({
        title: `Case Status Updated: ${newStatus}`,
        message: `Case ${caseItem.caseReferenceNumber} has been updated to ${newStatus} by ${currentUser.name}`,
        type: 'success',
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error updating case status:', error);
      return false;
    }
  }

  /**
   * Get cases filtered by user permissions
   */
  async getCasesForUser(): Promise<CaseBooking[]> {
    const currentUser = userService.getCurrentUser();
    if (!currentUser) return [];

    const allCases = await this.getAllCases();

    // Admin sees all cases
    if (currentUser.role === 'admin') {
      return allCases;
    }

    // Filter by user's countries and departments
    return allCases.filter(caseItem => {
      const hasCountryAccess = currentUser.countries.includes(caseItem.country);
      const hasDepartmentAccess = currentUser.departments.length === 0 || 
        currentUser.departments.includes(caseItem.department);
      
      return hasCountryAccess && hasDepartmentAccess;
    });
  }

  /**
   * Search cases
   */
  async searchCases(query: string): Promise<CaseBooking[]> {
    if (!query.trim()) return await this.getCasesForUser();

    const searchTerm = query.toLowerCase().trim();
    const cases = await this.getCasesForUser();

    return cases.filter(caseItem => 
      caseItem.caseReferenceNumber.toLowerCase().includes(searchTerm) ||
      caseItem.hospital.toLowerCase().includes(searchTerm) ||
      caseItem.doctorName?.toLowerCase().includes(searchTerm) ||
      caseItem.procedureType.toLowerCase().includes(searchTerm) ||
      caseItem.procedureName.toLowerCase().includes(searchTerm) ||
      caseItem.submittedBy.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get cases by status
   */
  async getCasesByStatus(status: CaseStatus): Promise<CaseBooking[]> {
    const cases = await this.getCasesForUser();
    return cases.filter(caseItem => caseItem.status === status);
  }

  /**
   * Get cases by date range
   */
  async getCasesByDateRange(startDate: string, endDate: string): Promise<CaseBooking[]> {
    const cases = await this.getCasesForUser();
    return cases.filter(caseItem => {
      const caseDate = caseItem.dateOfSurgery;
      return caseDate >= startDate && caseDate <= endDate;
    });
  }

  /**
   * Delete case
   */
  async deleteCase(caseId: string): Promise<boolean> {
    try {
      await caseOperations.delete(caseId);
      this.casesCache.delete(caseId);
      
      return true;
    } catch (error) {
      console.error('Error deleting case:', error);
      return false;
    }
  }

  /**
   * Amend case
   */
  async amendCase(
    caseId: string,
    amendmentData: Partial<CaseBooking>,
    amendedBy: string,
    isAdmin: boolean = false
  ): Promise<boolean> {
    try {
      const existingCase = await this.getCaseById(caseId);
      if (!existingCase) {
        console.error('Case not found for amendment:', caseId);
        return false;
      }

      const currentUser = userService.getCurrentUser();
      if (!currentUser) {
        console.error('No current user found');
        return false;
      }

      // Track changes for history
      const changes = [];
      for (const [field, newValue] of Object.entries(amendmentData)) {
        const oldValue = existingCase[field as keyof CaseBooking];
        if (oldValue !== newValue && newValue !== undefined) {
          changes.push({
            field,
            oldValue: oldValue?.toString() || '',
            newValue: newValue?.toString() || ''
          });
        }
      }

      if (changes.length === 0) {
        console.log('No changes detected for amendment');
        return true;
      }

      // Update the case
      const updatedCase = { ...existingCase, ...amendmentData };
      await caseOperations.update(caseId, updatedCase);

      // Add amendment history
      await caseOperations.addAmendment(caseId, currentUser.id, changes, 'Case amended');

      // Update cache
      this.casesCache.set(caseId, updatedCase);

      // Send notification
      notificationService.addNotification({
        title: 'Case Amended',
        message: `Case ${existingCase.caseReferenceNumber} has been amended by ${currentUser.name}`,
        type: 'success',
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error amending case:', error);
      return false;
    }
  }

  /**
   * Generate unique case reference number
   */
  async generateCaseReferenceNumber(): Promise<string> {
    const cases = await this.getAllCases();
    const currentYear = new Date().getFullYear();
    const yearCases = cases.filter(c => 
      c.caseReferenceNumber.startsWith(`TMC${currentYear}`)
    );
    
    const nextNumber = yearCases.length + 1;
    return `TMC${currentYear}${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.casesCache.clear();
    this.lastFetchTime = 0;
  }

  /**
   * Get cases count by status
   */
  async getCasesCountByStatus(): Promise<Record<CaseStatus, number>> {
    const cases = await this.getCasesForUser();
    const counts = {} as Record<CaseStatus, number>;

    // Initialize all possible statuses with 0
    const allStatuses: CaseStatus[] = [
      'Case Booked',
      'Order Preparation', 
      'Order Prepared',
      'Pending Delivery (Hospital)',
      'Delivered (Hospital)',
      'Case Completed',
      'Pending Delivery (Office)',
      'Delivered (Office)',
      'To be billed',
      'Case Closed',
      'Case Cancelled'
    ];

    allStatuses.forEach(status => {
      counts[status] = 0;
    });

    cases.forEach(caseItem => {
      if (counts[caseItem.status] !== undefined) {
        counts[caseItem.status]++;
      }
    });

    return counts;
  }
}

export default CaseService.getInstance();
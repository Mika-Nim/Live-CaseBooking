import React, { useState, useEffect, useCallback } from 'react';
import { CaseBooking, SURGERY_SETS, IMPLANT_BOXES, PROCEDURE_TYPE_MAPPINGS } from '../types';
import { getCategorizedSets, getAllProcedureTypes } from '../utils/storage';
import { caseService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { 
  getHospitalsForCountry,
  getDepartments, 
  getDepartmentNamesForUser
} from '../utils/codeTable';
import { DatabaseError } from '../utils/errorHandler';
import MultiSelectDropdown from './MultiSelectDropdown';
import TimePicker from './common/TimePicker';
import SearchableDropdown from './SearchableDropdown';
import CustomModal from './CustomModal';
import { useModal } from '../hooks/useModal';
import FilterDatePicker from './FilterDatePicker';
import { addDaysForInput, getTodayForInput } from '../utils/dateFormat';
import { sendNewCaseNotification } from '../utils/emailNotificationService';

interface CaseBookingFormProps {
  onCaseSubmitted: () => void;
}

const CaseBookingForm: React.FC<CaseBookingFormProps> = ({ onCaseSubmitted }) => {
  const { user } = useAuth();
  const { modal, closeModal, showConfirm, showSuccess, showError } = useModal();
  
  const memoizedShowError = useCallback(showError, [showError]);
  const getDefaultDate = () => {
    return addDaysForInput(3);
  };

  const [formData, setFormData] = useState({
    hospital: '',
    department: '',
    dateOfSurgery: getDefaultDate(),
    procedureType: '',
    procedureName: '',
    doctorName: '',
    timeOfProcedure: '',
    surgerySetSelection: [] as string[],
    implantBox: [] as string[],
    specialInstruction: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableProcedureTypes, setAvailableProcedureTypes] = useState<string[]>([]);
  const [availableHospitals, setAvailableHospitals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Load dynamic procedure types and hospitals from Supabase
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        console.log('🏥 CaseBookingForm - No user available, skipping data load');
        return;
      }
      
      setLoading(true);
      setConnectionError(null);
      
      try {
        const userCountry = user.selectedCountry || 'Singapore';
        console.log('🏥 CaseBookingForm - Current User:', user);
        console.log('🌍 CaseBookingForm - User Country:', userCountry);
        
        // Load procedure types from Supabase ONLY
        const allTypes = await getAllProcedureTypes(userCountry);
        setAvailableProcedureTypes(allTypes.sort());
        
        // Load hospitals from Supabase ONLY
        const hospitals = await getHospitalsForCountry(userCountry);
        console.log('🏥 CaseBookingForm - Hospitals for', userCountry, ':', hospitals);
        setAvailableHospitals(hospitals.sort());
        
      } catch (error) {
        console.error('Error loading form data:', error);
        if (error instanceof DatabaseError) {
          setConnectionError(error.message);
          memoizedShowError('Form Setup Error', error.message);
        } else {
          setConnectionError('Unable to load form data. Please check your connection.');
          memoizedShowError('Connection Error', 'Unable to load form data. Please check your connection and try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, memoizedShowError]);

  const [surgerySetOptions, setSurgerySetOptions] = useState<string[]>([]);
  const [implantBoxOptions, setImplantBoxOptions] = useState<string[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);
  
  // Load surgery sets and implant boxes when procedure type changes
  useEffect(() => {
    const loadSetsAndBoxes = async () => {
      if (!formData.procedureType) {
        setSurgerySetOptions([...SURGERY_SETS].sort());
        setImplantBoxOptions([...IMPLANT_BOXES].sort());
        return;
      }
      
      const userCountry = user?.selectedCountry || 'Singapore';
      
      try {
        const categorizedSets = await getCategorizedSets(userCountry);
        
        // Surgery Sets
        if (categorizedSets[formData.procedureType]?.surgerySets?.length > 0) {
          setSurgerySetOptions(categorizedSets[formData.procedureType].surgerySets.sort());
        } else {
          const mapping = PROCEDURE_TYPE_MAPPINGS[formData.procedureType as keyof typeof PROCEDURE_TYPE_MAPPINGS];
          setSurgerySetOptions(mapping ? [...mapping.surgerySets].sort() : [...SURGERY_SETS].sort());
        }
        
        // Implant Boxes
        if (categorizedSets[formData.procedureType]?.implantBoxes?.length > 0) {
          setImplantBoxOptions(categorizedSets[formData.procedureType].implantBoxes.sort());
        } else {
          const mapping = PROCEDURE_TYPE_MAPPINGS[formData.procedureType as keyof typeof PROCEDURE_TYPE_MAPPINGS];
          setImplantBoxOptions(mapping ? [...mapping.implantBoxes].sort() : [...IMPLANT_BOXES].sort());
        }
      } catch (error) {
        console.error('Error loading categorized sets:', error);
        // Fallback to static mapping
        const mapping = PROCEDURE_TYPE_MAPPINGS[formData.procedureType as keyof typeof PROCEDURE_TYPE_MAPPINGS];
        setSurgerySetOptions(mapping ? [...mapping.surgerySets].sort() : [...SURGERY_SETS].sort());
        setImplantBoxOptions(mapping ? [...mapping.implantBoxes].sort() : [...IMPLANT_BOXES].sort());
      }
    };
    
    loadSetsAndBoxes();
  }, [formData.procedureType]);


  // Load departments when component mounts
  useEffect(() => {
    const loadDepartments = async () => {
      if (!user) {
        try {
          const departments = await getDepartments();
          setAvailableDepartments(departments.sort());
        } catch (error) {
          console.error('Error loading departments:', error);
          setAvailableDepartments([]);
        }
        return;
      }
      
      const userCountry = user.selectedCountry || user.countries?.[0];
      if (userCountry) {
        try {
          // Get departments for user's country
          const countryDepartments = await getDepartments(undefined, userCountry);
          
          if (user.role === 'admin' || user.role === 'it') {
            setAvailableDepartments(countryDepartments.sort());
          } else {
            const userDepartments = user.departments || [];
            const userDepartmentNames = await getDepartmentNamesForUser(userDepartments, [userCountry]);
            setAvailableDepartments(countryDepartments.filter(dept => userDepartmentNames.includes(dept)).sort());
          }
        } catch (error) {
          console.error('Error loading departments:', error);
          if (error instanceof DatabaseError) {
            memoizedShowError('Department Loading Error', error.message);
          }
          setAvailableDepartments([]);
        }
      } else {
        try {
          const departments = await getDepartments();
          setAvailableDepartments(departments.sort());
        } catch (error) {
          console.error('Error loading departments:', error);
          setAvailableDepartments([]);
        }
      }
    };
    
    loadDepartments();
  }, [user, memoizedShowError]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.hospital.trim()) {
      newErrors.hospital = 'Hospital is required';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }

    if (!formData.dateOfSurgery) {
      newErrors.dateOfSurgery = 'Date of Surgery is required';
    }

    if (!formData.procedureType.trim()) {
      newErrors.procedureType = 'Procedure Type is required';
    }

    if (!formData.procedureName.trim()) {
      newErrors.procedureName = 'Procedure Name is required';
    }

    if (formData.surgerySetSelection.length === 0) {
      newErrors.surgerySetSelection = 'Surgery Set Selection is required';
    }

    if (formData.implantBox.length === 0) {
      newErrors.implantBox = 'Implant Box selection is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleClearForm = () => {
    showConfirm(
      'Clear Form',
      'Are you sure you want to clear all inputs? This action cannot be undone.',
      () => {
        setFormData({
          hospital: '',
          department: '',
          dateOfSurgery: getDefaultDate(),
          procedureType: '',
          procedureName: '',
          doctorName: '',
          timeOfProcedure: '',
          surgerySetSelection: [],
          implantBox: [],
          specialInstruction: ''
        });
        setErrors({});
        
        // Show success popup
        showSuccess('All inputs have been successfully cleared!');
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!user) {
      showError('You must be logged in to submit a case');
      return;
    }

    const caseReferenceNumber = await caseService.generateCaseReferenceNumber();
    
    const newCase: CaseBooking = {
      id: Date.now().toString(),
      caseReferenceNumber,
      ...formData,
      status: 'Case Booked',
      submittedBy: user.name,
      submittedAt: new Date().toISOString(),
      country: user.selectedCountry || 'Singapore'
    };

    // Save directly to Supabase only
    try {
      await caseService.saveCase(newCase);
      console.log('✅ Case saved to Supabase:', newCase.caseReferenceNumber);
    } catch (error) {
      console.error('❌ Failed to save case to Supabase:', error);
      showError('Failed to submit case. Please check your connection and try again.');
      return;
    }
    
    // Send email notification for new case
    sendNewCaseNotification(newCase).then(emailSent => {
      if (emailSent) {
        console.log('✅ Email notification sent for new case:', newCase.caseReferenceNumber);
      } else {
        console.warn('⚠️ Failed to send email notification for new case:', newCase.caseReferenceNumber);
      }
    }).catch(error => {
      console.error('💥 Error sending email notification:', error);
    });
    
    setFormData({
      hospital: '',
      department: '',
      dateOfSurgery: getDefaultDate(),
      procedureType: '',
      procedureName: '',
      doctorName: '',
      timeOfProcedure: '',
      surgerySetSelection: [],
      implantBox: [],
      specialInstruction: ''
    });

    onCaseSubmitted();
  };

  if (loading) {
    return (
      <div className="case-booking-form">
        <div className="card-header">
          <h2 className="card-title">New Case Booking</h2>
          <p className="card-subtitle">Loading form data...</p>
        </div>
        <div className="card-content">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading hospitals, departments, and procedure types...</p>
          </div>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="case-booking-form">
        <div className="card-header">
          <h2 className="card-title">New Case Booking</h2>
          <p className="card-subtitle">Unable to load form</p>
        </div>
        <div className="card-content">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Connection Error</h3>
            <p>{connectionError}</p>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="case-booking-form">
      <div className="card-header">
        <h2 className="card-title">New Case Booking</h2>
        <p className="card-subtitle">Fill out the details for your medical case booking</p>
      </div>
      
      <div className="card-content">
        <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="hospital" className="required">Hospital</label>
            <SearchableDropdown
              id="hospital"
              value={formData.hospital}
              onChange={(value) => setFormData(prev => ({ ...prev, hospital: value }))}
              options={availableHospitals}
              placeholder="Search and select hospital"
              className={errors.hospital ? 'error' : ''}
              required
            />
            {errors.hospital && <span className="error-text">{errors.hospital}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="department" className="required">Department</label>
            <SearchableDropdown
              id="department"
              value={formData.department}
              onChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
              options={availableDepartments}
              placeholder="Search and select department"
              className={errors.department ? 'error' : ''}
              required
            />
            {errors.department && <span className="error-text">{errors.department}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="dateOfSurgery" className="required">Date of Surgery</label>
            <FilterDatePicker
              value={formData.dateOfSurgery}
              onChange={(value) => setFormData(prev => ({ ...prev, dateOfSurgery: value }))}
              placeholder="Select surgery date"
              min={getTodayForInput()}
              className={errors.dateOfSurgery ? 'error' : ''}
            />
            {errors.dateOfSurgery && <span className="error-text">{errors.dateOfSurgery}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="timeOfProcedure">Time of Procedure</label>
            <TimePicker
              id="timeOfProcedure"
              value={formData.timeOfProcedure}
              onChange={(value) => setFormData(prev => ({ ...prev, timeOfProcedure: value }))}
              placeholder="Select procedure time"
              step={15}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="procedureType" className="required">Procedure Type</label>
            <SearchableDropdown
              id="procedureType"
              value={formData.procedureType}
              onChange={(value) => setFormData(prev => ({ 
                ...prev, 
                procedureType: value,
                surgerySetSelection: [],
                implantBox: []
              }))}
              options={availableProcedureTypes}
              placeholder="Search and select procedure type"
              className={errors.procedureType ? 'error' : ''}
              required
            />
            {errors.procedureType && <span className="error-text">{errors.procedureType}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="procedureName" className="required">Procedure Name</label>
            <input
              type="text"
              id="procedureName"
              value={formData.procedureName}
              onChange={(e) => setFormData(prev => ({ ...prev, procedureName: e.target.value }))}
              className={errors.procedureName ? 'error' : ''}
            />
            {errors.procedureName && <span className="error-text">{errors.procedureName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="doctorName">Doctor Name</label>
            <input
              type="text"
              id="doctorName"
              value={formData.doctorName}
              onChange={(e) => setFormData(prev => ({ ...prev, doctorName: e.target.value }))}
            />
          </div>
        </div>

        <div className="form-section-surgery-sets">
          <MultiSelectDropdown
            id="surgerySetSelection"
            label="Surgery Set"
            options={surgerySetOptions}
            value={formData.surgerySetSelection}
            onChange={(values) => setFormData(prev => ({ ...prev, surgerySetSelection: values }))}
            placeholder="Select surgery sets..."
            required={true}
          />
          {formData.surgerySetSelection.length > 0 && (
            <div className="selection-indicator">
              <span className="indicator-label">Selected ({formData.surgerySetSelection.length}): </span>
              <div className="selected-items-container">
                {formData.surgerySetSelection.map((item, index) => (
                  <span key={item} className="selected-item-badge">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
          {errors.surgerySetSelection && <span className="error-text">{errors.surgerySetSelection}</span>}
        </div>

        <div className="form-section-implant-boxes">
          <MultiSelectDropdown
            id="implantBox"
            label="Implant Box"
            options={implantBoxOptions}
            value={formData.implantBox}
            onChange={(values) => setFormData(prev => ({ ...prev, implantBox: values }))}
            placeholder="Select implant boxes..."
            required={true}
          />
          {formData.implantBox.length > 0 && (
            <div className="selection-indicator">
              <span className="indicator-label">Selected ({formData.implantBox.length}): </span>
              <div className="selected-items-container">
                {formData.implantBox.map((item, index) => (
                  <span key={item} className="selected-item-badge">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
          {errors.implantBox && <span className="error-text">{errors.implantBox}</span>}
        </div>

        <div className="form-group form-section-special-instructions">
          <label htmlFor="specialInstruction">Special Instructions</label>
          <textarea
            id="specialInstruction"
            value={formData.specialInstruction}
            onChange={(e) => setFormData(prev => ({ ...prev, specialInstruction: e.target.value }))}
            rows={4}
            placeholder="Enter any additional notes or special instructions..."
          />
        </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={handleClearForm}
              className="btn btn-outline-secondary btn-lg clear-button"
            >
              🗑️ Clear Inputs
            </button>
            <button type="submit" className="btn btn-primary btn-lg submit-button">
              Submit Case Booking
            </button>
          </div>
        </form>
      </div>
      <CustomModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        actions={modal.type === 'confirm' ? [
          {
            label: 'Cancel',
            onClick: closeModal,
            style: 'secondary'
          },
          {
            label: 'Confirm',
            onClick: modal.onConfirm || closeModal,
            style: 'danger'
          }
        ] : undefined}
        autoClose={modal.autoClose}
        autoCloseDelay={modal.autoCloseDelay}
      />
    </div>
  );
};

export default CaseBookingForm;
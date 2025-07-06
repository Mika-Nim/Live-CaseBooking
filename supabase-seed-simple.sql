-- =============================================================================
-- TM Case Booking System - Simple Safe Seed Data
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- INSERT SEED DATA (SIMPLE APPROACH - NO CONFLICT HANDLING)
-- =============================================================================

-- Insert Countries
INSERT INTO countries (code, name, is_active) 
SELECT 'SG', 'Singapore', true WHERE NOT EXISTS (SELECT 1 FROM countries WHERE code = 'SG');
INSERT INTO countries (code, name, is_active) 
SELECT 'MY', 'Malaysia', true WHERE NOT EXISTS (SELECT 1 FROM countries WHERE code = 'MY');
INSERT INTO countries (code, name, is_active) 
SELECT 'PH', 'Philippines', true WHERE NOT EXISTS (SELECT 1 FROM countries WHERE code = 'PH');
INSERT INTO countries (code, name, is_active) 
SELECT 'ID', 'Indonesia', true WHERE NOT EXISTS (SELECT 1 FROM countries WHERE code = 'ID');
INSERT INTO countries (code, name, is_active) 
SELECT 'VN', 'Vietnam', true WHERE NOT EXISTS (SELECT 1 FROM countries WHERE code = 'VN');
INSERT INTO countries (code, name, is_active) 
SELECT 'HK', 'Hongkong', true WHERE NOT EXISTS (SELECT 1 FROM countries WHERE code = 'HK');
INSERT INTO countries (code, name, is_active) 
SELECT 'TH', 'Thailand', true WHERE NOT EXISTS (SELECT 1 FROM countries WHERE code = 'TH');

-- Insert Roles
INSERT INTO roles (name, display_name, description, color)
SELECT 'admin', 'Administrator', 'Full system access and user management', '#dc2626'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'admin');

INSERT INTO roles (name, display_name, description, color)
SELECT 'operations', 'Operations Manager', 'Manages case operations and workflows', '#2563eb'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'operations');

INSERT INTO roles (name, display_name, description, color)
SELECT 'operations-manager', 'Senior Operations Manager', 'Senior operations oversight', '#1d4ed8'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'operations-manager');

INSERT INTO roles (name, display_name, description, color)
SELECT 'it', 'IT Support', 'Technical support and system maintenance', '#059669'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'it');

INSERT INTO roles (name, display_name, description, color)
SELECT 'warehouse', 'Warehouse Staff', 'Inventory and logistics management', '#7c3aed'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'warehouse');

INSERT INTO roles (name, display_name, description, color)
SELECT 'sales', 'Sales Representative', 'Customer relations and sales support', '#ea580c'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'sales');

-- Insert Case Statuses
INSERT INTO case_statuses (status_key, display_name, description, color, icon, sort_order)
SELECT 'case_booked', 'Case Booked', 'Initial case booking', '#3b82f6', '📅', 1
WHERE NOT EXISTS (SELECT 1 FROM case_statuses WHERE status_key = 'case_booked');

INSERT INTO case_statuses (status_key, display_name, description, color, icon, sort_order)
SELECT 'order_preparation', 'Order Preparation', 'Order being prepared', '#f59e0b', '📋', 2
WHERE NOT EXISTS (SELECT 1 FROM case_statuses WHERE status_key = 'order_preparation');

INSERT INTO case_statuses (status_key, display_name, description, color, icon, sort_order)
SELECT 'order_prepared', 'Order Prepared', 'Order ready for delivery', '#10b981', '✅', 3
WHERE NOT EXISTS (SELECT 1 FROM case_statuses WHERE status_key = 'order_prepared');

INSERT INTO case_statuses (status_key, display_name, description, color, icon, sort_order)
SELECT 'delivered_hospital', 'Delivered (Hospital)', 'Delivered to hospital', '#8b5cf6', '🚚', 4
WHERE NOT EXISTS (SELECT 1 FROM case_statuses WHERE status_key = 'delivered_hospital');

INSERT INTO case_statuses (status_key, display_name, description, color, icon, sort_order)
SELECT 'case_completed', 'Case Completed', 'Surgery completed', '#06b6d4', '🏥', 5
WHERE NOT EXISTS (SELECT 1 FROM case_statuses WHERE status_key = 'case_completed');

INSERT INTO case_statuses (status_key, display_name, description, color, icon, sort_order)
SELECT 'case_cancelled', 'Case Cancelled', 'Case cancelled', '#ef4444', '❌', 6
WHERE NOT EXISTS (SELECT 1 FROM case_statuses WHERE status_key = 'case_cancelled');

INSERT INTO case_statuses (status_key, display_name, description, color, icon, sort_order)
SELECT 'case_closed', 'Case Closed', 'Case closed', '#6b7280', '🔒', 7
WHERE NOT EXISTS (SELECT 1 FROM case_statuses WHERE status_key = 'case_closed');

-- =============================================================================
-- INSERT DEPARTMENTS, HOSPITALS, PROCEDURES, SETS, IMPLANTS
-- =============================================================================

DO $$
DECLARE
    country_sg_id UUID;
    country_my_id UUID;
    country_ph_id UUID;
    country_id_id UUID;
    country_vn_id UUID;
    country_hk_id UUID;
    country_th_id UUID;
BEGIN
    -- Get country IDs
    SELECT id INTO country_sg_id FROM countries WHERE code = 'SG';
    SELECT id INTO country_my_id FROM countries WHERE code = 'MY';
    SELECT id INTO country_ph_id FROM countries WHERE code = 'PH';
    SELECT id INTO country_id_id FROM countries WHERE code = 'ID';
    SELECT id INTO country_vn_id FROM countries WHERE code = 'VN';
    SELECT id INTO country_hk_id FROM countries WHERE code = 'HK';
    SELECT id INTO country_th_id FROM countries WHERE code = 'TH';

    -- Insert Singapore data
    IF country_sg_id IS NOT NULL THEN
        -- Departments
        INSERT INTO departments (name, country_id) SELECT 'Orthopedic Surgery', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Orthopedic Surgery' AND country_id = country_sg_id);
        INSERT INTO departments (name, country_id) SELECT 'Neurosurgery', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Neurosurgery' AND country_id = country_sg_id);
        INSERT INTO departments (name, country_id) SELECT 'Cardiovascular Surgery', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Cardiovascular Surgery' AND country_id = country_sg_id);
        INSERT INTO departments (name, country_id) SELECT 'General Surgery', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'General Surgery' AND country_id = country_sg_id);
        INSERT INTO departments (name, country_id) SELECT 'Plastic Surgery', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Plastic Surgery' AND country_id = country_sg_id);
        INSERT INTO departments (name, country_id) SELECT 'ENT Surgery', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'ENT Surgery' AND country_id = country_sg_id);
        INSERT INTO departments (name, country_id) SELECT 'Ophthalmology', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Ophthalmology' AND country_id = country_sg_id);
        INSERT INTO departments (name, country_id) SELECT 'Urology', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Urology' AND country_id = country_sg_id);
        INSERT INTO departments (name, country_id) SELECT 'Trauma Surgery', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Trauma Surgery' AND country_id = country_sg_id);
        INSERT INTO departments (name, country_id) SELECT 'Spine Surgery', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Spine Surgery' AND country_id = country_sg_id);

        -- Hospitals
        INSERT INTO hospitals (name, country_id) SELECT 'Singapore General Hospital', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE name = 'Singapore General Hospital' AND country_id = country_sg_id);
        INSERT INTO hospitals (name, country_id) SELECT 'National University Hospital', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE name = 'National University Hospital' AND country_id = country_sg_id);
        INSERT INTO hospitals (name, country_id) SELECT 'Tan Tock Seng Hospital', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE name = 'Tan Tock Seng Hospital' AND country_id = country_sg_id);
        INSERT INTO hospitals (name, country_id) SELECT 'Changi General Hospital', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE name = 'Changi General Hospital' AND country_id = country_sg_id);
        INSERT INTO hospitals (name, country_id) SELECT 'Mount Elizabeth Hospital', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE name = 'Mount Elizabeth Hospital' AND country_id = country_sg_id);

        -- Procedure Types
        INSERT INTO procedure_types (name, country_id) SELECT 'Total Knee Replacement', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM procedure_types WHERE name = 'Total Knee Replacement' AND country_id = country_sg_id);
        INSERT INTO procedure_types (name, country_id) SELECT 'Total Hip Replacement', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM procedure_types WHERE name = 'Total Hip Replacement' AND country_id = country_sg_id);
        INSERT INTO procedure_types (name, country_id) SELECT 'Spinal Fusion', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM procedure_types WHERE name = 'Spinal Fusion' AND country_id = country_sg_id);
        INSERT INTO procedure_types (name, country_id) SELECT 'Craniotomy', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM procedure_types WHERE name = 'Craniotomy' AND country_id = country_sg_id);
        INSERT INTO procedure_types (name, country_id) SELECT 'Arthroscopy', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM procedure_types WHERE name = 'Arthroscopy' AND country_id = country_sg_id);

        -- Surgery Sets
        INSERT INTO surgery_sets (name, country_id) SELECT 'Basic Orthopedic Set', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM surgery_sets WHERE name = 'Basic Orthopedic Set' AND country_id = country_sg_id);
        INSERT INTO surgery_sets (name, country_id) SELECT 'Total Knee Set', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM surgery_sets WHERE name = 'Total Knee Set' AND country_id = country_sg_id);
        INSERT INTO surgery_sets (name, country_id) SELECT 'Total Hip Set', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM surgery_sets WHERE name = 'Total Hip Set' AND country_id = country_sg_id);
        INSERT INTO surgery_sets (name, country_id) SELECT 'Spine Fusion Set', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM surgery_sets WHERE name = 'Spine Fusion Set' AND country_id = country_sg_id);
        INSERT INTO surgery_sets (name, country_id) SELECT 'Trauma Set', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM surgery_sets WHERE name = 'Trauma Set' AND country_id = country_sg_id);

        -- Implant Boxes
        INSERT INTO implant_boxes (name, country_id) SELECT 'Knee Implant System', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM implant_boxes WHERE name = 'Knee Implant System' AND country_id = country_sg_id);
        INSERT INTO implant_boxes (name, country_id) SELECT 'Hip Implant System', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM implant_boxes WHERE name = 'Hip Implant System' AND country_id = country_sg_id);
        INSERT INTO implant_boxes (name, country_id) SELECT 'Spine Implant System', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM implant_boxes WHERE name = 'Spine Implant System' AND country_id = country_sg_id);
        INSERT INTO implant_boxes (name, country_id) SELECT 'Trauma Implant System', country_sg_id WHERE NOT EXISTS (SELECT 1 FROM implant_boxes WHERE name = 'Trauma Implant System' AND country_id = country_sg_id);
    END IF;

    -- Insert Malaysia data
    IF country_my_id IS NOT NULL THEN
        -- Departments
        INSERT INTO departments (name, country_id) SELECT 'Orthopedic Surgery', country_my_id WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Orthopedic Surgery' AND country_id = country_my_id);
        INSERT INTO departments (name, country_id) SELECT 'Neurosurgery', country_my_id WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Neurosurgery' AND country_id = country_my_id);
        INSERT INTO departments (name, country_id) SELECT 'Cardiovascular Surgery', country_my_id WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Cardiovascular Surgery' AND country_id = country_my_id);
        INSERT INTO departments (name, country_id) SELECT 'General Surgery', country_my_id WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'General Surgery' AND country_id = country_my_id);
        INSERT INTO departments (name, country_id) SELECT 'Emergency Surgery', country_my_id WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Emergency Surgery' AND country_id = country_my_id);

        -- Hospitals
        INSERT INTO hospitals (name, country_id) SELECT 'Hospital Kuala Lumpur', country_my_id WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE name = 'Hospital Kuala Lumpur' AND country_id = country_my_id);
        INSERT INTO hospitals (name, country_id) SELECT 'University Malaya Medical Centre', country_my_id WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE name = 'University Malaya Medical Centre' AND country_id = country_my_id);
        INSERT INTO hospitals (name, country_id) SELECT 'Gleneagles Kuala Lumpur', country_my_id WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE name = 'Gleneagles Kuala Lumpur' AND country_id = country_my_id);

        -- Procedure Types
        INSERT INTO procedure_types (name, country_id) SELECT 'Total Knee Replacement', country_my_id WHERE NOT EXISTS (SELECT 1 FROM procedure_types WHERE name = 'Total Knee Replacement' AND country_id = country_my_id);
        INSERT INTO procedure_types (name, country_id) SELECT 'Total Hip Replacement', country_my_id WHERE NOT EXISTS (SELECT 1 FROM procedure_types WHERE name = 'Total Hip Replacement' AND country_id = country_my_id);
        INSERT INTO procedure_types (name, country_id) SELECT 'Spinal Fusion', country_my_id WHERE NOT EXISTS (SELECT 1 FROM procedure_types WHERE name = 'Spinal Fusion' AND country_id = country_my_id);

        -- Surgery Sets
        INSERT INTO surgery_sets (name, country_id) SELECT 'Basic Orthopedic Set', country_my_id WHERE NOT EXISTS (SELECT 1 FROM surgery_sets WHERE name = 'Basic Orthopedic Set' AND country_id = country_my_id);
        INSERT INTO surgery_sets (name, country_id) SELECT 'Total Knee Set', country_my_id WHERE NOT EXISTS (SELECT 1 FROM surgery_sets WHERE name = 'Total Knee Set' AND country_id = country_my_id);

        -- Implant Boxes
        INSERT INTO implant_boxes (name, country_id) SELECT 'Knee Implant System', country_my_id WHERE NOT EXISTS (SELECT 1 FROM implant_boxes WHERE name = 'Knee Implant System' AND country_id = country_my_id);
        INSERT INTO implant_boxes (name, country_id) SELECT 'Hip Implant System', country_my_id WHERE NOT EXISTS (SELECT 1 FROM implant_boxes WHERE name = 'Hip Implant System' AND country_id = country_my_id);
    END IF;

    -- Insert data for other countries with basic sets
    IF country_ph_id IS NOT NULL THEN
        INSERT INTO departments (name, country_id) SELECT 'Orthopedic Surgery', country_ph_id WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Orthopedic Surgery' AND country_id = country_ph_id);
        INSERT INTO departments (name, country_id) SELECT 'General Surgery', country_ph_id WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'General Surgery' AND country_id = country_ph_id);
        INSERT INTO hospitals (name, country_id) SELECT 'Philippine General Hospital', country_ph_id WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE name = 'Philippine General Hospital' AND country_id = country_ph_id);
        INSERT INTO hospitals (name, country_id) SELECT 'St. Luke''s Medical Center', country_ph_id WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE name = 'St. Luke''s Medical Center' AND country_id = country_ph_id);
        INSERT INTO procedure_types (name, country_id) SELECT 'Total Knee Replacement', country_ph_id WHERE NOT EXISTS (SELECT 1 FROM procedure_types WHERE name = 'Total Knee Replacement' AND country_id = country_ph_id);
        INSERT INTO surgery_sets (name, country_id) SELECT 'Basic Orthopedic Set', country_ph_id WHERE NOT EXISTS (SELECT 1 FROM surgery_sets WHERE name = 'Basic Orthopedic Set' AND country_id = country_ph_id);
        INSERT INTO implant_boxes (name, country_id) SELECT 'Knee Implant System', country_ph_id WHERE NOT EXISTS (SELECT 1 FROM implant_boxes WHERE name = 'Knee Implant System' AND country_id = country_ph_id);
    END IF;

    IF country_id_id IS NOT NULL THEN
        INSERT INTO departments (name, country_id) SELECT 'Orthopedic Surgery', country_id_id WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Orthopedic Surgery' AND country_id = country_id_id);
        INSERT INTO departments (name, country_id) SELECT 'General Surgery', country_id_id WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'General Surgery' AND country_id = country_id_id);
        INSERT INTO hospitals (name, country_id) SELECT 'Cipto Mangunkusumo Hospital', country_id_id WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE name = 'Cipto Mangunkusumo Hospital' AND country_id = country_id_id);
        INSERT INTO hospitals (name, country_id) SELECT 'Dr. Soetomo Hospital', country_id_id WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE name = 'Dr. Soetomo Hospital' AND country_id = country_id_id);
        INSERT INTO procedure_types (name, country_id) SELECT 'Total Knee Replacement', country_id_id WHERE NOT EXISTS (SELECT 1 FROM procedure_types WHERE name = 'Total Knee Replacement' AND country_id = country_id_id);
        INSERT INTO surgery_sets (name, country_id) SELECT 'Basic Orthopedic Set', country_id_id WHERE NOT EXISTS (SELECT 1 FROM surgery_sets WHERE name = 'Basic Orthopedic Set' AND country_id = country_id_id);
        INSERT INTO implant_boxes (name, country_id) SELECT 'Knee Implant System', country_id_id WHERE NOT EXISTS (SELECT 1 FROM implant_boxes WHERE name = 'Knee Implant System' AND country_id = country_id_id);
    END IF;

    IF country_vn_id IS NOT NULL THEN
        INSERT INTO departments (name, country_id) SELECT 'Orthopedic Surgery', country_vn_id WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Orthopedic Surgery' AND country_id = country_vn_id);
        INSERT INTO departments (name, country_id) SELECT 'General Surgery', country_vn_id WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'General Surgery' AND country_id = country_vn_id);
        INSERT INTO hospitals (name, country_id) SELECT 'Bach Mai Hospital', country_vn_id WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE name = 'Bach Mai Hospital' AND country_id = country_vn_id);
        INSERT INTO hospitals (name, country_id) SELECT 'Cho Ray Hospital', country_vn_id WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE name = 'Cho Ray Hospital' AND country_id = country_vn_id);
        INSERT INTO procedure_types (name, country_id) SELECT 'Total Knee Replacement', country_vn_id WHERE NOT EXISTS (SELECT 1 FROM procedure_types WHERE name = 'Total Knee Replacement' AND country_id = country_vn_id);
        INSERT INTO surgery_sets (name, country_id) SELECT 'Basic Orthopedic Set', country_vn_id WHERE NOT EXISTS (SELECT 1 FROM surgery_sets WHERE name = 'Basic Orthopedic Set' AND country_id = country_vn_id);
        INSERT INTO implant_boxes (name, country_id) SELECT 'Knee Implant System', country_vn_id WHERE NOT EXISTS (SELECT 1 FROM implant_boxes WHERE name = 'Knee Implant System' AND country_id = country_vn_id);
    END IF;

    IF country_hk_id IS NOT NULL THEN
        INSERT INTO departments (name, country_id) SELECT 'Orthopedic Surgery', country_hk_id WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Orthopedic Surgery' AND country_id = country_hk_id);
        INSERT INTO departments (name, country_id) SELECT 'General Surgery', country_hk_id WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'General Surgery' AND country_id = country_hk_id);
        INSERT INTO hospitals (name, country_id) SELECT 'Queen Mary Hospital', country_hk_id WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE name = 'Queen Mary Hospital' AND country_id = country_hk_id);
        INSERT INTO hospitals (name, country_id) SELECT 'Prince of Wales Hospital', country_hk_id WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE name = 'Prince of Wales Hospital' AND country_id = country_hk_id);
        INSERT INTO procedure_types (name, country_id) SELECT 'Total Knee Replacement', country_hk_id WHERE NOT EXISTS (SELECT 1 FROM procedure_types WHERE name = 'Total Knee Replacement' AND country_id = country_hk_id);
        INSERT INTO surgery_sets (name, country_id) SELECT 'Basic Orthopedic Set', country_hk_id WHERE NOT EXISTS (SELECT 1 FROM surgery_sets WHERE name = 'Basic Orthopedic Set' AND country_id = country_hk_id);
        INSERT INTO implant_boxes (name, country_id) SELECT 'Knee Implant System', country_hk_id WHERE NOT EXISTS (SELECT 1 FROM implant_boxes WHERE name = 'Knee Implant System' AND country_id = country_hk_id);
    END IF;

    IF country_th_id IS NOT NULL THEN
        INSERT INTO departments (name, country_id) SELECT 'Orthopedic Surgery', country_th_id WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Orthopedic Surgery' AND country_id = country_th_id);
        INSERT INTO departments (name, country_id) SELECT 'General Surgery', country_th_id WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'General Surgery' AND country_id = country_th_id);
        INSERT INTO hospitals (name, country_id) SELECT 'Siriraj Hospital', country_th_id WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE name = 'Siriraj Hospital' AND country_id = country_th_id);
        INSERT INTO hospitals (name, country_id) SELECT 'Bumrungrad International Hospital', country_th_id WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE name = 'Bumrungrad International Hospital' AND country_id = country_th_id);
        INSERT INTO procedure_types (name, country_id) SELECT 'Total Knee Replacement', country_th_id WHERE NOT EXISTS (SELECT 1 FROM procedure_types WHERE name = 'Total Knee Replacement' AND country_id = country_th_id);
        INSERT INTO surgery_sets (name, country_id) SELECT 'Basic Orthopedic Set', country_th_id WHERE NOT EXISTS (SELECT 1 FROM surgery_sets WHERE name = 'Basic Orthopedic Set' AND country_id = country_th_id);
        INSERT INTO implant_boxes (name, country_id) SELECT 'Knee Implant System', country_th_id WHERE NOT EXISTS (SELECT 1 FROM implant_boxes WHERE name = 'Knee Implant System' AND country_id = country_th_id);
    END IF;

END $$;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Show what was inserted
SELECT 
    'Countries' as table_name, 
    COUNT(*) as total_records
FROM countries
UNION ALL
SELECT 
    'Roles' as table_name, 
    COUNT(*) as total_records
FROM roles
UNION ALL
SELECT 
    'Case Statuses' as table_name, 
    COUNT(*) as total_records
FROM case_statuses
UNION ALL
SELECT 
    'Departments' as table_name, 
    COUNT(*) as total_records
FROM departments
UNION ALL
SELECT 
    'Hospitals' as table_name, 
    COUNT(*) as total_records
FROM hospitals
UNION ALL
SELECT 
    'Procedure Types' as table_name, 
    COUNT(*) as total_records
FROM procedure_types
UNION ALL
SELECT 
    'Surgery Sets' as table_name, 
    COUNT(*) as total_records
FROM surgery_sets
UNION ALL
SELECT 
    'Implant Boxes' as table_name, 
    COUNT(*) as total_records
FROM implant_boxes
ORDER BY table_name;

-- Show detailed breakdown by country
SELECT 
    c.name as country,
    c.code,
    COUNT(DISTINCT d.id) as departments,
    COUNT(DISTINCT h.id) as hospitals,
    COUNT(DISTINCT pt.id) as procedure_types,
    COUNT(DISTINCT ss.id) as surgery_sets,
    COUNT(DISTINCT ib.id) as implant_boxes
FROM countries c
LEFT JOIN departments d ON c.id = d.country_id
LEFT JOIN hospitals h ON c.id = h.country_id
LEFT JOIN procedure_types pt ON c.id = pt.country_id
LEFT JOIN surgery_sets ss ON c.id = ss.country_id
LEFT JOIN implant_boxes ib ON c.id = ib.country_id
GROUP BY c.name, c.code
ORDER BY c.name;
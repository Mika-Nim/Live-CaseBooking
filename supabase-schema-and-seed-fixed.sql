-- =============================================================================
-- TM Case Booking System - Complete Schema and Realistic Seed Data (FIXED)
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CREATE TABLES
-- =============================================================================

-- Countries table
CREATE TABLE IF NOT EXISTS countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(2) UNIQUE NOT NULL,
    name VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case statuses table
CREATE TABLE IF NOT EXISTS case_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status_key VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    icon VARCHAR(10) DEFAULT '📅',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, country_id)
);

-- Hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, country_id)
);

-- Procedure types table
CREATE TABLE IF NOT EXISTS procedure_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    is_hidden BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, country_id)
);

-- Surgery sets table
CREATE TABLE IF NOT EXISTS surgery_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, country_id)
);

-- Implant boxes table
CREATE TABLE IF NOT EXISTS implant_boxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, country_id)
);

-- Procedure mappings table (links procedure types to surgery sets and implant boxes)
CREATE TABLE IF NOT EXISTS procedure_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    procedure_type_id UUID REFERENCES procedure_types(id) ON DELETE CASCADE,
    surgery_set_id UUID REFERENCES surgery_sets(id) ON DELETE CASCADE,
    implant_box_id UUID REFERENCES implant_boxes(id) ON DELETE CASCADE,
    country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- CLEAR EXISTING DATA (OPTIONAL - UNCOMMENT IF YOU WANT TO RESET)
-- =============================================================================

-- DELETE FROM procedure_mappings;
-- DELETE FROM implant_boxes;
-- DELETE FROM surgery_sets;
-- DELETE FROM procedure_types;
-- DELETE FROM hospitals;
-- DELETE FROM departments;
-- DELETE FROM case_statuses;
-- DELETE FROM roles;
-- DELETE FROM countries;

-- =============================================================================
-- INSERT SEED DATA
-- =============================================================================

-- Insert Countries (using INSERT with WHERE NOT EXISTS to avoid duplicates)
INSERT INTO countries (code, name, is_active)
SELECT 'SG', 'Singapore', true
WHERE NOT EXISTS (SELECT 1 FROM countries WHERE name = 'Singapore');

INSERT INTO countries (code, name, is_active)
SELECT 'MY', 'Malaysia', true
WHERE NOT EXISTS (SELECT 1 FROM countries WHERE name = 'Malaysia');

INSERT INTO countries (code, name, is_active)
SELECT 'PH', 'Philippines', true
WHERE NOT EXISTS (SELECT 1 FROM countries WHERE name = 'Philippines');

INSERT INTO countries (code, name, is_active)
SELECT 'ID', 'Indonesia', true
WHERE NOT EXISTS (SELECT 1 FROM countries WHERE name = 'Indonesia');

INSERT INTO countries (code, name, is_active)
SELECT 'VN', 'Vietnam', true
WHERE NOT EXISTS (SELECT 1 FROM countries WHERE name = 'Vietnam');

INSERT INTO countries (code, name, is_active)
SELECT 'HK', 'Hongkong', true
WHERE NOT EXISTS (SELECT 1 FROM countries WHERE name = 'Hongkong');

INSERT INTO countries (code, name, is_active)
SELECT 'TH', 'Thailand', true
WHERE NOT EXISTS (SELECT 1 FROM countries WHERE name = 'Thailand');

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

-- Insert Departments for each country
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
    SELECT id INTO country_sg_id FROM countries WHERE name = 'Singapore';
    SELECT id INTO country_my_id FROM countries WHERE name = 'Malaysia';
    SELECT id INTO country_ph_id FROM countries WHERE name = 'Philippines';
    SELECT id INTO country_id_id FROM countries WHERE name = 'Indonesia';
    SELECT id INTO country_vn_id FROM countries WHERE name = 'Vietnam';
    SELECT id INTO country_hk_id FROM countries WHERE name = 'Hongkong';
    SELECT id INTO country_th_id FROM countries WHERE name = 'Thailand';

    -- Singapore departments
    IF country_sg_id IS NOT NULL THEN
        INSERT INTO departments (name, country_id) 
        SELECT dept_name, country_sg_id 
        FROM unnest(ARRAY[
            'Orthopedic Surgery', 'Neurosurgery', 'Cardiovascular Surgery', 'General Surgery',
            'Plastic Surgery', 'ENT Surgery', 'Ophthalmology', 'Urology', 'Trauma Surgery',
            'Spine Surgery', 'Hand Surgery', 'Sports Medicine', 'Joint Replacement',
            'Pediatric Surgery', 'Vascular Surgery', 'Thoracic Surgery', 'Oncology Surgery'
        ]) AS dept_name
        WHERE NOT EXISTS (
            SELECT 1 FROM departments 
            WHERE name = dept_name AND country_id = country_sg_id
        );
    END IF;

    -- Malaysia departments
    IF country_my_id IS NOT NULL THEN
        INSERT INTO departments (name, country_id) 
        SELECT dept_name, country_my_id 
        FROM unnest(ARRAY[
            'Orthopedic Surgery', 'Neurosurgery', 'Cardiovascular Surgery', 'General Surgery',
            'Plastic Surgery', 'ENT Surgery', 'Ophthalmology', 'Urology', 'Emergency Surgery',
            'Spine Surgery', 'Trauma Surgery', 'Joint Replacement', 'Sports Medicine',
            'Pediatric Surgery', 'Vascular Surgery', 'Oncology Surgery'
        ]) AS dept_name
        WHERE NOT EXISTS (
            SELECT 1 FROM departments 
            WHERE name = dept_name AND country_id = country_my_id
        );
    END IF;

    -- Philippines departments
    IF country_ph_id IS NOT NULL THEN
        INSERT INTO departments (name, country_id) 
        SELECT dept_name, country_ph_id 
        FROM unnest(ARRAY[
            'Orthopedic Surgery', 'Neurosurgery', 'Cardiovascular Surgery', 'General Surgery',
            'Plastic Surgery', 'ENT Surgery', 'Ophthalmology', 'Urology', 'Trauma Surgery',
            'Spine Surgery', 'Joint Replacement', 'Emergency Surgery', 'Pediatric Surgery',
            'Vascular Surgery', 'Thoracic Surgery'
        ]) AS dept_name
        WHERE NOT EXISTS (
            SELECT 1 FROM departments 
            WHERE name = dept_name AND country_id = country_ph_id
        );
    END IF;

    -- Indonesia departments
    IF country_id_id IS NOT NULL THEN
        INSERT INTO departments (name, country_id) 
        SELECT dept_name, country_id_id 
        FROM unnest(ARRAY[
            'Orthopedic Surgery', 'Neurosurgery', 'Cardiovascular Surgery', 'General Surgery',
            'Plastic Surgery', 'ENT Surgery', 'Ophthalmology', 'Urology', 'Trauma Surgery',
            'Spine Surgery', 'Joint Replacement', 'Emergency Surgery', 'Vascular Surgery'
        ]) AS dept_name
        WHERE NOT EXISTS (
            SELECT 1 FROM departments 
            WHERE name = dept_name AND country_id = country_id_id
        );
    END IF;

    -- Vietnam departments
    IF country_vn_id IS NOT NULL THEN
        INSERT INTO departments (name, country_id) 
        SELECT dept_name, country_vn_id 
        FROM unnest(ARRAY[
            'Orthopedic Surgery', 'Neurosurgery', 'Cardiovascular Surgery', 'General Surgery',
            'Plastic Surgery', 'ENT Surgery', 'Ophthalmology', 'Urology', 'Trauma Surgery',
            'Spine Surgery', 'Joint Replacement', 'Emergency Surgery'
        ]) AS dept_name
        WHERE NOT EXISTS (
            SELECT 1 FROM departments 
            WHERE name = dept_name AND country_id = country_vn_id
        );
    END IF;

    -- Hongkong departments
    IF country_hk_id IS NOT NULL THEN
        INSERT INTO departments (name, country_id) 
        SELECT dept_name, country_hk_id 
        FROM unnest(ARRAY[
            'Orthopedic Surgery', 'Neurosurgery', 'Cardiovascular Surgery', 'General Surgery',
            'Plastic Surgery', 'ENT Surgery', 'Ophthalmology', 'Urology', 'Trauma Surgery',
            'Spine Surgery', 'Hand Surgery', 'Sports Medicine', 'Joint Replacement',
            'Pediatric Surgery', 'Vascular Surgery', 'Thoracic Surgery', 'Oncology Surgery'
        ]) AS dept_name
        WHERE NOT EXISTS (
            SELECT 1 FROM departments 
            WHERE name = dept_name AND country_id = country_hk_id
        );
    END IF;

    -- Thailand departments
    IF country_th_id IS NOT NULL THEN
        INSERT INTO departments (name, country_id) 
        SELECT dept_name, country_th_id 
        FROM unnest(ARRAY[
            'Orthopedic Surgery', 'Neurosurgery', 'Cardiovascular Surgery', 'General Surgery',
            'Plastic Surgery', 'ENT Surgery', 'Ophthalmology', 'Urology', 'Trauma Surgery',
            'Spine Surgery', 'Joint Replacement', 'Sports Medicine', 'Vascular Surgery'
        ]) AS dept_name
        WHERE NOT EXISTS (
            SELECT 1 FROM departments 
            WHERE name = dept_name AND country_id = country_th_id
        );
    END IF;
END $$;

-- Insert Hospitals for each country
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
    SELECT id INTO country_sg_id FROM countries WHERE name = 'Singapore';
    SELECT id INTO country_my_id FROM countries WHERE name = 'Malaysia';
    SELECT id INTO country_ph_id FROM countries WHERE name = 'Philippines';
    SELECT id INTO country_id_id FROM countries WHERE name = 'Indonesia';
    SELECT id INTO country_vn_id FROM countries WHERE name = 'Vietnam';
    SELECT id INTO country_hk_id FROM countries WHERE name = 'Hongkong';
    SELECT id INTO country_th_id FROM countries WHERE name = 'Thailand';

    -- Singapore hospitals
    IF country_sg_id IS NOT NULL THEN
        INSERT INTO hospitals (name, country_id) 
        SELECT hospital_name, country_sg_id 
        FROM unnest(ARRAY[
            'Singapore General Hospital', 'National University Hospital', 'Tan Tock Seng Hospital',
            'Changi General Hospital', 'KK Women''s and Children''s Hospital', 'Institute of Mental Health',
            'Singapore National Eye Centre', 'National Heart Centre Singapore', 'National Cancer Centre Singapore',
            'Mount Elizabeth Hospital', 'Gleneagles Hospital', 'Raffles Hospital',
            'Parkway East Hospital', 'Mount Alvernia Hospital'
        ]) AS hospital_name
        WHERE NOT EXISTS (
            SELECT 1 FROM hospitals 
            WHERE name = hospital_name AND country_id = country_sg_id
        );
    END IF;

    -- Malaysia hospitals
    IF country_my_id IS NOT NULL THEN
        INSERT INTO hospitals (name, country_id) 
        SELECT hospital_name, country_my_id 
        FROM unnest(ARRAY[
            'Hospital Kuala Lumpur', 'University Malaya Medical Centre', 'Hospital Sultanah Aminah',
            'Hospital Selayang', 'Hospital Raja Permaisuri Bainun', 'Hospital Sungai Buloh',
            'Gleneagles Kuala Lumpur', 'Sunway Medical Centre', 'Prince Court Medical Centre',
            'Pantai Hospital Kuala Lumpur', 'Hospital Ampang', 'Hospital Putrajaya'
        ]) AS hospital_name
        WHERE NOT EXISTS (
            SELECT 1 FROM hospitals 
            WHERE name = hospital_name AND country_id = country_my_id
        );
    END IF;

    -- Philippines hospitals
    IF country_ph_id IS NOT NULL THEN
        INSERT INTO hospitals (name, country_id) 
        SELECT hospital_name, country_ph_id 
        FROM unnest(ARRAY[
            'Philippine General Hospital', 'St. Luke''s Medical Center', 'Makati Medical Center',
            'Asian Hospital and Medical Center', 'The Medical City', 'Cardinal Santos Medical Center',
            'Veterans Memorial Medical Center', 'Jose Reyes Memorial Medical Center',
            'Philippine Heart Center', 'National Kidney and Transplant Institute',
            'Research Institute for Tropical Medicine'
        ]) AS hospital_name
        WHERE NOT EXISTS (
            SELECT 1 FROM hospitals 
            WHERE name = hospital_name AND country_id = country_ph_id
        );
    END IF;

    -- Indonesia hospitals
    IF country_id_id IS NOT NULL THEN
        INSERT INTO hospitals (name, country_id) 
        SELECT hospital_name, country_id_id 
        FROM unnest(ARRAY[
            'Cipto Mangunkusumo Hospital', 'Persahabatan Hospital', 'Fatmawati Hospital',
            'Dr. Soetomo Hospital', 'Dr. Sardjito Hospital', 'Dr. Hasan Sadikin Hospital',
            'Siloam Hospitals Kebon Jeruk', 'RS Pondok Indah', 'Mayapada Hospital',
            'RSUP Dr. Kariadi', 'RS Premier Bintaro'
        ]) AS hospital_name
        WHERE NOT EXISTS (
            SELECT 1 FROM hospitals 
            WHERE name = hospital_name AND country_id = country_id_id
        );
    END IF;

    -- Vietnam hospitals
    IF country_vn_id IS NOT NULL THEN
        INSERT INTO hospitals (name, country_id) 
        SELECT hospital_name, country_vn_id 
        FROM unnest(ARRAY[
            'Bach Mai Hospital', 'Cho Ray Hospital', 'Vietnam National University Hospital',
            'Hospital for Tropical Diseases', 'University Medical Center Ho Chi Minh City',
            'Vinmec Central Park', 'FV Hospital', 'International Hospital Ho Chi Minh City',
            'Hanoi French Hospital', 'Family Medical Practice'
        ]) AS hospital_name
        WHERE NOT EXISTS (
            SELECT 1 FROM hospitals 
            WHERE name = hospital_name AND country_id = country_vn_id
        );
    END IF;

    -- Hongkong hospitals
    IF country_hk_id IS NOT NULL THEN
        INSERT INTO hospitals (name, country_id) 
        SELECT hospital_name, country_hk_id 
        FROM unnest(ARRAY[
            'Queen Mary Hospital', 'Prince of Wales Hospital', 'Queen Elizabeth Hospital',
            'Tuen Mun Hospital', 'Princess Margaret Hospital', 'United Christian Hospital',
            'Pamela Youde Nethersole Eastern Hospital', 'Kwong Wah Hospital',
            'Hong Kong Sanatorium & Hospital', 'Baptist Hospital', 'Matilda International Hospital'
        ]) AS hospital_name
        WHERE NOT EXISTS (
            SELECT 1 FROM hospitals 
            WHERE name = hospital_name AND country_id = country_hk_id
        );
    END IF;

    -- Thailand hospitals
    IF country_th_id IS NOT NULL THEN
        INSERT INTO hospitals (name, country_id) 
        SELECT hospital_name, country_th_id 
        FROM unnest(ARRAY[
            'Siriraj Hospital', 'Chulalongkorn Hospital', 'Ramathibodi Hospital',
            'Bumrungrad International Hospital', 'Bangkok Hospital', 'Samitivej Hospital',
            'BNH Hospital', 'Phyathai Hospital', 'Vichaiyut Hospital',
            'King Chulalongkorn Memorial Hospital', 'Mahidol University Hospital'
        ]) AS hospital_name
        WHERE NOT EXISTS (
            SELECT 1 FROM hospitals 
            WHERE name = hospital_name AND country_id = country_th_id
        );
    END IF;
END $$;

-- Insert Procedure Types for each country
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
    SELECT id INTO country_sg_id FROM countries WHERE name = 'Singapore';
    SELECT id INTO country_my_id FROM countries WHERE name = 'Malaysia';
    SELECT id INTO country_ph_id FROM countries WHERE name = 'Philippines';
    SELECT id INTO country_id_id FROM countries WHERE name = 'Indonesia';
    SELECT id INTO country_vn_id FROM countries WHERE name = 'Vietnam';
    SELECT id INTO country_hk_id FROM countries WHERE name = 'Hongkong';
    SELECT id INTO country_th_id FROM countries WHERE name = 'Thailand';

    -- Singapore procedure types
    IF country_sg_id IS NOT NULL THEN
        INSERT INTO procedure_types (name, country_id) 
        SELECT procedure_name, country_sg_id 
        FROM unnest(ARRAY[
            'Total Knee Replacement', 'Total Hip Replacement', 'Partial Knee Replacement',
            'Hip Resurfacing', 'Shoulder Replacement', 'Ankle Replacement',
            'Spinal Fusion', 'Laminectomy', 'Discectomy', 'Cervical Fusion',
            'Craniotomy', 'Deep Brain Stimulation', 'Aneurysm Clipping',
            'Coronary Artery Bypass', 'Valve Replacement', 'Pacemaker Implantation',
            'Arthroscopy', 'ACL Reconstruction', 'Rotator Cuff Repair',
            'Carpal Tunnel Release', 'Hand Reconstruction', 'Fracture Fixation'
        ]) AS procedure_name
        WHERE NOT EXISTS (
            SELECT 1 FROM procedure_types 
            WHERE name = procedure_name AND country_id = country_sg_id
        );
    END IF;

    -- Malaysia procedure types
    IF country_my_id IS NOT NULL THEN
        INSERT INTO procedure_types (name, country_id) 
        SELECT procedure_name, country_my_id 
        FROM unnest(ARRAY[
            'Total Knee Replacement', 'Total Hip Replacement', 'Partial Knee Replacement',
            'Spinal Fusion', 'Laminectomy', 'Discectomy', 'Cervical Fusion',
            'Craniotomy', 'Aneurysm Repair', 'Coronary Artery Bypass',
            'Valve Replacement', 'Arthroscopy', 'ACL Reconstruction',
            'Fracture Fixation', 'Joint Replacement', 'Spine Surgery'
        ]) AS procedure_name
        WHERE NOT EXISTS (
            SELECT 1 FROM procedure_types 
            WHERE name = procedure_name AND country_id = country_my_id
        );
    END IF;

    -- Philippines procedure types
    IF country_ph_id IS NOT NULL THEN
        INSERT INTO procedure_types (name, country_id) 
        SELECT procedure_name, country_ph_id 
        FROM unnest(ARRAY[
            'Total Knee Replacement', 'Total Hip Replacement', 'Spinal Fusion',
            'Laminectomy', 'Craniotomy', 'Coronary Artery Bypass',
            'Arthroscopy', 'Fracture Fixation', 'Joint Replacement',
            'ACL Reconstruction', 'Spine Surgery', 'Neurosurgery'
        ]) AS procedure_name
        WHERE NOT EXISTS (
            SELECT 1 FROM procedure_types 
            WHERE name = procedure_name AND country_id = country_ph_id
        );
    END IF;

    -- Indonesia procedure types
    IF country_id_id IS NOT NULL THEN
        INSERT INTO procedure_types (name, country_id) 
        SELECT procedure_name, country_id_id 
        FROM unnest(ARRAY[
            'Total Knee Replacement', 'Total Hip Replacement', 'Spinal Fusion',
            'Craniotomy', 'Arthroscopy', 'Fracture Fixation',
            'Joint Replacement', 'Spine Surgery', 'Neurosurgery', 'Heart Surgery'
        ]) AS procedure_name
        WHERE NOT EXISTS (
            SELECT 1 FROM procedure_types 
            WHERE name = procedure_name AND country_id = country_id_id
        );
    END IF;

    -- Vietnam procedure types
    IF country_vn_id IS NOT NULL THEN
        INSERT INTO procedure_types (name, country_id) 
        SELECT procedure_name, country_vn_id 
        FROM unnest(ARRAY[
            'Total Knee Replacement', 'Total Hip Replacement', 'Spinal Fusion',
            'Arthroscopy', 'Fracture Fixation', 'Joint Replacement',
            'Spine Surgery', 'Heart Surgery', 'General Surgery'
        ]) AS procedure_name
        WHERE NOT EXISTS (
            SELECT 1 FROM procedure_types 
            WHERE name = procedure_name AND country_id = country_vn_id
        );
    END IF;

    -- Hongkong procedure types
    IF country_hk_id IS NOT NULL THEN
        INSERT INTO procedure_types (name, country_id) 
        SELECT procedure_name, country_hk_id 
        FROM unnest(ARRAY[
            'Total Knee Replacement', 'Total Hip Replacement', 'Partial Knee Replacement',
            'Hip Resurfacing', 'Shoulder Replacement', 'Spinal Fusion',
            'Laminectomy', 'Craniotomy', 'Coronary Artery Bypass',
            'Arthroscopy', 'ACL Reconstruction', 'Fracture Fixation'
        ]) AS procedure_name
        WHERE NOT EXISTS (
            SELECT 1 FROM procedure_types 
            WHERE name = procedure_name AND country_id = country_hk_id
        );
    END IF;

    -- Thailand procedure types
    IF country_th_id IS NOT NULL THEN
        INSERT INTO procedure_types (name, country_id) 
        SELECT procedure_name, country_th_id 
        FROM unnest(ARRAY[
            'Total Knee Replacement', 'Total Hip Replacement', 'Spinal Fusion',
            'Laminectomy', 'Craniotomy', 'Arthroscopy',
            'Fracture Fixation', 'Joint Replacement', 'Spine Surgery'
        ]) AS procedure_name
        WHERE NOT EXISTS (
            SELECT 1 FROM procedure_types 
            WHERE name = procedure_name AND country_id = country_th_id
        );
    END IF;
END $$;

-- Insert Surgery Sets for each country
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
    SELECT id INTO country_sg_id FROM countries WHERE name = 'Singapore';
    SELECT id INTO country_my_id FROM countries WHERE name = 'Malaysia';
    SELECT id INTO country_ph_id FROM countries WHERE name = 'Philippines';
    SELECT id INTO country_id_id FROM countries WHERE name = 'Indonesia';
    SELECT id INTO country_vn_id FROM countries WHERE name = 'Vietnam';
    SELECT id INTO country_hk_id FROM countries WHERE name = 'Hongkong';
    SELECT id INTO country_th_id FROM countries WHERE name = 'Thailand';

    -- Singapore surgery sets
    IF country_sg_id IS NOT NULL THEN
        INSERT INTO surgery_sets (name, country_id) 
        SELECT set_name, country_sg_id 
        FROM unnest(ARRAY[
            'Basic Orthopedic Set', 'Total Knee Set', 'Total Hip Set', 'Spine Fusion Set',
            'Trauma Set', 'Arthroscopy Set', 'Hand Surgery Set', 'Shoulder Set',
            'Basic Neurosurgery Set', 'Craniotomy Set', 'Spine Neurosurgery Set',
            'Cardiovascular Set', 'Thoracic Set', 'Vascular Set',
            'General Surgery Set', 'Laparoscopic Set', 'Plastic Surgery Set',
            'ENT Set', 'Ophthalmology Set', 'Urology Set'
        ]) AS set_name
        WHERE NOT EXISTS (
            SELECT 1 FROM surgery_sets 
            WHERE name = set_name AND country_id = country_sg_id
        );
    END IF;

    -- Malaysia surgery sets
    IF country_my_id IS NOT NULL THEN
        INSERT INTO surgery_sets (name, country_id) 
        SELECT set_name, country_my_id 
        FROM unnest(ARRAY[
            'Basic Orthopedic Set', 'Total Knee Set', 'Total Hip Set', 'Spine Fusion Set',
            'Trauma Set', 'Arthroscopy Set', 'Basic Neurosurgery Set',
            'Cardiovascular Set', 'General Surgery Set', 'Laparoscopic Set',
            'Plastic Surgery Set', 'ENT Set', 'Urology Set'
        ]) AS set_name
        WHERE NOT EXISTS (
            SELECT 1 FROM surgery_sets 
            WHERE name = set_name AND country_id = country_my_id
        );
    END IF;

    -- Philippines surgery sets
    IF country_ph_id IS NOT NULL THEN
        INSERT INTO surgery_sets (name, country_id) 
        SELECT set_name, country_ph_id 
        FROM unnest(ARRAY[
            'Basic Orthopedic Set', 'Total Knee Set', 'Total Hip Set', 'Spine Fusion Set',
            'Trauma Set', 'Basic Neurosurgery Set', 'Cardiovascular Set',
            'General Surgery Set', 'Plastic Surgery Set', 'ENT Set'
        ]) AS set_name
        WHERE NOT EXISTS (
            SELECT 1 FROM surgery_sets 
            WHERE name = set_name AND country_id = country_ph_id
        );
    END IF;

    -- Indonesia surgery sets
    IF country_id_id IS NOT NULL THEN
        INSERT INTO surgery_sets (name, country_id) 
        SELECT set_name, country_id_id 
        FROM unnest(ARRAY[
            'Basic Orthopedic Set', 'Total Knee Set', 'Total Hip Set', 'Spine Fusion Set',
            'Trauma Set', 'Basic Neurosurgery Set', 'Cardiovascular Set',
            'General Surgery Set', 'ENT Set'
        ]) AS set_name
        WHERE NOT EXISTS (
            SELECT 1 FROM surgery_sets 
            WHERE name = set_name AND country_id = country_id_id
        );
    END IF;

    -- Vietnam surgery sets
    IF country_vn_id IS NOT NULL THEN
        INSERT INTO surgery_sets (name, country_id) 
        SELECT set_name, country_vn_id 
        FROM unnest(ARRAY[
            'Basic Orthopedic Set', 'Total Knee Set', 'Total Hip Set', 'Spine Fusion Set',
            'Trauma Set', 'General Surgery Set', 'Cardiovascular Set'
        ]) AS set_name
        WHERE NOT EXISTS (
            SELECT 1 FROM surgery_sets 
            WHERE name = set_name AND country_id = country_vn_id
        );
    END IF;

    -- Hongkong surgery sets
    IF country_hk_id IS NOT NULL THEN
        INSERT INTO surgery_sets (name, country_id) 
        SELECT set_name, country_hk_id 
        FROM unnest(ARRAY[
            'Basic Orthopedic Set', 'Total Knee Set', 'Total Hip Set', 'Spine Fusion Set',
            'Trauma Set', 'Arthroscopy Set', 'Hand Surgery Set', 'Basic Neurosurgery Set',
            'Cardiovascular Set', 'General Surgery Set', 'Laparoscopic Set'
        ]) AS set_name
        WHERE NOT EXISTS (
            SELECT 1 FROM surgery_sets 
            WHERE name = set_name AND country_id = country_hk_id
        );
    END IF;

    -- Thailand surgery sets
    IF country_th_id IS NOT NULL THEN
        INSERT INTO surgery_sets (name, country_id) 
        SELECT set_name, country_th_id 
        FROM unnest(ARRAY[
            'Basic Orthopedic Set', 'Total Knee Set', 'Total Hip Set', 'Spine Fusion Set',
            'Trauma Set', 'Basic Neurosurgery Set', 'General Surgery Set'
        ]) AS set_name
        WHERE NOT EXISTS (
            SELECT 1 FROM surgery_sets 
            WHERE name = set_name AND country_id = country_th_id
        );
    END IF;
END $$;

-- Insert Implant Boxes for each country
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
    SELECT id INTO country_sg_id FROM countries WHERE name = 'Singapore';
    SELECT id INTO country_my_id FROM countries WHERE name = 'Malaysia';
    SELECT id INTO country_ph_id FROM countries WHERE name = 'Philippines';
    SELECT id INTO country_id_id FROM countries WHERE name = 'Indonesia';
    SELECT id INTO country_vn_id FROM countries WHERE name = 'Vietnam';
    SELECT id INTO country_hk_id FROM countries WHERE name = 'Hongkong';
    SELECT id INTO country_th_id FROM countries WHERE name = 'Thailand';

    -- Singapore implant boxes
    IF country_sg_id IS NOT NULL THEN
        INSERT INTO implant_boxes (name, country_id) 
        SELECT implant_name, country_sg_id 
        FROM unnest(ARRAY[
            'Knee Implant System', 'Hip Implant System', 'Shoulder Implant System',
            'Spine Implant System', 'Trauma Implant System', 'Hand Implant System',
            'Ankle Implant System', 'Elbow Implant System',
            'Pedicle Screw System', 'Cervical Plate System', 'Lumbar Cage System',
            'Cranial Plate System', 'Neurovascular Coils', 'DBS Lead System',
            'Cardiac Valve System', 'Stent Graft System', 'Pacemaker System',
            'Mesh Implant System', 'Bone Graft System', 'Soft Tissue Repair System'
        ]) AS implant_name
        WHERE NOT EXISTS (
            SELECT 1 FROM implant_boxes 
            WHERE name = implant_name AND country_id = country_sg_id
        );
    END IF;

    -- Malaysia implant boxes
    IF country_my_id IS NOT NULL THEN
        INSERT INTO implant_boxes (name, country_id) 
        SELECT implant_name, country_my_id 
        FROM unnest(ARRAY[
            'Knee Implant System', 'Hip Implant System', 'Shoulder Implant System',
            'Spine Implant System', 'Trauma Implant System',
            'Pedicle Screw System', 'Cervical Plate System',
            'Cardiac Valve System', 'Stent System', 'Mesh Implant System'
        ]) AS implant_name
        WHERE NOT EXISTS (
            SELECT 1 FROM implant_boxes 
            WHERE name = implant_name AND country_id = country_my_id
        );
    END IF;

    -- Philippines implant boxes
    IF country_ph_id IS NOT NULL THEN
        INSERT INTO implant_boxes (name, country_id) 
        SELECT implant_name, country_ph_id 
        FROM unnest(ARRAY[
            'Knee Implant System', 'Hip Implant System', 'Spine Implant System',
            'Trauma Implant System', 'Pedicle Screw System',
            'Cardiac Valve System', 'Mesh Implant System'
        ]) AS implant_name
        WHERE NOT EXISTS (
            SELECT 1 FROM implant_boxes 
            WHERE name = implant_name AND country_id = country_ph_id
        );
    END IF;

    -- Indonesia implant boxes
    IF country_id_id IS NOT NULL THEN
        INSERT INTO implant_boxes (name, country_id) 
        SELECT implant_name, country_id_id 
        FROM unnest(ARRAY[
            'Knee Implant System', 'Hip Implant System', 'Spine Implant System',
            'Trauma Implant System', 'Cardiac Valve System'
        ]) AS implant_name
        WHERE NOT EXISTS (
            SELECT 1 FROM implant_boxes 
            WHERE name = implant_name AND country_id = country_id_id
        );
    END IF;

    -- Vietnam implant boxes
    IF country_vn_id IS NOT NULL THEN
        INSERT INTO implant_boxes (name, country_id) 
        SELECT implant_name, country_vn_id 
        FROM unnest(ARRAY[
            'Knee Implant System', 'Hip Implant System', 'Spine Implant System',
            'Trauma Implant System'
        ]) AS implant_name
        WHERE NOT EXISTS (
            SELECT 1 FROM implant_boxes 
            WHERE name = implant_name AND country_id = country_vn_id
        );
    END IF;

    -- Hongkong implant boxes
    IF country_hk_id IS NOT NULL THEN
        INSERT INTO implant_boxes (name, country_id) 
        SELECT implant_name, country_hk_id 
        FROM unnest(ARRAY[
            'Knee Implant System', 'Hip Implant System', 'Shoulder Implant System',
            'Spine Implant System', 'Trauma Implant System', 'Hand Implant System',
            'Pedicle Screw System', 'Cardiac Valve System', 'Mesh Implant System'
        ]) AS implant_name
        WHERE NOT EXISTS (
            SELECT 1 FROM implant_boxes 
            WHERE name = implant_name AND country_id = country_hk_id
        );
    END IF;

    -- Thailand implant boxes
    IF country_th_id IS NOT NULL THEN
        INSERT INTO implant_boxes (name, country_id) 
        SELECT implant_name, country_th_id 
        FROM unnest(ARRAY[
            'Knee Implant System', 'Hip Implant System', 'Spine Implant System',
            'Trauma Implant System', 'Cardiac Valve System'
        ]) AS implant_name
        WHERE NOT EXISTS (
            SELECT 1 FROM implant_boxes 
            WHERE name = implant_name AND country_id = country_th_id
        );
    END IF;
END $$;

-- =============================================================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code);
CREATE INDEX IF NOT EXISTS idx_countries_name ON countries(name);
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_departments_country ON departments(country_id);
CREATE INDEX IF NOT EXISTS idx_hospitals_country ON hospitals(country_id);
CREATE INDEX IF NOT EXISTS idx_procedure_types_country ON procedure_types(country_id);
CREATE INDEX IF NOT EXISTS idx_surgery_sets_country ON surgery_sets(country_id);
CREATE INDEX IF NOT EXISTS idx_implant_boxes_country ON implant_boxes(country_id);

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify data was inserted correctly
SELECT 
    'Countries' as table_name, COUNT(*) as record_count 
FROM countries
UNION ALL
SELECT 
    'Roles' as table_name, COUNT(*) as record_count 
FROM roles
UNION ALL
SELECT 
    'Case Statuses' as table_name, COUNT(*) as record_count 
FROM case_statuses
UNION ALL
SELECT 
    'Departments' as table_name, COUNT(*) as record_count 
FROM departments
UNION ALL
SELECT 
    'Hospitals' as table_name, COUNT(*) as record_count 
FROM hospitals
UNION ALL
SELECT 
    'Procedure Types' as table_name, COUNT(*) as record_count 
FROM procedure_types
UNION ALL
SELECT 
    'Surgery Sets' as table_name, COUNT(*) as record_count 
FROM surgery_sets
UNION ALL
SELECT 
    'Implant Boxes' as table_name, COUNT(*) as record_count 
FROM implant_boxes
ORDER BY table_name;

-- Show sample data by country
SELECT 
    c.name as country,
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
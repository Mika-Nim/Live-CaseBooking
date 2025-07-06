-- =============================================================================
-- TM Case Booking System - Complete Schema and Realistic Seed Data
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
-- INSERT SEED DATA
-- =============================================================================

-- Insert Countries
INSERT INTO countries (code, name, is_active) VALUES
    ('SG', 'Singapore', true),
    ('MY', 'Malaysia', true),
    ('PH', 'Philippines', true),
    ('ID', 'Indonesia', true),
    ('VN', 'Vietnam', true),
    ('HK', 'Hongkong', true),
    ('TH', 'Thailand', true)
ON CONFLICT (name) DO NOTHING;

-- Insert Roles
INSERT INTO roles (name, display_name, description, color) VALUES
    ('admin', 'Administrator', 'Full system access and user management', '#dc2626'),
    ('operations', 'Operations Manager', 'Manages case operations and workflows', '#2563eb'),
    ('operations-manager', 'Senior Operations Manager', 'Senior operations oversight', '#1d4ed8'),
    ('it', 'IT Support', 'Technical support and system maintenance', '#059669'),
    ('warehouse', 'Warehouse Staff', 'Inventory and logistics management', '#7c3aed'),
    ('sales', 'Sales Representative', 'Customer relations and sales support', '#ea580c')
ON CONFLICT (name) DO NOTHING;

-- Insert Case Statuses
INSERT INTO case_statuses (status_key, display_name, description, color, icon, sort_order) VALUES
    ('case_booked', 'Case Booked', 'Initial case booking', '#3b82f6', '📅', 1),
    ('order_preparation', 'Order Preparation', 'Order being prepared', '#f59e0b', '📋', 2),
    ('order_prepared', 'Order Prepared', 'Order ready for delivery', '#10b981', '✅', 3),
    ('delivered_hospital', 'Delivered (Hospital)', 'Delivered to hospital', '#8b5cf6', '🚚', 4),
    ('case_completed', 'Case Completed', 'Surgery completed', '#06b6d4', '🏥', 5),
    ('case_cancelled', 'Case Cancelled', 'Case cancelled', '#ef4444', '❌', 6),
    ('case_closed', 'Case Closed', 'Case closed', '#6b7280', '🔒', 7)
ON CONFLICT (status_key) DO NOTHING;

-- Insert Departments for each country
DO $$
DECLARE
    country_record RECORD;
    dept_name TEXT;
BEGIN
    -- Singapore departments
    SELECT id INTO country_record FROM countries WHERE name = 'Singapore';
    IF FOUND THEN
        FOR dept_name IN SELECT unnest(ARRAY[
            'Orthopedic Surgery', 'Neurosurgery', 'Cardiovascular Surgery', 'General Surgery',
            'Plastic Surgery', 'ENT Surgery', 'Ophthalmology', 'Urology', 'Trauma Surgery',
            'Spine Surgery', 'Hand Surgery', 'Sports Medicine', 'Joint Replacement',
            'Pediatric Surgery', 'Vascular Surgery', 'Thoracic Surgery', 'Oncology Surgery'
        ]) LOOP
            INSERT INTO departments (name, country_id) VALUES (dept_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Malaysia departments
    SELECT id INTO country_record FROM countries WHERE name = 'Malaysia';
    IF FOUND THEN
        FOR dept_name IN SELECT unnest(ARRAY[
            'Orthopedic Surgery', 'Neurosurgery', 'Cardiovascular Surgery', 'General Surgery',
            'Plastic Surgery', 'ENT Surgery', 'Ophthalmology', 'Urology', 'Emergency Surgery',
            'Spine Surgery', 'Trauma Surgery', 'Joint Replacement', 'Sports Medicine',
            'Pediatric Surgery', 'Vascular Surgery', 'Oncology Surgery'
        ]) LOOP
            INSERT INTO departments (name, country_id) VALUES (dept_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Philippines departments
    SELECT id INTO country_record FROM countries WHERE name = 'Philippines';
    IF FOUND THEN
        FOR dept_name IN SELECT unnest(ARRAY[
            'Orthopedic Surgery', 'Neurosurgery', 'Cardiovascular Surgery', 'General Surgery',
            'Plastic Surgery', 'ENT Surgery', 'Ophthalmology', 'Urology', 'Trauma Surgery',
            'Spine Surgery', 'Joint Replacement', 'Emergency Surgery', 'Pediatric Surgery',
            'Vascular Surgery', 'Thoracic Surgery'
        ]) LOOP
            INSERT INTO departments (name, country_id) VALUES (dept_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Indonesia departments
    SELECT id INTO country_record FROM countries WHERE name = 'Indonesia';
    IF FOUND THEN
        FOR dept_name IN SELECT unnest(ARRAY[
            'Orthopedic Surgery', 'Neurosurgery', 'Cardiovascular Surgery', 'General Surgery',
            'Plastic Surgery', 'ENT Surgery', 'Ophthalmology', 'Urology', 'Trauma Surgery',
            'Spine Surgery', 'Joint Replacement', 'Emergency Surgery', 'Vascular Surgery'
        ]) LOOP
            INSERT INTO departments (name, country_id) VALUES (dept_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Vietnam departments
    SELECT id INTO country_record FROM countries WHERE name = 'Vietnam';
    IF FOUND THEN
        FOR dept_name IN SELECT unnest(ARRAY[
            'Orthopedic Surgery', 'Neurosurgery', 'Cardiovascular Surgery', 'General Surgery',
            'Plastic Surgery', 'ENT Surgery', 'Ophthalmology', 'Urology', 'Trauma Surgery',
            'Spine Surgery', 'Joint Replacement', 'Emergency Surgery'
        ]) LOOP
            INSERT INTO departments (name, country_id) VALUES (dept_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Hongkong departments
    SELECT id INTO country_record FROM countries WHERE name = 'Hongkong';
    IF FOUND THEN
        FOR dept_name IN SELECT unnest(ARRAY[
            'Orthopedic Surgery', 'Neurosurgery', 'Cardiovascular Surgery', 'General Surgery',
            'Plastic Surgery', 'ENT Surgery', 'Ophthalmology', 'Urology', 'Trauma Surgery',
            'Spine Surgery', 'Hand Surgery', 'Sports Medicine', 'Joint Replacement',
            'Pediatric Surgery', 'Vascular Surgery', 'Thoracic Surgery', 'Oncology Surgery'
        ]) LOOP
            INSERT INTO departments (name, country_id) VALUES (dept_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Thailand departments
    SELECT id INTO country_record FROM countries WHERE name = 'Thailand';
    IF FOUND THEN
        FOR dept_name IN SELECT unnest(ARRAY[
            'Orthopedic Surgery', 'Neurosurgery', 'Cardiovascular Surgery', 'General Surgery',
            'Plastic Surgery', 'ENT Surgery', 'Ophthalmology', 'Urology', 'Trauma Surgery',
            'Spine Surgery', 'Joint Replacement', 'Sports Medicine', 'Vascular Surgery'
        ]) LOOP
            INSERT INTO departments (name, country_id) VALUES (dept_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
END $$;

-- Insert Hospitals for each country
DO $$
DECLARE
    country_record RECORD;
    hospital_name TEXT;
BEGIN
    -- Singapore hospitals
    SELECT id INTO country_record FROM countries WHERE name = 'Singapore';
    IF FOUND THEN
        FOR hospital_name IN SELECT unnest(ARRAY[
            'Singapore General Hospital', 'National University Hospital', 'Tan Tock Seng Hospital',
            'Changi General Hospital', 'KK Women''s and Children''s Hospital', 'Institute of Mental Health',
            'Singapore National Eye Centre', 'National Heart Centre Singapore', 'National Cancer Centre Singapore',
            'Mount Elizabeth Hospital', 'Gleneagles Hospital', 'Raffles Hospital',
            'Parkway East Hospital', 'Mount Alvernia Hospital'
        ]) LOOP
            INSERT INTO hospitals (name, country_id) VALUES (hospital_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Malaysia hospitals
    SELECT id INTO country_record FROM countries WHERE name = 'Malaysia';
    IF FOUND THEN
        FOR hospital_name IN SELECT unnest(ARRAY[
            'Hospital Kuala Lumpur', 'University Malaya Medical Centre', 'Hospital Sultanah Aminah',
            'Hospital Selayang', 'Hospital Raja Permaisuri Bainun', 'Hospital Sungai Buloh',
            'Gleneagles Kuala Lumpur', 'Sunway Medical Centre', 'Prince Court Medical Centre',
            'Pantai Hospital Kuala Lumpur', 'Hospital Ampang', 'Hospital Putrajaya'
        ]) LOOP
            INSERT INTO hospitals (name, country_id) VALUES (hospital_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Philippines hospitals
    SELECT id INTO country_record FROM countries WHERE name = 'Philippines';
    IF FOUND THEN
        FOR hospital_name IN SELECT unnest(ARRAY[
            'Philippine General Hospital', 'St. Luke''s Medical Center', 'Makati Medical Center',
            'Asian Hospital and Medical Center', 'The Medical City', 'Cardinal Santos Medical Center',
            'Veterans Memorial Medical Center', 'Jose Reyes Memorial Medical Center',
            'Philippine Heart Center', 'National Kidney and Transplant Institute',
            'Research Institute for Tropical Medicine'
        ]) LOOP
            INSERT INTO hospitals (name, country_id) VALUES (hospital_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Indonesia hospitals
    SELECT id INTO country_record FROM countries WHERE name = 'Indonesia';
    IF FOUND THEN
        FOR hospital_name IN SELECT unnest(ARRAY[
            'Cipto Mangunkusumo Hospital', 'Persahabatan Hospital', 'Fatmawati Hospital',
            'Dr. Soetomo Hospital', 'Dr. Sardjito Hospital', 'Dr. Hasan Sadikin Hospital',
            'Siloam Hospitals Kebon Jeruk', 'RS Pondok Indah', 'Mayapada Hospital',
            'RSUP Dr. Kariadi', 'RS Premier Bintaro'
        ]) LOOP
            INSERT INTO hospitals (name, country_id) VALUES (hospital_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Vietnam hospitals
    SELECT id INTO country_record FROM countries WHERE name = 'Vietnam';
    IF FOUND THEN
        FOR hospital_name IN SELECT unnest(ARRAY[
            'Bach Mai Hospital', 'Cho Ray Hospital', 'Vietnam National University Hospital',
            'Hospital for Tropical Diseases', 'University Medical Center Ho Chi Minh City',
            'Vinmec Central Park', 'FV Hospital', 'International Hospital Ho Chi Minh City',
            'Hanoi French Hospital', 'Family Medical Practice'
        ]) LOOP
            INSERT INTO hospitals (name, country_id) VALUES (hospital_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Hongkong hospitals
    SELECT id INTO country_record FROM countries WHERE name = 'Hongkong';
    IF FOUND THEN
        FOR hospital_name IN SELECT unnest(ARRAY[
            'Queen Mary Hospital', 'Prince of Wales Hospital', 'Queen Elizabeth Hospital',
            'Tuen Mun Hospital', 'Princess Margaret Hospital', 'United Christian Hospital',
            'Pamela Youde Nethersole Eastern Hospital', 'Kwong Wah Hospital',
            'Hong Kong Sanatorium & Hospital', 'Baptist Hospital', 'Matilda International Hospital'
        ]) LOOP
            INSERT INTO hospitals (name, country_id) VALUES (hospital_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Thailand hospitals
    SELECT id INTO country_record FROM countries WHERE name = 'Thailand';
    IF FOUND THEN
        FOR hospital_name IN SELECT unnest(ARRAY[
            'Siriraj Hospital', 'Chulalongkorn Hospital', 'Ramathibodi Hospital',
            'Bumrungrad International Hospital', 'Bangkok Hospital', 'Samitivej Hospital',
            'BNH Hospital', 'Phyathai Hospital', 'Vichaiyut Hospital',
            'King Chulalongkorn Memorial Hospital', 'Mahidol University Hospital'
        ]) LOOP
            INSERT INTO hospitals (name, country_id) VALUES (hospital_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
END $$;

-- Insert Procedure Types for each country
DO $$
DECLARE
    country_record RECORD;
    procedure_name TEXT;
BEGIN
    -- Singapore procedure types
    SELECT id INTO country_record FROM countries WHERE name = 'Singapore';
    IF FOUND THEN
        FOR procedure_name IN SELECT unnest(ARRAY[
            'Total Knee Replacement', 'Total Hip Replacement', 'Partial Knee Replacement',
            'Hip Resurfacing', 'Shoulder Replacement', 'Ankle Replacement',
            'Spinal Fusion', 'Laminectomy', 'Discectomy', 'Cervical Fusion',
            'Craniotomy', 'Deep Brain Stimulation', 'Aneurysm Clipping',
            'Coronary Artery Bypass', 'Valve Replacement', 'Pacemaker Implantation',
            'Arthroscopy', 'ACL Reconstruction', 'Rotator Cuff Repair',
            'Carpal Tunnel Release', 'Hand Reconstruction', 'Fracture Fixation'
        ]) LOOP
            INSERT INTO procedure_types (name, country_id) VALUES (procedure_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Malaysia procedure types
    SELECT id INTO country_record FROM countries WHERE name = 'Malaysia';
    IF FOUND THEN
        FOR procedure_name IN SELECT unnest(ARRAY[
            'Total Knee Replacement', 'Total Hip Replacement', 'Partial Knee Replacement',
            'Spinal Fusion', 'Laminectomy', 'Discectomy', 'Cervical Fusion',
            'Craniotomy', 'Aneurysm Repair', 'Coronary Artery Bypass',
            'Valve Replacement', 'Arthroscopy', 'ACL Reconstruction',
            'Fracture Fixation', 'Joint Replacement', 'Spine Surgery'
        ]) LOOP
            INSERT INTO procedure_types (name, country_id) VALUES (procedure_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Philippines procedure types
    SELECT id INTO country_record FROM countries WHERE name = 'Philippines';
    IF FOUND THEN
        FOR procedure_name IN SELECT unnest(ARRAY[
            'Total Knee Replacement', 'Total Hip Replacement', 'Spinal Fusion',
            'Laminectomy', 'Craniotomy', 'Coronary Artery Bypass',
            'Arthroscopy', 'Fracture Fixation', 'Joint Replacement',
            'ACL Reconstruction', 'Spine Surgery', 'Neurosurgery'
        ]) LOOP
            INSERT INTO procedure_types (name, country_id) VALUES (procedure_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Indonesia procedure types
    SELECT id INTO country_record FROM countries WHERE name = 'Indonesia';
    IF FOUND THEN
        FOR procedure_name IN SELECT unnest(ARRAY[
            'Total Knee Replacement', 'Total Hip Replacement', 'Spinal Fusion',
            'Craniotomy', 'Arthroscopy', 'Fracture Fixation',
            'Joint Replacement', 'Spine Surgery', 'Neurosurgery', 'Heart Surgery'
        ]) LOOP
            INSERT INTO procedure_types (name, country_id) VALUES (procedure_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Vietnam procedure types
    SELECT id INTO country_record FROM countries WHERE name = 'Vietnam';
    IF FOUND THEN
        FOR procedure_name IN SELECT unnest(ARRAY[
            'Total Knee Replacement', 'Total Hip Replacement', 'Spinal Fusion',
            'Arthroscopy', 'Fracture Fixation', 'Joint Replacement',
            'Spine Surgery', 'Heart Surgery', 'General Surgery'
        ]) LOOP
            INSERT INTO procedure_types (name, country_id) VALUES (procedure_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Hongkong procedure types
    SELECT id INTO country_record FROM countries WHERE name = 'Hongkong';
    IF FOUND THEN
        FOR procedure_name IN SELECT unnest(ARRAY[
            'Total Knee Replacement', 'Total Hip Replacement', 'Partial Knee Replacement',
            'Hip Resurfacing', 'Shoulder Replacement', 'Spinal Fusion',
            'Laminectomy', 'Craniotomy', 'Coronary Artery Bypass',
            'Arthroscopy', 'ACL Reconstruction', 'Fracture Fixation'
        ]) LOOP
            INSERT INTO procedure_types (name, country_id) VALUES (procedure_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Thailand procedure types
    SELECT id INTO country_record FROM countries WHERE name = 'Thailand';
    IF FOUND THEN
        FOR procedure_name IN SELECT unnest(ARRAY[
            'Total Knee Replacement', 'Total Hip Replacement', 'Spinal Fusion',
            'Laminectomy', 'Craniotomy', 'Arthroscopy',
            'Fracture Fixation', 'Joint Replacement', 'Spine Surgery'
        ]) LOOP
            INSERT INTO procedure_types (name, country_id) VALUES (procedure_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
END $$;

-- Insert Surgery Sets for each country
DO $$
DECLARE
    country_record RECORD;
    set_name TEXT;
BEGIN
    -- Singapore surgery sets
    SELECT id INTO country_record FROM countries WHERE name = 'Singapore';
    IF FOUND THEN
        FOR set_name IN SELECT unnest(ARRAY[
            'Basic Orthopedic Set', 'Total Knee Set', 'Total Hip Set', 'Spine Fusion Set',
            'Trauma Set', 'Arthroscopy Set', 'Hand Surgery Set', 'Shoulder Set',
            'Basic Neurosurgery Set', 'Craniotomy Set', 'Spine Neurosurgery Set',
            'Cardiovascular Set', 'Thoracic Set', 'Vascular Set',
            'General Surgery Set', 'Laparoscopic Set', 'Plastic Surgery Set',
            'ENT Set', 'Ophthalmology Set', 'Urology Set'
        ]) LOOP
            INSERT INTO surgery_sets (name, country_id) VALUES (set_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Malaysia surgery sets
    SELECT id INTO country_record FROM countries WHERE name = 'Malaysia';
    IF FOUND THEN
        FOR set_name IN SELECT unnest(ARRAY[
            'Basic Orthopedic Set', 'Total Knee Set', 'Total Hip Set', 'Spine Fusion Set',
            'Trauma Set', 'Arthroscopy Set', 'Basic Neurosurgery Set',
            'Cardiovascular Set', 'General Surgery Set', 'Laparoscopic Set',
            'Plastic Surgery Set', 'ENT Set', 'Urology Set'
        ]) LOOP
            INSERT INTO surgery_sets (name, country_id) VALUES (set_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Philippines surgery sets
    SELECT id INTO country_record FROM countries WHERE name = 'Philippines';
    IF FOUND THEN
        FOR set_name IN SELECT unnest(ARRAY[
            'Basic Orthopedic Set', 'Total Knee Set', 'Total Hip Set', 'Spine Fusion Set',
            'Trauma Set', 'Basic Neurosurgery Set', 'Cardiovascular Set',
            'General Surgery Set', 'Plastic Surgery Set', 'ENT Set'
        ]) LOOP
            INSERT INTO surgery_sets (name, country_id) VALUES (set_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Indonesia surgery sets
    SELECT id INTO country_record FROM countries WHERE name = 'Indonesia';
    IF FOUND THEN
        FOR set_name IN SELECT unnest(ARRAY[
            'Basic Orthopedic Set', 'Total Knee Set', 'Total Hip Set', 'Spine Fusion Set',
            'Trauma Set', 'Basic Neurosurgery Set', 'Cardiovascular Set',
            'General Surgery Set', 'ENT Set'
        ]) LOOP
            INSERT INTO surgery_sets (name, country_id) VALUES (set_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Vietnam surgery sets
    SELECT id INTO country_record FROM countries WHERE name = 'Vietnam';
    IF FOUND THEN
        FOR set_name IN SELECT unnest(ARRAY[
            'Basic Orthopedic Set', 'Total Knee Set', 'Total Hip Set', 'Spine Fusion Set',
            'Trauma Set', 'General Surgery Set', 'Cardiovascular Set'
        ]) LOOP
            INSERT INTO surgery_sets (name, country_id) VALUES (set_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Hongkong surgery sets
    SELECT id INTO country_record FROM countries WHERE name = 'Hongkong';
    IF FOUND THEN
        FOR set_name IN SELECT unnest(ARRAY[
            'Basic Orthopedic Set', 'Total Knee Set', 'Total Hip Set', 'Spine Fusion Set',
            'Trauma Set', 'Arthroscopy Set', 'Hand Surgery Set', 'Basic Neurosurgery Set',
            'Cardiovascular Set', 'General Surgery Set', 'Laparoscopic Set'
        ]) LOOP
            INSERT INTO surgery_sets (name, country_id) VALUES (set_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Thailand surgery sets
    SELECT id INTO country_record FROM countries WHERE name = 'Thailand';
    IF FOUND THEN
        FOR set_name IN SELECT unnest(ARRAY[
            'Basic Orthopedic Set', 'Total Knee Set', 'Total Hip Set', 'Spine Fusion Set',
            'Trauma Set', 'Basic Neurosurgery Set', 'General Surgery Set'
        ]) LOOP
            INSERT INTO surgery_sets (name, country_id) VALUES (set_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
END $$;

-- Insert Implant Boxes for each country
DO $$
DECLARE
    country_record RECORD;
    implant_name TEXT;
BEGIN
    -- Singapore implant boxes
    SELECT id INTO country_record FROM countries WHERE name = 'Singapore';
    IF FOUND THEN
        FOR implant_name IN SELECT unnest(ARRAY[
            'Knee Implant System', 'Hip Implant System', 'Shoulder Implant System',
            'Spine Implant System', 'Trauma Implant System', 'Hand Implant System',
            'Ankle Implant System', 'Elbow Implant System',
            'Pedicle Screw System', 'Cervical Plate System', 'Lumbar Cage System',
            'Cranial Plate System', 'Neurovascular Coils', 'DBS Lead System',
            'Cardiac Valve System', 'Stent Graft System', 'Pacemaker System',
            'Mesh Implant System', 'Bone Graft System', 'Soft Tissue Repair System'
        ]) LOOP
            INSERT INTO implant_boxes (name, country_id) VALUES (implant_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Malaysia implant boxes
    SELECT id INTO country_record FROM countries WHERE name = 'Malaysia';
    IF FOUND THEN
        FOR implant_name IN SELECT unnest(ARRAY[
            'Knee Implant System', 'Hip Implant System', 'Shoulder Implant System',
            'Spine Implant System', 'Trauma Implant System',
            'Pedicle Screw System', 'Cervical Plate System',
            'Cardiac Valve System', 'Stent System', 'Mesh Implant System'
        ]) LOOP
            INSERT INTO implant_boxes (name, country_id) VALUES (implant_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Philippines implant boxes
    SELECT id INTO country_record FROM countries WHERE name = 'Philippines';
    IF FOUND THEN
        FOR implant_name IN SELECT unnest(ARRAY[
            'Knee Implant System', 'Hip Implant System', 'Spine Implant System',
            'Trauma Implant System', 'Pedicle Screw System',
            'Cardiac Valve System', 'Mesh Implant System'
        ]) LOOP
            INSERT INTO implant_boxes (name, country_id) VALUES (implant_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Indonesia implant boxes
    SELECT id INTO country_record FROM countries WHERE name = 'Indonesia';
    IF FOUND THEN
        FOR implant_name IN SELECT unnest(ARRAY[
            'Knee Implant System', 'Hip Implant System', 'Spine Implant System',
            'Trauma Implant System', 'Cardiac Valve System'
        ]) LOOP
            INSERT INTO implant_boxes (name, country_id) VALUES (implant_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Vietnam implant boxes
    SELECT id INTO country_record FROM countries WHERE name = 'Vietnam';
    IF FOUND THEN
        FOR implant_name IN SELECT unnest(ARRAY[
            'Knee Implant System', 'Hip Implant System', 'Spine Implant System',
            'Trauma Implant System'
        ]) LOOP
            INSERT INTO implant_boxes (name, country_id) VALUES (implant_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Hongkong implant boxes
    SELECT id INTO country_record FROM countries WHERE name = 'Hongkong';
    IF FOUND THEN
        FOR implant_name IN SELECT unnest(ARRAY[
            'Knee Implant System', 'Hip Implant System', 'Shoulder Implant System',
            'Spine Implant System', 'Trauma Implant System', 'Hand Implant System',
            'Pedicle Screw System', 'Cardiac Valve System', 'Mesh Implant System'
        ]) LOOP
            INSERT INTO implant_boxes (name, country_id) VALUES (implant_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Thailand implant boxes
    SELECT id INTO country_record FROM countries WHERE name = 'Thailand';
    IF FOUND THEN
        FOR implant_name IN SELECT unnest(ARRAY[
            'Knee Implant System', 'Hip Implant System', 'Spine Implant System',
            'Trauma Implant System', 'Cardiac Valve System'
        ]) LOOP
            INSERT INTO implant_boxes (name, country_id) VALUES (implant_name, country_record.id) ON CONFLICT DO NOTHING;
        END LOOP;
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
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedure_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE surgery_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE implant_boxes ENABLE ROW LEVEL SECURITY;

-- Create policies for read access (authenticated users can read all)
CREATE POLICY "Allow read access for authenticated users" ON countries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read access for authenticated users" ON roles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read access for authenticated users" ON case_statuses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read access for authenticated users" ON departments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read access for authenticated users" ON hospitals FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read access for authenticated users" ON procedure_types FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read access for authenticated users" ON surgery_sets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read access for authenticated users" ON implant_boxes FOR SELECT USING (auth.role() = 'authenticated');

-- Create policies for service role access (for seeding)
CREATE POLICY "Allow service role full access" ON countries FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Allow service role full access" ON roles FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Allow service role full access" ON case_statuses FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Allow service role full access" ON departments FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Allow service role full access" ON hospitals FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Allow service role full access" ON procedure_types FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Allow service role full access" ON surgery_sets FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Allow service role full access" ON implant_boxes FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

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
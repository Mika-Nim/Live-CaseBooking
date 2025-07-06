-- =============================================================================
-- TM Case Booking System - Safe Seed Data (Handles Existing Data)
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CREATE TABLES (ONLY IF THEY DON'T EXIST)
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

-- =============================================================================
-- INSERT SEED DATA (SAFE - HANDLES EXISTING DATA)
-- =============================================================================

-- Insert Countries (using ON CONFLICT for tables with unique constraints)
INSERT INTO countries (code, name, is_active) VALUES
    ('SG', 'Singapore', true),
    ('MY', 'Malaysia', true),
    ('PH', 'Philippines', true),
    ('ID', 'Indonesia', true),
    ('VN', 'Vietnam', true),
    ('HK', 'Hongkong', true),
    ('TH', 'Thailand', true)
ON CONFLICT (code) DO NOTHING;

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

-- =============================================================================
-- INSERT DEPARTMENTS FOR EACH COUNTRY
-- =============================================================================

DO $$
DECLARE
    country_record RECORD;
    dept_names TEXT[];
    dept_name TEXT;
BEGIN
    -- Define departments for each country
    FOR country_record IN SELECT id, name FROM countries LOOP
        -- Set department arrays based on country
        CASE country_record.name
            WHEN 'Singapore' THEN
                dept_names := ARRAY[
                    'Orthopedic Surgery', 'Neurosurgery', 'Cardiovascular Surgery', 'General Surgery',
                    'Plastic Surgery', 'ENT Surgery', 'Ophthalmology', 'Urology', 'Trauma Surgery',
                    'Spine Surgery', 'Hand Surgery', 'Sports Medicine', 'Joint Replacement',
                    'Pediatric Surgery', 'Vascular Surgery', 'Thoracic Surgery', 'Oncology Surgery'
                ];
            WHEN 'Malaysia' THEN
                dept_names := ARRAY[
                    'Orthopedic Surgery', 'Neurosurgery', 'Cardiovascular Surgery', 'General Surgery',
                    'Plastic Surgery', 'ENT Surgery', 'Ophthalmology', 'Urology', 'Emergency Surgery',
                    'Spine Surgery', 'Trauma Surgery', 'Joint Replacement', 'Sports Medicine',
                    'Pediatric Surgery', 'Vascular Surgery', 'Oncology Surgery'
                ];
            WHEN 'Philippines' THEN
                dept_names := ARRAY[
                    'Orthopedic Surgery', 'Neurosurgery', 'Cardiovascular Surgery', 'General Surgery',
                    'Plastic Surgery', 'ENT Surgery', 'Ophthalmology', 'Urology', 'Trauma Surgery',
                    'Spine Surgery', 'Joint Replacement', 'Emergency Surgery', 'Pediatric Surgery',
                    'Vascular Surgery', 'Thoracic Surgery'
                ];
            WHEN 'Indonesia' THEN
                dept_names := ARRAY[
                    'Orthopedic Surgery', 'Neurosurgery', 'Cardiovascular Surgery', 'General Surgery',
                    'Plastic Surgery', 'ENT Surgery', 'Ophthalmology', 'Urology', 'Trauma Surgery',
                    'Spine Surgery', 'Joint Replacement', 'Emergency Surgery', 'Vascular Surgery'
                ];
            WHEN 'Vietnam' THEN
                dept_names := ARRAY[
                    'Orthopedic Surgery', 'Neurosurgery', 'Cardiovascular Surgery', 'General Surgery',
                    'Plastic Surgery', 'ENT Surgery', 'Ophthalmology', 'Urology', 'Trauma Surgery',
                    'Spine Surgery', 'Joint Replacement', 'Emergency Surgery'
                ];
            WHEN 'Hongkong' THEN
                dept_names := ARRAY[
                    'Orthopedic Surgery', 'Neurosurgery', 'Cardiovascular Surgery', 'General Surgery',
                    'Plastic Surgery', 'ENT Surgery', 'Ophthalmology', 'Urology', 'Trauma Surgery',
                    'Spine Surgery', 'Hand Surgery', 'Sports Medicine', 'Joint Replacement',
                    'Pediatric Surgery', 'Vascular Surgery', 'Thoracic Surgery', 'Oncology Surgery'
                ];
            WHEN 'Thailand' THEN
                dept_names := ARRAY[
                    'Orthopedic Surgery', 'Neurosurgery', 'Cardiovascular Surgery', 'General Surgery',
                    'Plastic Surgery', 'ENT Surgery', 'Ophthalmology', 'Urology', 'Trauma Surgery',
                    'Spine Surgery', 'Joint Replacement', 'Sports Medicine', 'Vascular Surgery'
                ];
            ELSE
                dept_names := ARRAY['General Surgery', 'Orthopedic Surgery'];
        END CASE;

        -- Insert departments for this country
        FOREACH dept_name IN ARRAY dept_names LOOP
            INSERT INTO departments (name, country_id)
            VALUES (dept_name, country_record.id)
            ON CONFLICT (name, country_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- =============================================================================
-- INSERT HOSPITALS FOR EACH COUNTRY
-- =============================================================================

DO $$
DECLARE
    country_record RECORD;
    hospital_names TEXT[];
    hospital_name TEXT;
BEGIN
    FOR country_record IN SELECT id, name FROM countries LOOP
        -- Set hospital arrays based on country
        CASE country_record.name
            WHEN 'Singapore' THEN
                hospital_names := ARRAY[
                    'Singapore General Hospital', 'National University Hospital', 'Tan Tock Seng Hospital',
                    'Changi General Hospital', 'KK Women''s and Children''s Hospital', 'Institute of Mental Health',
                    'Singapore National Eye Centre', 'National Heart Centre Singapore', 'National Cancer Centre Singapore',
                    'Mount Elizabeth Hospital', 'Gleneagles Hospital', 'Raffles Hospital',
                    'Parkway East Hospital', 'Mount Alvernia Hospital'
                ];
            WHEN 'Malaysia' THEN
                hospital_names := ARRAY[
                    'Hospital Kuala Lumpur', 'University Malaya Medical Centre', 'Hospital Sultanah Aminah',
                    'Hospital Selayang', 'Hospital Raja Permaisuri Bainun', 'Hospital Sungai Buloh',
                    'Gleneagles Kuala Lumpur', 'Sunway Medical Centre', 'Prince Court Medical Centre',
                    'Pantai Hospital Kuala Lumpur', 'Hospital Ampang', 'Hospital Putrajaya'
                ];
            WHEN 'Philippines' THEN
                hospital_names := ARRAY[
                    'Philippine General Hospital', 'St. Luke''s Medical Center', 'Makati Medical Center',
                    'Asian Hospital and Medical Center', 'The Medical City', 'Cardinal Santos Medical Center',
                    'Veterans Memorial Medical Center', 'Jose Reyes Memorial Medical Center',
                    'Philippine Heart Center', 'National Kidney and Transplant Institute',
                    'Research Institute for Tropical Medicine'
                ];
            WHEN 'Indonesia' THEN
                hospital_names := ARRAY[
                    'Cipto Mangunkusumo Hospital', 'Persahabatan Hospital', 'Fatmawati Hospital',
                    'Dr. Soetomo Hospital', 'Dr. Sardjito Hospital', 'Dr. Hasan Sadikin Hospital',
                    'Siloam Hospitals Kebon Jeruk', 'RS Pondok Indah', 'Mayapada Hospital',
                    'RSUP Dr. Kariadi', 'RS Premier Bintaro'
                ];
            WHEN 'Vietnam' THEN
                hospital_names := ARRAY[
                    'Bach Mai Hospital', 'Cho Ray Hospital', 'Vietnam National University Hospital',
                    'Hospital for Tropical Diseases', 'University Medical Center Ho Chi Minh City',
                    'Vinmec Central Park', 'FV Hospital', 'International Hospital Ho Chi Minh City',
                    'Hanoi French Hospital', 'Family Medical Practice'
                ];
            WHEN 'Hongkong' THEN
                hospital_names := ARRAY[
                    'Queen Mary Hospital', 'Prince of Wales Hospital', 'Queen Elizabeth Hospital',
                    'Tuen Mun Hospital', 'Princess Margaret Hospital', 'United Christian Hospital',
                    'Pamela Youde Nethersole Eastern Hospital', 'Kwong Wah Hospital',
                    'Hong Kong Sanatorium & Hospital', 'Baptist Hospital', 'Matilda International Hospital'
                ];
            WHEN 'Thailand' THEN
                hospital_names := ARRAY[
                    'Siriraj Hospital', 'Chulalongkorn Hospital', 'Ramathibodi Hospital',
                    'Bumrungrad International Hospital', 'Bangkok Hospital', 'Samitivej Hospital',
                    'BNH Hospital', 'Phyathai Hospital', 'Vichaiyut Hospital',
                    'King Chulalongkorn Memorial Hospital', 'Mahidol University Hospital'
                ];
            ELSE
                hospital_names := ARRAY['General Hospital', 'Medical Center'];
        END CASE;

        -- Insert hospitals for this country
        FOREACH hospital_name IN ARRAY hospital_names LOOP
            INSERT INTO hospitals (name, country_id)
            VALUES (hospital_name, country_record.id)
            ON CONFLICT (name, country_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- =============================================================================
-- INSERT PROCEDURE TYPES FOR EACH COUNTRY
-- =============================================================================

DO $$
DECLARE
    country_record RECORD;
    procedure_names TEXT[];
    procedure_name TEXT;
BEGIN
    FOR country_record IN SELECT id, name FROM countries LOOP
        -- Set procedure arrays based on country
        CASE country_record.name
            WHEN 'Singapore' THEN
                procedure_names := ARRAY[
                    'Total Knee Replacement', 'Total Hip Replacement', 'Partial Knee Replacement',
                    'Hip Resurfacing', 'Shoulder Replacement', 'Ankle Replacement',
                    'Spinal Fusion', 'Laminectomy', 'Discectomy', 'Cervical Fusion',
                    'Craniotomy', 'Deep Brain Stimulation', 'Aneurysm Clipping',
                    'Coronary Artery Bypass', 'Valve Replacement', 'Pacemaker Implantation',
                    'Arthroscopy', 'ACL Reconstruction', 'Rotator Cuff Repair',
                    'Carpal Tunnel Release', 'Hand Reconstruction', 'Fracture Fixation'
                ];
            WHEN 'Malaysia' THEN
                procedure_names := ARRAY[
                    'Total Knee Replacement', 'Total Hip Replacement', 'Partial Knee Replacement',
                    'Spinal Fusion', 'Laminectomy', 'Discectomy', 'Cervical Fusion',
                    'Craniotomy', 'Aneurysm Repair', 'Coronary Artery Bypass',
                    'Valve Replacement', 'Arthroscopy', 'ACL Reconstruction',
                    'Fracture Fixation', 'Joint Replacement', 'Spine Surgery'
                ];
            WHEN 'Philippines' THEN
                procedure_names := ARRAY[
                    'Total Knee Replacement', 'Total Hip Replacement', 'Spinal Fusion',
                    'Laminectomy', 'Craniotomy', 'Coronary Artery Bypass',
                    'Arthroscopy', 'Fracture Fixation', 'Joint Replacement',
                    'ACL Reconstruction', 'Spine Surgery', 'Neurosurgery'
                ];
            WHEN 'Indonesia' THEN
                procedure_names := ARRAY[
                    'Total Knee Replacement', 'Total Hip Replacement', 'Spinal Fusion',
                    'Craniotomy', 'Arthroscopy', 'Fracture Fixation',
                    'Joint Replacement', 'Spine Surgery', 'Neurosurgery', 'Heart Surgery'
                ];
            WHEN 'Vietnam' THEN
                procedure_names := ARRAY[
                    'Total Knee Replacement', 'Total Hip Replacement', 'Spinal Fusion',
                    'Arthroscopy', 'Fracture Fixation', 'Joint Replacement',
                    'Spine Surgery', 'Heart Surgery', 'General Surgery'
                ];
            WHEN 'Hongkong' THEN
                procedure_names := ARRAY[
                    'Total Knee Replacement', 'Total Hip Replacement', 'Partial Knee Replacement',
                    'Hip Resurfacing', 'Shoulder Replacement', 'Spinal Fusion',
                    'Laminectomy', 'Craniotomy', 'Coronary Artery Bypass',
                    'Arthroscopy', 'ACL Reconstruction', 'Fracture Fixation'
                ];
            WHEN 'Thailand' THEN
                procedure_names := ARRAY[
                    'Total Knee Replacement', 'Total Hip Replacement', 'Spinal Fusion',
                    'Laminectomy', 'Craniotomy', 'Arthroscopy',
                    'Fracture Fixation', 'Joint Replacement', 'Spine Surgery'
                ];
            ELSE
                procedure_names := ARRAY['General Surgery', 'Basic Procedure'];
        END CASE;

        -- Insert procedure types for this country
        FOREACH procedure_name IN ARRAY procedure_names LOOP
            INSERT INTO procedure_types (name, country_id)
            VALUES (procedure_name, country_record.id)
            ON CONFLICT (name, country_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- =============================================================================
-- INSERT SURGERY SETS FOR EACH COUNTRY
-- =============================================================================

DO $$
DECLARE
    country_record RECORD;
    set_names TEXT[];
    set_name TEXT;
BEGIN
    FOR country_record IN SELECT id, name FROM countries LOOP
        -- Set surgery set arrays based on country
        CASE country_record.name
            WHEN 'Singapore' THEN
                set_names := ARRAY[
                    'Basic Orthopedic Set', 'Total Knee Set', 'Total Hip Set', 'Spine Fusion Set',
                    'Trauma Set', 'Arthroscopy Set', 'Hand Surgery Set', 'Shoulder Set',
                    'Basic Neurosurgery Set', 'Craniotomy Set', 'Spine Neurosurgery Set',
                    'Cardiovascular Set', 'Thoracic Set', 'Vascular Set',
                    'General Surgery Set', 'Laparoscopic Set', 'Plastic Surgery Set',
                    'ENT Set', 'Ophthalmology Set', 'Urology Set'
                ];
            WHEN 'Malaysia' THEN
                set_names := ARRAY[
                    'Basic Orthopedic Set', 'Total Knee Set', 'Total Hip Set', 'Spine Fusion Set',
                    'Trauma Set', 'Arthroscopy Set', 'Basic Neurosurgery Set',
                    'Cardiovascular Set', 'General Surgery Set', 'Laparoscopic Set',
                    'Plastic Surgery Set', 'ENT Set', 'Urology Set'
                ];
            WHEN 'Philippines' THEN
                set_names := ARRAY[
                    'Basic Orthopedic Set', 'Total Knee Set', 'Total Hip Set', 'Spine Fusion Set',
                    'Trauma Set', 'Basic Neurosurgery Set', 'Cardiovascular Set',
                    'General Surgery Set', 'Plastic Surgery Set', 'ENT Set'
                ];
            WHEN 'Indonesia' THEN
                set_names := ARRAY[
                    'Basic Orthopedic Set', 'Total Knee Set', 'Total Hip Set', 'Spine Fusion Set',
                    'Trauma Set', 'Basic Neurosurgery Set', 'Cardiovascular Set',
                    'General Surgery Set', 'ENT Set'
                ];
            WHEN 'Vietnam' THEN
                set_names := ARRAY[
                    'Basic Orthopedic Set', 'Total Knee Set', 'Total Hip Set', 'Spine Fusion Set',
                    'Trauma Set', 'General Surgery Set', 'Cardiovascular Set'
                ];
            WHEN 'Hongkong' THEN
                set_names := ARRAY[
                    'Basic Orthopedic Set', 'Total Knee Set', 'Total Hip Set', 'Spine Fusion Set',
                    'Trauma Set', 'Arthroscopy Set', 'Hand Surgery Set', 'Basic Neurosurgery Set',
                    'Cardiovascular Set', 'General Surgery Set', 'Laparoscopic Set'
                ];
            WHEN 'Thailand' THEN
                set_names := ARRAY[
                    'Basic Orthopedic Set', 'Total Knee Set', 'Total Hip Set', 'Spine Fusion Set',
                    'Trauma Set', 'Basic Neurosurgery Set', 'General Surgery Set'
                ];
            ELSE
                set_names := ARRAY['Basic Surgery Set', 'General Set'];
        END CASE;

        -- Insert surgery sets for this country
        FOREACH set_name IN ARRAY set_names LOOP
            INSERT INTO surgery_sets (name, country_id)
            VALUES (set_name, country_record.id)
            ON CONFLICT (name, country_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- =============================================================================
-- INSERT IMPLANT BOXES FOR EACH COUNTRY
-- =============================================================================

DO $$
DECLARE
    country_record RECORD;
    implant_names TEXT[];
    implant_name TEXT;
BEGIN
    FOR country_record IN SELECT id, name FROM countries LOOP
        -- Set implant box arrays based on country
        CASE country_record.name
            WHEN 'Singapore' THEN
                implant_names := ARRAY[
                    'Knee Implant System', 'Hip Implant System', 'Shoulder Implant System',
                    'Spine Implant System', 'Trauma Implant System', 'Hand Implant System',
                    'Ankle Implant System', 'Elbow Implant System',
                    'Pedicle Screw System', 'Cervical Plate System', 'Lumbar Cage System',
                    'Cranial Plate System', 'Neurovascular Coils', 'DBS Lead System',
                    'Cardiac Valve System', 'Stent Graft System', 'Pacemaker System',
                    'Mesh Implant System', 'Bone Graft System', 'Soft Tissue Repair System'
                ];
            WHEN 'Malaysia' THEN
                implant_names := ARRAY[
                    'Knee Implant System', 'Hip Implant System', 'Shoulder Implant System',
                    'Spine Implant System', 'Trauma Implant System',
                    'Pedicle Screw System', 'Cervical Plate System',
                    'Cardiac Valve System', 'Stent System', 'Mesh Implant System'
                ];
            WHEN 'Philippines' THEN
                implant_names := ARRAY[
                    'Knee Implant System', 'Hip Implant System', 'Spine Implant System',
                    'Trauma Implant System', 'Pedicle Screw System',
                    'Cardiac Valve System', 'Mesh Implant System'
                ];
            WHEN 'Indonesia' THEN
                implant_names := ARRAY[
                    'Knee Implant System', 'Hip Implant System', 'Spine Implant System',
                    'Trauma Implant System', 'Cardiac Valve System'
                ];
            WHEN 'Vietnam' THEN
                implant_names := ARRAY[
                    'Knee Implant System', 'Hip Implant System', 'Spine Implant System',
                    'Trauma Implant System'
                ];
            WHEN 'Hongkong' THEN
                implant_names := ARRAY[
                    'Knee Implant System', 'Hip Implant System', 'Shoulder Implant System',
                    'Spine Implant System', 'Trauma Implant System', 'Hand Implant System',
                    'Pedicle Screw System', 'Cardiac Valve System', 'Mesh Implant System'
                ];
            WHEN 'Thailand' THEN
                implant_names := ARRAY[
                    'Knee Implant System', 'Hip Implant System', 'Spine Implant System',
                    'Trauma Implant System', 'Cardiac Valve System'
                ];
            ELSE
                implant_names := ARRAY['Basic Implant System', 'General Implant'];
        END CASE;

        -- Insert implant boxes for this country
        FOREACH implant_name IN ARRAY implant_names LOOP
            INSERT INTO implant_boxes (name, country_id)
            VALUES (implant_name, country_record.id)
            ON CONFLICT (name, country_id) DO NOTHING;
        END LOOP;
    END LOOP;
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

-- Show what was inserted/already exists
SELECT 
    'Countries' as table_name, 
    COUNT(*) as total_records,
    string_agg(name, ', ' ORDER BY name) as sample_data
FROM countries
UNION ALL
SELECT 
    'Roles' as table_name, 
    COUNT(*) as total_records,
    string_agg(display_name, ', ' ORDER BY display_name) as sample_data
FROM roles
UNION ALL
SELECT 
    'Case Statuses' as table_name, 
    COUNT(*) as total_records,
    string_agg(display_name, ', ' ORDER BY sort_order) as sample_data
FROM case_statuses
UNION ALL
SELECT 
    'Departments' as table_name, 
    COUNT(*) as total_records,
    COUNT(DISTINCT country_id)::text || ' countries covered' as sample_data
FROM departments
UNION ALL
SELECT 
    'Hospitals' as table_name, 
    COUNT(*) as total_records,
    COUNT(DISTINCT country_id)::text || ' countries covered' as sample_data
FROM hospitals
UNION ALL
SELECT 
    'Procedure Types' as table_name, 
    COUNT(*) as total_records,
    COUNT(DISTINCT country_id)::text || ' countries covered' as sample_data
FROM procedure_types
UNION ALL
SELECT 
    'Surgery Sets' as table_name, 
    COUNT(*) as total_records,
    COUNT(DISTINCT country_id)::text || ' countries covered' as sample_data
FROM surgery_sets
UNION ALL
SELECT 
    'Implant Boxes' as table_name, 
    COUNT(*) as total_records,
    COUNT(DISTINCT country_id)::text || ' countries covered' as sample_data
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
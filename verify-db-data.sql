-- Quick verification script to check if seed data exists
-- Run this in your Supabase SQL editor to verify data was inserted

SELECT 'countries' as table_name, COUNT(*) as count FROM countries WHERE is_active = true
UNION ALL
SELECT 'hospitals' as table_name, COUNT(*) as count FROM hospitals WHERE is_active = true
UNION ALL
SELECT 'departments' as table_name, COUNT(*) as count FROM departments WHERE is_active = true
UNION ALL
SELECT 'procedure_types' as table_name, COUNT(*) as count FROM procedure_types WHERE is_active = true
UNION ALL
SELECT 'surgery_sets' as table_name, COUNT(*) as count FROM surgery_sets WHERE is_active = true
UNION ALL
SELECT 'implant_boxes' as table_name, COUNT(*) as count FROM implant_boxes WHERE is_active = true
ORDER BY table_name;

-- Check sample data from each table
SELECT 'Countries:' as info;
SELECT name, code FROM countries WHERE is_active = true LIMIT 5;

SELECT 'Hospitals:' as info;
SELECT h.name, c.name as country FROM hospitals h
JOIN countries c ON h.country_id = c.id
WHERE h.is_active = true LIMIT 5;

SELECT 'Departments:' as info;
SELECT d.name, c.name as country FROM departments d
JOIN countries c ON d.country_id = c.id
WHERE d.is_active = true LIMIT 5;

SELECT 'Procedure Types:' as info;
SELECT p.name, c.name as country FROM procedure_types p
JOIN countries c ON p.country_id = c.id
WHERE p.is_active = true LIMIT 5;
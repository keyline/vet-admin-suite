-- Delete orphaned auth user for caregiver@keylines.net
-- This user exists in auth.users but has no corresponding staff record
DELETE FROM auth.users 
WHERE id = '3d6ff796-5e0e-47a7-9afa-43306e4c45b1' 
AND email = 'caregiver@keylines.net';
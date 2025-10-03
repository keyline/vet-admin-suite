-- Create auth user for Huisa and link to staff record
DO $$
DECLARE
  new_user_id uuid;
  new_identity_id uuid;
BEGIN
  -- Generate IDs
  new_user_id := gen_random_uuid();
  new_identity_id := gen_random_uuid();
  
  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'huisa@keylines.net',
    crypt('pass123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Huisa"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- Update staff record with new user_id
  UPDATE public.staff 
  SET user_id = new_user_id 
  WHERE email = 'huisa@keylines.net';
  
  -- Insert identity with provider_id
  INSERT INTO auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    new_identity_id,
    new_user_id::text,
    new_user_id,
    format('{"sub":"%s","email":"huisa@keylines.net","email_verified":false,"phone_verified":false}', new_user_id)::jsonb,
    'email',
    now(),
    now(),
    now()
  );
  
END $$;
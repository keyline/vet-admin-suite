import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const createStaffSchema = z.object({
  staffId: z.string().uuid(),
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
  fullName: z.string().min(2).max(100)
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get and verify the calling user is an admin
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!authHeader) {
      throw new Error('Unauthorized')
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader)
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin
    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc('is_admin', { _user_id: user.id })
    if (roleError || !isAdmin) {
      throw new Error('Only administrators can create staff accounts')
    }

    // Validate input
    const body = await req.json()
    const validated = createStaffSchema.parse(body)
    const { staffId, email, password, fullName } = validated

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    })

    if (authError) throw authError

    // Update staff record with user_id
    const { error: updateError } = await supabaseAdmin
      .from('staff')
      .update({ user_id: authData.user.id })
      .eq('id', staffId)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ success: true, userId: authData.user.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

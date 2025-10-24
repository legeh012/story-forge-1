import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyCodeRequest {
  phoneNumber: string;
  code: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, code }: VerifyCodeRequest = await req.json();
    
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const verifySid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

    if (!accountSid || !authToken || !verifySid) {
      throw new Error('Twilio credentials not configured');
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          verified: false,
          error: 'Invalid verification code format. Must be 6 digits.' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Verifying code for phone number:', phoneNumber);

    // Verify code via Twilio Verify API
    const twilioUrl = `https://verify.twilio.com/v2/Services/${verifySid}/VerificationCheck`;
    const credentials = btoa(`${accountSid}:${authToken}`);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: phoneNumber,
        Code: code,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Twilio verification error:', data);
      return new Response(
        JSON.stringify({ 
          success: false, 
          verified: false,
          error: data.message || 'Verification failed' 
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const isVerified = data.status === 'approved';
    console.log('Verification result:', { verified: isVerified, status: data.status });

    // If verified, we could optionally store phone number in user metadata
    if (isVerified) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Get the current user from auth header if available
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        
        if (user) {
          // Update user metadata with verified phone number
          await supabase.auth.admin.updateUserById(user.id, {
            user_metadata: { 
              phone_verified: true,
              phone_number: phoneNumber,
              phone_verified_at: new Date().toISOString()
            }
          });
          console.log('Updated user metadata with verified phone');
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        verified: isVerified,
        status: data.status,
        message: isVerified ? 'Phone number verified successfully' : 'Invalid verification code'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in verify-code:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, verified: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

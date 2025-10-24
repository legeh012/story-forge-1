import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendCodeRequest {
  phoneNumber: string;
  channel?: 'sms' | 'call';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, channel = 'sms' }: SendCodeRequest = await req.json();
    
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const verifySid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

    if (!accountSid || !authToken || !verifySid) {
      throw new Error('Twilio credentials not configured');
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid phone number format. Must include country code (e.g., +1234567890)' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Sending verification code to:', phoneNumber);

    // Send verification code via Twilio Verify API
    const twilioUrl = `https://verify.twilio.com/v2/Services/${verifySid}/Verifications`;
    const credentials = btoa(`${accountSid}:${authToken}`);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: phoneNumber,
        Channel: channel,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Twilio API error:', data);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.message || 'Failed to send verification code' 
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Verification code sent successfully:', data.status);

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: data.status,
        message: 'Verification code sent successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-verification-code:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

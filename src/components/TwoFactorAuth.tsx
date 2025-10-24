import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Shield, Phone } from 'lucide-react';

interface TwoFactorAuthProps {
  onVerified: () => void;
  onSkip?: () => void;
}

export const TwoFactorAuth = ({ onVerified, onSkip }: TwoFactorAuthProps) => {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendCode = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: 'Phone number required',
        description: 'Please enter your phone number with country code (e.g., +1234567890)',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-verification-code', {
        body: { phoneNumber: phoneNumber.trim() }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to send code');

      toast({
        title: 'Code sent!',
        description: 'Check your phone for the verification code',
      });
      setStep('code');
    } catch (error: any) {
      console.error('Error sending code:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send verification code',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code.trim() || code.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Please enter the 6-digit verification code',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('verify-code', {
        body: { phoneNumber: phoneNumber.trim(), code: code.trim() },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });

      if (error) throw error;
      if (!data.success || !data.verified) {
        throw new Error(data.error || 'Invalid verification code');
      }

      toast({
        title: 'Verified!',
        description: 'Your phone number has been verified successfully',
      });
      onVerified();
    } catch (error: any) {
      console.error('Error verifying code:', error);
      toast({
        title: 'Verification failed',
        description: error.message || 'Invalid verification code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-6 w-6 text-primary" />
          <CardTitle>Two-Factor Authentication</CardTitle>
        </div>
        <CardDescription>
          {step === 'phone' 
            ? 'Secure your account with SMS verification' 
            : 'Enter the code sent to your phone'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'phone' ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <Phone className="h-5 w-5 text-muted-foreground mt-2.5" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., +1 for USA)
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={sendCode} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Code
              </Button>
              {onSkip && (
                <Button 
                  variant="outline" 
                  onClick={onSkip}
                  disabled={isLoading}
                >
                  Skip
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                disabled={isLoading}
                className="text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-muted-foreground">
                Sent to {phoneNumber}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setStep('phone')}
                disabled={isLoading}
              >
                Change Number
              </Button>
              <Button 
                onClick={verifyCode} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

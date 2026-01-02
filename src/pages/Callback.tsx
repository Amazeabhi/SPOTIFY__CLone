import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { getAccessToken } from '@/lib/spotify';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const Callback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const storedState = localStorage.getItem('auth_state');
      const urlError = searchParams.get('error');

      console.log('Callback params:', { code: !!code, state, storedState, urlError });

      if (urlError) {
        setError(`Authorization failed: ${urlError}`);
        setIsProcessing(false);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        setIsProcessing(false);
        return;
      }

      if (state !== storedState) {
        console.log('State mismatch:', { state, storedState });
        setError('State mismatch - please try logging in again');
        setIsProcessing(false);
        return;
      }

      try {
        const token = await getAccessToken(code);
        if (token) {
          toast.success('Successfully logged in!');
          navigate('/', { replace: true });
        } else {
          setError('Failed to get access token from Spotify');
          setIsProcessing(false);
        }
      } catch (err) {
        console.error('Token exchange error:', err);
        setError('Failed to authenticate with Spotify. Please try again.');
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-destructive text-lg font-medium">{error}</p>
          <p className="text-sm text-muted-foreground">
            Make sure you've added the correct redirect URI to your Spotify Developer Dashboard.
          </p>
          <Button onClick={() => navigate('/login')} variant="default">
            Return to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">
        {isProcessing ? 'Logging you in...' : 'Processing...'}
      </p>
    </div>
  );
};

export default Callback;

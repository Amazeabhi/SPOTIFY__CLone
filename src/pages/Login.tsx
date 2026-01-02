import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { redirectToSpotifyAuth, isAuthenticated } from '@/lib/spotify';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const redirectUri = `${window.location.origin}/callback`;

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      await redirectToSpotifyAuth();
    } catch (error) {
      setIsLoading(false);
      toast.error('Failed to connect to Spotify. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-spotify-dark-elevated to-background p-4">
      <div className="w-full max-w-md text-center space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
            <Music className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Spotify Clone</h1>
          <p className="text-muted-foreground text-lg">
            Millions of songs. Free on Spotify.
          </p>
        </div>

        {/* Login Button */}
        <Button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full py-6 text-lg font-semibold bg-primary hover:bg-spotify-green-hover text-primary-foreground rounded-full transition-all hover:scale-105"
        >
          {isLoading ? 'Connecting...' : 'Log in with Spotify'}
        </Button>

        {/* Important Notice */}
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-left">
          <p className="text-sm text-destructive font-medium mb-2">⚠️ Important: Open in new tab</p>
          <p className="text-xs text-muted-foreground">
            Click the <strong>↗ external link icon</strong> at the top-right of the preview to open in a new browser tab. OAuth won't work inside the iframe.
          </p>
        </div>

        {/* Redirect URI Info */}
        <div className="bg-card/50 rounded-lg p-4 text-left space-y-3">
          <h2 className="font-semibold text-foreground">Redirect URI for Spotify Dashboard:</h2>
          <code className="block bg-accent p-3 rounded text-xs break-all text-primary">
            {redirectUri}
          </code>
          <p className="text-xs text-muted-foreground">
            Make sure this exact URI is added in your{' '}
            <a 
              href="https://developer.spotify.com/dashboard" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:underline"
            >
              Spotify Developer Dashboard
            </a>
            {' '}→ Your App → Settings → Redirect URIs
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          This is a demo application. You need a Spotify account to use it.
        </p>
      </div>
    </div>
  );
};

export default Login;

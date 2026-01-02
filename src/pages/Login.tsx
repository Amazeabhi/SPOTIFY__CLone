import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { redirectToSpotifyAuth, isAuthenticated } from '@/lib/spotify';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

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
          <h1 className="text-4xl font-bold text-foreground">Spotifyness</h1>
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

        <p className="text-xs text-muted-foreground">
          This is a demo application. You need a Spotify account to use it.
        </p>
      </div>
    </div>
  );
};

export default Login;

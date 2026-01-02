import { useEffect, useState, useCallback, useRef } from 'react';
import { getValidAccessToken, isAuthenticated } from '@/lib/spotify';

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

interface SpotifyPlayer {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  addListener: (event: string, callback: (state: any) => void) => void;
  removeListener: (event: string, callback?: (state: any) => void) => void;
  getCurrentState: () => Promise<any>;
  setName: (name: string) => void;
  getVolume: () => Promise<number>;
  setVolume: (volume: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  togglePlay: () => Promise<void>;
  seek: (position_ms: number) => Promise<void>;
  previousTrack: () => Promise<void>;
  nextTrack: () => Promise<void>;
}

export interface PlayerState {
  deviceId: string | null;
  isReady: boolean;
  isActive: boolean;
  isPaused: boolean;
  currentTrack: any | null;
  position: number;
  duration: number;
  volume: number;
}

export const useSpotifyPlayer = () => {
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const [state, setState] = useState<PlayerState>({
    deviceId: null,
    isReady: false,
    isActive: false,
    isPaused: true,
    currentTrack: null,
    position: 0,
    duration: 0,
    volume: 0.5,
  });

  useEffect(() => {
    // Only initialize if authenticated
    if (!isAuthenticated()) return;

    let isMounted = true;

    const initializePlayer = async () => {
      try {
        // Load Spotify SDK script
        if (!document.getElementById('spotify-sdk')) {
          const script = document.createElement('script');
          script.id = 'spotify-sdk';
          script.src = 'https://sdk.scdn.co/spotify-player.js';
          script.async = true;
          document.body.appendChild(script);
        }

        window.onSpotifyWebPlaybackSDKReady = async () => {
          if (!isMounted) return;
          
          const token = await getValidAccessToken();
          if (!token || !isMounted) return;

          try {
            const spotifyPlayer = new window.Spotify.Player({
              name: 'Spotify Clone Web Player',
              getOAuthToken: async (cb: (token: string) => void) => {
                const freshToken = await getValidAccessToken();
                if (freshToken) cb(freshToken);
              },
              volume: 0.5,
            });

            spotifyPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
              if (!isMounted) return;
              console.log('Ready with Device ID', device_id);
              setState(prev => ({ ...prev, deviceId: device_id, isReady: true }));
            });

            spotifyPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
              if (!isMounted) return;
              console.log('Device ID has gone offline', device_id);
              setState(prev => ({ ...prev, isReady: false }));
            });

            spotifyPlayer.addListener('player_state_changed', (playerState: any) => {
              if (!isMounted) return;
              if (!playerState) {
                setState(prev => ({ ...prev, isActive: false }));
                return;
              }

              const currentTrack = playerState.track_window?.current_track;
              
              setState(prev => ({
                ...prev,
                isActive: true,
                isPaused: playerState.paused,
                currentTrack: currentTrack ? {
                  id: currentTrack.id,
                  name: currentTrack.name,
                  duration_ms: currentTrack.duration_ms,
                  album: {
                    id: currentTrack.album?.uri?.split(':')[2],
                    name: currentTrack.album?.name,
                    images: currentTrack.album?.images || [],
                  },
                  artists: currentTrack.artists?.map((a: any) => ({
                    id: a.uri?.split(':')[2],
                    name: a.name,
                  })) || [],
                } : null,
                position: playerState.position,
                duration: currentTrack?.duration_ms || 0,
              }));
            });

            spotifyPlayer.addListener('initialization_error', ({ message }: { message: string }) => {
              console.error('Failed to initialize:', message);
            });

            spotifyPlayer.addListener('authentication_error', ({ message }: { message: string }) => {
              console.error('Failed to authenticate:', message);
            });

            spotifyPlayer.addListener('account_error', ({ message }: { message: string }) => {
              console.error('Failed to validate Spotify account:', message);
            });

            spotifyPlayer.connect();
            playerRef.current = spotifyPlayer;
          } catch (error) {
            console.error('Error initializing Spotify player:', error);
          }
        };
      } catch (error) {
        console.error('Error loading Spotify SDK:', error);
      }
    };

    initializePlayer();

    return () => {
      isMounted = false;
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
    };
  }, []);

  const play = useCallback(async (uri: string, contextUri?: string) => {
    try {
      const token = await getValidAccessToken();
      if (!token || !state.deviceId) return;

      const body: any = {};
      if (contextUri) {
        body.context_uri = contextUri;
        body.offset = { uri };
      } else {
        body.uris = [uri];
      }

      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${state.deviceId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error('Error playing track:', error);
    }
  }, [state.deviceId]);

  const togglePlay = useCallback(async () => {
    try {
      if (playerRef.current) {
        await playerRef.current.togglePlay();
      }
    } catch (error) {
      console.error('Error toggling play:', error);
    }
  }, []);

  const nextTrack = useCallback(async () => {
    try {
      if (playerRef.current) {
        await playerRef.current.nextTrack();
      }
    } catch (error) {
      console.error('Error skipping to next track:', error);
    }
  }, []);

  const previousTrack = useCallback(async () => {
    try {
      if (playerRef.current) {
        await playerRef.current.previousTrack();
      }
    } catch (error) {
      console.error('Error going to previous track:', error);
    }
  }, []);

  const seek = useCallback(async (position: number) => {
    try {
      if (playerRef.current) {
        await playerRef.current.seek(position);
      }
    } catch (error) {
      console.error('Error seeking:', error);
    }
  }, []);

  const setVolume = useCallback(async (volume: number) => {
    try {
      if (playerRef.current) {
        await playerRef.current.setVolume(volume);
        setState(prev => ({ ...prev, volume }));
      }
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  }, []);

  // Update position periodically
  useEffect(() => {
    if (!state.isActive || state.isPaused) return;

    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        position: Math.min(prev.position + 1000, prev.duration),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isActive, state.isPaused]);

  return {
    ...state,
    play,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
  };
};

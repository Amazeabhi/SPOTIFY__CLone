import { useEffect, useState, useCallback } from 'react';
import { getValidAccessToken } from '@/lib/spotify';

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
  const [player, setPlayer] = useState<SpotifyPlayer | null>(null);
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
    // Load Spotify SDK script
    if (!document.getElementById('spotify-sdk')) {
      const script = document.createElement('script');
      script.id = 'spotify-sdk';
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
    }

    window.onSpotifyWebPlaybackSDKReady = async () => {
      const token = await getValidAccessToken();
      if (!token) return;

      const spotifyPlayer = new window.Spotify.Player({
        name: 'Spotify Clone Web Player',
        getOAuthToken: async (cb: (token: string) => void) => {
          const freshToken = await getValidAccessToken();
          if (freshToken) cb(freshToken);
        },
        volume: 0.5,
      });

      spotifyPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id);
        setState(prev => ({ ...prev, deviceId: device_id, isReady: true }));
      });

      spotifyPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
        setState(prev => ({ ...prev, isReady: false }));
      });

      spotifyPlayer.addListener('player_state_changed', (playerState: any) => {
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
      setPlayer(spotifyPlayer);
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, []);

  const play = useCallback(async (uri: string, contextUri?: string) => {
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
  }, [state.deviceId]);

  const togglePlay = useCallback(async () => {
    if (player) {
      await player.togglePlay();
    }
  }, [player]);

  const nextTrack = useCallback(async () => {
    if (player) {
      await player.nextTrack();
    }
  }, [player]);

  const previousTrack = useCallback(async () => {
    if (player) {
      await player.previousTrack();
    }
  }, [player]);

  const seek = useCallback(async (position: number) => {
    if (player) {
      await player.seek(position);
    }
  }, [player]);

  const setVolume = useCallback(async (volume: number) => {
    if (player) {
      await player.setVolume(volume);
      setState(prev => ({ ...prev, volume }));
    }
  }, [player]);

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

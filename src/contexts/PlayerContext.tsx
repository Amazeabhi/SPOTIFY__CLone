import React, { createContext, useContext, useCallback, useEffect, useState, useRef } from 'react';
import { SpotifyTrack } from '@/hooks/useSpotify';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';

interface PlayerContextType {
  currentTrack: SpotifyTrack | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isReady: boolean;
  isPremium: boolean;
  queue: SpotifyTrack[];
  currentIndex: number;
  playTrack: (track: SpotifyTrack, queue?: SpotifyTrack[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const spotifyPlayer = useSpotifyPlayer();
  const [localQueue, setLocalQueue] = useState<SpotifyTrack[]>([]);
  const [localIndex, setLocalIndex] = useState(0);
  const [localTrack, setLocalTrack] = useState<SpotifyTrack | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [previewState, setPreviewState] = useState({
    isPlaying: false,
    progress: 0,
    duration: 0,
    volume: 0.5,
  });

  const isPremiumPlayer = !!(spotifyPlayer.isReady && spotifyPlayer.deviceId);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      audioRef.current.volume = previewState.volume;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Setup audio element event listeners for preview fallback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setPreviewState(prev => ({ ...prev, progress: audio.currentTime }));
    };

    const handleLoadedMetadata = () => {
      setPreviewState(prev => ({ ...prev, duration: audio.duration }));
    };

    const handleEnded = () => {
      setPreviewState(prev => ({ ...prev, isPlaying: false }));
      // Play next track
      if (localQueue.length > 0) {
        const nextIdx = (localIndex + 1) % localQueue.length;
        const nextTrack = localQueue[nextIdx];
        if (nextTrack?.preview_url && audio) {
          audio.src = nextTrack.preview_url;
          audio.play().catch(console.error);
          setLocalIndex(nextIdx);
          setLocalTrack(nextTrack);
          setPreviewState(prev => ({ ...prev, isPlaying: true }));
        }
      }
    };

    const handleError = (e: Event) => {
      console.error('Audio playback error:', e);
      setPreviewState(prev => ({ ...prev, isPlaying: false }));
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [localQueue, localIndex]);

  const playTrack = useCallback((track: SpotifyTrack, queue?: SpotifyTrack[]) => {
    if (queue) {
      setLocalQueue(queue);
      const idx = queue.findIndex(t => t.id === track.id);
      setLocalIndex(idx >= 0 ? idx : 0);
    }
    setLocalTrack(track);

    if (isPremiumPlayer) {
      // Use Spotify SDK for Premium users
      spotifyPlayer.play(`spotify:track:${track.id}`);
    } else if (track.preview_url && audioRef.current) {
      // Fallback to preview for non-Premium
      audioRef.current.src = track.preview_url;
      audioRef.current.play()
        .then(() => {
          setPreviewState(prev => ({ ...prev, isPlaying: true, progress: 0 }));
        })
        .catch(console.error);
    }
  }, [isPremiumPlayer, spotifyPlayer]);

  const togglePlay = useCallback(() => {
    if (isPremiumPlayer) {
      spotifyPlayer.togglePlay();
    } else if (audioRef.current) {
      if (previewState.isPlaying) {
        audioRef.current.pause();
        setPreviewState(prev => ({ ...prev, isPlaying: false }));
      } else {
        audioRef.current.play()
          .then(() => {
            setPreviewState(prev => ({ ...prev, isPlaying: true }));
          })
          .catch(console.error);
      }
    }
  }, [isPremiumPlayer, spotifyPlayer, previewState.isPlaying]);

  const handleNextTrack = useCallback(() => {
    if (isPremiumPlayer) {
      spotifyPlayer.nextTrack();
    } else if (localQueue.length > 0) {
      const nextIdx = (localIndex + 1) % localQueue.length;
      playTrack(localQueue[nextIdx], localQueue);
    }
  }, [isPremiumPlayer, spotifyPlayer, localQueue, localIndex, playTrack]);

  const handlePreviousTrack = useCallback(() => {
    if (isPremiumPlayer) {
      spotifyPlayer.previousTrack();
    } else if (localQueue.length > 0) {
      const prevIdx = localIndex === 0 ? localQueue.length - 1 : localIndex - 1;
      playTrack(localQueue[prevIdx], localQueue);
    }
  }, [isPremiumPlayer, spotifyPlayer, localQueue, localIndex, playTrack]);

  const seek = useCallback((time: number) => {
    if (isPremiumPlayer) {
      spotifyPlayer.seek(time * 1000); // SDK uses milliseconds
    } else if (audioRef.current) {
      audioRef.current.currentTime = time;
      setPreviewState(prev => ({ ...prev, progress: time }));
    }
  }, [isPremiumPlayer, spotifyPlayer]);

  const handleSetVolume = useCallback((volume: number) => {
    if (isPremiumPlayer) {
      spotifyPlayer.setVolume(volume);
    } else if (audioRef.current) {
      audioRef.current.volume = volume;
      setPreviewState(prev => ({ ...prev, volume }));
    }
  }, [isPremiumPlayer, spotifyPlayer]);

  // Determine current state based on Premium or Preview
  const currentTrack = isPremiumPlayer ? spotifyPlayer.currentTrack : localTrack;
  const isPlaying = isPremiumPlayer ? !spotifyPlayer.isPaused : previewState.isPlaying;
  const progress = isPremiumPlayer ? spotifyPlayer.position / 1000 : previewState.progress;
  const duration = isPremiumPlayer 
    ? spotifyPlayer.duration / 1000 
    : (previewState.duration || 30);
  const volume = isPremiumPlayer ? spotifyPlayer.volume : previewState.volume;

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        progress,
        duration,
        volume,
        isReady: spotifyPlayer.isReady,
        isPremium: isPremiumPlayer,
        queue: localQueue,
        currentIndex: localIndex,
        playTrack,
        togglePlay,
        nextTrack: handleNextTrack,
        previousTrack: handlePreviousTrack,
        seek,
        setVolume: handleSetVolume,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

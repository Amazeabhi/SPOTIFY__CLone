import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
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

  // Fallback audio for preview URLs when SDK not available
  const [audioRef] = useState<HTMLAudioElement | null>(() => 
    typeof window !== 'undefined' ? new Audio() : null
  );
  const [previewState, setPreviewState] = useState({
    isPlaying: false,
    progress: 0,
    duration: 0,
  });

  const isPremiumPlayer = spotifyPlayer.isReady && spotifyPlayer.deviceId;

  // Setup audio element event listeners for preview fallback
  useEffect(() => {
    if (!audioRef) return;

    const handleTimeUpdate = () => {
      setPreviewState(prev => ({ ...prev, progress: audioRef.currentTime }));
    };

    const handleLoadedMetadata = () => {
      setPreviewState(prev => ({ ...prev, duration: audioRef.duration }));
    };

    const handleEnded = () => {
      setPreviewState(prev => ({ ...prev, isPlaying: false }));
      // Play next track
      if (localQueue.length > 0) {
        const nextIdx = (localIndex + 1) % localQueue.length;
        const nextTrack = localQueue[nextIdx];
        if (nextTrack?.preview_url) {
          audioRef.src = nextTrack.preview_url;
          audioRef.play();
          setLocalIndex(nextIdx);
          setLocalTrack(nextTrack);
          setPreviewState(prev => ({ ...prev, isPlaying: true }));
        }
      }
    };

    audioRef.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioRef.addEventListener('ended', handleEnded);

    return () => {
      audioRef.removeEventListener('timeupdate', handleTimeUpdate);
      audioRef.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.removeEventListener('ended', handleEnded);
    };
  }, [audioRef, localQueue, localIndex]);

  const playTrack = useCallback((track: SpotifyTrack, queue?: SpotifyTrack[]) => {
    if (queue) {
      setLocalQueue(queue);
      setLocalIndex(queue.findIndex(t => t.id === track.id));
    }
    setLocalTrack(track);

    if (isPremiumPlayer) {
      // Use Spotify SDK for Premium users
      spotifyPlayer.play(`spotify:track:${track.id}`);
    } else if (track.preview_url && audioRef) {
      // Fallback to preview for non-Premium
      audioRef.src = track.preview_url;
      audioRef.play();
      setPreviewState(prev => ({ ...prev, isPlaying: true, progress: 0 }));
    }
  }, [isPremiumPlayer, spotifyPlayer, audioRef]);

  const togglePlay = useCallback(() => {
    if (isPremiumPlayer) {
      spotifyPlayer.togglePlay();
    } else if (audioRef) {
      if (previewState.isPlaying) {
        audioRef.pause();
      } else {
        audioRef.play();
      }
      setPreviewState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    }
  }, [isPremiumPlayer, spotifyPlayer, audioRef, previewState.isPlaying]);

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
    } else if (audioRef) {
      audioRef.currentTime = time;
      setPreviewState(prev => ({ ...prev, progress: time }));
    }
  }, [isPremiumPlayer, spotifyPlayer, audioRef]);

  const handleSetVolume = useCallback((volume: number) => {
    if (isPremiumPlayer) {
      spotifyPlayer.setVolume(volume);
    } else if (audioRef) {
      audioRef.volume = volume;
    }
  }, [isPremiumPlayer, spotifyPlayer, audioRef]);

  // Determine current state based on Premium or Preview
  const currentTrack = isPremiumPlayer ? spotifyPlayer.currentTrack : localTrack;
  const isPlaying = isPremiumPlayer ? !spotifyPlayer.isPaused : previewState.isPlaying;
  const progress = isPremiumPlayer ? spotifyPlayer.position / 1000 : previewState.progress;
  const duration = isPremiumPlayer 
    ? spotifyPlayer.duration / 1000 
    : (previewState.duration || 30);
  const volume = isPremiumPlayer ? spotifyPlayer.volume : (audioRef?.volume || 0.5);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        progress,
        duration,
        volume,
        isReady: spotifyPlayer.isReady,
        isPremium: !!isPremiumPlayer,
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

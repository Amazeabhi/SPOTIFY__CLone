import { Play, Pause, MoreHorizontal } from 'lucide-react';
import { SpotifyTrack } from '@/hooks/useSpotify';
import { usePlayer } from '@/contexts/PlayerContext';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import AddToPlaylistMenu from '@/components/playlist/AddToPlaylistMenu';

interface TrackCardProps {
  track: SpotifyTrack;
  index?: number;
  queue?: SpotifyTrack[];
  showAlbum?: boolean;
  onRemove?: () => void;
  showRemove?: boolean;
}

const formatDuration = (ms: number) => {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const TrackCard = ({ track, index, queue, showAlbum = true, onRemove, showRemove = false }: TrackCardProps) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const isCurrentTrack = currentTrack?.id === track.id;

  const handlePlay = () => {
    if (isCurrentTrack) {
      togglePlay();
    } else {
      playTrack(track, queue);
    }
  };

  return (
    <div
      className={cn(
        'group grid grid-cols-[16px_4fr_2fr_auto_minmax(80px,1fr)] md:grid-cols-[16px_4fr_3fr_auto_minmax(80px,1fr)] gap-4 items-center px-4 py-2 rounded-md hover:bg-accent/50 transition-colors',
        isCurrentTrack && 'bg-accent/30'
      )}
    >
      {/* Index / Play Button */}
      <div className="flex items-center justify-center">
        <span
          className={cn(
            'text-sm tabular-nums',
            isCurrentTrack ? 'text-primary' : 'text-muted-foreground group-hover:hidden'
          )}
        >
          {index !== undefined ? index + 1 : '-'}
        </span>
        <button
          onClick={handlePlay}
          className={cn(
            'hidden group-hover:flex items-center justify-center',
            !isCurrentTrack && 'hidden group-hover:flex'
          )}
        >
          {isCurrentTrack && isPlaying ? (
            <Pause className="h-4 w-4 text-foreground fill-current" />
          ) : (
            <Play className="h-4 w-4 text-foreground fill-current" />
          )}
        </button>
      </div>

      {/* Track Info */}
      <div className="flex items-center gap-3 min-w-0">
        {showAlbum && (
          <img
            src={track.album?.images?.[0]?.url || '/placeholder.svg'}
            alt={track.album?.name || 'Album'}
            className="w-10 h-10 rounded object-cover flex-shrink-0"
          />
        )}
        <div className="min-w-0">
          <p
            className={cn(
              'text-sm font-medium truncate',
              isCurrentTrack ? 'text-primary' : 'text-foreground'
            )}
          >
            {track.name}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {track.artists.map((a, i) => (
              <span key={a.id}>
                {i > 0 && ', '}
                <Link
                  to={`/artist/${a.id}`}
                  className="hover:underline hover:text-foreground"
                >
                  {a.name}
                </Link>
              </span>
            ))}
          </p>
        </div>
      </div>

      {/* Album */}
      <div className="hidden md:block min-w-0">
        <Link
          to={`/album/${track.album.id}`}
          className="text-sm text-muted-foreground hover:underline hover:text-foreground truncate block"
        >
          {track.album.name}
        </Link>
      </div>

      {/* Actions */}
      <div className="flex items-center">
        <AddToPlaylistMenu track={track} onRemove={onRemove} showRemove={showRemove} />
      </div>

      {/* Duration */}
      <div className="flex justify-end">
        <span className="text-sm text-muted-foreground tabular-nums">
          {formatDuration(track.duration_ms)}
        </span>
      </div>
    </div>
  );
};

export default TrackCard;

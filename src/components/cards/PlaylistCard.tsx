import { Link } from 'react-router-dom';
import { Play, Music } from 'lucide-react';
import { SpotifyPlaylist } from '@/hooks/useSpotify';

interface PlaylistCardProps {
  playlist: SpotifyPlaylist;
}

const PlaylistCard = ({ playlist }: PlaylistCardProps) => {
  return (
    <Link
      to={`/playlist/${playlist.id}`}
      className="group p-4 bg-card rounded-lg hover:bg-accent/50 transition-all duration-300"
    >
      <div className="relative mb-4">
        {playlist.images?.[0]?.url ? (
          <img
            src={playlist.images[0].url}
            alt={playlist.name}
            className="w-full aspect-square object-cover rounded-md shadow-lg"
          />
        ) : (
          <div className="w-full aspect-square bg-accent rounded-md shadow-lg flex items-center justify-center">
            <Music className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <button
          className="absolute bottom-2 right-2 w-12 h-12 bg-primary rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 play-button-shadow hover:scale-105"
          onClick={(e) => {
            e.preventDefault();
            // Play playlist functionality
          }}
        >
          <Play className="h-5 w-5 text-primary-foreground fill-current ml-1" />
        </button>
      </div>
      <h3 className="font-semibold text-foreground truncate mb-1">
        {playlist.name}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-2">
        {playlist.description || `By ${playlist.owner.display_name}`}
      </p>
    </Link>
  );
};

export default PlaylistCard;

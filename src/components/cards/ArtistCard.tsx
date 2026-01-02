import { Link } from 'react-router-dom';
import { Play, User } from 'lucide-react';
import { SpotifyArtist } from '@/hooks/useSpotify';

interface ArtistCardProps {
  artist: SpotifyArtist;
}

const ArtistCard = ({ artist }: ArtistCardProps) => {
  return (
    <Link
      to={`/artist/${artist.id}`}
      className="group p-4 bg-card rounded-lg hover:bg-accent/50 transition-all duration-300"
    >
      <div className="relative mb-4">
        {artist.images?.[0]?.url ? (
          <img
            src={artist.images[0].url}
            alt={artist.name}
            className="w-full aspect-square object-cover rounded-full shadow-lg"
          />
        ) : (
          <div className="w-full aspect-square bg-accent rounded-full shadow-lg flex items-center justify-center">
            <User className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <button
          className="absolute bottom-2 right-2 w-12 h-12 bg-primary rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 play-button-shadow hover:scale-105"
          onClick={(e) => {
            e.preventDefault();
            // Play artist top tracks functionality
          }}
        >
          <Play className="h-5 w-5 text-primary-foreground fill-current ml-1" />
        </button>
      </div>
      <h3 className="font-semibold text-foreground truncate mb-1 text-center">
        {artist.name}
      </h3>
      <p className="text-sm text-muted-foreground text-center">
        Artist
      </p>
    </Link>
  );
};

export default ArtistCard;

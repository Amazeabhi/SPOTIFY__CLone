import { useState } from 'react';
import { Plus, MoreHorizontal, Trash2, Music } from 'lucide-react';
import { SpotifyTrack } from '@/hooks/useSpotify';
import { spotifyApi } from '@/lib/spotify';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useUserPlaylists } from '@/hooks/useSpotify';
import { useQueryClient } from '@tanstack/react-query';

interface AddToPlaylistMenuProps {
  track: SpotifyTrack;
  onRemove?: () => void;
  showRemove?: boolean;
}

const AddToPlaylistMenu = ({ track, onRemove, showRemove = false }: AddToPlaylistMenuProps) => {
  const { data: playlistsData } = useUserPlaylists();
  const playlists = playlistsData?.items || [];
  const queryClient = useQueryClient();

  const handleAddToPlaylist = async (playlistId: string, playlistName: string) => {
    try {
      await spotifyApi(`/playlists/${playlistId}/tracks`, {
        method: 'POST',
        body: JSON.stringify({
          uris: [`spotify:track:${track.id}`],
        }),
      });
      toast.success(`Added to ${playlistName}`);
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
    } catch (error) {
      toast.error('Failed to add to playlist');
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Plus className="mr-2 h-4 w-4" />
            Add to playlist
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48 max-h-64 overflow-y-auto">
            {playlists.length > 0 ? (
              playlists.map((playlist) => (
                <DropdownMenuItem
                  key={playlist.id}
                  onClick={() => handleAddToPlaylist(playlist.id, playlist.name)}
                  className="flex items-center gap-2"
                >
                  {playlist.images?.[0] ? (
                    <img
                      src={playlist.images[0].url}
                      alt={playlist.name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-accent flex items-center justify-center">
                      <Music className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <span className="truncate">{playlist.name}</span>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>No playlists found</DropdownMenuItem>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {showRemove && (
          <DropdownMenuItem onClick={handleRemove} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Remove from playlist
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AddToPlaylistMenu;

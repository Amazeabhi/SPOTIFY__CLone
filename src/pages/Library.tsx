import { useUserPlaylists, useTopArtists, useCurrentUser } from '@/hooks/useSpotify';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PlaylistCard from '@/components/cards/PlaylistCard';
import ArtistCard from '@/components/cards/ArtistCard';
import CardGrid from '@/components/common/CardGrid';
import CreatePlaylistDialog from '@/components/playlist/CreatePlaylistDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Heart, Music } from 'lucide-react';

const Library = () => {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: playlistsData, isLoading: playlistsLoading } = useUserPlaylists();
  const { data: artistsData, isLoading: artistsLoading } = useTopArtists();

  const playlists = playlistsData?.items || [];
  const artists = artistsData?.items || [];

  return (
    <div className="pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">Your Library</h1>
        {user && <CreatePlaylistDialog userId={user.id} />}
      </div>

      <Tabs defaultValue="playlists" className="w-full">
        <TabsList className="bg-transparent mb-6">
          <TabsTrigger
            value="playlists"
            className="data-[state=active]:bg-foreground data-[state=active]:text-background rounded-full px-4"
          >
            Playlists
          </TabsTrigger>
          <TabsTrigger
            value="artists"
            className="data-[state=active]:bg-foreground data-[state=active]:text-background rounded-full px-4"
          >
            Artists
          </TabsTrigger>
        </TabsList>

        <TabsContent value="playlists">
          {/* Liked Songs Card */}
          <Link
            to="/liked"
            className="flex items-center gap-4 p-4 mb-4 bg-gradient-to-r from-purple-700 to-blue-300 rounded-lg hover:from-purple-600 hover:to-blue-200 transition-colors"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-purple-700 to-blue-300 rounded flex items-center justify-center shadow-lg">
              <Heart className="h-8 w-8 text-foreground fill-foreground" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">Liked Songs</h3>
              <p className="text-sm text-foreground/80">Your favorite tracks</p>
            </div>
          </Link>

          {playlistsLoading ? (
            <CardGrid>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="p-4 bg-card rounded-lg">
                  <Skeleton className="aspect-square rounded-md mb-4" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </CardGrid>
          ) : playlists.length > 0 ? (
            <CardGrid>
              {playlists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </CardGrid>
          ) : (
            <div className="text-center py-12 bg-card/30 rounded-lg">
              <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Create your first playlist
              </h3>
              <p className="text-muted-foreground mb-4">
                It's easy, we'll help you
              </p>
              {user && (
                <div className="flex justify-center">
                  <CreatePlaylistDialog userId={user.id} />
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="artists">
          {artistsLoading ? (
            <CardGrid>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="p-4 bg-card rounded-lg">
                  <Skeleton className="aspect-square rounded-full mb-4" />
                  <Skeleton className="h-4 w-3/4 mx-auto mb-2" />
                  <Skeleton className="h-3 w-1/2 mx-auto" />
                </div>
              ))}
            </CardGrid>
          ) : artists.length > 0 ? (
            <CardGrid>
              {artists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </CardGrid>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Follow your first artist
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Library;

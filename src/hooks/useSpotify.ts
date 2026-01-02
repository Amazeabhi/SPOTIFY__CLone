import { useQuery } from '@tanstack/react-query';
import { spotifyApi, isAuthenticated } from '@/lib/spotify';

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: { url: string }[];
  product: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  owner: { display_name: string };
  tracks: { total: number };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string }[];
  genres: string[];
  followers: { total: number };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  preview_url: string | null;
  album: {
    id: string;
    name: string;
    images: { url: string }[];
  };
  artists: SpotifyArtist[];
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: { url: string }[];
  artists: SpotifyArtist[];
  release_date: string;
  total_tracks: number;
}

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => spotifyApi('/me') as Promise<SpotifyUser>,
    enabled: isAuthenticated(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUserPlaylists = () => {
  return useQuery({
    queryKey: ['userPlaylists'],
    queryFn: () => spotifyApi('/me/playlists?limit=50') as Promise<{ items: SpotifyPlaylist[] }>,
    enabled: isAuthenticated(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useFeaturedPlaylists = () => {
  return useQuery({
    queryKey: ['featuredPlaylists'],
    queryFn: async () => {
      // Return empty - we'll rely on user playlists instead
      // Featured playlists endpoint is deprecated by Spotify
      return { playlists: { items: [] } };
    },
    enabled: isAuthenticated(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useNewReleases = () => {
  return useQuery({
    queryKey: ['newReleases'],
    queryFn: () => spotifyApi('/browse/new-releases?limit=20') as Promise<{ albums: { items: SpotifyAlbum[] } }>,
    enabled: isAuthenticated(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useTopArtists = () => {
  return useQuery({
    queryKey: ['topArtists'],
    queryFn: () => spotifyApi('/me/top/artists?limit=20&time_range=short_term') as Promise<{ items: SpotifyArtist[] }>,
    enabled: isAuthenticated(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useTopTracks = () => {
  return useQuery({
    queryKey: ['topTracks'],
    queryFn: () => spotifyApi('/me/top/tracks?limit=20&time_range=short_term') as Promise<{ items: SpotifyTrack[] }>,
    enabled: isAuthenticated(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRecentlyPlayed = () => {
  return useQuery({
    queryKey: ['recentlyPlayed'],
    queryFn: () => spotifyApi('/me/player/recently-played?limit=20') as Promise<{ items: { track: SpotifyTrack }[] }>,
    enabled: isAuthenticated(),
    staleTime: 60 * 1000,
  });
};

export const useSearch = (query: string, types: string[] = ['track', 'artist', 'album', 'playlist']) => {
  return useQuery({
    queryKey: ['search', query, types],
    queryFn: () => spotifyApi(`/search?q=${encodeURIComponent(query)}&type=${types.join(',')}&limit=20`),
    enabled: isAuthenticated() && query.length > 0,
    staleTime: 60 * 1000,
  });
};

export const usePlaylist = (playlistId: string) => {
  return useQuery({
    queryKey: ['playlist', playlistId],
    queryFn: () => spotifyApi(`/playlists/${playlistId}`),
    enabled: isAuthenticated() && !!playlistId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useArtist = (artistId: string) => {
  return useQuery({
    queryKey: ['artist', artistId],
    queryFn: () => spotifyApi(`/artists/${artistId}`) as Promise<SpotifyArtist>,
    enabled: isAuthenticated() && !!artistId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useArtistTopTracks = (artistId: string) => {
  return useQuery({
    queryKey: ['artistTopTracks', artistId],
    queryFn: () => spotifyApi(`/artists/${artistId}/top-tracks?market=US`) as Promise<{ tracks: SpotifyTrack[] }>,
    enabled: isAuthenticated() && !!artistId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useArtistAlbums = (artistId: string) => {
  return useQuery({
    queryKey: ['artistAlbums', artistId],
    queryFn: () => spotifyApi(`/artists/${artistId}/albums?include_groups=album,single&limit=20`) as Promise<{ items: SpotifyAlbum[] }>,
    enabled: isAuthenticated() && !!artistId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useRelatedArtists = (artistId: string) => {
  return useQuery({
    queryKey: ['relatedArtists', artistId],
    queryFn: () => spotifyApi(`/artists/${artistId}/related-artists`) as Promise<{ artists: SpotifyArtist[] }>,
    enabled: isAuthenticated() && !!artistId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAlbum = (albumId: string) => {
  return useQuery({
    queryKey: ['album', albumId],
    queryFn: () => spotifyApi(`/albums/${albumId}`),
    enabled: isAuthenticated() && !!albumId,
    staleTime: 5 * 60 * 1000,
  });
};

export const usePlaybackState = () => {
  return useQuery({
    queryKey: ['playbackState'],
    queryFn: () => spotifyApi('/me/player'),
    enabled: isAuthenticated(),
    refetchInterval: 5000,
    staleTime: 1000,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => spotifyApi('/browse/categories?limit=40'),
    enabled: isAuthenticated(),
    staleTime: 5 * 60 * 1000,
  });
};

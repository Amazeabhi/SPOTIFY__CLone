import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Library, Plus, Heart } from 'lucide-react';
import { useUserPlaylists } from '@/hooks/useSpotify';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const location = useLocation();
  const { data: playlistsData } = useUserPlaylists();
  const playlists = playlistsData?.items || [];

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Library, label: 'Your Library', path: '/library' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-sidebar h-full p-2 gap-2">
      {/* Main Navigation */}
      <nav className="bg-spotify-dark-elevated rounded-lg p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={cn(
                  'flex items-center gap-4 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  location.pathname === item.path
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className="h-6 w-6" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Library Section */}
      <div className="flex-1 bg-spotify-dark-elevated rounded-lg p-4 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
            <Library className="h-6 w-6" />
            <span className="font-semibold">Your Library</span>
          </div>
          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors">
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Playlists */}
        <div className="flex-1 overflow-y-auto space-y-1">
          <Link
            to="/liked"
            className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-700 to-blue-300 rounded flex items-center justify-center flex-shrink-0">
              <Heart className="h-5 w-5 text-foreground fill-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">Liked Songs</p>
              <p className="text-xs text-muted-foreground">Playlist</p>
            </div>
          </Link>

          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              to={`/playlist/${playlist.id}`}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors group"
            >
              {playlist.images?.[0]?.url ? (
                <img
                  src={playlist.images[0].url}
                  alt={playlist.name}
                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 bg-accent rounded flex items-center justify-center flex-shrink-0">
                  <Library className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{playlist.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  Playlist • {playlist.owner.display_name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

// Spotify API Configuration
const CLIENT_ID = '8d96909a05274a2ba7125f32fd907f7e';
const REDIRECT_URI = `${window.location.origin}/callback`;

const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-library-read',
  'user-library-modify',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-read-recently-played',
  'user-top-read',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
  'streaming',
].join(' ');

// Generate random string for state
const generateRandomString = (length: number) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
};

// Generate code verifier for PKCE
const generateCodeVerifier = (length: number) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
};

// Generate code challenge from verifier
const generateCodeChallenge = async (codeVerifier: string) => {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

export const redirectToSpotifyAuth = async () => {
  if (!CLIENT_ID) {
    throw new Error('Spotify Client ID is not configured. Please set VITE_SPOTIFY_CLIENT_ID in your environment.');
  }

  const codeVerifier = generateCodeVerifier(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateRandomString(16);

  localStorage.setItem('code_verifier', codeVerifier);
  localStorage.setItem('auth_state', state);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    state: state,
    scope: SCOPES,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
};

export const getAccessToken = async (code: string): Promise<string | null> => {
  const codeVerifier = localStorage.getItem('code_verifier');

  if (!codeVerifier || !CLIENT_ID) {
    return null;
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  const data = await response.json();

  if (data.access_token) {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('token_expires', String(Date.now() + data.expires_in * 1000));
    localStorage.removeItem('code_verifier');
    localStorage.removeItem('auth_state');
    return data.access_token;
  }

  return null;
};

export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('refresh_token');

  if (!refreshToken || !CLIENT_ID) {
    return null;
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();

  if (data.access_token) {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('token_expires', String(Date.now() + data.expires_in * 1000));
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    return data.access_token;
  }

  return null;
};

export const getValidAccessToken = async (): Promise<string | null> => {
  const token = localStorage.getItem('access_token');
  const expires = localStorage.getItem('token_expires');

  if (!token || !expires) {
    return null;
  }

  if (Date.now() >= parseInt(expires) - 60000) {
    return refreshAccessToken();
  }

  return token;
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token_expires');
  localStorage.removeItem('code_verifier');
  localStorage.removeItem('auth_state');
};

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('access_token');
  const expires = localStorage.getItem('token_expires');
  return !!(token && expires && Date.now() < parseInt(expires));
};

// Spotify API helper
export const spotifyApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getValidAccessToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      logout();
      window.location.href = '/login';
    }
    throw new Error(`Spotify API error: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

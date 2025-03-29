import { format, subDays } from "date-fns";

// Last.fm API key - using a valid API key
const API_KEY = "1b5a4a0e2d2a071ce7f2ad9b1b349efd";
const BASE_URL = "https://ws.audioscrobbler.com/2.0/";

export interface Scrobble {
  artist: string;
  album: string;
  track: string;
  image: string;
  date: Date;
  url: string;
  username: string;
}

export interface User {
  username: string;
  realname?: string;
  url: string;
  image: string;
  lastScrobble?: Date;
}

// Cache for users who don't scrobble frequently
const userCache: Record<string, { data: User; timestamp: number }> = {};
const INACTIVE_USER_THRESHOLD = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

// Get user info from Last.fm
export const getUserInfo = async (username: string): Promise<User> => {
  // Check cache for inactive users
  const cachedUser = userCache[username];
  const now = Date.now();
  
  if (cachedUser && now - cachedUser.timestamp < INACTIVE_USER_THRESHOLD) {
    return cachedUser.data;
  }
  
  try {
    const response = await fetch(
      `${BASE_URL}?method=user.getinfo&user=${username}&api_key=${API_KEY}&format=json`
    );
    
    if (!response.ok) {
      throw new Error(`Error fetching user info: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Last.fm API error: ${data.message}`);
    }
    
    const user: User = {
      username: data.user.name,
      realname: data.user.realname || undefined,
      url: data.user.url,
      image: data.user.image[3]["#text"] || "/placeholder.svg",
    };
    
    // Update the cache
    userCache[username] = { data: user, timestamp: now };
    
    return user;
  } catch (error) {
    console.error("Error fetching user info:", error);
    throw error;
  }
};

// Get user's friends from Last.fm
export const getUserFriends = async (username: string): Promise<User[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}?method=user.getfriends&user=${username}&api_key=${API_KEY}&format=json`
    );
    
    if (!response.ok) {
      throw new Error(`Error fetching friends: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Last.fm API error: ${data.message}`);
    }
    
    return data.friends.user.map((friend: any) => ({
      username: friend.name,
      realname: friend.realname || undefined,
      url: friend.url,
      image: friend.image[3]["#text"] || "/placeholder.svg",
    }));
  } catch (error) {
    console.error("Error fetching friends:", error);
    throw error;
  }
};

// Get recent tracks for a user
export const getRecentTracks = async (username: string, limit = 10): Promise<Scrobble[]> => {
  try {
    const user = userCache[username];
    const now = Date.now();
    
    // If user hasn't scrobbled in 30 days, don't fetch new data as frequently
    if (user && user.data.lastScrobble) {
      const daysSinceLastScrobble = (now - user.data.lastScrobble.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastScrobble > 30 && now - user.timestamp < 24 * 60 * 60 * 1000) { // Check once per day for inactive users
        return [];
      }
    }
    
    const fromDate = format(subDays(new Date(), 7), "yyyy-MM-dd");
    
    const response = await fetch(
      `${BASE_URL}?method=user.getrecenttracks&user=${username}&from=${fromDate}&limit=${limit}&api_key=${API_KEY}&format=json`
    );
    
    if (!response.ok) {
      throw new Error(`Error fetching recent tracks: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Last.fm API error: ${data.message}`);
    }
    
    if (!data.recenttracks.track || data.recenttracks.track.length === 0) {
      return [];
    }
    
    const tracks = Array.isArray(data.recenttracks.track) 
      ? data.recenttracks.track 
      : [data.recenttracks.track];
    
    const scrobbles = tracks
      .filter((track: any) => !track["@attr"]?.nowplaying) // Filter out "now playing" tracks
      .map((track: any) => ({
        artist: track.artist["#text"],
        album: track.album["#text"],
        track: track.name,
        image: track.image[3]["#text"] || "/placeholder.svg",
        date: new Date(Number(track.date.uts) * 1000),
        url: track.url,
        username: username,
      }));
    
    // Update last scrobble time in cache
    if (scrobbles.length > 0 && userCache[username]) {
      userCache[username].data.lastScrobble = scrobbles[0].date;
      userCache[username].timestamp = now;
    }
    
    return scrobbles;
  } catch (error) {
    console.error(`Error fetching recent tracks for ${username}:`, error);
    return [];
  }
};

// Get all friends' recent scrobbles
export const getAllFriendsScrobbles = async (username: string): Promise<Scrobble[]> => {
  try {
    const friends = await getUserFriends(username);
    // Include the user's own scrobbles
    const allUsers = [{ username }, ...friends];
    
    const scrobblesPromises = allUsers.map(user => getRecentTracks(user.username));
    const scrobblesByUser = await Promise.all(scrobblesPromises);
    
    // Flatten and sort by date (newest first)
    const allScrobbles = scrobblesByUser
      .flat()
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return allScrobbles;
  } catch (error) {
    console.error("Error fetching all friends' scrobbles:", error);
    throw error;
  }
};

// Check if a user exists
export const checkUserExists = async (username: string): Promise<boolean> => {
  try {
    await getUserInfo(username);
    return true;
  } catch (error) {
    return false;
  }
};

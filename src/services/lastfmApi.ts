import { format, subDays } from "date-fns";

// Last.fm API key - using a valid API key
const API_KEY = "bdad2e1a8a56f85a4622d4c80da3f6d7";
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

export interface FetchProgress {
  currentPage: number;
  totalPages: number;
  processedUsers: number;
  totalUsers: number;
  status: string;
}

// Cache for users who don't scrobble frequently
const userCache: Record<string, { data: User; timestamp: number }> = {};
const INACTIVE_USER_THRESHOLD = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const FRIENDS_PER_PAGE = 50;

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

// Get user's friends from Last.fm with pagination
export const getUserFriends = async (
  username: string, 
  page = 1,
  onProgress?: (progress: FetchProgress) => void
): Promise<{ friends: User[]; totalPages: number }> => {
  try {
    const response = await fetch(
      `${BASE_URL}?method=user.getfriends&user=${username}&api_key=${API_KEY}&format=json&page=${page}&limit=${FRIENDS_PER_PAGE}`
    );
    
    if (!response.ok) {
      throw new Error(`Error fetching friends: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Last.fm API error: ${data.message}`);
    }

    const totalPages = Math.ceil(Number(data.friends["@attr"].total) / FRIENDS_PER_PAGE);
    
    if (onProgress) {
      onProgress({
        currentPage: page,
        totalPages,
        processedUsers: (page - 1) * FRIENDS_PER_PAGE,
        totalUsers: Number(data.friends["@attr"].total),
        status: "Fetching friends list..."
      });
    }
    
    const friends = data.friends.user.map((friend: any) => ({
      username: friend.name,
      realname: friend.realname || undefined,
      url: friend.url,
      image: friend.image[3]["#text"] || "/placeholder.svg",
    }));
    
    return { friends, totalPages };
  } catch (error) {
    console.error("Error fetching friends:", error);
    throw error;
  }
};

// Get recent tracks for a user
export const getRecentTracks = async (
  username: string, 
  limit = 10,
  checkOnly = false,
  isRefresh = false
): Promise<{ scrobbles: Scrobble[]; hasRecentActivity: boolean }> => {
  try {
    const user = userCache[username];
    const now = Date.now();
    
    // If user hasn't scrobbled in 30 days, don't fetch new data as frequently
    if (user && user.data.lastScrobble) {
      const daysSinceLastScrobble = (now - user.data.lastScrobble.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastScrobble > 30 && now - user.timestamp < 24 * 60 * 60 * 1000) {
        return { scrobbles: [], hasRecentActivity: false };
      }
    }
    
    // Always use 24h window for consistency
    const fromDate = format(
      subDays(new Date(), 1),
      "yyyy-MM-dd HH:mm"
    );
    
    // If we're just checking for activity, request only 1 track
    const checkLimit = checkOnly ? 1 : limit;
    
    const response = await fetch(
      `${BASE_URL}?method=user.getrecenttracks&user=${username}&from=${fromDate}&limit=${checkLimit}&api_key=${API_KEY}&format=json`
    );
    
    if (!response.ok) {
      throw new Error(`Error fetching recent tracks: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Last.fm API error: ${data.message}`);
    }
    
    if (!data.recenttracks.track || data.recenttracks.track.length === 0) {
      return { scrobbles: [], hasRecentActivity: false };
    }

    // If we're just checking for activity, return early
    if (checkOnly) {
      const hasRecentActivity = data.recenttracks["@attr"]?.total > 0;
      return { scrobbles: [], hasRecentActivity };
    }
    
    const tracks = Array.isArray(data.recenttracks.track) 
      ? data.recenttracks.track 
      : [data.recenttracks.track];
    
    const scrobbles = tracks
      .filter((track: any) => !track["@attr"]?.nowplaying)
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
    if (scrobbles.length > 0) {
      if (!userCache[username]) {
        userCache[username] = { 
          data: { 
            username, 
            url: `https://www.last.fm/user/${username}`,
            image: scrobbles[0].image,
            lastScrobble: scrobbles[0].date
          }, 
          timestamp: now 
        };
      } else {
        userCache[username].data.lastScrobble = scrobbles[0].date;
        userCache[username].timestamp = now;
      }
    }
    
    return { scrobbles, hasRecentActivity: true };
  } catch (error) {
    console.error(`Error fetching recent tracks for ${username}:`, error);
    return { scrobbles: [], hasRecentActivity: false };
  }
};

// Get all friends' recent scrobbles with pagination and progress tracking
export const getAllFriendsScrobbles = async (
  username: string,
  onProgress?: (progress: FetchProgress) => void,
  isRefresh = false,
  activeUsers?: string[]
): Promise<Scrobble[]> => {
  try {
    let allScrobbles: Scrobble[] = [];
    let currentPage = 1;
    let hasMoreFriends = true;
    
    // First, get the user's own scrobbles
    const userScrobbles = await getRecentTracks(username, 10, false, isRefresh);
    allScrobbles = [...userScrobbles.scrobbles];
    
    // If we're refreshing and have active users list, only fetch those
    if (isRefresh && activeUsers) {
      // Remove the main user from active users if present
      const friendsToFetch = activeUsers.filter(u => u !== username);
      
      if (onProgress) {
        onProgress({
          currentPage: 1,
          totalPages: 1,
          processedUsers: 0,
          totalUsers: friendsToFetch.length,
          status: `Refreshing ${friendsToFetch.length} active users...`
        });
      }
      
      const activeScrobblesPromises = await Promise.all(
        friendsToFetch.map(async (friend) => {
          const { scrobbles } = await getRecentTracks(friend, 10, false, true);
          return scrobbles;
        })
      );
      
      allScrobbles = [...allScrobbles, ...activeScrobblesPromises.flat()];
    } else {
      // Get first page to determine total count
      const firstPageResult = await getUserFriends(username, 1);
      const totalPages = firstPageResult.totalPages;
      
      // Then start fetching friends' data
      while (hasMoreFriends) {
        if (onProgress) {
          onProgress({
            currentPage,
            totalPages,
            processedUsers: currentPage,
            totalUsers: totalPages,
            status: `Loading page ${currentPage} of ${totalPages}...`
          });
        }

        const { friends } = currentPage === 1 ? firstPageResult : 
          await getUserFriends(username, currentPage);
        
        // Check which friends have recent activity and fetch their scrobbles
        const activeScrobblesPromises = await Promise.all(
          friends.map(async (friend) => {
            const { hasRecentActivity, scrobbles } = await getRecentTracks(
              friend.username,
              10,
              false,
              isRefresh
            );
            return hasRecentActivity ? scrobbles : [];
          })
        );
        
        allScrobbles = [...allScrobbles, ...activeScrobblesPromises.flat()];
        
        if (currentPage >= totalPages) {
          hasMoreFriends = false;
        } else {
          currentPage++;
        }
      }
    }
    
    // Sort all scrobbles by date (newest first)
    return allScrobbles.sort((a, b) => b.date.getTime() - a.date.getTime());
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

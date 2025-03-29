
import React, { createContext, useContext, useState, useEffect } from "react";
import { User, getUserInfo } from "@/services/lastfmApi";
import { useToast } from "@/components/ui/use-toast";

interface LastfmContextType {
  username: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string) => Promise<void>;
  logout: () => void;
}

const LastfmContext = createContext<LastfmContextType | undefined>(undefined);

export const LastfmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load username from cookie on initial load
  useEffect(() => {
    const savedUsername = getCookie("lastfm_username");
    if (savedUsername) {
      setUsername(savedUsername);
      fetchUserData(savedUsername);
    }
  }, []);

  const fetchUserData = async (username: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const userInfo = await getUserInfo(username);
      setUser(userInfo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch user data";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newUsername: string) => {
    setUsername(newUsername);
    setCookie("lastfm_username", newUsername, 30); // Save for 30 days
    await fetchUserData(newUsername);
  };

  const logout = () => {
    setUsername(null);
    setUser(null);
    deleteCookie("lastfm_username");
    toast({
      title: "Logged out",
      description: "You've been logged out successfully",
    });
  };

  return (
    <LastfmContext.Provider value={{ username, user, isLoading, error, login, logout }}>
      {children}
    </LastfmContext.Provider>
  );
};

export const useLastfm = (): LastfmContextType => {
  const context = useContext(LastfmContext);
  if (context === undefined) {
    throw new Error("useLastfm must be used within a LastfmProvider");
  }
  return context;
};

// Helper functions for cookies
function setCookie(name: string, value: string, days: number) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
}

function getCookie(name: string): string | null {
  const cookieName = `${name}=`;
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.indexOf(cookieName) === 0) {
      return cookie.substring(cookieName.length, cookie.length);
    }
  }
  return null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

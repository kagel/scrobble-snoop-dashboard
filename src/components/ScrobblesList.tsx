import React, { useState, useEffect, useMemo } from "react";
import { Scrobble, getAllFriendsScrobbles, FetchProgress } from "@/services/lastfmApi";
import { useLastfm } from "@/contexts/LastfmContext";
import ScrobbleCard from "./ScrobbleCard";
import ArtistSummaryTable from "./ArtistSummaryTable";
import { Button } from "@/components/ui/button";
import { RefreshCw, ListIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 50;
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds in milliseconds
const HOURS_TO_SHOW = 24;

const ScrobblesList: React.FC = () => {
  const [scrobbles, setScrobbles] = useState<Scrobble[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"card" | "table" | "artist">("card");
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [fetchProgress, setFetchProgress] = useState<FetchProgress | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(false);
  
  const { username } = useLastfm();
  const { toast } = useToast();
  
  const lastfmBaseUrl = "https://www.last.fm";
  
  // Filter scrobbles to last 24 hours and get active users
  const { recentScrobbles, activeUsers } = useMemo(() => {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - HOURS_TO_SHOW);
    
    const recent = scrobbles.filter(s => s.date > cutoffTime);
    const active = new Set(recent.map(s => s.username));
    
    return { recentScrobbles: recent, activeUsers: active };
  }, [scrobbles]);
  
  useEffect(() => {
    if (username) {
      fetchScrobbles();
    }
  }, [username]);
  
  // Set up auto-refresh interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (username && activeUsers.size > 0) {
        console.log("Auto-refreshing scrobbles for active users...");
        setIsAutoRefresh(true);
        fetchScrobbles(true);
      }
    }, AUTO_REFRESH_INTERVAL);
    
    // Clean up interval on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [username, activeUsers]);
  
  const fetchScrobbles = async (isAutoRefresh = false) => {
    if (!username) return;
    
    setIsAutoRefresh(isAutoRefresh);
    
    if (!isAutoRefresh) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    try {
      const data = await getAllFriendsScrobbles(
        username, 
        (progress) => {
          setFetchProgress(progress);
        },
        isAutoRefresh,
        isAutoRefresh ? Array.from(activeUsers) : undefined
      );
      
      if (isAutoRefresh) {
        // For auto-refresh, merge new scrobbles with existing ones
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - HOURS_TO_SHOW);
        
        // Keep old scrobbles from inactive users
        const oldScrobbles = scrobbles.filter(s => 
          s.date > cutoffTime && !activeUsers.has(s.username)
        );
        
        setScrobbles([...oldScrobbles, ...data].sort((a, b) => 
          b.date.getTime() - a.date.getTime()
        ));
      } else {
        setScrobbles(data);
      }
      
      setLastRefreshed(new Date());
      
      if (isAutoRefresh) {
        toast({
          title: "Updated",
          description: `Updated scrobbles for ${activeUsers.size} active users`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error fetching scrobbles:", error);
      if (!isAutoRefresh) {
        toast({
          title: "Error",
          description: "Failed to load scrobbles. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setFetchProgress(null);
      setIsAutoRefresh(false);
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchScrobbles(true);
      toast({
        title: "Refreshed",
        description: activeUsers.size > 0 
          ? `Updated scrobbles for ${activeUsers.size} active users`
          : "No active users to update",
      });
    } finally {
      setRefreshing(false);
    }
  };
  
  // Calculate pagination
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const visibleScrobbles = recentScrobbles.slice(startIndex, endIndex);
  const totalPages = Math.ceil(recentScrobbles.length / ITEMS_PER_PAGE);
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo(0, 0);
    }
  };
  
  if (loading || (!isAutoRefresh && fetchProgress)) {
    const progress = fetchProgress ? (
      <div className="space-y-2 mb-8">
        <div className="flex justify-between text-sm text-lastfm-gray">
          <span>{fetchProgress.status}</span>
          <span>
            {fetchProgress.processedUsers} / {fetchProgress.totalUsers} users
          </span>
        </div>
        <Progress 
          value={(fetchProgress.processedUsers / fetchProgress.totalUsers) * 100} 
          className="h-2 bg-lastfm-gray/20"
        />
      </div>
    ) : null;

    return (
      <div className="space-y-4 mt-4">
        {progress}
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex items-start space-x-3">
            <Skeleton className="h-16 w-16 rounded-md" />
            <div className="space-y-2 flex-grow">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (recentScrobbles.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-lastfm-gray mb-4">No scrobbles found for you and your friends</p>
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="border-lastfm-red text-lastfm-red hover:bg-lastfm-red/10"
          disabled={refreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    );
  }
  
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-lastfm-dark">
          Last {HOURS_TO_SHOW}h Scrobbles
          <span className="text-xs text-lastfm-gray ml-2">
            Last updated: {format(lastRefreshed, "HH:mm:ss")}
          </span>
          {activeUsers.size > 0 && (
            <span className="text-xs text-lastfm-gray ml-2">
              ({activeUsers.size} active users)
            </span>
          )}
        </h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-lastfm-gray">Card</span>
            <div className="flex items-center space-x-1">
              <Switch
                checked={viewMode !== "card"}
                onCheckedChange={(checked) => {
                  if (!checked) setViewMode("card");
                  else if (viewMode === "card") setViewMode("table");
                }}
                className="data-[state=checked]:bg-lastfm-red"
              />
              <span className="text-sm text-lastfm-gray">Table</span>
              <Switch
                checked={viewMode === "artist"}
                onCheckedChange={(checked) => setViewMode(checked ? "artist" : "table")}
                className="data-[state=checked]:bg-lastfm-red"
              />
              <span className="text-sm text-lastfm-gray">Artist</span>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="border-lastfm-red text-lastfm-red hover:bg-lastfm-red/10"
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      {viewMode === "card" ? (
        <div className="space-y-1">
          {visibleScrobbles.map((scrobble, index) => (
            <ScrobbleCard key={`${scrobble.username}-${scrobble.date.getTime()}-${index}`} scrobble={scrobble} />
          ))}
        </div>
      ) : viewMode === "table" ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Track</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead>Album</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleScrobbles.map((scrobble, index) => (
                <TableRow key={`${scrobble.username}-${scrobble.date.getTime()}-${index}`}>
                  <TableCell>{scrobble.track}</TableCell>
                  <TableCell>
                    <a 
                      href={`${lastfmBaseUrl}/music/${encodeURIComponent(scrobble.artist)}`}
                      className="hover:text-lastfm-red hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {scrobble.artist}
                    </a>
                  </TableCell>
                  <TableCell>
                    {scrobble.album ? (
                      <a 
                        href={`${lastfmBaseUrl}/music/${encodeURIComponent(scrobble.artist)}/${encodeURIComponent(scrobble.album)}`}
                        className="hover:text-lastfm-red hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {scrobble.album}
                      </a>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    <a 
                      href={`${lastfmBaseUrl}/user/${encodeURIComponent(scrobble.username)}`}
                      className="hover:text-lastfm-red hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {scrobble.username}
                    </a>
                  </TableCell>
                  <TableCell>{format(scrobble.date, "HH:mm")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <ArtistSummaryTable scrobbles={recentScrobbles} />
      )}

      {(viewMode === "card" || viewMode === "table") && totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(page - 1)}
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i + 1}>
                <PaginationLink
                  onClick={() => handlePageChange(i + 1)}
                  isActive={page === i + 1}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(page + 1)}
                className={page === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default ScrobblesList;

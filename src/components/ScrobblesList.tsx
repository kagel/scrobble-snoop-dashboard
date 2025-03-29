
import React, { useState, useEffect } from "react";
import { Scrobble, getAllFriendsScrobbles } from "@/services/lastfmApi";
import { useLastfm } from "@/contexts/LastfmContext";
import ScrobbleCard from "./ScrobbleCard";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const SCROBBLES_PER_PAGE = 15;

const ScrobblesList: React.FC = () => {
  const [scrobbles, setScrobbles] = useState<Scrobble[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  const { username } = useLastfm();
  const { toast } = useToast();
  
  useEffect(() => {
    if (username) {
      fetchScrobbles();
    }
  }, [username]);
  
  const fetchScrobbles = async () => {
    if (!username) return;
    
    setLoading(true);
    try {
      const data = await getAllFriendsScrobbles(username);
      setScrobbles(data);
    } catch (error) {
      console.error("Error fetching scrobbles:", error);
      toast({
        title: "Error",
        description: "Failed to load scrobbles. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchScrobbles();
      toast({
        title: "Refreshed",
        description: "Latest scrobbles loaded",
      });
    } finally {
      setRefreshing(false);
    }
  };
  
  const loadMore = () => {
    setPage(prevPage => prevPage + 1);
  };
  
  const visibleScrobbles = scrobbles.slice(0, page * SCROBBLES_PER_PAGE);
  const hasMore = visibleScrobbles.length < scrobbles.length;
  
  if (loading) {
    return (
      <div className="space-y-4 mt-4">
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
  
  if (scrobbles.length === 0) {
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
          Recent Scrobbles
        </h2>
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
      
      <div className="space-y-1">
        {visibleScrobbles.map((scrobble, index) => (
          <ScrobbleCard key={`${scrobble.username}-${scrobble.date.getTime()}-${index}`} scrobble={scrobble} />
        ))}
      </div>
      
      {hasMore && (
        <div className="text-center mt-6">
          <Button 
            onClick={loadMore}
            variant="outline"
            className="border-lastfm-gray text-lastfm-dark hover:bg-lastfm-gray/10"
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
};

export default ScrobblesList;

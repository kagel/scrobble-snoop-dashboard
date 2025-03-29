
import { Scrobble } from "@/services/lastfmApi";
import { Card, CardContent } from "@/components/ui/card";
import { format, formatDistanceToNow } from "date-fns";

interface ScrobbleCardProps {
  scrobble: Scrobble;
}

const ScrobbleCard = ({ scrobble }: ScrobbleCardProps) => {
  return (
    <Card className="mb-3 overflow-hidden hover:shadow-md transition-shadow duration-200 border-lastfm-gray/20">
      <CardContent className="p-3 flex items-start space-x-3">
        <div className="flex-shrink-0">
          <img 
            src={scrobble.image || "/placeholder.svg"} 
            alt={`${scrobble.album} by ${scrobble.artist}`} 
            className="w-16 h-16 object-cover rounded-md"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
        </div>
        
        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-start">
            <div className="truncate">
              <a 
                href={scrobble.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-lastfm-dark hover:text-lastfm-red transition-colors duration-200"
              >
                {scrobble.track}
              </a>
            </div>
            <span className="text-xs text-lastfm-gray ml-2 flex-shrink-0" title={format(scrobble.date, "PPpp")}>
              {formatDistanceToNow(scrobble.date, { addSuffix: true })}
            </span>
          </div>
          
          <div className="text-sm text-lastfm-dark/80 truncate">
            {scrobble.artist}
          </div>
          
          {scrobble.album && (
            <div className="text-xs text-lastfm-gray italic truncate">
              {scrobble.album}
            </div>
          )}
          
          <div className="text-xs mt-1 text-lastfm-red">
            <a 
              href={`https://www.last.fm/user/${scrobble.username}`}
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:underline"
            >
              {scrobble.username}
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScrobbleCard;

import React from "react";
import { Card } from "@/components/ui/card";
import { Scrobble } from "@/services/lastfmApi";
import { format } from "date-fns";

const ScrobbleCard: React.FC<{ scrobble: Scrobble }> = ({ scrobble }) => {
  const lastfmBaseUrl = "https://www.last.fm";

  return (
    <Card className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start space-x-3">
        <div className="h-16 w-16 flex-shrink-0">
          <img
            src={scrobble.image}
            alt={`${scrobble.artist} - ${scrobble.track}`}
            className="h-full w-full object-cover rounded-md"
          />
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-baseline justify-between space-x-2">
            <h3 className="text-sm font-medium text-lastfm-dark truncate">
              {scrobble.track}
            </h3>
            <span className="text-xs text-lastfm-gray whitespace-nowrap">
              {format(scrobble.date, "HH:mm")}
            </span>
          </div>
          <div className="mt-1 text-sm text-lastfm-gray">
            <a 
              href={`${lastfmBaseUrl}/music/${encodeURIComponent(scrobble.artist)}`}
              className="hover:text-lastfm-red hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {scrobble.artist}
            </a>
            {scrobble.album && (
              <>
                {" • "}
                <a 
                  href={`${lastfmBaseUrl}/music/${encodeURIComponent(scrobble.artist)}/${encodeURIComponent(scrobble.album)}`}
                  className="hover:text-lastfm-red hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {scrobble.album}
                </a>
              </>
            )}
          </div>
          <div className="mt-1 text-xs text-lastfm-gray">
            <a 
              href={`${lastfmBaseUrl}/user/${encodeURIComponent(scrobble.username)}`}
              className="hover:text-lastfm-red hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {scrobble.username}
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ScrobbleCard;

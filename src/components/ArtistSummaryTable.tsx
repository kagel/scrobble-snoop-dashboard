import React from "react";
import { Scrobble } from "@/services/lastfmApi";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";

interface ArtistSummary {
  artist: string;
  trackCount: number;
  lastPlayed: Date;
  image: string;
  users: Set<string>;
  url: string;
}

interface ArtistSummaryTableProps {
  scrobbles: Scrobble[];
}

const ArtistSummaryTable: React.FC<ArtistSummaryTableProps> = ({ scrobbles }) => {
  const lastfmBaseUrl = "https://www.last.fm";

  // Aggregate scrobbles by artist
  const artistSummaries = scrobbles.reduce<Record<string, ArtistSummary>>((acc, scrobble) => {
    if (!acc[scrobble.artist]) {
      acc[scrobble.artist] = {
        artist: scrobble.artist,
        trackCount: 0,
        lastPlayed: scrobble.date,
        image: scrobble.image,
        users: new Set(),
        url: scrobble.url.split("/track/")[0], // Get artist URL by removing track part
      };
    }

    acc[scrobble.artist].trackCount += 1;
    acc[scrobble.artist].users.add(scrobble.username);
    
    // Update last played if this scrobble is more recent
    if (scrobble.date > acc[scrobble.artist].lastPlayed) {
      acc[scrobble.artist].lastPlayed = scrobble.date;
      // Update image to the most recent track's image
      acc[scrobble.artist].image = scrobble.image;
    }

    return acc;
  }, {});

  // Convert to array and sort by track count (most played first)
  const sortedArtists = Object.values(artistSummaries).sort(
    (a, b) => b.trackCount - a.trackCount
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Artist</TableHead>
            <TableHead>Plays</TableHead>
            <TableHead>Listeners</TableHead>
            <TableHead>Last Played</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedArtists.map((summary) => (
            <TableRow key={summary.artist}>
              <TableCell>
                <img
                  src={summary.image || "/placeholder.svg"}
                  alt={summary.artist}
                  className="w-10 h-10 rounded-sm object-cover"
                />
              </TableCell>
              <TableCell>
                <a 
                  href={`${lastfmBaseUrl}/music/${encodeURIComponent(summary.artist)}`}
                  className="hover:text-lastfm-red hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {summary.artist}
                </a>
              </TableCell>
              <TableCell>{summary.trackCount}</TableCell>
              <TableCell>
                {Array.from(summary.users).map((user, index) => (
                  <React.Fragment key={user}>
                    {index > 0 && ", "}
                    <a 
                      href={`${lastfmBaseUrl}/user/${encodeURIComponent(user)}`}
                      className="hover:text-lastfm-red hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {user}
                    </a>
                  </React.Fragment>
                ))}
              </TableCell>
              <TableCell>{format(summary.lastPlayed, "HH:mm:ss")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ArtistSummaryTable; 
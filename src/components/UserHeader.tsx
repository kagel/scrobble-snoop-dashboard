
import { useLastfm } from "@/contexts/LastfmContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Music } from "lucide-react";

const UserHeader: React.FC = () => {
  const { user, logout } = useLastfm();
  
  if (!user) return null;
  
  return (
    <div className="flex justify-between items-center mb-6 pb-4 border-b border-lastfm-gray/20">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border border-lastfm-gray/20">
          <AvatarImage src={user.image} alt={user.username} />
          <AvatarFallback className="bg-lastfm-red text-white">
            {user.username[0]?.toUpperCase() || <Music className="h-5 w-5" />}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <h2 className="text-lg font-semibold text-lastfm-dark">{user.realname || user.username}</h2>
          <a 
            href={user.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm text-lastfm-red hover:underline"
          >
            {user.username}
          </a>
        </div>
      </div>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={logout}
        className="text-lastfm-gray hover:text-lastfm-red hover:bg-lastfm-red/10"
      >
        <LogOut className="h-4 w-4 mr-1" />
        Logout
      </Button>
    </div>
  );
};

export default UserHeader;

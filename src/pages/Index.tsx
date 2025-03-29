
import { useLastfm, LastfmProvider } from "@/contexts/LastfmContext";
import LastfmLogin from "@/components/LastfmLogin";
import Dashboard from "@/components/Dashboard";

const LastfmApp = () => {
  const { username, isLoading } = useLastfm();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lastfm-light">
        <div className="text-center">
          <div className="h-16 w-16 border-4 border-t-lastfm-red border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lastfm-dark">Loading your Last.fm profile...</p>
        </div>
      </div>
    );
  }
  
  return username ? <Dashboard /> : <LastfmLogin />;
};

const Index = () => {
  return (
    <LastfmProvider>
      <LastfmApp />
    </LastfmProvider>
  );
};

export default Index;


import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLastfm } from "@/contexts/LastfmContext";
import { checkUserExists } from "@/services/lastfmApi";
import { useToast } from "@/components/ui/use-toast";

const LastfmLogin: React.FC = () => {
  const [inputUsername, setInputUsername] = useState<string>("");
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const { login } = useLastfm();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputUsername.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Last.fm username",
        variant: "destructive",
      });
      return;
    }
    
    setIsChecking(true);
    
    try {
      const exists = await checkUserExists(inputUsername.trim());
      
      if (exists) {
        await login(inputUsername.trim());
        toast({
          title: "Success",
          description: `Welcome, ${inputUsername}!`,
        });
      } else {
        toast({
          title: "User not found",
          description: "Please check the username and try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error connecting to Last.fm",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-lastfm-light p-4">
      <Card className="w-full max-w-md border-lastfm-gray">
        <CardHeader className="bg-lastfm-red text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold">Last.fm Obsessor</CardTitle>
          <CardDescription className="text-white/80">
            Track your friends' scrobbles in one place
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-lastfm-dark mb-1">
                Your Last.fm Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your Last.fm username"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                className="border-lastfm-gray"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-lastfm-red hover:bg-lastfm-red/90 text-white"
              disabled={isChecking}
            >
              {isChecking ? "Checking..." : "Login"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-xs text-lastfm-gray">
          Note: This app requires a public Last.fm profile
        </CardFooter>
      </Card>
    </div>
  );
};

export default LastfmLogin;


import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Ghost, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tech-dark via-gray-900 to-black">
      <div className="text-center space-y-8 p-8 max-w-md">
        <div className="relative">
          <Ghost className="h-24 w-24 mx-auto text-tech-purple animate-pulse-subtle" />
          <div className="absolute -inset-2 bg-tech-purple/20 rounded-full blur-xl"></div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-white glow-text">404</h1>
          <h2 className="text-2xl font-semibold text-tech-cyan">Ghost Protocol Activated</h2>
          <p className="text-gray-400 leading-relaxed">
            The page you're looking for has vanished into the digital void. 
            Our AI agents are investigating this anomaly.
          </p>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={() => window.history.back()} 
            variant="outline" 
            className="w-full border-tech-purple text-tech-purple hover:bg-tech-purple hover:text-white transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          
          <Button 
            onClick={() => window.location.href = "/"} 
            className="w-full bg-tech-blue hover:bg-tech-cyan text-white transition-all duration-300"
          >
            <Home className="h-4 w-4 mr-2" />
            Return to Base
          </Button>
        </div>

        <div className="text-xs text-gray-500 mt-8">
          <p>SD - Ghost Protocol</p>
          <p>Advanced AI Memory & Data Platform</p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

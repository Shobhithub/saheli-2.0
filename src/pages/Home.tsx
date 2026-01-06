import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Navigation,
  Car,
  Phone as PhoneIcon,
  Mic,
  Video,
  Shield,
  Route,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CitizenLayout } from '@/components/layout/CitizenLayout';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSOS } from '@/contexts/SOSContext';
import { useToast } from '@/hooks/use-toast';
import heroIllustration from '@/assets/hero-illustration.png';

const toolkitItems = [
  { icon: Navigation, label: 'Travel Companion', color: 'bg-secondary text-secondary-foreground', path: '/travel-companion' },
  { icon: Route, label: 'Safe Route', color: 'bg-secondary text-secondary-foreground', path: '/safe-route' },
  { icon: Car, label: '24/7 Transport', color: 'bg-secondary text-secondary-foreground', path: '/transport' },
  { icon: PhoneIcon, label: 'Fake call', color: 'bg-secondary text-secondary-foreground', path: '/fake-call' },
];

export default function Home() {
  const { user } = useAuth();
  const { triggerSOS } = useSOS();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    // Get user's location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.log('Location error:', err);
        }
      );
    }
  }, []);

  const handleSOSPress = () => {
    setIsGettingLocation(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          triggerSOS(pos.coords.latitude, pos.coords.longitude);
          navigate('/sos-active');
          setIsGettingLocation(false);
        },
        (err) => {
          toast({
            title: "Location required",
            description: "Please enable location access to use SOS feature.",
            variant: "destructive",
          });
          setIsGettingLocation(false);
          // Use fallback location for demo
          triggerSOS(17.4435, 78.3772);
          navigate('/sos-active');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      // Fallback for demo
      triggerSOS(17.4435, 78.3772);
      navigate('/sos-active');
      setIsGettingLocation(false);
    }
  };

  return (
    <CitizenLayout>
      <div className="flex-1 flex flex-col pb-20">
        {/* Hero Banner */}
        <div className="bg-gradient-teal mx-4 mt-4 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <p className="text-accent-foreground font-medium text-sm leading-relaxed">
                "Together, let's make every step safer. You're not alone."
              </p>
            </div>
            <img
              src={heroIllustration}
              alt="Safety"
              className="w-24 h-24 object-contain rounded-xl -mt-2 -mr-2"
            />
          </div>
        </div>

        {/* Safety Toolkit */}
        <div className="px-4 mt-6">
          <h2 className="text-lg font-semibold text-foreground text-center mb-4">
            Safety Toolkit
          </h2>

          <div className="relative">
            {/* Toolkit Grid */}
            <div className="grid grid-cols-2 gap-4">
              {toolkitItems.map((item, index) => (
                <Button
                  key={index}
                  variant="secondary"
                  className="h-auto py-4 flex flex-col items-center gap-2 rounded-2xl hover:shadow-md transition-all"
                  onClick={() => {
                    if (item.path) {
                      navigate(item.path);
                    } else {
                      toast({ title: item.label, description: "Feature coming soon!" });
                    }
                  }}
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </Button>
              ))}
            </div>

            {/* SOS Button - Centered */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="relative">
                {/* Ripple effects */}
                <div className="absolute inset-0 bg-destructive/20 rounded-full animate-ripple" />
                <div className="absolute inset-0 bg-destructive/15 rounded-full animate-ripple" style={{ animationDelay: '0.5s' }} />

                <Button
                  variant="sos"
                  size="sos-lg"
                  className="relative z-10 shadow-sos"
                  onClick={handleSOSPress}
                  disabled={isGettingLocation}
                >
                  {isGettingLocation ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    'SOS'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Recording Actions */}
        <div className="px-4 mt-8">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="coral"
              size="lg"
              className="rounded-xl gap-2"
              onClick={() => navigate('/recording')}
            >
              <Mic className="h-5 w-5" />
              Audio recording
            </Button>
            <Button
              variant="coral"
              size="lg"
              className="rounded-xl gap-2"
              onClick={() => navigate('/recording')}
            >
              <Video className="h-5 w-5" />
              Video recording
            </Button>
          </div>
        </div>

        {/* Quick Location Card */}
        <div className="px-4 mt-6">
          <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Current Location</p>
                <p className="text-xs text-muted-foreground truncate">
                  {location
                    ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                    : 'Getting location...'
                  }
                </p>
              </div>
              <Button variant="teal" size="sm" className="rounded-lg">
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Emergency Tips */}
        <div className="px-4 mt-6 mb-4">
          <div className="bg-warning/10 rounded-2xl p-4 border border-warning/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Safety Tip</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Share your live location with trusted contacts when traveling alone at night.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </CitizenLayout>
  );
}

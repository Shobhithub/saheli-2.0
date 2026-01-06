import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, X, Check, Radio, MapPin, Mic, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSOS } from '@/contexts/SOSContext';
import { cn } from '@/lib/utils';

interface ProgressItemProps {
  label: string;
  isComplete: boolean;
  isActive: boolean;
  icon: React.ReactNode;
}

function ProgressItem({ label, isComplete, isActive, icon }: ProgressItemProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-primary-foreground/20 last:border-0">
      <div className="flex items-center gap-3">
        <div className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center",
          isComplete ? "bg-primary-foreground/20" : "bg-primary-foreground/10"
        )}>
          {icon}
        </div>
        <span className="text-primary-foreground font-medium">{label}</span>
      </div>
      
      <div className="flex items-center gap-2">
        {isActive && !isComplete && (
          <div className="w-24 h-2 bg-primary-foreground/20 rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full animate-progress w-full" />
          </div>
        )}
        {isComplete && (
          <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center">
            <Check className="h-4 w-4 text-accent-foreground" />
          </div>
        )}
        {!isComplete && !isActive && (
          <Button variant="ghost" size="icon-sm" className="text-primary-foreground/60">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function SOSActive() {
  const { isSOSActive, sosProgress, cancelSOS, currentSOS } = useSOS();
  const navigate = useNavigate();

  const handleCancel = () => {
    cancelSOS();
    navigate('/home');
  };

  const progressItems = [
    { 
      label: 'Contacting control center', 
      isComplete: sosProgress.contactingCenter,
      isActive: !sosProgress.contactingCenter,
      icon: <Radio className="h-4 w-4 text-primary-foreground" />
    },
    { 
      label: 'Sending alert to emergency contacts', 
      isComplete: sosProgress.alertingContacts,
      isActive: sosProgress.contactingCenter && !sosProgress.alertingContacts,
      icon: <MapPin className="h-4 w-4 text-primary-foreground" />
    },
    { 
      label: 'Live location tracking', 
      isComplete: sosProgress.trackingLocation,
      isActive: sosProgress.alertingContacts && !sosProgress.trackingLocation,
      icon: <MapPin className="h-4 w-4 text-primary-foreground" />
    },
    { 
      label: 'Audio & Video recording in progress', 
      isComplete: sosProgress.recording,
      isActive: sosProgress.trackingLocation && !sosProgress.recording,
      icon: <Video className="h-4 w-4 text-primary-foreground" />
    },
  ];

  return (
    <div className="min-h-screen bg-destructive flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-destructive-foreground hover:bg-destructive-foreground/10"
          onClick={handleCancel}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold text-destructive-foreground flex-1 text-center pr-10">
          SOS
        </h1>
      </header>

      {/* Progress Content */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-sm mx-auto">
          <div className="space-y-1">
            {progressItems.map((item, index) => (
              <ProgressItem
                key={index}
                label={item.label}
                isComplete={item.isComplete}
                isActive={item.isActive}
                icon={item.icon}
              />
            ))}
          </div>

          {/* All Complete Message */}
          {sosProgress.recording && (
            <div className="mt-8 p-4 bg-accent/20 rounded-2xl text-center animate-slide-in-up">
              <p className="text-primary-foreground font-semibold text-lg">
                Help is on the way!
              </p>
              <p className="text-primary-foreground/80 text-sm mt-2">
                Authorities have been notified and your location is being tracked in real-time.
              </p>
            </div>
          )}

          {/* Location Info */}
          {currentSOS && (
            <div className="mt-6 p-3 bg-destructive-foreground/10 rounded-xl">
              <p className="text-xs text-primary-foreground/80 text-center">
                📍 Location: {currentSOS.location.latitude.toFixed(4)}, {currentSOS.location.longitude.toFixed(4)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Button */}
      <div className="px-6 pb-8 pt-4">
        <div className="max-w-sm mx-auto">
          <Button
            variant="outline"
            size="xl"
            className="w-full rounded-2xl bg-card text-foreground border-0 hover:bg-card/90"
            onClick={handleCancel}
          >
            <X className="h-5 w-5 mr-2" />
            Cancel SOS
          </Button>
        </div>
      </div>
    </div>
  );
}

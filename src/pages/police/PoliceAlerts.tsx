import React, { useEffect, useRef, useMemo } from 'react';
import { AlertTriangle, Phone, MapPin, Clock, Navigation, Volume2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PoliceDashboardLayout } from '@/components/layout/PoliceDashboardLayout';
import { useSOS } from '@/contexts/SOSContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom red marker icon for SOS alerts
const sosIcon = new L.DivIcon({
  className: 'custom-sos-marker',
  html: `
    <div style="
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.3);
      animation: pulse-sos 1.5s ease-in-out infinite;
      border: 3px solid white;
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <path d="M12 9v4"/>
        <path d="M12 17h.01"/>
      </svg>
    </div>
    <style>
      @keyframes pulse-sos {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
    </style>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// Component to fit map bounds to markers
function FitBounds({ alerts }: { alerts: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (alerts.length > 0) {
      const bounds = L.latLngBounds(
        alerts.map(alert => [alert.location.latitude, alert.location.longitude])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [alerts, map]);

  return null;
}

export default function PoliceAlerts() {
  const { activeAlerts, resolveAlert } = useSOS();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeSOSAlerts = activeAlerts.filter(a => a.status === 'ACTIVE');

  // Default center (Hyderabad) if no alerts
  const defaultCenter: [number, number] = [17.4435, 78.3772];

  // Calculate center based on alerts
  const mapCenter = useMemo(() => {
    if (activeSOSAlerts.length === 0) return defaultCenter;
    const lat = activeSOSAlerts.reduce((sum, a) => sum + a.location.latitude, 0) / activeSOSAlerts.length;
    const lng = activeSOSAlerts.reduce((sum, a) => sum + a.location.longitude, 0) / activeSOSAlerts.length;
    return [lat, lng] as [number, number];
  }, [activeSOSAlerts]);

  // Play alert sound on new alerts
  useEffect(() => {
    if (activeSOSAlerts.length > 0) {
      // Create beep sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 200);
    }
  }, [activeSOSAlerts.length]);

  const handleRespond = (alertId: string, lat: number, lng: number) => {
    // Open Google Maps with directions
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(mapsUrl, '_blank');
    toast({
      title: "Responding to alert",
      description: "Navigation started in Google Maps. Backup has been notified.",
    });
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone.replace(/\s/g, '')}`, '_self');
    toast({
      title: "Calling victim",
      description: `Initiating call to ${phone}`,
    });
  };

  // Calculate distance from police station (simulated at Kukatpally)
  const policeStationLat = 17.4947;
  const policeStationLng = 78.3996;

  const calculateDistance = (lat: number, lng: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat - policeStationLat) * Math.PI / 180;
    const dLon = (lng - policeStationLng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(policeStationLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Format relative time from createdAt
  const formatTimeAgo = (createdAt: Date | string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} min${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <PoliceDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-sidebar-foreground">Active Alerts</h1>
            <p className="text-muted-foreground">Real-time SOS emergency alerts</p>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl",
            activeSOSAlerts.length > 0
              ? "bg-destructive/20 text-destructive animate-alert-flash"
              : "bg-success/20 text-success"
          )}>
            <Volume2 className="h-5 w-5" />
            <span className="font-semibold">
              {activeSOSAlerts.length > 0 ? `${activeSOSAlerts.length} ACTIVE` : 'All Clear'}
            </span>
          </div>
        </div>

        {/* Real Map with Leaflet */}
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border h-64 lg:h-96 relative overflow-hidden">
          <MapContainer
            center={mapCenter}
            zoom={12}
            style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {activeSOSAlerts.length > 0 && <FitBounds alerts={activeSOSAlerts} />}

            {activeSOSAlerts.map((alert) => (
              <Marker
                key={alert.id}
                position={[alert.location.latitude, alert.location.longitude]}
                icon={sosIcon}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-medium">
                        SOS ALERT
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900">{alert.victimName}</h3>
                    <p className="text-sm text-gray-600">{alert.victimPhone}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {alert.location.latitude.toFixed(4)}, {alert.location.longitude.toFixed(4)}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleRespond(alert.id, alert.location.latitude, alert.location.longitude)}
                        className="flex-1 px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-md hover:bg-red-600"
                      >
                        Navigate
                      </button>
                      <button
                        onClick={() => handleCall(alert.victimPhone)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-200"
                      >
                        Call
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Overlay when no alerts */}
          {activeSOSAlerts.length === 0 && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
              <div className="text-center bg-sidebar-accent/90 px-6 py-4 rounded-xl">
                <MapPin className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="text-success font-medium">No Active Alerts</p>
                <p className="text-xs text-muted-foreground">Monitoring area for emergencies</p>
              </div>
            </div>
          )}
        </div>

        {/* Alert Cards */}
        <div className="grid gap-4 lg:grid-cols-2">
          {activeSOSAlerts.length === 0 ? (
            <div className="lg:col-span-2 bg-sidebar-accent rounded-xl border border-sidebar-border p-12 text-center">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-success" />
              </div>
              <p className="text-lg font-semibold text-sidebar-foreground">No Active Alerts</p>
              <p className="text-muted-foreground">All citizens are safe. Monitoring in real-time.</p>
            </div>
          ) : (
            activeSOSAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-sidebar-accent rounded-xl border-2 border-destructive p-4 animate-alert-flash"
              >
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-xl bg-destructive/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-7 w-7 text-destructive" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground font-medium">
                        SOS ALERT
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(alert.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-sidebar-foreground">{alert.victimName}</h3>
                    <p className="text-sm text-muted-foreground">{alert.victimPhone}</p>

                    <div className="flex items-center gap-2 mt-2 text-sm text-sidebar-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{calculateDistance(alert.location.latitude, alert.location.longitude).toFixed(1)} km away</span>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1">
                      📍 {alert.location.latitude.toFixed(4)}, {alert.location.longitude.toFixed(4)}
                    </p>

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => handleRespond(alert.id || alert._id, alert.location.latitude, alert.location.longitude)}
                      >
                        <Navigation className="h-4 w-4" />
                        Respond
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 gap-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => resolveAlert(alert.id || alert._id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Resolved
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-border"
                        onClick={() => handleCall(alert.victimPhone)}
                      >
                        <Phone className="h-4 w-4" />
                        Call
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PoliceDashboardLayout>
  );
}


import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Navigation, AlertTriangle, MessageSquare, Plus, Phone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useSOS } from '@/contexts/SOSContext';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Mock Safety Data relative to user (will be adjusted dynamically in real app)
const SAFETY_SPOTS = [
    { id: 1, lat: 17.4435, lng: 78.3772, type: 'safe', label: 'Safe Area' },
    { id: 2, lat: 17.4485, lng: 78.3822, type: 'incident', label: 'Recent Incident' },
];

const DEFAULT_LOCATION = { lat: 17.4455, lng: 78.3792 };
const DEFAULT_DESTINATION = { lat: 17.4485, lng: 78.3822 }; // Kukatpally areaish

export default function SafeRoute() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { triggerSOS } = useSOS();

    const [userLocation, setUserLocation] = useState(DEFAULT_LOCATION);
    const [searchQuery, setSearchQuery] = useState('Kukatpally');

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    // User location markers references
    const userMarkerRef = useRef<L.CircleMarker | null>(null);
    const userPulseRef = useRef<L.CircleMarker | null>(null);

    // Get User Location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const newLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUserLocation(newLocation);

                    if (mapInstanceRef.current) {
                        mapInstanceRef.current.setView([newLocation.lat, newLocation.lng], 14);
                        if (userMarkerRef.current) userMarkerRef.current.setLatLng([newLocation.lat, newLocation.lng]);
                        if (userPulseRef.current) userPulseRef.current.setLatLng([newLocation.lat, newLocation.lng]);
                    }
                },
                (error) => {
                    console.error("Error getting location:", error);
                    toast({
                        title: "Location Error",
                        description: "Using default location. Please enable GPS.",
                        variant: "destructive"
                    });
                }
            );
        }
    }, [toast]);

    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (mapInstanceRef.current) return;

        // Initialize Map
        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false
        }).setView([userLocation.lat, userLocation.lng], 14);

        // Tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // User Location Markers (Pulse Effect)
        const pulse = L.circleMarker([userLocation.lat, userLocation.lng], {
            radius: 20,
            color: false,
            fillColor: '#0f766e',
            fillOpacity: 0.2
        }).addTo(map);
        userPulseRef.current = pulse;

        const dot = L.circleMarker([userLocation.lat, userLocation.lng], {
            radius: 8,
            color: 'white',
            weight: 2,
            fillColor: '#0f766e',
            fillOpacity: 1
        }).addTo(map).bindPopup("You are here");
        userMarkerRef.current = dot;

        // Destination Marker (Static for demo)
        L.marker([DEFAULT_DESTINATION.lat, DEFAULT_DESTINATION.lng]).addTo(map).bindPopup("Kukatpally");

        // Safety Spots
        SAFETY_SPOTS.forEach(spot => {
            if (spot.type === 'incident') {
                L.circleMarker([spot.lat, spot.lng], {
                    radius: 6,
                    color: 'red',
                    fillColor: 'red',
                    fillOpacity: 0.8
                }).addTo(map).bindPopup(spot.label);
            }
        });

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    const handleSearch = () => {
        toast({ title: "Routing", description: `Calculating safest path to ${searchQuery}...` });
        // Mock fly to destination
        if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([DEFAULT_DESTINATION.lat, DEFAULT_DESTINATION.lng], 15);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
            {/* Real Map Layer */}
            <div className="absolute inset-0 z-0 bg-slate-100">
                <div ref={mapContainerRef} className="w-full h-full" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4 pt-6 pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-full p-2 pr-3 shadow-lg border border-white/50">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => navigate(-1)}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            className="border-none shadow-none h-8 p-0 focus-visible:ring-0 bg-transparent text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full p-0" onClick={handleSearch}>
                        <ArrowRight className="h-4 w-4 text-primary" />
                    </Button>
                </div>

                {/* Safety Indicators */}
                <div className="flex justify-between items-start mt-4 pointer-events-none">
                    <Badge className="bg-white/90 text-green-600 hover:bg-white border-green-200 shadow-sm pointer-events-auto backdrop-blur-sm gap-1 pl-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div> Safe Area
                    </Badge>
                    <Badge className="bg-white/90 text-red-500 hover:bg-white border-red-200 shadow-sm pointer-events-auto backdrop-blur-sm gap-1 pl-1">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div> Incidents
                    </Badge>
                </div>
            </div>

            {/* Bottom Info Card */}
            <div className="mt-auto relative z-10 p-4 pb-24">
                <Card className="p-5 shadow-xl border-0 bg-white/95 backdrop-blur-md rounded-[2rem] animate-in slide-in-from-bottom duration-500">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h2 className="text-xl font-bold">{searchQuery || "Destination"}</h2>
                            <div className="flex items-center gap-1 mt-1">
                                <span className="font-bold text-sm">5.0</span>
                                <div className="flex text-yellow-400 text-xs">★★★★★</div>
                                <span className="text-xs text-muted-foreground">(97 reviews)</span>
                            </div>
                        </div>
                        <AlertTriangle className="text-red-500 h-5 w-5" />
                    </div>

                    <p className="text-xs text-green-600 mb-4 bg-green-50 p-2 rounded-lg border border-green-100">
                        Identified this area as <span className="font-bold">safe to go</span> based on recent community reports and streetlight data.
                    </p>

                    <div className="flex gap-3 mb-6">
                        <Button
                            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-lg shadow-teal-200/50"
                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${DEFAULT_DESTINATION.lat},${DEFAULT_DESTINATION.lng}`, '_blank')}
                        >
                            <Navigation className="h-4 w-4 mr-2" /> Directions
                        </Button>
                        <Button
                            className="flex-1 bg-teal-500 hover:bg-teal-600 text-white rounded-full shadow-lg shadow-teal-200/50"
                            onClick={() => toast({ title: "Navigation Started", description: "Turn-by-turn navigation is active." })}
                        >
                            Start
                        </Button>
                    </div>

                    {/* Action Bar */}
                    <div className="flex justify-center items-center gap-4">
                        <Button
                            size="icon"
                            className="h-10 w-10 rounded-full bg-teal-500 hover:bg-teal-600 shadow-md"
                            onClick={() => navigate('/reports')}
                        >
                            <Plus className="h-5 w-5 text-white" />
                        </Button>

                        <Button
                            size="icon"
                            className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 shadow-xl shadow-red-200 animate-pulse"
                            onClick={() => triggerSOS()}
                        >
                            <span className="font-bold text-white text-xs">SOS</span>
                        </Button>

                        <Button
                            size="icon"
                            className="h-10 w-10 rounded-full bg-teal-500 hover:bg-teal-600 shadow-md"
                            onClick={() => navigate('/community')}
                        >
                            <MessageSquare className="h-5 w-5 text-white" />
                        </Button>
                    </div>
                </Card>
            </div>

            <BottomNavigation />
        </div>
    );
}

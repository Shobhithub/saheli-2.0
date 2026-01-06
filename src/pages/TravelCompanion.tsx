import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Mic, ArrowRight, MessageSquare, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSOS } from '@/contexts/SOSContext';
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

const NEARBY_USERS = [
    { id: 1, name: 'Ananya Singh', distance: '250m', lat: 17.4455, lng: 78.3792, image: 'https://images.unsplash.com/photo-1596215143922-eedeaba0d91c?auto=format&fit=crop&w=100&q=80', status: 'Walking towards Metro', rating: 4.8 },
    { id: 2, name: 'Priya Patel', distance: '350m', lat: 17.4415, lng: 78.3752, image: 'https://images.unsplash.com/photo-1621592484082-2d1c72a0eff7?auto=format&fit=crop&w=100&q=80', status: 'At Bus Stop', rating: 4.5 },
    { id: 3, name: 'Diya Sharma', distance: '380m', lat: 17.4445, lng: 78.3732, image: 'https://images.unsplash.com/photo-1618077360395-f3068be8e001?auto=format&fit=crop&w=100&q=80', status: 'Waiting for cab', rating: 4.9 },
];

const DEFAULT_LOCATION = { lat: 17.4435, lng: 78.3772 };

export default function TravelCompanion() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { triggerSOS } = useSOS();

    const [selectedUser, setSelectedUser] = useState<number | null>(null);
    const [userLocation, setUserLocation] = useState(DEFAULT_LOCATION);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'distance' | 'rating'>('distance');
    const [chatSent, setChatSent] = useState<Record<number, boolean>>({});

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const userMarkerRef = useRef<L.CircleMarker | null>(null);
    const userPulseRef = useRef<L.CircleMarker | null>(null);

    // Filter and Sort Users
    const filteredUsers = NEARBY_USERS
        .filter(user => user.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'rating') return b.rating - a.rating;
            // Mock distance sort (assuming array is already roughly sorted by distance or parse string '250m')
            return parseInt(a.distance) - parseInt(b.distance);
        });

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
                        mapInstanceRef.current.setView([newLocation.lat, newLocation.lng], 15);
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

        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false
        }).setView([userLocation.lat, userLocation.lng], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        const pulse = L.circleMarker([userLocation.lat, userLocation.lng], {
            radius: 20, stroke: false, fillColor: '#0f766e', fillOpacity: 0.2
        }).addTo(map);
        userPulseRef.current = pulse;

        const dot = L.circleMarker([userLocation.lat, userLocation.lng], {
            radius: 8, color: 'white', weight: 2, fillColor: '#0f766e', fillOpacity: 1
        }).addTo(map).bindPopup("You are here");
        userMarkerRef.current = dot;

        NEARBY_USERS.forEach(user => {
            const marker = L.marker([user.lat, user.lng])
                .addTo(map)
                .bindPopup(`
                    <div style="text-align: center;">
                        <strong>${user.name}</strong><br/>
                        <span style="font-size: 10px; color: #666;">${user.rating} ★</span>
                    </div>
                `);

            marker.on('click', () => {
                setSelectedUser(user.id);
            });
        });

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    const handleChat = (userId: number, userName: string) => {
        setChatSent(prev => ({ ...prev, [userId]: true }));
        toast({
            title: `Request Sent`,
            description: `Invitation sent to ${userName}.`,
            className: "bg-teal-600 text-white border-none"
        });
    };

    return (
        <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 z-0 bg-slate-100">
                <div ref={mapContainerRef} className="w-full h-full" />
            </div>

            {/* Header Search & Filter */}
            <div className="relative z-10 p-4 pt-6 pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-full p-2 pr-4 shadow-lg border border-white/50 ring-1 ring-black/5">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-secondary/50" onClick={() => navigate(-1)}>
                        <ChevronLeft className="h-5 w-5 text-foreground" />
                    </Button>
                    <div className="flex-1 flex items-center">
                        <Search className="h-4 w-4 text-muted-foreground mr-2" />
                        <Input
                            className="border-none shadow-none h-8 p-0 focus-visible:ring-0 bg-transparent text-sm placeholder:text-muted-foreground/70"
                            placeholder="Find companion..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Toggle Pills */}
                <div className="pointer-events-auto flex justify-center mt-4 gap-3">
                    <Badge
                        variant={sortBy === 'distance' ? 'default' : 'outline'}
                        className={`px-6 py-2 rounded-full shadow-md text-sm cursor-pointer transition-transform active:scale-95 ${sortBy === 'distance' ? 'bg-coral-500 hover:bg-coral-600 text-white border-transparent' : 'bg-white/80'}`}
                        onClick={() => setSortBy('distance')}
                    >
                        Nearby
                    </Badge>
                    <Badge
                        variant={sortBy === 'rating' ? 'default' : 'outline'}
                        className={`px-6 py-2 rounded-full shadow-md text-sm cursor-pointer transition-transform active:scale-95 ${sortBy === 'rating' ? 'bg-coral-500 hover:bg-coral-600 text-white border-transparent' : 'bg-white/80'}`}
                        onClick={() => setSortBy('rating')}
                    >
                        Ratings
                    </Badge>
                </div>
            </div>

            {/* Bottom Sheet */}
            <div className={`mt-auto relative z-10 p-4 pb-24 transition-all duration-500 ease-in-out`}>
                <div className="flex justify-between items-center mb-3 px-1">
                    <span className="text-sm font-bold bg-white/90 px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm border border-white/50 text-foreground">
                        {filteredUsers.length} Users Found
                    </span>
                </div>

                <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto pr-1">
                    {filteredUsers.length === 0 ? (
                        <div className="bg-white/90 p-4 rounded-xl text-center text-sm text-gray-500">
                            No companions found matching "{searchQuery}"
                        </div>
                    ) : (
                        filteredUsers.map((user) => (
                            <Card
                                key={user.id}
                                className={`p-3 flex items-center gap-4 transition-all cursor-pointer border-0 shadow-md ${selectedUser === user.id ? 'bg-white ring-2 ring-primary scale-[1.02]' : 'bg-white/95 hover:bg-white hover:scale-[1.01]'}`}
                                onClick={() => {
                                    setSelectedUser(user.id);
                                    if (mapInstanceRef.current) {
                                        mapInstanceRef.current.flyTo([user.lat, user.lng], 16);
                                    }
                                }}
                            >
                                <Avatar className="h-12 w-12 border-2 border-white shadow-sm ring-1 ring-black/5">
                                    <AvatarImage src={user.image} className="object-cover" />
                                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-sm text-foreground">{user.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-medium text-yellow-600 flex items-center">
                                                ★ {user.rating}
                                            </span>
                                            <span className="text-[10px] font-medium px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">{user.distance}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">{user.status}</p>
                                </div>
                                <Button
                                    size="sm"
                                    variant={chatSent[user.id] ? "outline" : "default"}
                                    className={`rounded-full px-5 h-8 shadow-sm pointer-events-auto ${chatSent[user.id] ? 'bg-green-50 text-green-700 border-green-200' : 'bg-primary hover:bg-primary/90 text-white'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!chatSent[user.id]) handleChat(user.id, user.name);
                                    }}
                                >
                                    {chatSent[user.id] ? "Sent" : "Chat"}
                                </Button>
                            </Card>
                        ))
                    )}
                </div>

                {/* SOS Button */}
                <div
                    className="relative group cursor-pointer overflow-hidden rounded-full shadow-xl shadow-destructive/20 active:scale-[0.99] transition-transform pointer-events-auto"
                    onClick={() => triggerSOS()}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-rose-600"></div>
                    <div className="relative p-2 pl-3 flex items-center justify-between">
                        <div className="flex flex-col ml-3">
                            <span className="text-sm font-bold text-white">Emergency SOS</span>
                            <span className="text-[10px] text-white/80">Tap to call help</span>
                        </div>
                        <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-rose-600 shadow-md animate-pulse">
                            <ArrowRight className="h-5 w-5" />
                        </div>
                    </div>
                </div>
            </div>

            <BottomNavigation />
        </div>
    );
}

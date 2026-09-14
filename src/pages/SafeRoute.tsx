import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  AlertTriangle,
  Plus,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSOS } from "@/contexts/SOSContext";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet default icon issue
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// fallback if GPS denied
const DEFAULT_LOCATION = { lat: 17.4455, lng: 78.3792 };

// how far to search for places near user
const RADIUS_METERS = 2500;

// Overpass element type
type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type PlaceCategory = "police" | "medical" | "community";

type NearbyPlace = {
  id: string;
  category: PlaceCategory;
  name: string;
  lat: number;
  lng: number;
  rawTags?: Record<string, string>;
};

const getLatLngFromElement = (el: OverpassElement) => {
  if (el.type === "node" && el.lat != null && el.lon != null) {
    return { lat: el.lat, lng: el.lon };
  }
  if (el.center?.lat != null && el.center?.lon != null) {
    return { lat: el.center.lat, lng: el.center.lon };
  }
  return null;
};

const buildOverpassQuery = (lat: number, lng: number, radius: number) => {
  // nwr = nodes/ways/relations
  // We use "out center;" so ways/relations also include a center point.
  return `
  [out:json][timeout:25];
  (
    nwr(around:${radius},${lat},${lng})["amenity"="police"];
    nwr(around:${radius},${lat},${lng})["amenity"~"hospital|clinic|doctors|pharmacy"];
    nwr(around:${radius},${lat},${lng})["amenity"~"community_centre|social_facility|townhall"];
  );
  out center;
  `;
};

export default function SafeRoute() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { triggerSOS } = useSOS();

  const [userLocation, setUserLocation] = useState(DEFAULT_LOCATION);
  const [isLocating, setIsLocating] = useState(false);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const userPulseRef = useRef<L.CircleMarker | null>(null);

  const placesLayerRef = useRef<L.LayerGroup | null>(null);

  // Get GPS location
  useEffect(() => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(newLocation);
        setIsLocating(false);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([newLocation.lat, newLocation.lng], 14);
          userMarkerRef.current?.setLatLng([newLocation.lat, newLocation.lng]);
          userPulseRef.current?.setLatLng([newLocation.lat, newLocation.lng]);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsLocating(false);
        toast({
          title: "Location Error",
          description: "Using default location. Please enable GPS.",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, [toast]);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([userLocation.lat, userLocation.lng], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // user pulse ring
    const pulse = L.circleMarker([userLocation.lat, userLocation.lng], {
      radius: 20,
      fillColor: "#0f766e",
      fillOpacity: 0.2,
      stroke: false,
    }).addTo(map);
    userPulseRef.current = pulse;

    // user dot
    const dot = L.circleMarker([userLocation.lat, userLocation.lng], {
      radius: 8,
      color: "white",
      weight: 2,
      fillColor: "#0f766e",
      fillOpacity: 1,
    })
      .addTo(map)
      .bindPopup("You are here");
    userMarkerRef.current = dot;

    // layer for nearby places markers (so we can clear & re-add)
    placesLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNearbyPlaces = useCallback(async () => {
    try {
      setIsLoadingPlaces(true);

      const query = buildOverpassQuery(userLocation.lat, userLocation.lng, RADIUS_METERS);

      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: query,
      });

      const data = await res.json();

      const elements: OverpassElement[] = data?.elements || [];

      const parsed: NearbyPlace[] = elements
        .map((el) => {
          const ll = getLatLngFromElement(el);
          if (!ll) return null;

          const tags = el.tags || {};
          const amenity = tags.amenity || "";

          let category: PlaceCategory | null = null;

          if (amenity === "police") category = "police";
          else if (["hospital", "clinic", "doctors", "pharmacy"].includes(amenity)) category = "medical";
          else if (["community_centre", "social_facility", "townhall"].includes(amenity)) category = "community";

          if (!category) return null;

          const name =
            tags.name ||
            (category === "police"
              ? "Police Station"
              : category === "medical"
              ? "Medical"
              : "Community Place");

          return {
            id: `${el.type}:${el.id}`,
            category,
            name,
            lat: ll.lat,
            lng: ll.lng,
            rawTags: tags,
          } satisfies NearbyPlace;
        })
        .filter(Boolean) as NearbyPlace[];

      setPlaces(parsed);

      // draw markers
      if (placesLayerRef.current) {
        placesLayerRef.current.clearLayers();

        parsed.forEach((p) => {
          // color by category
          const color =
            p.category === "police" ? "#ef4444" : p.category === "medical" ? "#2563eb" : "#16a34a";

          const marker = L.circleMarker([p.lat, p.lng], {
            radius: 7,
            color,
            fillColor: color,
            fillOpacity: 0.9,
            weight: 2,
          });

          const emoji = p.category === "police" ? "👮" : p.category === "medical" ? "🏥" : "🏘️";

          marker.bindPopup(
            `<b>${emoji} ${p.name}</b><br/>(${p.category})`
          );

          marker.addTo(placesLayerRef.current!);
        });
      }

      toast({
        title: "Nearby places updated",
        description: `Found ${parsed.length} places within ${(RADIUS_METERS / 1000).toFixed(1)}km.`,
      });
    } catch (e) {
      console.error("Overpass fetch error:", e);
      toast({
        title: "Failed to load nearby places",
        description: "Try again in a few seconds (Overpass may be rate-limiting).",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPlaces(false);
    }
  }, [toast, userLocation.lat, userLocation.lng]);

  // load places once map & location are ready
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    fetchNearbyPlaces();
  }, [fetchNearbyPlaces]);

  const policeCount = places.filter((p) => p.category === "police").length;
  const medicalCount = places.filter((p) => p.category === "medical").length;
  const communityCount = places.filter((p) => p.category === "community").length;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Map */}
      <div className="absolute inset-0 z-0 bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Header */}
      <div className="relative z-10 p-4 pt-6 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-full p-2 pr-3 shadow-lg border border-white/50">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex-1">
            <p className="text-sm font-semibold">Nearby Safety Places</p>
            <p className="text-[11px] text-muted-foreground">
              {isLocating ? "Getting location..." : `Within ${(RADIUS_METERS / 1000).toFixed(1)}km`}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full p-0"
            onClick={fetchNearbyPlaces}
            disabled={isLoadingPlaces}
            title="Refresh nearby places"
          >
            <RefreshCw className={`h-4 w-4 text-primary ${isLoadingPlaces ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Indicators */}
        <div className="flex justify-between items-start mt-4 pointer-events-none">
          <Badge className="bg-white/90 text-red-500 hover:bg-white border-red-200 shadow-sm pointer-events-auto backdrop-blur-sm gap-1 pl-1">
            <div className="w-2 h-2 rounded-full bg-red-500" /> Police ({policeCount})
          </Badge>

          <Badge className="bg-white/90 text-blue-600 hover:bg-white border-blue-200 shadow-sm pointer-events-auto backdrop-blur-sm gap-1 pl-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" /> Medical ({medicalCount})
          </Badge>

          <Badge className="bg-white/90 text-green-600 hover:bg-white border-green-200 shadow-sm pointer-events-auto backdrop-blur-sm gap-1 pl-1">
            <div className="w-2 h-2 rounded-full bg-green-500" /> Community ({communityCount})
          </Badge>
        </div>
      </div>

      {/* Bottom Card */}
      <div className="mt-auto relative z-10 p-4 pb-24">
        <Card className="p-5 shadow-xl border-0 bg-white/95 backdrop-blur-md rounded-[2rem] animate-in slide-in-from-bottom duration-500">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-xl font-bold">Nearby Places</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Tap markers on the map to see details.
              </p>
            </div>
            <AlertTriangle className="text-red-500 h-5 w-5" />
          </div>

          <p className="text-xs text-green-600 mb-4 bg-green-50 p-2 rounded-lg border border-green-100">
            Showing only nearest <b>Police</b>, <b>Medical</b>, and <b>Community</b> places near your current location.
          </p>

          {/* Action Bar */}
          <div className="flex justify-center items-center gap-4">
            <Button
              size="icon"
              className="h-10 w-10 rounded-full bg-teal-500 hover:bg-teal-600 shadow-md"
              onClick={() => navigate("/reports")}
            >
              <Plus className="h-5 w-5 text-white" />
            </Button>

            <Button
              size="icon"
              className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 shadow-xl shadow-red-200 animate-pulse"
              onClick={() => triggerSOS(userLocation.lat, userLocation.lng)}
            >
              <span className="font-bold text-white text-xs">SOS</span>
            </Button>

            <Button
              size="icon"
              className="h-10 w-10 rounded-full bg-teal-500 hover:bg-teal-600 shadow-md"
              onClick={() => navigate("/community")}
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
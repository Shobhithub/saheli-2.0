/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Phone,
  MapPin,
  Clock,
  Navigation,
  Volume2,
  VolumeX,
  CheckCircle,
  Crosshair,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PoliceDashboardLayout } from "@/components/layout/PoliceDashboardLayout";
import { useSOS } from "@/contexts/SOSContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type ResolvedAlert = Record<string, any> & {
  __id: string;
  resolvedAt: string;
};

const resolvedAlertsStorageKey = "police-resolved-alerts";

const getResolvedAlerts = (): ResolvedAlert[] => {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(resolvedAlertsStorageKey);
    const alerts = stored ? JSON.parse(stored) : [];
    return Array.isArray(alerts) ? alerts : [];
  } catch {
    return [];
  }
};

const saveResolvedAlerts = (alerts: ResolvedAlert[]) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(resolvedAlertsStorageKey, JSON.stringify(alerts));
  }
};

const addResolvedAlert = (alert: ResolvedAlert): ResolvedAlert[] => {
  const alerts = [
    alert,
    ...getResolvedAlerts().filter((item) => item.__id !== alert.__id),
  ];
  saveResolvedAlerts(alerts);
  return alerts;
};

const clearResolvedAlerts = () => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(resolvedAlertsStorageKey);
  }
};

/** ---------- Marker Icon (SOS) ---------- */
const sosIcon = new L.DivIcon({
  className: "custom-sos-marker",
  html: `
    <div style="
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, #ef4444, #b91c1c);
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.55), 0 0 40px rgba(239, 68, 68, 0.25);
      animation: pulse-sos 1.35s ease-in-out infinite;
      border: 3px solid rgba(255,255,255,0.9);
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
        50% { transform: scale(1.08); }
      }
    </style>
  `,
  iconSize: [42, 42],
  iconAnchor: [21, 42],
  popupAnchor: [0, -42],
});

/** ---------- Fit bounds helper ---------- */
function FitBounds({ alerts }: { alerts: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (!alerts?.length) return;

    const bounds = L.latLngBounds(
      alerts.map((a) => [a.location.latitude, a.location.longitude])
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }, [alerts, map]);

  return null;
}

function MapOverlayControls({
  onFit,
  disabled,
}: {
  onFit: () => void;
  disabled?: boolean;
}) {
  const outlineDark =
    "bg-transparent border-sidebar-border/70 text-sidebar-foreground hover:bg-sidebar-border/40 hover:text-sidebar-foreground";

  return (
    <div className="absolute right-3 top-3 z-[500] flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className={cn("h-9 rounded-xl", outlineDark)}
        onClick={onFit}
        disabled={disabled}
        title="Fit map to active alerts"
      >
        <Crosshair className="mr-2 h-4 w-4" />
        Fit
      </Button>
    </div>
  );
}

export default function PoliceAlerts() {
  const { activeAlerts, resolveAlert } = useSOS();
  const { toast } = useToast();

  // UI state
  const [muted, setMuted] = useState(false);
  const [resolvingIds, setResolvingIds] = useState<Record<string, boolean>>({});
  const [locallyResolvedIds, setLocallyResolvedIds] = useState<Set<string>>(
    () => new Set()
  );

  // resolved alerts persisted in localStorage
  const [resolvedAlerts, setResolvedAlertsState] = useState<ResolvedAlert[]>(
    () => getResolvedAlerts()
  );

  // Beep only on NEW alerts
  const prevActiveCountRef = useRef<number>(0);

  // Map fit trigger
  const [fitTick, setFitTick] = useState(0);

  const outlineDark =
    "bg-transparent border-sidebar-border/70 text-sidebar-foreground hover:bg-sidebar-border/40 hover:text-sidebar-foreground";

  const defaultCenter: [number, number] = [17.4435, 78.3772]; // Hyderabad
  const policeStationLat = 17.4947; // simulated station
  const policeStationLng = 78.3996;

  const safeAlertId = (a: any) => (a?.id ?? a?._id ?? "").toString();

  // Build active list with stable id and local removal
  const activeSOSAlerts = useMemo(() => {
    const list = (activeAlerts ?? []).map((a: any) => ({
      ...a,
      __id: safeAlertId(a),
    }));

    return list.filter(
      (a: any) =>
        a.status === "ACTIVE" &&
        a.__id &&
        !locallyResolvedIds.has(a.__id)
    );
  }, [activeAlerts, locallyResolvedIds]);

  // Map center
  const mapCenter = useMemo(() => {
    if (activeSOSAlerts.length === 0) return defaultCenter;
    const lat =
      activeSOSAlerts.reduce((sum: number, a: any) => sum + a.location.latitude, 0) /
      activeSOSAlerts.length;
    const lng =
      activeSOSAlerts.reduce((sum: number, a: any) => sum + a.location.longitude, 0) /
      activeSOSAlerts.length;
    return [lat, lng] as [number, number];
  }, [activeSOSAlerts]);

  // Beep on new active alerts
  useEffect(() => {
    const current = activeSOSAlerts.length;
    const prev = prevActiveCountRef.current;

    if (!muted && current > prev) {
      try {
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 900;
        oscillator.type = "sine";
        gainNode.gain.value = 0.25;

        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
          audioContext.close();
        }, 220);
      } catch {
        // ignore
      }
    }

    prevActiveCountRef.current = current;
  }, [activeSOSAlerts.length, muted]);

  const calculateDistanceKm = (lat: number, lng: number) => {
    const R = 6371;
    const dLat = ((lat - policeStationLat) * Math.PI) / 180;
    const dLon = ((lng - policeStationLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((policeStationLat * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatTimeAgo = (time: Date | string) => {
    const now = new Date();
    const created = new Date(time);
    const diffMs = now.getTime() - created.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const handleRespond = (id: string, lat: number, lng: number) => {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(mapsUrl, "_blank");
    toast({
      title: "Responding to alert",
      description: "Navigation opened in Google Maps.",
    });
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone.replace(/\s/g, "")}`, "_self");
    toast({
      title: "Calling victim",
      description: `Initiating call to ${phone}`,
    });
  };

  /**
   * Resolve flow:
   * 1) Immediately remove from Active list (local Set)
   * 2) Add to resolved store + UI
   * 3) Call resolveAlert(id) to update context/backend
   * 4) If it fails: rollback (remove from resolved, re-add to active)
   */
  const handleResolve = async (id: string) => {
    if (!id || resolvingIds[id]) return;

    const alert = activeSOSAlerts.find((a: any) => a.__id === id);
    if (!alert) return;

    setResolvingIds((p) => ({ ...p, [id]: true }));

    // Step 1: remove from active immediately
    setLocallyResolvedIds((prev) => new Set(prev).add(id));

    // Step 2: store resolved locally (persistent)
    const nextResolved = addResolvedAlert({
      ...alert,
      __id: id,
      status: "RESOLVED",
      resolvedAt: new Date().toISOString(),
    });
    setResolvedAlertsState(nextResolved);

    try {
      // Step 3: update real state/backend
      await Promise.resolve(resolveAlert(id));

      toast({
        title: "Resolved",
        description: "Alert moved to Resolved Alerts.",
      });
    } catch (e: any) {
      // Step 4: rollback on failure
      setLocallyResolvedIds((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });

      // Remove the record we added (simple reload from store after clearing and re-adding others is overkill)
      // We'll just reload persisted store to be safe:
      setResolvedAlertsState(getResolvedAlerts().filter((r) => r.__id !== id));

      toast({
        title: "Resolve failed",
        description: e?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setResolvingIds((p) => ({ ...p, [id]: false }));
    }
  };

  const handleClearResolved = () => {
    clearResolvedAlerts();
    setResolvedAlertsState([]);
    toast({ title: "Cleared", description: "Resolved alerts history cleared." });
  };

  return (
    <PoliceDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-sidebar-foreground">Active Alerts</h1>
            <p className="text-muted-foreground">Real-time SOS emergency monitoring</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-2xl border",
                activeSOSAlerts.length > 0
                  ? "bg-destructive/10 text-destructive border-destructive/25 animate-alert-flash"
                  : "bg-success/10 text-success border-success/25"
              )}
            >
              {activeSOSAlerts.length > 0 ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
              <span className="font-semibold">
                {activeSOSAlerts.length > 0
                  ? `${activeSOSAlerts.length} ACTIVE`
                  : "All Clear"}
              </span>
            </div>

            <Button
              variant="outline"
              className={cn("h-10 rounded-2xl", outlineDark)}
              onClick={() => setMuted((m) => !m)}
            >
              {muted ? (
                <>
                  <VolumeX className="mr-2 h-4 w-4" /> Muted
                </>
              ) : (
                <>
                  <Volume2 className="mr-2 h-4 w-4" /> Sound On
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Map */}
        <div className="relative overflow-hidden rounded-2xl border border-sidebar-border bg-sidebar-accent">
          <div className="h-[320px] lg:h-[440px]">
            <MapContainer
              center={mapCenter}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {activeSOSAlerts.length > 0 && (
                <FitBounds key={fitTick} alerts={activeSOSAlerts} />
              )}

              {activeSOSAlerts.map((alert: any) => (
                <Marker
                  key={alert.__id}
                  position={[alert.location.latitude, alert.location.longitude]}
                  icon={sosIcon}
                >
                  <Popup>
                    <div className="min-w-[220px] p-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                          SOS ALERT
                        </span>
                        <span className="text-xs text-gray-600">
                          {formatTimeAgo(alert.createdAt)}
                        </span>
                      </div>

                      <div className="mt-2">
                        <div className="font-semibold text-gray-900">{alert.victimName}</div>
                        <div className="text-sm text-gray-700">{alert.victimPhone}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {alert.location.latitude.toFixed(4)}, {alert.location.longitude.toFixed(4)}
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          onClick={() =>
                            handleRespond(
                              alert.__id,
                              alert.location.latitude,
                              alert.location.longitude
                            )
                          }
                          className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Navigate
                        </button>
                        <button
                          onClick={() => handleCall(alert.victimPhone)}
                          className="rounded-md bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-200"
                        >
                          Call
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            <MapOverlayControls
              onFit={() => setFitTick((t) => t + 1)}
              disabled={activeSOSAlerts.length === 0}
            />

            {activeSOSAlerts.length === 0 && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/25">
                <div className="rounded-2xl border border-success/25 bg-sidebar-accent/90 px-6 py-4 text-center">
                  <MapPin className="mx-auto mb-2 h-8 w-8 text-success" />
                  <p className="font-semibold text-success">No Active Alerts</p>
                  <p className="text-xs text-muted-foreground">
                    Monitoring area for emergencies
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Alerts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-sidebar-foreground">Active SOS Alerts</h2>
            <div className="text-sm text-muted-foreground">{activeSOSAlerts.length} active</div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {activeSOSAlerts.length === 0 ? (
              <div className="xl:col-span-2 rounded-2xl border border-sidebar-border bg-sidebar-accent p-10 text-center">
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-success/10">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <p className="text-lg font-semibold text-sidebar-foreground">No Active Alerts</p>
                <p className="text-muted-foreground">
                  All citizens are safe. Monitoring in real-time.
                </p>
              </div>
            ) : (
              activeSOSAlerts.map((alert: any) => {
                const id = alert.__id as string;
                const distance = calculateDistanceKm(
                  alert.location.latitude,
                  alert.location.longitude
                );

                return (
                  <div
                    key={id}
                    className={cn(
                      "rounded-2xl border p-4 sm:p-5 bg-sidebar-accent",
                      "border-destructive/60 ring-1 ring-destructive/20 animate-alert-flash"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 rounded-2xl bg-destructive/10 p-3 ring-1 ring-destructive/15">
                        <AlertTriangle className="h-7 w-7 text-destructive" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground">
                            SOS ALERT
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTimeAgo(alert.createdAt)}
                          </span>
                        </div>

                        <h3 className="mt-2 truncate text-lg font-bold text-sidebar-foreground">
                          {alert.victimName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{alert.victimPhone}</p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                          <div className="inline-flex items-center gap-2 text-sidebar-foreground">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="font-medium">{distance.toFixed(1)} km away</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            📍 {alert.location.latitude.toFixed(4)},{" "}
                            {alert.location.longitude.toFixed(4)}
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <Button
                            variant="destructive"
                            className="h-10 rounded-xl gap-2"
                            onClick={() =>
                              handleRespond(
                                id,
                                alert.location.latitude,
                                alert.location.longitude
                              )
                            }
                          >
                            <Navigation className="h-4 w-4" />
                            Respond
                          </Button>

                          <Button
                            className={cn(
                              "h-10 rounded-xl gap-2",
                              "bg-emerald-600 hover:bg-emerald-700 text-white"
                            )}
                            onClick={() => handleResolve(id)}
                            disabled={!!resolvingIds[id]}
                          >
                            <CheckCircle className="h-4 w-4" />
                            {resolvingIds[id] ? "Resolving..." : "Resolve"}
                          </Button>

                          <Button
                            variant="outline"
                            className={cn("h-10 rounded-xl gap-2", outlineDark)}
                            onClick={() => handleCall(alert.victimPhone)}
                          >
                            <Phone className="h-4 w-4" />
                            Call
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Resolved Alerts (persistent) */}
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-sidebar-foreground">Resolved Alerts</h2>
              <span className="inline-flex items-center gap-2 rounded-full border border-sidebar-border bg-sidebar-accent px-3 py-1 text-xs text-muted-foreground">
                <History className="h-4 w-4" />
                {resolvedAlerts.length} total
              </span>
            </div>

            <Button
              variant="outline"
              className={cn("h-10 rounded-2xl", outlineDark)}
              onClick={handleClearResolved}
              disabled={resolvedAlerts.length === 0}
            >
              Clear Resolved History
            </Button>
          </div>

          {resolvedAlerts.length === 0 ? (
            <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent p-8 text-center">
              <p className="font-semibold text-sidebar-foreground">No resolved alerts yet</p>
              <p className="text-sm text-muted-foreground">
                Resolved cases will appear here and persist after refresh.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {resolvedAlerts.map((alert: any) => {
                const id = alert.__id as string;
                const distance =
                  alert?.location?.latitude && alert?.location?.longitude
                    ? calculateDistanceKm(alert.location.latitude, alert.location.longitude)
                    : null;

                return (
                  <div
                    key={id}
                    className={cn(
                      "rounded-2xl border border-success/25 bg-sidebar-accent p-4 sm:p-5",
                      "ring-1 ring-success/10"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 rounded-2xl bg-success/10 p-3 ring-1 ring-success/15">
                        <CheckCircle className="h-7 w-7 text-success" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success border border-success/25">
                            RESOLVED
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            Resolved {formatTimeAgo(alert.resolvedAt)}
                          </span>
                        </div>

                        <h3 className="mt-2 truncate text-lg font-bold text-sidebar-foreground">
                          {alert.victimName ?? "Unknown"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {alert.victimPhone ?? "N/A"}
                        </p>

                        {alert?.location && (
                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                            <div className="inline-flex items-center gap-2 text-sidebar-foreground">
                              <MapPin className="h-4 w-4 text-primary" />
                              <span className="font-medium">
                                {distance !== null ? `${distance.toFixed(1)} km away` : "—"}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              📍 {alert.location.latitude.toFixed(4)},{" "}
                              {alert.location.longitude.toFixed(4)}
                            </div>
                          </div>
                        )}

                        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <Button
                            variant="outline"
                            className={cn("h-10 rounded-xl gap-2", outlineDark)}
                            onClick={() => {
                              if (!alert?.location) return;
                              handleRespond(
                                id,
                                alert.location.latitude,
                                alert.location.longitude
                              );
                            }}
                            disabled={!alert?.location}
                          >
                            <Navigation className="h-4 w-4" />
                            Navigate
                          </Button>

                          <Button
                            variant="outline"
                            className={cn("h-10 rounded-xl gap-2", outlineDark)}
                            onClick={() => handleCall(alert.victimPhone)}
                            disabled={!alert?.victimPhone}
                          >
                            <Phone className="h-4 w-4" />
                            Call
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PoliceDashboardLayout>
  );
}
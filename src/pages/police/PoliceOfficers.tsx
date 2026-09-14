import React, { useMemo, useState } from "react";
import {
  Users,
  Phone,
  Mail,
  MapPin,
  Shield,
  Clock,
  Search,
  X,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PoliceDashboardLayout } from "@/components/layout/PoliceDashboardLayout";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type OfficerStatus = "online" | "busy" | "offline";

type Officer = {
  id: string;
  name: string;
  badge: string;
  phone: string;
  email: string;
  status: OfficerStatus;
  location: string;
  assignedAlerts: number;
};

// Mock officers data
const mockOfficers: Officer[] = [
  {
    id: "1",
    name: "Officer Priya Sharma",
    badge: "HP-2341",
    phone: "+91 98765 43210",
    email: "priya.sharma@police.gov.in",
    status: "online",
    location: "Kukatpally Zone",
    assignedAlerts: 2,
  },
  {
    id: "2",
    name: "Officer Rajesh Kumar",
    badge: "HP-2342",
    phone: "+91 98765 43211",
    email: "rajesh.kumar@police.gov.in",
    status: "online",
    location: "Madhapur Zone",
    assignedAlerts: 1,
  },
  {
    id: "3",
    name: "Officer Sunita Reddy",
    badge: "HP-2343",
    phone: "+91 98765 43212",
    email: "sunita.reddy@police.gov.in",
    status: "busy",
    location: "Gachibowli Zone",
    assignedAlerts: 3,
  },
  {
    id: "4",
    name: "Officer Vikram Singh",
    badge: "HP-2344",
    phone: "+91 98765 43213",
    email: "vikram.singh@police.gov.in",
    status: "offline",
    location: "Jubilee Hills Zone",
    assignedAlerts: 0,
  },
  {
    id: "5",
    name: "Officer Meena Patel",
    badge: "HP-2345",
    phone: "+91 98765 43214",
    email: "meena.patel@police.gov.in",
    status: "online",
    location: "Hitech City Zone",
    assignedAlerts: 0,
  },
];

const STATUS_META: Record<
  OfficerStatus,
  {
    label: string;
    dot: string;
    badge: string;
    ring: string;
  }
> = {
  online: {
    label: "Online",
    dot: "bg-success",
    badge: "bg-success/10 text-success border-success/25",
    ring: "ring-success/15",
  },
  busy: {
    label: "Busy",
    dot: "bg-warning",
    badge: "bg-warning/10 text-warning border-warning/25",
    ring: "ring-warning/15",
  },
  offline: {
    label: "Offline",
    dot: "bg-muted-foreground",
    badge: "bg-muted text-muted-foreground border-border",
    ring: "ring-muted/20",
  },
};

const FILTERS: Array<{ key: "all" | OfficerStatus; label: string }> = [
  { key: "all", label: "All" },
  { key: "online", label: "Online" },
  { key: "busy", label: "Busy" },
  { key: "offline", label: "Offline" },
];

export default function PoliceOfficers() {
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OfficerStatus>("all");

  const stats = useMemo(() => {
    const total = mockOfficers.length;
    const online = mockOfficers.filter((o) => o.status === "online").length;
    const busy = mockOfficers.filter((o) => o.status === "busy").length;
    const offline = mockOfficers.filter((o) => o.status === "offline").length;
    const available = mockOfficers.filter(
      (o) => o.status === "online" && o.assignedAlerts === 0
    ).length;
    return { total, online, busy, offline, available };
  }, []);

  const filteredOfficers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return mockOfficers.filter((officer) => {
      const matchesSearch =
        !q ||
        officer.name.toLowerCase().includes(q) ||
        officer.badge.toLowerCase().includes(q) ||
        officer.location.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "all" || officer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  const normalizePhoneForTel = (phone: string) => phone.replace(/[^\d+]/g, "");

  const handleCall = (phone: string, name: string) => {
    window.open(`tel:${normalizePhoneForTel(phone)}`, "_self");
    toast({ title: `Calling ${name}`, description: `Dialing ${phone}...` });
  };

  const handleMessage = (email: string, name: string) => {
    window.open(`mailto:${email}`, "_self");
    toast({ title: `Messaging ${name}`, description: "Opening default email client..." });
  };

  // IMPORTANT: Avoid shadcn "outline" bg-background (often white). Force dark/transparent.
  const outlineDark =
    "bg-transparent border-sidebar-border/70 text-sidebar-foreground hover:bg-sidebar-border/40 hover:text-sidebar-foreground";

  return (
    <PoliceDashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-sidebar-foreground">Officers</h1>
            <p className="text-muted-foreground">
              Manage and monitor on-duty officers across zones
            </p>
          </div>

          {/* Stats: responsive and dashboard-like */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:w-[620px]">
            <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent p-4">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="mt-1 text-2xl font-semibold text-sidebar-foreground">
                {stats.total}
              </div>
            </div>

            <div className="rounded-2xl border border-success/25 bg-success/5 p-4">
              <div className="flex items-center gap-2 text-xs text-success">
                <span className="h-2 w-2 rounded-full bg-success" />
                Online
              </div>
              <div className="mt-1 text-2xl font-semibold text-sidebar-foreground">
                {stats.online}
              </div>
            </div>

            <div className="rounded-2xl border border-warning/25 bg-warning/5 p-4">
              <div className="flex items-center gap-2 text-xs text-warning">
                <span className="h-2 w-2 rounded-full bg-warning" />
                Busy
              </div>
              <div className="mt-1 text-2xl font-semibold text-sidebar-foreground">
                {stats.busy}
              </div>
            </div>

            <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                Available
              </div>
              <div className="mt-1 text-2xl font-semibold text-sidebar-foreground">
                {stats.available}
              </div>
            </div>
          </div>
        </div>

        {/* Filters panel */}
        <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, badge, or zone..."
                className={cn(
                  "pl-9 pr-10",
                  // ensure it doesn't look disabled + matches dark dashboard
                  "bg-transparent border-sidebar-border/70 text-sidebar-foreground",
                  "placeholder:text-muted-foreground/80",
                  "focus-visible:ring-2 focus-visible:ring-primary/40"
                )}
              />
              {searchQuery.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-sidebar-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Status filter chips: wrap on mobile, no hidden buttons */}
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => {
                const active = statusFilter === f.key;
                return (
                  <Button
                    key={f.key}
                    size="sm"
                    variant={active ? "default" : "outline"}
                    onClick={() => setStatusFilter(f.key)}
                    className={cn(
                      "h-9 rounded-full px-4",
                      active
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : outlineDark
                    )}
                  >
                    {f.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>
              Showing{" "}
              <span className="font-medium text-sidebar-foreground">
                {filteredOfficers.length}
              </span>{" "}
              officer(s)
            </div>
            <div className="sm:text-right">
              Tip: Search by zone (e.g., “Madhapur”)
            </div>
          </div>
        </div>

        {/* Officers Grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredOfficers.map((officer) => {
            const meta = STATUS_META[officer.status];
            const isAvailable = officer.status === "online" && officer.assignedAlerts === 0;

            return (
              <div
                key={officer.id}
                className={cn(
                  "rounded-2xl border border-sidebar-border bg-sidebar-accent",
                  "p-4 sm:p-5",
                  "shadow-sm transition-shadow hover:shadow-md"
                )}
              >
                {/* Card header */}
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "relative grid h-12 w-12 place-items-center rounded-2xl",
                      "bg-primary/10 ring-1 ring-primary/15"
                    )}
                  >
                    <Shield className="h-6 w-6 text-primary" />
                    <span
                      className={cn(
                        "absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-sidebar-accent",
                        meta.dot
                      )}
                      title={meta.label}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-base font-semibold text-sidebar-foreground">
                        {officer.name}
                      </h3>

                      <span
                        className={cn(
                          "shrink-0 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium",
                          meta.badge
                        )}
                      >
                        <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                        {meta.label}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Badge: <span className="font-medium">{officer.badge}</span>
                    </p>
                  </div>
                </div>

                {/* Info */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">{officer.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span className="truncate">{officer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{officer.email}</span>
                  </div>

                  <div className="pt-1">
                    {officer.assignedAlerts > 0 ? (
                      <div className="inline-flex items-center gap-2 rounded-lg bg-warning/10 px-2.5 py-1.5 text-sm text-warning">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">
                          {officer.assignedAlerts} active alert(s)
                        </span>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm",
                          isAvailable
                            ? "bg-success/10 text-success"
                            : "bg-muted/30 text-muted-foreground"
                        )}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-medium">
                          {isAvailable ? "Available" : "No active alerts"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions (visible + high contrast on dark UI) */}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    className={cn(
                      "h-10 w-full justify-center rounded-xl",
                      "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                    onClick={() => handleCall(officer.phone, officer.name)}
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Call
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "h-10 w-full justify-center rounded-xl",
                      outlineDark
                    )}
                    onClick={() => handleMessage(officer.email, officer.name)}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredOfficers.length === 0 && (
          <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent p-10 text-center">
            <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="font-semibold text-sidebar-foreground">No officers found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different search term or change the status filter.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                variant="outline"
                className={cn("rounded-xl", outlineDark)}
                onClick={() => setSearchQuery("")}
              >
                Clear search
              </Button>
              <Button
                variant="outline"
                className={cn("rounded-xl", outlineDark)}
                onClick={() => setStatusFilter("all")}
              >
                Reset filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </PoliceDashboardLayout>
  );
}
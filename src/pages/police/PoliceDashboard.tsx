import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, FileText, Users, TrendingUp, Clock, MapPin } from 'lucide-react';
import { PoliceDashboardLayout } from '@/components/layout/PoliceDashboardLayout';
import { useSOS } from '@/contexts/SOSContext';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface Report {
  _id: string;
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED';
  resolvedAt?: string;
  title: string;
  description: string;
  userName: string;
  location: { latitude: number; longitude: number; address?: string };
}

export default function PoliceDashboard() {
  const { activeAlerts } = useSOS();
  const [reports, setReports] = useState<Report[]>([]);

  // Fetch all reports on mount
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/reports/all');
        setReports(res.data);
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      }
    };
    fetchReports();
  }, []);

  const activeCount = activeAlerts.filter(a => a.status === 'ACTIVE').length;
  const pendingReports = reports.filter(r => r.status === 'PENDING').length;

  // Calculate resolved today
  const resolvedToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return reports.filter(r => {
      if (r.status !== 'RESOLVED' || !r.resolvedAt) return false;
      const resolvedDate = new Date(r.resolvedAt);
      return resolvedDate >= today;
    }).length;
  }, [reports]);

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

  const stats = [
    {
      label: 'Active SOS Alerts',
      value: activeCount,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      urgent: activeCount > 0
    },
    {
      label: 'Pending Reports',
      value: pendingReports,
      icon: FileText,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      label: 'Officers Online',
      value: 8,
      icon: Users,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      label: 'Resolved Today',
      value: resolvedToday || reports.filter(r => r.status === 'RESOLVED').length,
      icon: TrendingUp,
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
  ];

  return (
    <PoliceDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-sidebar-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Real-time safety monitoring</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={cn(
                "bg-sidebar-accent rounded-xl p-4 border border-sidebar-border",
                stat.urgent && "ring-2 ring-destructive animate-alert-flash"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", stat.bgColor)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-sidebar-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Active Alerts Section */}
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border overflow-hidden">
          <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
            <h2 className="font-semibold text-sidebar-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Active SOS Alerts
            </h2>
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              activeCount > 0
                ? "bg-destructive text-destructive-foreground animate-alert-flash"
                : "bg-muted text-muted-foreground"
            )}>
              {activeCount} Active
            </span>
          </div>

          <div className="divide-y divide-sidebar-border">
            {activeAlerts.filter(a => a.status === 'ACTIVE').length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No active alerts</p>
              </div>
            ) : (
              activeAlerts.filter(a => a.status === 'ACTIVE').map((alert) => (
                <div key={alert.id} className="p-4 hover:bg-sidebar-border/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center animate-alert-flash">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sidebar-foreground">{alert.victimName}</span>
                        <span className="text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                          URGENT
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.victimPhone}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-sidebar-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{calculateDistance(alert.location.latitude, alert.location.longitude).toFixed(1)} km away</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Just now</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border overflow-hidden">
          <div className="p-4 border-b border-sidebar-border">
            <h2 className="font-semibold text-sidebar-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              Recent Community Reports
            </h2>
          </div>

          <div className="divide-y divide-sidebar-border">
            {reports.slice(0, 3).map((report) => (
              <div key={report._id} className="p-4 hover:bg-sidebar-border/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sidebar-foreground">{report.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{report.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{report.userName}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{report.location.address}</span>
                    </div>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full shrink-0",
                    report.status === 'PENDING' && "bg-warning/10 text-warning",
                    report.status === 'INVESTIGATING' && "bg-accent/10 text-accent",
                    report.status === 'RESOLVED' && "bg-success/10 text-success",
                  )}>
                    {report.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PoliceDashboardLayout>
  );
}

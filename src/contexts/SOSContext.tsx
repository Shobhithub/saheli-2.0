/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { User } from './AuthContext';

// Re-using types from AuthContext or defining here if not exported
export interface SOSAlert {
  id: string;
  _id?: string;
  victimId: string;
  victimName: string;
  victimPhone: string;
  location: { latitude: number; longitude: number; address?: string };
  status: 'ACTIVE' | 'RESOLVED';
  createdAt: Date;
  distance?: number;
}

export interface Report {
  id: string;
  _id?: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  category: string;
  location: { latitude: number; longitude: number; address?: string };
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED';
  createdAt: Date;
  policeComment?: string;
  resolvedAt?: Date;
  feedback?: { rating: number; comment: string };
}

interface SOSContextType {
  isSOSActive: boolean;
  currentSOS: SOSAlert | null;
  sosProgress: SOSProgress;
  triggerSOS: (latitude?: number, longitude?: number) => Promise<void>;
  cancelSOS: () => void;
  reports: Report[];
  addReport: (report: Omit<Report, 'id' | 'createdAt' | 'status'>) => void;
  updateReportStatus: (reportId: string, status: Report['status'], comment?: string) => void;
  addReportFeedback: (reportId: string, rating: number, comment: string) => void;
  activeAlerts: SOSAlert[];
  resolveAlert: (alertId: string) => Promise<void>;
}

interface SOSProgress {
  contactingCenter: boolean;
  alertingContacts: boolean;
  trackingLocation: boolean;
  recording: boolean;
}

const SOSContext = createContext<SOSContextType | undefined>(undefined);

export function SOSProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [currentSOS, setCurrentSOS] = useState<SOSAlert | null>(null);
  const [sosProgress, setSOSProgress] = useState<SOSProgress>({
    contactingCenter: false,
    alertingContacts: false,
    trackingLocation: false,
    recording: false,
  });
  const [reports, setReports] = useState<Report[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<SOSAlert[]>([]);

  // Fetch active alerts on mount (could be poll-based or socket-based in future)
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get('/sos/active');
        setActiveAlerts(res.data);
      } catch (err) {
        console.error("Failed to fetch active alerts");
      }
    };

    // Initial fetch
    fetchAlerts();

    // Simple polling for now
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const triggerSOS = useCallback(async (lat?: number, lng?: number) => {
    setIsSOSActive(true);

    // Default location if not provided
    let latitude = lat;
    let longitude = lng;

    if (!latitude || !longitude) {
      // Try to get location
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (e) {
        console.error("SOS Location Error:", e);
        latitude = 17.4435; // Default fallback (Hyderabad)
        longitude = 78.3772;
      }
    }

    // Optimistic UI updates
    setSOSProgress(p => ({ ...p, contactingCenter: true }));
    toast({
      title: "EMERGENCY SOS TRIGGERED",
      description: "Contacting authorities and emergency contacts...",
      variant: "destructive",
      duration: 10000,
    });

    try {
      const res = await api.post('/sos/create', { latitude, longitude });
      // NEW (fixes the crash):
        setCurrentSOS(res.data.alert); 

      // Simulate progression of systems coming online
      setTimeout(() => setSOSProgress(p => ({ ...p, alertingContacts: true })), 1000);
      setTimeout(() => setSOSProgress(p => ({ ...p, trackingLocation: true })), 2000);
      setTimeout(() => setSOSProgress(p => ({ ...p, recording: true })), 3000);

      toast({
        title: "SOS SENT SUCCESSFULLY",
        description: "Help is on the way. Location shared with Police.",
        variant: "destructive",
      });

    } catch (error) {
      console.error("SOS Failed:", error);
      toast({
        title: "SOS CONNECTION FAILED",
        description: "Could not reach server. Trying SMS fallback...",
        variant: "destructive"
      });
      // In real app: Trigger Native SMS via fallback
    }
  }, [toast]);

  const cancelSOS = useCallback(() => {
    setIsSOSActive(false);
    setCurrentSOS(null);
    setSOSProgress({
      contactingCenter: false,
      alertingContacts: false,
      trackingLocation: false,
      recording: false,
    });
    toast({
      title: "SOS Cancelled",
      description: "Emergency mode deactivated.",
    });
  }, [toast]);

  // Fetch reports on mount
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/reports');
        setReports(res.data);
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      }
    };
    fetchReports();
  }, []);

  // Create report via API
  const addReport = useCallback(async (report: Omit<Report, 'id' | 'createdAt' | 'status'>) => {
    try {
      const res = await api.post('/reports', report);
      setReports(prev => [res.data, ...prev]);
      toast({ title: "Report Submitted", description: "Thank you for helping the community." });
    } catch (error: any) {
      console.error("Failed to create report:", error);
      toast({
        title: "Failed to submit report",
        description: error.response?.data?.message || "Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const updateReportStatus = useCallback((reportId: string, status: Report['status'], comment?: string) => {
    setReports(prev => prev.map(r =>
      r.id === reportId
        ? {
          ...r,
          status,
          policeComment: comment || r.policeComment,
          resolvedAt: status === 'RESOLVED' ? new Date() : r.resolvedAt,
        }
        : r
    ));
  }, []);

  // Add feedback via API
  const addReportFeedback = useCallback(async (reportId: string, rating: number, comment: string) => {
    try {
      const res = await api.put(`/reports/${reportId}/feedback`, { rating, comment });
      setReports(prev => prev.map(r =>
        r.id === reportId || r._id === reportId
          ? { ...r, feedback: { rating, comment } }
          : r
      ));
      toast({ title: "Thank you for your feedback!" });
    } catch (error: any) {
      console.error("Failed to add feedback:", error);
      toast({ title: "Failed to submit feedback", variant: "destructive" });
    }
  }, [toast]);

  // Resolve an SOS alert
  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      await api.put(`/sos/${alertId}/resolve`);
      // Remove from active alerts
      setActiveAlerts(prev => prev.filter(a => (a.id !== alertId && a._id !== alertId)));
      toast({
        title: "Alert Resolved",
        description: "The emergency has been marked as resolved.",
      });
    } catch (error: any) {
      console.error("Failed to resolve alert:", error);
      toast({
        title: "Failed to resolve alert",
        description: error.response?.data?.message || "Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  return (
    <SOSContext.Provider
      value={{
        isSOSActive,
        currentSOS,
        sosProgress,
        triggerSOS,
        cancelSOS,
        reports,
        addReport,
        updateReportStatus,
        addReportFeedback,
        activeAlerts,
        resolveAlert,
      }}
    >
      {children}
    </SOSContext.Provider>
  );
}

export function useSOS() {
  const context = useContext(SOSContext);
  if (context === undefined) {
    throw new Error('useSOS must be used within an SOSProvider');
  }
  return context;
}

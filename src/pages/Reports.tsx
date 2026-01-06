import React, { useState } from 'react';
import { Plus, MapPin, ChevronRight, Star, MessageSquare, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CitizenLayout } from '@/components/layout/CitizenLayout';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { useSOS } from '@/contexts/SOSContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Report } from '@/contexts/AuthContext';

const categoryOptions = [
  { value: 'streetlight', label: 'Broken Streetlight' },
  { value: 'harassment', label: 'Harassment Hotspot' },
  { value: 'unsafe_area', label: 'Unsafe Area' },
  { value: 'other', label: 'Other' },
];

const statusColors = {
  PENDING: 'bg-warning/10 text-warning border-warning/20',
  INVESTIGATING: 'bg-accent/10 text-accent border-accent/20',
  RESOLVED: 'bg-success/10 text-success border-success/20',
};

const statusIcons = {
  PENDING: Clock,
  INVESTIGATING: AlertCircle,
  RESOLVED: CheckCircle2,
};

export default function Reports() {
  const { reports, addReport, addReportFeedback } = useSOS();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState<string | null>(null);
  const [newReport, setNewReport] = useState({
    title: '',
    description: '',
    category: '' as Report['category'] | '',
  });
  const [feedbackData, setFeedbackData] = useState({ rating: 0, comment: '' });

  // Location state
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Get user location when dialog opens
  const fetchUserLocation = async () => {
    setLocationLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      // Reverse geocoding using OpenStreetMap Nominatim
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        const address = data.display_name?.split(',').slice(0, 3).join(',') ||
          `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        setUserLocation({ latitude: lat, longitude: lng, address });
      } catch {
        setUserLocation({
          latitude: lat,
          longitude: lng,
          address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        });
      }
    } catch (error) {
      console.error('Location error:', error);
      toast({
        title: "Location Error",
        description: "Could not get your location. Using default.",
        variant: "destructive"
      });
      // Fallback location
      setUserLocation({
        latitude: 17.4435,
        longitude: 78.3772,
        address: 'Location unavailable'
      });
    } finally {
      setLocationLoading(false);
    }
  };

  // Reports are already filtered by user on the backend
  const userReports = reports;

  const handleSubmitReport = () => {
    if (!newReport.title || !newReport.description || !newReport.category) {
      toast({
        title: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    const location = userLocation || {
      latitude: 17.4435,
      longitude: 78.3772,
      address: 'Location unavailable'
    };

    addReport({
      userId: user?._id || user?.id || '',
      userName: user?.name || 'Anonymous',
      title: newReport.title,
      description: newReport.description,
      category: newReport.category,
      location: location,
    });

    setNewReport({ title: '', description: '', category: '' });
    setUserLocation(null);
    setIsOpen(false);
  };

  const handleFeedback = (reportId: string) => {
    if (feedbackData.rating === 0) {
      toast({ title: "Please select a rating", variant: "destructive" });
      return;
    }

    addReportFeedback(reportId, feedbackData.rating, feedbackData.comment);
    toast({ title: "Thank you for your feedback!" });
    setFeedbackOpen(null);
    setFeedbackData({ rating: 0, comment: '' });
  };

  return (
    <CitizenLayout title="My Reports">
      <div className="flex-1 flex flex-col pb-20">
        {/* Header Actions */}
        <div className="px-4 py-4 bg-card border-b border-border">
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (open && !userLocation) {
              fetchUserLocation();
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="coral" size="lg" className="w-full rounded-xl gap-2">
                <Plus className="h-5 w-5" />
                Report an Issue
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm mx-4 rounded-2xl">
              <DialogHeader>
                <DialogTitle>Report an Issue</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newReport.category}
                    onValueChange={(v) => setNewReport(p => ({ ...p, category: v as Report['category'] }))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="Brief title of the issue"
                    value={newReport.title}
                    onChange={(e) => setNewReport(p => ({ ...p, title: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe the issue in detail..."
                    value={newReport.description}
                    onChange={(e) => setNewReport(p => ({ ...p, description: e.target.value }))}
                    className="rounded-xl min-h-[100px]"
                  />
                </div>

                <div className="p-3 bg-muted rounded-xl flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {locationLoading ? (
                    <span className="text-sm text-muted-foreground">Detecting location...</span>
                  ) : userLocation ? (
                    <span className="text-sm text-muted-foreground truncate">{userLocation.address}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Location will be auto-detected</span>
                  )}
                </div>

                <Button variant="coral" className="w-full rounded-xl" onClick={handleSubmitReport}>
                  Submit Report
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Reports List */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {userReports.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No reports yet</p>
              <p className="text-sm text-muted-foreground">Report issues to help make your community safer</p>
            </div>
          ) : (
            userReports.map((report) => {
              const StatusIcon = statusIcons[report.status];

              return (
                <div
                  key={report._id || report.id}
                  className="bg-card rounded-2xl border border-border p-4 shadow-sm animate-slide-in-up"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full border font-medium",
                          statusColors[report.status]
                        )}>
                          <StatusIcon className="h-3 w-3 inline mr-1" />
                          {report.status}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground">{report.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {report.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{report.location.address || 'Unknown location'}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>

                  {/* Police Comment */}
                  {report.policeComment && (
                    <div className="mt-3 p-3 bg-muted rounded-xl">
                      <p className="text-xs font-medium text-foreground">Police Response:</p>
                      <p className="text-sm text-muted-foreground">{report.policeComment}</p>
                    </div>
                  )}

                  {/* Feedback Button */}
                  {report.status === 'RESOLVED' && !report.feedback && (
                    <Dialog open={feedbackOpen === (report._id || report.id)} onOpenChange={(o) => setFeedbackOpen(o ? (report._id || report.id) : null)}>
                      <DialogTrigger asChild>
                        <Button variant="teal" size="sm" className="mt-3 rounded-lg gap-1">
                          <Star className="h-4 w-4" />
                          Give Feedback
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-sm mx-4 rounded-2xl">
                        <DialogHeader>
                          <DialogTitle>Rate Resolution</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setFeedbackData(p => ({ ...p, rating: star }))}
                                className="p-1"
                              >
                                <Star
                                  className={cn(
                                    "h-8 w-8 transition-colors",
                                    star <= feedbackData.rating
                                      ? "fill-warning text-warning"
                                      : "text-muted-foreground"
                                  )}
                                />
                              </button>
                            ))}
                          </div>
                          <Textarea
                            placeholder="Additional comments (optional)"
                            value={feedbackData.comment}
                            onChange={(e) => setFeedbackData(p => ({ ...p, comment: e.target.value }))}
                            className="rounded-xl"
                          />
                          <Button variant="coral" className="w-full rounded-xl" onClick={() => handleFeedback(report._id || report.id)}>
                            Submit Feedback
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Already gave feedback */}
                  {report.feedback && (
                    <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-warning text-warning" />
                      <span>You rated this {report.feedback.rating}/5</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <BottomNavigation />
    </CitizenLayout>
  );
}

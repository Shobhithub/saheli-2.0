/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  FileText,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  MessageSquare,
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PoliceDashboardLayout } from '@/components/layout/PoliceDashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface Report {
  _id: string;
  id?: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  category: string;
  location: { latitude: number; longitude: number; address?: string };
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED';
  createdAt: string;
  policeComment?: string;
}

const statusOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'INVESTIGATING', label: 'Investigating' },
  { value: 'RESOLVED', label: 'Resolved' },
];

export default function PoliceReports() {
  const { toast } = useToast();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [comment, setComment] = useState('');
  const [filter, setFilter] = useState<'all' | Report['status']>('all');

  // Fetch all reports on mount
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/reports/all');
        setReports(res.data);
      } catch (error) {
        console.error('Failed to fetch reports:', error);
        toast({ title: 'Error loading reports', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const filteredReports = filter === 'all'
    ? reports
    : reports.filter(r => r.status === filter);

  const handleUpdateStatus = async (reportId: string, status: Report['status']) => {
    try {
      const res = await api.put(`/reports/${reportId}/status`, {
        status,
        policeComment: comment || undefined
      });
      // Update local state
      setReports(prev => prev.map(r =>
        (r._id === reportId || r.id === reportId) ? res.data : r
      ));
      toast({
        title: "Status updated",
        description: `Report marked as ${status}`,
      });
      setComment('');
      setSelectedReport(null);
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  };

  return (
    <PoliceDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-sidebar-foreground">Community Reports</h1>
            <p className="text-muted-foreground">Manage citizen-reported issues</p>
          </div>

          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-[180px] bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reports</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="INVESTIGATING">Investigating</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reports Table */}
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sidebar-border">
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Reporter</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-right p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sidebar-border">
                {filteredReports.map((report) => (
                  <tr key={report._id} className="hover:bg-sidebar-border/50 transition-colors">
                    <td className="p-4 text-sm text-sidebar-foreground whitespace-nowrap">
                      {formatDate(report.createdAt)}
                    </td>
                    <td className="p-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                        {report.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-sidebar-foreground max-w-[200px] truncate">
                      {report.title}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {report.userName}
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full inline-flex items-center gap-1",
                        report.status === 'PENDING' && "bg-warning/10 text-warning",
                        report.status === 'INVESTIGATING' && "bg-accent/10 text-accent",
                        report.status === 'RESOLVED' && "bg-success/10 text-success",
                      )}>
                        {report.status === 'PENDING' && <Clock className="h-3 w-3" />}
                        {report.status === 'INVESTIGATING' && <AlertCircle className="h-3 w-3" />}
                        {report.status === 'RESOLVED' && <CheckCircle2 className="h-3 w-3" />}
                        {report.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-sidebar-foreground hover:bg-sidebar-border gap-1"
                        onClick={() => setSelectedReport(report)}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredReports.length === 0 && (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No reports found</p>
            </div>
          )}
        </div>

        {/* Report Detail Modal */}
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-lg bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
            <DialogHeader>
              <DialogTitle>Report Details</DialogTitle>
            </DialogHeader>

            {selectedReport && (
              <div className="space-y-4 mt-4">
                <div>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full capitalize",
                    "bg-primary/10 text-primary"
                  )}>
                    {selectedReport.category.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">{selectedReport.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{selectedReport.description}</p>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedReport.location.address || 'Location coordinates available'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Reported by {selectedReport.userName} on {formatDate(selectedReport.createdAt)}</span>
                </div>

                <div className="border-t border-sidebar-border pt-4 space-y-3">
                  <div className="space-y-3">
                    <span className="text-sm font-medium">Update Status:</span>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className={cn(
                          "min-w-[100px]",
                          selectedReport.status === 'PENDING'
                            ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                            : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/50"
                        )}
                        onClick={() => handleUpdateStatus(selectedReport._id, 'PENDING')}
                      >
                        Pending
                      </Button>
                      <Button
                        size="sm"
                        className={cn(
                          "min-w-[100px]",
                          selectedReport.status === 'INVESTIGATING'
                            ? "bg-blue-500 hover:bg-blue-600 text-white"
                            : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/50"
                        )}
                        onClick={() => handleUpdateStatus(selectedReport._id, 'INVESTIGATING')}
                      >
                        Investigating
                      </Button>
                      <Button
                        size="sm"
                        className={cn(
                          "min-w-[100px]",
                          selectedReport.status === 'RESOLVED'
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : "bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50"
                        )}
                        onClick={() => handleUpdateStatus(selectedReport._id, 'RESOLVED')}
                      >
                        Resolved
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      Add Comment
                    </label>
                    <Textarea
                      placeholder="Add official response or notes..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="bg-sidebar border-sidebar-border text-sidebar-foreground"
                    />
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PoliceDashboardLayout>
  );
}

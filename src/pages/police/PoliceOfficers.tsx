import React, { useState } from 'react';
import {
    Users,
    Phone,
    Mail,
    MapPin,
    Shield,
    Clock,
    CheckCircle2,
    Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PoliceDashboardLayout } from '@/components/layout/PoliceDashboardLayout';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Mock officers data
const mockOfficers = [
    {
        id: '1',
        name: 'Officer Priya Sharma',
        badge: 'HP-2341',
        phone: '+91 98765 43210',
        email: 'priya.sharma@police.gov.in',
        status: 'online' as const,
        location: 'Kukatpally Zone',
        assignedAlerts: 2
    },
    {
        id: '2',
        name: 'Officer Rajesh Kumar',
        badge: 'HP-2342',
        phone: '+91 98765 43211',
        email: 'rajesh.kumar@police.gov.in',
        status: 'online' as const,
        location: 'Madhapur Zone',
        assignedAlerts: 1
    },
    {
        id: '3',
        name: 'Officer Sunita Reddy',
        badge: 'HP-2343',
        phone: '+91 98765 43212',
        email: 'sunita.reddy@police.gov.in',
        status: 'busy' as const,
        location: 'Gachibowli Zone',
        assignedAlerts: 3
    },
    {
        id: '4',
        name: 'Officer Vikram Singh',
        badge: 'HP-2344',
        phone: '+91 98765 43213',
        email: 'vikram.singh@police.gov.in',
        status: 'offline' as const,
        location: 'Jubilee Hills Zone',
        assignedAlerts: 0
    },
    {
        id: '5',
        name: 'Officer Meena Patel',
        badge: 'HP-2345',
        phone: '+91 98765 43214',
        email: 'meena.patel@police.gov.in',
        status: 'online' as const,
        location: 'Hitech City Zone',
        assignedAlerts: 0
    },
];

const statusColors = {
    online: 'bg-success',
    busy: 'bg-warning',
    offline: 'bg-muted-foreground',
};

export default function PoliceOfficers() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'busy' | 'offline'>('all');

    const filteredOfficers = mockOfficers.filter(officer => {
        const matchesSearch = officer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            officer.badge.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || officer.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const onlineCount = mockOfficers.filter(o => o.status === 'online').length;
    const busyCount = mockOfficers.filter(o => o.status === 'busy').length;

    const { toast } = useToast();

    const handleCall = (phone: string, name: string) => {
        window.open(`tel:${phone.replace(/\s/g, '')}`, '_self');
        toast({
            title: `Calling ${name}`,
            description: `Dialing ${phone}...`,
        });
    };

    const handleMessage = (email: string, name: string) => {
        window.open(`mailto:${email}`, '_self');
        toast({
            title: `Messaging ${name}`,
            description: "Opening default email client...",
        });
    };

    return (
        <PoliceDashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-sidebar-foreground">Officers</h1>
                        <p className="text-muted-foreground">Manage and monitor on-duty officers</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 rounded-lg text-success text-sm">
                            <div className="h-2 w-2 rounded-full bg-success" />
                            {onlineCount} Online
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 rounded-lg text-warning text-sm">
                            <div className="h-2 w-2 rounded-full bg-warning" />
                            {busyCount} Busy
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search officers by name or badge..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
                        />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'online', 'busy', 'offline'].map((status) => (
                            <Button
                                key={status}
                                variant={statusFilter === status ? 'default' : 'outline'}
                                size="sm"
                                className={cn(
                                    statusFilter !== status && "border-sidebar-border text-sidebar-foreground hover:bg-sidebar-border"
                                )}
                                onClick={() => setStatusFilter(status as any)}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Officers Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredOfficers.map((officer) => (
                        <div
                            key={officer.id}
                            className="bg-sidebar-accent rounded-xl border border-sidebar-border p-4"
                        >
                            <div className="flex items-start gap-3">
                                <div className="relative">
                                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                                        <Shield className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className={cn(
                                        "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-sidebar-accent",
                                        statusColors[officer.status]
                                    )} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sidebar-foreground truncate">
                                        {officer.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">{officer.badge}</p>
                                </div>

                                <span className={cn(
                                    "text-xs px-2 py-0.5 rounded-full capitalize",
                                    officer.status === 'online' && "bg-success/10 text-success",
                                    officer.status === 'busy' && "bg-warning/10 text-warning",
                                    officer.status === 'offline' && "bg-muted text-muted-foreground",
                                )}>
                                    {officer.status}
                                </span>
                            </div>

                            <div className="mt-4 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    <span>{officer.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="h-4 w-4" />
                                    <span>{officer.phone}</span>
                                </div>
                                {officer.assignedAlerts > 0 && (
                                    <div className="flex items-center gap-2 text-sm text-warning">
                                        <Clock className="h-4 w-4" />
                                        <span>{officer.assignedAlerts} active alert(s)</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-border"
                                    onClick={() => handleCall(officer.phone, officer.name)}
                                >
                                    <Phone className="h-4 w-4 mr-1" />
                                    Call
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-border"
                                    onClick={() => handleMessage(officer.email, officer.name)}
                                >
                                    <Mail className="h-4 w-4 mr-1" />
                                    Message
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredOfficers.length === 0 && (
                    <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-12 text-center">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No officers found</p>
                    </div>
                )}
            </div>
        </PoliceDashboardLayout>
    );
}

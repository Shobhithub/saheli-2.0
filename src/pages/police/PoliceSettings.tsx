import React, { useState, useEffect } from 'react';
import {
    Settings,
    Bell,
    Shield,
    Moon,
    Mail,
    Phone,
    MapPin,
    Volume2,
    Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PoliceDashboardLayout } from '@/components/layout/PoliceDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function PoliceSettings() {
    const { user } = useAuth();
    const { toast } = useToast();

    // Settings states
    const [soundAlerts, setSoundAlerts] = useState(() => {
        return localStorage.getItem('police_sound_alerts') !== 'false';
    });
    const [pushNotifications, setPushNotifications] = useState(() => {
        return localStorage.getItem('police_push_notifications') !== 'false';
    });
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('saheli_darkmode') === 'true';
    });
    const [autoRefresh, setAutoRefresh] = useState(() => {
        return localStorage.getItem('police_auto_refresh') !== 'false';
    });

    // Station info - load from localStorage or use defaults
    const [stationInfo, setStationInfo] = useState(() => {
        const saved = localStorage.getItem('police_station_info');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return {
                    name: 'Kukatpally Police Station',
                    phone: '+91 40 2785 1234',
                    email: 'kukatpally.ps@hyderabadpolice.gov.in',
                    address: 'Kukatpally, Hyderabad, Telangana - 500072'
                };
            }
        }
        return {
            name: 'Kukatpally Police Station',
            phone: '+91 40 2785 1234',
            email: 'kukatpally.ps@hyderabadpolice.gov.in',
            address: 'Kukatpally, Hyderabad, Telangana - 500072'
        };
    });

    // Apply dark mode
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('saheli_darkmode', String(darkMode));
    }, [darkMode]);

    // Persist settings
    useEffect(() => {
        localStorage.setItem('police_sound_alerts', String(soundAlerts));
    }, [soundAlerts]);

    useEffect(() => {
        localStorage.setItem('police_push_notifications', String(pushNotifications));
    }, [pushNotifications]);

    useEffect(() => {
        localStorage.setItem('police_auto_refresh', String(autoRefresh));
    }, [autoRefresh]);

    const handleSaveSettings = () => {
        // Save station info to localStorage
        localStorage.setItem('police_station_info', JSON.stringify(stationInfo));

        toast({
            title: "Settings saved",
            description: "Your preferences have been updated successfully."
        });
    };

    return (
        <PoliceDashboardLayout>
            <div className="space-y-6 max-w-3xl">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-sidebar-foreground">Settings</h1>
                    <p className="text-muted-foreground">Configure your dashboard preferences</p>
                </div>

                {/* Notification Settings */}
                <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-6">
                    <h2 className="text-lg font-semibold text-sidebar-foreground mb-4 flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Settings
                    </h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-sidebar-foreground">Sound Alerts</p>
                                <p className="text-sm text-muted-foreground">Play audio for SOS alerts</p>
                            </div>
                            <Switch
                                checked={soundAlerts}
                                onCheckedChange={setSoundAlerts}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-sidebar-foreground">Push Notifications</p>
                                <p className="text-sm text-muted-foreground">Receive browser notifications</p>
                            </div>
                            <Switch
                                checked={pushNotifications}
                                onCheckedChange={setPushNotifications}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-sidebar-foreground">Auto Refresh</p>
                                <p className="text-sm text-muted-foreground">Automatically refresh alerts every 10 seconds</p>
                            </div>
                            <Switch
                                checked={autoRefresh}
                                onCheckedChange={setAutoRefresh}
                            />
                        </div>
                    </div>
                </div>

                {/* Appearance */}
                <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-6">
                    <h2 className="text-lg font-semibold text-sidebar-foreground mb-4 flex items-center gap-2">
                        <Moon className="h-5 w-5" />
                        Appearance
                    </h2>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-sidebar-foreground">Dark Mode</p>
                            <p className="text-sm text-muted-foreground">Use dark theme for the dashboard</p>
                        </div>
                        <Switch
                            checked={darkMode}
                            onCheckedChange={setDarkMode}
                        />
                    </div>
                </div>

                {/* Station Information */}
                <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-6">
                    <h2 className="text-lg font-semibold text-sidebar-foreground mb-4 flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Station Information
                    </h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sidebar-foreground">Station Name</Label>
                            <Input
                                value={stationInfo.name}
                                onChange={(e) => setStationInfo(p => ({ ...p, name: e.target.value }))}
                                className="bg-sidebar border-sidebar-border text-sidebar-foreground"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sidebar-foreground">Phone Number</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={stationInfo.phone}
                                    onChange={(e) => setStationInfo(p => ({ ...p, phone: e.target.value }))}
                                    className="pl-9 bg-sidebar border-sidebar-border text-sidebar-foreground"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sidebar-foreground">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={stationInfo.email}
                                    onChange={(e) => setStationInfo(p => ({ ...p, email: e.target.value }))}
                                    className="pl-9 bg-sidebar border-sidebar-border text-sidebar-foreground"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sidebar-foreground">Address</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={stationInfo.address}
                                    onChange={(e) => setStationInfo(p => ({ ...p, address: e.target.value }))}
                                    className="pl-9 bg-sidebar border-sidebar-border text-sidebar-foreground"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <Button
                    variant="coral"
                    className="w-full rounded-xl gap-2"
                    onClick={handleSaveSettings}
                >
                    <Save className="h-5 w-5" />
                    Save All Settings
                </Button>
            </div>
        </PoliceDashboardLayout>
    );
}

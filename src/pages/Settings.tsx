import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, Shield, Moon, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function Settings() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <div className="p-4 flex items-center gap-4 bg-card border-b sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-semibold">Settings</h1>
            </div>

            <div className="flex-1 p-6 space-y-6">
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-medium">
                        <Bell className="h-5 w-5" />
                        <h2>Notifications</h2>
                    </div>
                    <div className="bg-card rounded-xl border p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="push-notifs">Push Notifications</Label>
                            <Switch id="push-notifs" defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <Label htmlFor="email-alerts">Email Alerts</Label>
                            <Switch id="email-alerts" defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <Label htmlFor="sos-updates">SOS Updates</Label>
                            <Switch id="sos-updates" defaultChecked />
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-medium">
                        <Shield className="h-5 w-5" />
                        <h2>Privacy & Security</h2>
                    </div>
                    <div className="bg-card rounded-xl border p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="location-sharing">Location Sharing</Label>
                            <Switch id="location-sharing" defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <Label htmlFor="incognito">Incognito Mode</Label>
                            <Switch id="incognito" />
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-medium">
                        <Volume2 className="h-5 w-5" />
                        <h2>Preferences</h2>
                    </div>
                    <div className="bg-card rounded-xl border p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="dark-mode">Dark Mode</Label>
                            <Switch id="dark-mode" />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <Label htmlFor="sound-effects">Sound Effects</Label>
                            <Switch id="sound-effects" defaultChecked />
                        </div>
                    </div>
                </section>

                <div className="pt-4 text-center text-sm text-muted-foreground">
                    App Version 1.0.0
                </div>
            </div>
        </div>
    );
}

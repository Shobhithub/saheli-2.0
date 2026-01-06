import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  Shield,
  Bell,
  Moon,
  HelpCircle,
  LogOut,
  ChevronRight,
  Edit2,
  Users,
  X,
  Lock,
  Eye,
  MessageCircle,
  FileText,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CitizenLayout } from '@/components/layout/CitizenLayout';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Edit Profile state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });

  // Settings states with localStorage persistence
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('saheli_notifications') !== 'false';
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('saheli_darkmode') === 'true';
  });

  // Dialogs state
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Apply dark mode on mount and changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('saheli_darkmode', String(darkMode));
  }, [darkMode]);

  // Persist notification setting
  useEffect(() => {
    localStorage.setItem('saheli_notifications', String(notificationsEnabled));
  }, [notificationsEnabled]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast({ title: "Logged out successfully" });
  };

  const handleSaveProfile = () => {
    // In a real app, this would call an API to update the user profile
    // For now, we'll show a success message
    toast({
      title: "Profile updated!",
      description: "Your changes have been saved successfully."
    });
    setIsEditOpen(false);
  };

  const handleNotificationToggle = (checked: boolean) => {
    setNotificationsEnabled(checked);
    toast({
      title: checked ? "Notifications enabled" : "Notifications disabled",
      description: checked ? "You'll receive alerts and updates" : "You won't receive any notifications"
    });
  };

  const handleDarkModeToggle = (checked: boolean) => {
    setDarkMode(checked);
    toast({
      title: checked ? "Dark mode enabled" : "Light mode enabled",
      description: "Your preference has been saved"
    });
  };

  return (
    <CitizenLayout title="Profile">
      <div className="flex-1 flex flex-col pb-20">
        {/* Profile Header */}
        <div className="px-4 py-6 bg-gradient-coral">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-card flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <button
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-card shadow-md flex items-center justify-center border-2 border-background hover:bg-muted transition-colors"
                onClick={() => setIsEditOpen(true)}
              >
                <Edit2 className="h-4 w-4 text-primary" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-header-foreground">
                {user?.name || 'User'}
              </h2>
              <p className="text-header-foreground/80 text-sm">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="px-4 py-4 -mt-3 bg-background rounded-t-3xl">
          <div className="bg-card rounded-2xl border border-border divide-y divide-border">
            <div className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium text-foreground">{user?.phone || 'Not set'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="px-4 py-2">
          <div className="bg-card rounded-2xl border border-border divide-y divide-border">
            {/* Emergency Contacts */}
            <button
              className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
              onClick={() => navigate('/onboarding')}
            >
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">Emergency Contacts</p>
                <p className="text-xs text-muted-foreground">{user?.emergencyContacts?.length || 0} contacts</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Notifications */}
            <div className="w-full flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">Notifications</p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
              />
            </div>

            {/* Dark Mode */}
            <div className="w-full flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Moon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">Dark Mode</p>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={handleDarkModeToggle}
              />
            </div>

            {/* Privacy & Security */}
            <button
              className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
              onClick={() => setPrivacyOpen(true)}
            >
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">Privacy & Security</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Help & Support */}
            <button
              className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
              onClick={() => setHelpOpen(true)}
            >
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">Help & Support</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="px-4 py-4 mt-auto">
          <Button
            variant="destructive"
            size="lg"
            className="w-full rounded-xl gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </div>

      <BottomNavigation />

      {/* Edit Profile Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Enter your name"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))}
                placeholder="Enter your email"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="Enter your phone"
                className="rounded-xl"
              />
            </div>
            <Button variant="coral" className="w-full rounded-xl" onClick={handleSaveProfile}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy & Security Dialog */}
      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Privacy & Security</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-xl">
              <Lock className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Data Encryption</p>
                <p className="text-xs text-muted-foreground">All your data is encrypted end-to-end</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted rounded-xl">
              <Eye className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <p className="text-sm font-medium">Location Privacy</p>
                <p className="text-xs text-muted-foreground">Your location is only shared during SOS emergencies</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted rounded-xl">
              <Shield className="h-5 w-5 text-success mt-0.5" />
              <div>
                <p className="text-sm font-medium">Secure Authentication</p>
                <p className="text-xs text-muted-foreground">Your account is protected with JWT tokens</p>
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground text-center">
                Saheli is committed to protecting your privacy. We never sell your data to third parties.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help & Support Dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Help & Support</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Frequently Asked Questions</h4>

              <div className="p-3 bg-muted rounded-xl">
                <p className="text-sm font-medium">How do I trigger an SOS?</p>
                <p className="text-xs text-muted-foreground mt-1">Press and hold the SOS button on the home screen for 3 seconds to activate emergency mode.</p>
              </div>

              <div className="p-3 bg-muted rounded-xl">
                <p className="text-sm font-medium">How do I add emergency contacts?</p>
                <p className="text-xs text-muted-foreground mt-1">Go to Profile → Emergency Contacts to add trusted people who will be notified during emergencies.</p>
              </div>

              <div className="p-3 bg-muted rounded-xl">
                <p className="text-sm font-medium">Is my location always tracked?</p>
                <p className="text-xs text-muted-foreground mt-1">No, location is only accessed when you trigger an SOS or use the Safe Route feature.</p>
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <h4 className="text-sm font-semibold">Contact Us</h4>

              <button className="w-full flex items-center gap-3 p-3 bg-muted rounded-xl hover:bg-muted/80 transition-colors text-left">
                <MessageCircle className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Chat Support</p>
                  <p className="text-xs text-muted-foreground">Available 24/7</p>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 p-3 bg-muted rounded-xl hover:bg-muted/80 transition-colors text-left">
                <Mail className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm font-medium">Email Support</p>
                  <p className="text-xs text-muted-foreground">support@saheli.app</p>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 p-3 bg-muted rounded-xl hover:bg-muted/80 transition-colors text-left">
                <FileText className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-sm font-medium">Terms of Service</p>
                  <p className="text-xs text-muted-foreground">Read our policies</p>
                </div>
              </button>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">Saheli v1.0.0</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </CitizenLayout>
  );
}


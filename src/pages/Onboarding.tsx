import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Plus, X, User, Phone, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, EmergencyContact } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import safetyIllustration from '@/assets/safety-illustration.png';

export default function Onboarding() {
  const { updateEmergencyContacts } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { id: '1', name: '', phone: '' },
  ]);

  const addContact = () => {
    if (contacts.length >= 3) {
      toast({
        title: "Maximum contacts reached",
        description: "You can add up to 3 emergency contacts.",
        variant: "destructive",
      });
      return;
    }
    setContacts([...contacts, { id: Date.now().toString(), name: '', phone: '' }]);
  };

  const removeContact = (id: string) => {
    if (contacts.length === 1) return;
    setContacts(contacts.filter(c => c.id !== id));
  };

  const updateContact = (id: string, field: 'name' | 'phone', value: string) => {
    setContacts(contacts.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validContacts = contacts.filter(c => c.name.trim() && c.phone.trim());
    
    if (validContacts.length === 0) {
      toast({
        title: "Add at least one contact",
        description: "Emergency contacts help us notify your loved ones in case of an emergency.",
        variant: "destructive",
      });
      return;
    }

    updateEmergencyContacts(validContacts);
    
    toast({
      title: "Setup complete!",
      description: "Your emergency contacts have been saved.",
    });
    
    navigate('/home');
  };

  const handleSkip = () => {
    toast({
      title: "Setup skipped",
      description: "You can add emergency contacts later from your profile.",
    });
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-gradient-coral px-6 pt-8 pb-12">
        <div className="max-w-sm mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="h-7 w-7 text-header-foreground" />
            <span className="text-xl font-bold text-header-foreground">Emergency Contacts</span>
          </div>
          <p className="text-header-foreground/90 text-sm">
            Add up to 3 trusted contacts who will be notified immediately when you trigger an SOS alert.
          </p>
          <img 
            src={safetyIllustration} 
            alt="Safety illustration" 
            className="w-32 h-32 mx-auto mt-4 object-contain rounded-xl"
          />
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 px-6 py-6 -mt-6 bg-background rounded-t-3xl">
        <div className="max-w-sm mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            {contacts.map((contact, index) => (
              <div 
                key={contact.id} 
                className="p-4 bg-card rounded-2xl border border-border shadow-sm animate-slide-in-up"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-foreground">
                    Contact {index + 1}
                  </span>
                  {contacts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeContact(contact.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Name (e.g., Mom, Dad)"
                      value={contact.name}
                      onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                      className="h-11 pl-10 rounded-xl bg-muted/30"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="Phone number"
                      value={contact.phone}
                      onChange={(e) => updateContact(contact.id, 'phone', e.target.value)}
                      className="h-11 pl-10 rounded-xl bg-muted/30"
                    />
                  </div>
                </div>
              </div>
            ))}

            {contacts.length < 3 && (
              <Button
                type="button"
                variant="soft-outline"
                size="lg"
                className="w-full rounded-xl"
                onClick={addContact}
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Another Contact
              </Button>
            )}

            <div className="pt-4 space-y-3">
              <Button 
                type="submit" 
                variant="coral"
                size="lg"
                className="w-full rounded-xl"
              >
                Save & Continue
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>

              <Button 
                type="button"
                variant="ghost"
                size="lg"
                className="w-full"
                onClick={handleSkip}
              >
                Skip for now
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

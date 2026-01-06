import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import communityIllustration from '@/assets/community-illustration.png';

export default function Register() {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await signup({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
    });

    if (success) {
      toast({
        title: "Account created!",
        description: "Welcome to SAHELI. Let's set up your emergency contacts.",
      });
      navigate('/onboarding');
    } else {
      toast({
        title: "Registration failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-gradient-coral px-4 pt-4 pb-8">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Button 
              variant="header-icon" 
              size="icon-sm" 
              className="rounded-full"
              onClick={() => step === 1 ? navigate('/login') : setStep(1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-lg font-semibold text-header-foreground">
              {step === 1 ? 'Sign Up' : 'Complete Profile'}
            </span>
          </div>
          
          <div className="flex justify-center">
            <img 
              src={communityIllustration} 
              alt="Community illustration" 
              className="w-40 h-40 object-contain rounded-2xl"
            />
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 px-6 py-8 -mt-4 bg-background rounded-t-3xl">
        <div className="max-w-sm mx-auto">
          {step === 1 ? (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email or Phone number</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="h-12 rounded-xl border-border bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password securely"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="h-12 rounded-xl border-border bg-muted/50 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Enter your password securely"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="h-12 rounded-xl border-border bg-muted/50"
                />
              </div>

              <div className="flex justify-end">
                <Link to="/login" className="text-sm text-primary hover:underline font-medium">
                  Forgot Password
                </Link>
              </div>

              <Button 
                type="submit" 
                variant="coral"
                size="lg"
                className="w-full rounded-xl"
              >
                Continue
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-semibold hover:underline">
                  Login
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="h-12 rounded-xl border-border bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="h-12 rounded-xl border-border bg-muted/50"
                />
              </div>

              <div className="p-4 bg-secondary/50 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground">
                  "Stay prepared with SAHELI—securely upload your Aadhaar to help authorities identify you quickly in emergencies, adding an extra layer of safety."
                </p>
              </div>

              <Button 
                type="submit" 
                variant="coral"
                size="lg"
                className="w-full rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Register'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

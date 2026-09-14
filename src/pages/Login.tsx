import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import heroIllustration from '@/assets/hero-illustration.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(email, password);

    if (result.ok) {
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
      // Route straight off the authenticated user rather than re-reading
      // localStorage, so the redirect can't miss the police role.
      navigate(result.user.role === 'police' ? '/police' : '/home');
    } else {
      toast({
        title: "Login failed",
        description: 'error' in result ? result.error : 'Unable to log in.',
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="bg-gradient-coral px-6 pt-12 pb-8">
        <div className="max-w-sm mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-header-foreground" />
            <span className="text-2xl font-bold text-header-foreground">SAHELI 2.0</span>
          </div>
          <p className="text-header-foreground/90 text-sm mb-6">
            Welcome to SAHELI - your trusted companion for women's safety. Empowering you with essential tools and resources for safety, anytime, anywhere.
          </p>
          <img 
            src={heroIllustration} 
            alt="Safety illustration" 
            className="w-48 h-48 mx-auto object-contain rounded-2xl"
          />
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 px-6 py-8 -mt-4 bg-background rounded-t-3xl">
        <div className="max-w-sm mx-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                Email or Phone number
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl border-border bg-muted/50 focus:bg-card"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password securely"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl border-border bg-muted/50 focus:bg-card pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link 
                to="/forgot-password" 
                className="text-sm text-primary hover:underline font-medium"
              >
                Forgot Password
              </Link>
            </div>

            <Button 
              type="submit" 
              variant="coral"
              size="lg"
              className="w-full rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-4">
            <Button 
              variant="soft-outline"
              size="lg"
              className="w-full rounded-xl"
              onClick={() => navigate('/register')}
            >
              Register
            </Button>
            
            <p className="text-sm text-muted-foreground">
              New here?{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Register Now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

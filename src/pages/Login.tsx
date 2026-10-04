import React, { useState, useEffect, useRef, FormEvent, ChangeEvent, FocusEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import heroIllustration from '@/assets/hero-illustration.png';

// ------------------------------
// Validation utilities
// ------------------------------
const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};

const validatePhone = (phone: string): boolean => {
    // Supports Indian phone numbers: +91 prefix, optional spaces/dashes, 10 digits
    const cleaned = phone.replace(/[\s-]/g, '');
    const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
    return phoneRegex.test(cleaned);
};

const validateEmailOrPhone = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return 'Please enter your email or phone number';

    // Check if value looks like a phone number (starts with + or digits)
    const isPhone = /^[\d+\s-]+$/.test(trimmed);
    if (isPhone) {
        if (!validatePhone(trimmed)) return 'Please enter a valid Indian phone number';
        return null;
    }

    if (!validateEmail(trimmed)) return 'Please enter a valid email address';
    return null;
};

const validatePassword = (password: string): string | null => {
    if (!password) return 'Please enter your password';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
};

interface FormErrors {
    identifier?: string;
    password?: string;
    general?: string;
}

export default function Login() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [rememberMe, setRememberMe] = useState(false);
    const [formShake, setFormShake] = useState(false);
    const [imageLoadError, setImageLoadError] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    const identifierInputRef = useRef<HTMLInputElement>(null);
    const isMountedRef = useRef(true);

    const { login } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    // ------------------------------
    // Lifecycle effects
    // ------------------------------
    useEffect(() => {
        // Auto-focus first input on mount for better UX
        identifierInputRef.current?.focus();

        // Load saved email/phone if Remember Me was checked previously
        const savedIdentifier = localStorage.getItem('saheli_remembered_identifier');
        if (savedIdentifier) {
            setIdentifier(savedIdentifier);
            setRememberMe(true);
        }

        // Track online/offline status
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            isMountedRef.current = false;
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Clear errors when user starts typing
    useEffect(() => {
        if (errors.identifier && touched.identifier) {
            setErrors(prev => ({ ...prev, identifier: validateEmailOrPhone(identifier) }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [identifier]);

    useEffect(() => {
        if (errors.password && touched.password) {
            setErrors(prev => ({ ...prev, password: validatePassword(password) }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [password]);

    // ------------------------------
    // Form handlers
    // ------------------------------
    const validateForm = (): boolean => {
        const identifierError = validateEmailOrPhone(identifier);
        const passwordError = validatePassword(password);

        setErrors({
            identifier: identifierError || undefined,
            password: passwordError || undefined,
        });

        setTouched({ identifier: true, password: true });

        if (identifierError || passwordError) {
            // Trigger shake animation for invalid form
            setFormShake(true);
            setTimeout(() => setFormShake(false), 500);

            // Focus first invalid field
            if (identifierError) identifierInputRef.current?.focus();
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Prevent multiple submissions
        if (isLoading) return;

        // Offline check
        if (!isOnline) {
            setErrors({ general: 'You appear to be offline. Please check your internet connection.' });
            toast({
                title: "No internet connection",
                description: "Please connect to the internet to log in",
                variant: "destructive",
            });
            return;
        }

        // Run validation first
        if (!validateForm()) return;

        setIsLoading(true);
        setErrors(prev => ({ ...prev, general: undefined }));

        try {
            // Clean input: trim identifier
            const cleanIdentifier = identifier.trim();
            const result = await login(cleanIdentifier, password);

            if (!isMountedRef.current) return;

            if (result.ok) {
                // Handle remember me
                if (rememberMe) {
                    localStorage.setItem('saheli_remembered_identifier', cleanIdentifier);
                } else {
                    localStorage.removeItem('saheli_remembered_identifier');
                }

                toast({
                    title: "Welcome back!",
                    description: "You've successfully logged in to Saheli.",
                });

                // Redirect based on role, per auth state
                navigate(result.user.role === 'police' ? '/police' : '/home', { replace: true });
            } else {
                const errorMessage = 'error' in result ? result.error : 'Unable to log in. Please try again.';

                // Show field-specific errors if possible
                if (errorMessage.toLowerCase().includes('password')) {
                    setErrors({ password: errorMessage });
                } else if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('phone') || errorMessage.toLowerCase().includes('user')) {
                    setErrors({ identifier: errorMessage });
                } else {
                    setErrors({ general: errorMessage });
                }

                setFormShake(true);
                setTimeout(() => setFormShake(false), 500);

                toast({
                    title: "Login failed",
                    description: errorMessage,
                    variant: "destructive",
                });
            }
        } catch (err) {
            if (!isMountedRef.current) return;
            const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
            setErrors({ general: errorMsg });
            toast({
                title: "Login error",
                description: errorMsg,
                variant: "destructive",
            });
        } finally {
            if (isMountedRef.current) setIsLoading(false);
        }
    };

    const handleBlur = (field: 'identifier' | 'password') => (e: FocusEvent<HTMLInputElement>) => {
        setTouched(prev => ({ ...prev, [field]: true }));

        if (field === 'identifier') {
            setErrors(prev => ({ ...prev, identifier: validateEmailOrPhone(e.target.value) }));
        } else {
            setErrors(prev => ({ ...prev, password: validatePassword(e.target.value) }));
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Hero Section */}
            <div className="bg-gradient-coral px-6 pt-10 pb-8 sm:pt-16 sm:pb-12">
                <div className="max-w-md mx-auto text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <ShieldCheck className="h-9 w-9 text-header-foreground" />
                        <span className="text-2xl sm:text-3xl font-bold text-header-foreground tracking-tight">SAHELI 2.0</span>
                    </div>
                    <p className="text-header-foreground/90 text-sm sm:text-base mb-6 max-w-sm mx-auto leading-relaxed">
                        Your trusted companion for women's safety. Empowering you with essential tools and resources, anytime, anywhere.
                    </p>

                    {/* Hero illustration with fallback */}
                    <div className="w-44 h-44 sm:w-56 sm:h-56 mx-auto rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center">
                        {!imageLoadError ? (
                            <img
                                src={heroIllustration}
                                alt="Saheli safety illustration"
                                className="w-full h-full object-contain"
                                onError={() => setImageLoadError(true)}
                                loading="eager"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-header-foreground/80">
                                <Shield className="h-16 w-16" />
                                <span className="text-xs">Safety Companion</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <div className="flex-1 px-6 py-8 -mt-6 bg-background rounded-t-[2rem] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className={`max-w-md mx-auto ${formShake ? 'animate-shake' : ''}`}>
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
                        <p className="text-muted-foreground text-sm mt-1">Enter your details to access your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        {/* General form error */}
                        {errors.general && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                <span>{errors.general}</span>
                            </div>
                        )}

                        {/* Email/Phone Field */}
                        <div className="space-y-2">
                            <Label htmlFor="identifier" className="text-foreground font-medium">
                                Email or Phone number
                            </Label>
                            <Input
                                id="identifier"
                                ref={identifierInputRef}
                                type="text"
                                inputMode="email"
                                autoComplete="username"
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck={false}
                                placeholder="Enter your email or phone number"
                                value={identifier}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setIdentifier(e.target.value)}
                                onBlur={handleBlur('identifier')}
                                disabled={isLoading}
                                className={`h-12 rounded-xl border-border bg-muted/50 focus:bg-card transition-colors ${
                                    errors.identifier && touched.identifier ? 'border-red-500 focus-visible:ring-red-500' : ''
                                }`}
                                aria-invalid={!!(errors.identifier && touched.identifier)}
                                aria-describedby={errors.identifier && touched.identifier ? 'identifier-error' : undefined}
                            />
                            {errors.identifier && touched.identifier && (
                                <p id="identifier-error" className="text-sm text-red-500 flex items-center gap-1 animate-in fade-in">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    {errors.identifier}
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-foreground font-medium">
                                Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                    onBlur={handleBlur('password')}
                                    disabled={isLoading}
                                    className={`h-12 rounded-xl border-border bg-muted/50 focus:bg-card pr-12 transition-colors ${
                                        errors.password && touched.password ? 'border-red-500 focus-visible:ring-red-500' : ''
                                    }`}
                                    aria-invalid={!!(errors.password && touched.password)}
                                    aria-describedby={errors.password && touched.password ? 'password-error' : undefined}
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    disabled={isLoading}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-500"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    tabIndex={0}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {errors.password && touched.password && (
                                <p id="password-error" className="text-sm text-red-500 flex items-center gap-1 animate-in fade-in">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="remember"
                                    checked={rememberMe}
                                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                                    disabled={isLoading}
                                />
                                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                                    Remember me
                                </Label>
                            </div>
                            <Link
                                to="/forgot-password"
                                className="text-sm text-coral-600 hover:text-coral-700 font-medium hover:underline transition-colors"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            variant="coral"
                            size="lg"
                            className="w-full rounded-xl h-12 text-base mt-2 group"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center space-y-4">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    New to Saheli?
                                </span>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            Create an account to access all safety features{' '}
                            <Link
                                to="/register"
                                className="text-coral-600 font-semibold hover:text-coral-700 hover:underline transition-colors"
                            >
                                Register Now
                            </Link>
                        </p>
                    </div>

                    <p className="text-xs text-center text-muted-foreground mt-8 px-4">
                        By signing in, you agree to our Terms of Service and Privacy Policy. Your data is protected and secure.
                    </p>
                </div>
            </div>

            {/* Shake animation for invalid form */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-8px); }
                    40% { transform: translateX(8px); }
                    60% { transform: translateX(-4px); }
                    80% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
}

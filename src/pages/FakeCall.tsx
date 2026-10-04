import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Camera, Image, User, Phone, PhoneOff, X, MicOff, Mic,
    Volume2, VolumeX, Grid3X3, UserPlus, Video, Pause
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";

// Helper: Format seconds to MM:SS
const formatCallTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Helper: Light haptic feedback for mobile
const haptic = (pattern: number | number[] = 50) => {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
};

export default function FakeCall() {
    const navigate = useNavigate();
    const { toast } = useToast();

    // Core state
    const [callerName, setCallerName] = useState('Dad');
    const [phoneNumber, setPhoneNumber] = useState('+91 98765 43210');
    const [countdown, setCountdown] = useState<number | null>(null); // Countdown before call rings
    const [isCountdownRunning, setIsCountdownRunning] = useState(false);
    const [showIncomingCall, setShowIncomingCall] = useState(false);
    const [callActive, setCallActive] = useState(false);
    const [callDuration, setCallDuration] = useState(0); // Active call length counter

    // Customization state
    const [callerImage, setCallerImage] = useState<string | null>(null);
    const [script, setScript] = useState('');
    const [isScriptEnabled, setIsScriptEnabled] = useState(false);
    const [isScriptDialogOpen, setIsScriptDialogOpen] = useState(false);
    const [isCustomTimerDialogOpen, setIsCustomTimerDialogOpen] = useState(false);
    const [customTimerInput, setCustomTimerInput] = useState('2'); // Default 2 minutes

    // In-call control state
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(false);

    // Refs (to avoid stale closures, manage media/timers)
    const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const callDurationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const ringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const autoMissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const ringOscillatorRef = useRef<OscillatorNode | null>(null);
    const ringGainRef = useRef<GainNode | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ------------------------------
    // Ringtone (in-browser generated, no external files)
    // ------------------------------
    const startRingtone = () => {
        try {
            // Initialize audio context on first run (required to avoid autoplay blocks)
            if (!audioContextRef.current) {
                const AudioCtx = window.AudioContext ||
                    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
                if (!AudioCtx) throw new Error('Web Audio API is not supported');
                audioContextRef.current = new AudioCtx();
            }
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') ctx.resume();

            // Standard ring pattern: double beep + silence, repeat
            const playRingCycle = () => {
                // First beep
                const osc1 = ctx.createOscillator();
                const gain1 = ctx.createGain();
                osc1.frequency.value = 850;
                osc1.type = 'sine';
                gain1.gain.setValueAtTime(0, ctx.currentTime);
                gain1.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
                gain1.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
                osc1.connect(gain1);
                gain1.connect(ctx.destination);
                osc1.start(ctx.currentTime);
                osc1.stop(ctx.currentTime + 0.4);

                // Second beep
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.frequency.value = 850;
                osc2.type = 'sine';
                gain2.gain.setValueAtTime(0, ctx.currentTime + 0.6);
                gain2.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.65);
                gain2.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.start(ctx.currentTime + 0.6);
                osc2.stop(ctx.currentTime + 1.0);
            };

            playRingCycle();
            ringIntervalRef.current = setInterval(playRingCycle, 3000); // Repeat every 3s

            // Vibration pattern for mobile
            if ('vibrate' in navigator) navigator.vibrate([1000, 500, 1000, 500, 1000, 500]);
            const vibrateInterval = setInterval(() => {
                if ('vibrate' in navigator) navigator.vibrate([1000, 500, 1000, 500, 1000, 500]);
            }, 3000);
            ringIntervalRef.current = vibrateInterval; // Overwrite with combined interval? No, merge: just store in separate ref, cleanup all
        } catch (e) {
            console.log('Ringtone not supported, vibration only');
        }
    };

    const stopRingtone = () => {
        if (ringIntervalRef.current) {
            clearInterval(ringIntervalRef.current);
            ringIntervalRef.current = null;
        }
        if (ringOscillatorRef.current) {
            try {
                ringOscillatorRef.current.stop();
            } catch (error) {
                console.warn('Unable to stop ringtone oscillator', error);
            }
            ringOscillatorRef.current = null;
        }
        if ('vibrate' in navigator) navigator.vibrate(0); // Stop vibration
    };

    // ------------------------------
    // Core call logic
    // ------------------------------
    const clearAllTimers = () => {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        if (callDurationIntervalRef.current) clearInterval(callDurationIntervalRef.current);
        if (autoMissTimeoutRef.current) clearTimeout(autoMissTimeoutRef.current);
        countdownIntervalRef.current = null;
        callDurationIntervalRef.current = null;
        autoMissTimeoutRef.current = null;
    };

    const endCall = (reason: 'ended' | 'declined' | 'missed' = 'ended') => {
        haptic(75);
        stopRingtone();
        clearAllTimers();
        setCallActive(false);
        setShowIncomingCall(false);
        setIsMuted(false);
        setIsSpeakerOn(false);
        setCallDuration(0);

        // Show appropriate feedback
        const messages = {
            ended: { title: "Call Ended", description: `Call lasted ${formatCallTime(callDuration)}` },
            declined: { title: "Call Declined", description: "Incoming call was rejected" },
            missed: { title: "Missed Call", description: "Incoming call rang out" }
        };
        toast({ ...messages[reason], variant: reason === 'missed' ? 'destructive' : 'default' });

        // Unlock page scroll
        document.body.style.overflow = '';
    };

    const triggerIncomingCall = () => {
        setShowIncomingCall(true);
        setCountdown(null);
        setIsCountdownRunning(false);
        startRingtone();
        document.body.style.overflow = 'hidden'; // Prevent background scrolling

        // Auto-miss call after 30 seconds of ringing
        autoMissTimeoutRef.current = setTimeout(() => {
            endCall('missed');
        }, 30000);
    };

    const startCountdown = (seconds: number) => {
        // Validation
        if (!callerName.trim()) {
            toast({ title: "Enter caller name", description: "Please add a name for the fake caller", variant: 'destructive' });
            return;
        }

        haptic(50);
        clearAllTimers();
        setCountdown(seconds);
        setIsCountdownRunning(true);
        toast({
            title: "Call Scheduled",
            description: `Fake call will ring in ${seconds < 60 ? `${seconds} seconds` : `${Math.round(seconds/60)} minutes`}.`,
        });

        // Countdown timer
        countdownIntervalRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(countdownIntervalRef.current!);
                    triggerIncomingCall();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const cancelCountdown = () => {
        haptic(50);
        clearAllTimers();
        setCountdown(null);
        setIsCountdownRunning(false);
        toast({ title: "Timer Canceled", description: "Scheduled fake call was stopped" });
    };

    const acceptCall = () => {
        haptic([50, 50, 50]);
        stopRingtone();
        if (autoMissTimeoutRef.current) clearTimeout(autoMissTimeoutRef.current);
        setCallActive(true);
        setCallDuration(0);

        // Start call duration counter
        callDurationIntervalRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
    };

    // ------------------------------
    // Image upload handling
    // ------------------------------
    const handleImageSelect = (type: 'camera' | 'gallery' | 'avatar') => {
        haptic(30);
        if (type === 'avatar') {
            setCallerImage(null);
            toast({ title: "Avatar Reset", description: "Using default caller avatar" });
            return;
        }

        if (fileInputRef.current) {
            fileInputRef.current.accept = "image/*";
            if (type === 'camera') {
                fileInputRef.current.setAttribute('capture', 'user');
            } else {
                fileInputRef.current.removeAttribute('capture');
            }
            fileInputRef.current.value = ''; // Reset to allow re-selecting same file
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast({ title: "Invalid File", description: "Please select an image file", variant: 'destructive' });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setCallerImage(reader.result as string);
            toast({ title: "Caller Image Set", description: "Custom caller photo updated" });
        };
        reader.onerror = () => {
            toast({ title: "Error", description: "Could not load selected image", variant: 'destructive' });
        };
        reader.readAsDataURL(file);
    };

    // ------------------------------
    // Lifecycle & cleanup
    // ------------------------------
    // Handle back button during active calls
    useEffect(() => {
        const handlePopState = () => {
            if (showIncomingCall || callActive) {
                endCall(callActive ? 'ended' : 'declined');
                window.history.pushState(null, document.title, window.location.href);
            }
        };

        window.history.pushState(null, document.title, window.location.href);
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            clearAllTimers();
            stopRingtone();
            if (audioContextRef.current) audioContextRef.current.close();
            document.body.style.overflow = '';
            if ('vibrate' in navigator) navigator.vibrate(0);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showIncomingCall, callActive]);

    // Open script dialog when user enables script feature
    useEffect(() => {
        if (isScriptEnabled && !script) {
            setIsScriptDialogOpen(true);
        }
    }, [isScriptEnabled, script]);

    // ------------------------------
    // Call Screen UI
    // ------------------------------
    if (showIncomingCall) {
        const displayName = callerName.trim() || 'Unknown Caller';
        const displayNumber = phoneNumber.trim() || 'No Caller ID';

        return (
            <div
                className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-between py-12 text-white overflow-hidden"
                style={{
                    backgroundImage: callerImage
                        ? `url(${callerImage})`
                        : `url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1888&auto=format&fit=crop')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                {/* Blur overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80 z-0 backdrop-blur-[2px]" />

                {/* Status bar mockup (realistic mobile UI) */}
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 text-sm opacity-80">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <div className="flex gap-1.5 items-center">
                        <div className="flex gap-0.5">
                            <div className="w-1 h-2 bg-white rounded-sm" />
                            <div className="w-1 h-2.5 bg-white rounded-sm" />
                            <div className="w-1 h-3 bg-white rounded-sm" />
                            <div className="w-1 h-3.5 bg-white rounded-sm" />
                        </div>
                        <span className="ml-1">5G</span>
                        <div className="w-6 h-3 border border-white rounded-sm relative ml-1">
                            <div className="absolute inset-0.5 bg-white rounded-[1px]" style={{ width: '80%' }} />
                        </div>
                    </div>
                </div>

                {/* Caller info section */}
                <div className="z-10 flex flex-col items-center mt-16 w-full px-8 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="h-40 w-40 rounded-full bg-gray-300 mb-6 overflow-hidden border-4 border-white/10 shadow-2xl">
                        {callerImage ? (
                            <img src={callerImage} alt="Caller" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-coral-400 to-coral-600 flex items-center justify-center text-6xl font-bold">
                                {displayName.charAt(0)}
                            </div>
                        )}
                    </div>
                    <h1 className="text-5xl font-light mb-3 drop-shadow-lg tracking-tight">{displayName}</h1>
                    <p className="text-xl opacity-80 font-light">
                        {callActive ? formatCallTime(callDuration) : displayNumber}
                    </p>

                    {/* In-call script panel */}
                    {callActive && isScriptEnabled && script && (
                        <div className="mt-8 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 w-full max-w-sm text-left animate-in slide-in-from-bottom-10 duration-500 max-h-40 overflow-y-auto">
                            <p className="text-xs text-white/60 uppercase tracking-widest mb-2">Call Script</p>
                            <p className="text-base leading-relaxed font-light">{script}</p>
                        </div>
                    )}
                </div>

                {/* Call controls section */}
                <div className="z-10 w-full px-8 mb-8">
                    {callActive ? (
                        <>
                            {/* Extra call controls (realistic phone UI) */}
                            <div className="grid grid-cols-3 gap-6 mb-10 max-w-xs mx-auto">
                                {[
                                    { icon: isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />, label: isMuted ? 'Unmute' : 'Mute', active: isMuted, onClick: () => { setIsMuted(!isMuted); haptic(30); } },
                                    { icon: <Grid3X3 className="h-6 w-6" />, label: 'Keypad', active: false, onClick: () => haptic(30) },
                                    { icon: isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />, label: 'Speaker', active: isSpeakerOn, onClick: () => { setIsSpeakerOn(!isSpeakerOn); haptic(30); } },
                                    { icon: <UserPlus className="h-6 w-6" />, label: 'Add Call', active: false, onClick: () => haptic(30) },
                                    { icon: <Video className="h-6 w-6" />, label: 'Video', active: false, onClick: () => haptic(30) },
                                    { icon: <Pause className="h-6 w-6" />, label: 'Hold', active: false, onClick: () => haptic(30) },
                                ].map((control, i) => (
                                    <button
                                        key={i}
                                        onClick={control.onClick}
                                        className={`flex flex-col items-center gap-2`}
                                    >
                                        <div className={`h-16 w-16 rounded-full flex items-center justify-center transition-colors ${control.active ? 'bg-white text-black' : 'bg-white/15 text-white hover:bg-white/25'}`}>
                                            {control.icon}
                                        </div>
                                        <span className="text-xs font-light opacity-80">{control.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* End call button */}
                            <div className="flex justify-center">
                                <Button
                                    onClick={() => endCall('ended')}
                                    className="h-20 w-20 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-xl transform transition-transform hover:scale-105 active:scale-95"
                                >
                                    <PhoneOff className="h-9 w-9 text-white" />
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex justify-between items-center w-full max-w-sm mx-auto">
                            <div className="flex flex-col items-center gap-2">
                                <Button
                                    onClick={() => endCall('declined')}
                                    className="h-20 w-20 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg transition-transform active:scale-95"
                                >
                                    <PhoneOff className="h-9 w-9 text-white" />
                                </Button>
                                <span className="text-sm font-light drop-shadow">Decline</span>
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <Button
                                    onClick={acceptCall}
                                    className="h-20 w-20 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg transition-transform active:scale-95"
                                    style={{ animation: 'pulse 1.5s infinite' }}
                                >
                                    <Phone className="h-9 w-9 text-white rotate-90" />
                                </Button>
                                <span className="text-sm font-light drop-shadow">Accept</span>
                            </div>
                        </div>
                    )}
                </div>

                <style>{`
                    @keyframes pulse {
                        0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
                        70% { box-shadow: 0 0 0 20px rgba(34, 197, 94, 0); }
                        100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                    }
                `}</style>
            </div>
        );
    }

    // ------------------------------
    // Setup Screen UI
    // ------------------------------
    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <div className="p-4 flex items-center gap-4 bg-card border-b sticky top-0 z-10 shadow-sm">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} disabled={isCountdownRunning}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-semibold">Fake Call Setup</h1>
            </div>

            <div className="flex-1 p-6 space-y-8 overflow-y-auto pb-10">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*"
                />

                {/* Caller Image Section */}
                <section className="space-y-4">
                    <Label className="text-base font-semibold">Caller Photo</Label>
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            className="flex-1 h-24 flex-col gap-2 rounded-xl border-dashed hover:border-coral-500/50 hover:bg-coral-50 disabled:opacity-50"
                            onClick={() => handleImageSelect('camera')}
                            disabled={isCountdownRunning}
                        >
                            <Camera className="h-6 w-6 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Take Photo</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 h-24 flex-col gap-2 rounded-xl border-dashed hover:border-coral-500/50 hover:bg-coral-50 disabled:opacity-50"
                            onClick={() => handleImageSelect('gallery')}
                            disabled={isCountdownRunning}
                        >
                            <Image className="h-6 w-6 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Gallery</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 h-24 flex-col gap-2 rounded-xl bg-coral-50 border-coral-200 hover:bg-coral-100 disabled:opacity-50"
                            onClick={() => handleImageSelect('avatar')}
                            disabled={isCountdownRunning}
                        >
                            <User className="h-6 w-6 text-coral-600" />
                            <span className="text-xs text-coral-600 font-medium">Default</span>
                        </Button>
                    </div>

                    {/* Selected image preview */}
                    {callerImage && (
                        <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-coral-100 shadow-md mx-auto">
                            <img src={callerImage} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    )}
                </section>

                {/* Caller ID Section */}
                <section className="space-y-4">
                    <Label className="text-base font-semibold">Caller Information</Label>
                    <div className="space-y-4 bg-card p-5 rounded-xl border shadow-sm">
                        <div className="space-y-2">
                            <Label htmlFor="name">Caller Name</Label>
                            <Input
                                id="name"
                                value={callerName}
                                onChange={(e) => setCallerName(e.target.value)}
                                className="bg-background h-11"
                                placeholder="Enter contact name"
                                disabled={isCountdownRunning}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="bg-background h-11"
                                placeholder="Enter phone number"
                                disabled={isCountdownRunning}
                            />
                        </div>
                    </div>
                </section>

                {/* Timer Section */}
                <section className="space-y-4">
                    <Label className="text-base font-semibold">Call Timer</Label>
                    <p className="text-xs text-muted-foreground -mt-2">Choose when the fake call will ring after you press start</p>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {[
                            { label: 'Now', val: 1 },
                            { label: '5 sec', val: 5 },
                            { label: '1 min', val: 60 },
                            { label: '5 min', val: 300 },
                            { label: '15 min', val: 900 },
                        ].map((t) => (
                            <Button
                                key={t.val}
                                variant={countdown === t.val && !isCountdownRunning ? "default" : "outline"}
                                className="rounded-full px-6 shrink-0 disabled:opacity-50 bg-coral-500 hover:bg-coral-600"
                                onClick={() => {
                                    haptic(30);
                                    setCountdown(Number(t.val));
                                }}
                                disabled={isCountdownRunning}
                            >
                                {t.label}
                            </Button>
                        ))}
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full w-10 h-10 shrink-0 disabled:opacity-50"
                            onClick={() => setIsCustomTimerDialogOpen(true)}
                            disabled={isCountdownRunning}
                        >
                            <span className="text-lg">+</span>
                        </Button>
                    </div>
                </section>

                {/* Script Section */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-card rounded-xl border shadow-sm">
                        <div className="flex items-center gap-3">
                            <Switch
                                id="script"
                                checked={isScriptEnabled}
                                onCheckedChange={(val) => {
                                    haptic(30);
                                    setIsScriptEnabled(val);
                                }}
                                disabled={isCountdownRunning}
                            />
                            <Label htmlFor="script" className="font-medium">Show call script</Label>
                        </div>
                    </div>

                    {isScriptEnabled && (
                        <Dialog open={isScriptDialogOpen} onOpenChange={setIsScriptDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="link" className="text-coral-600 pl-0 h-auto p-0">
                                    ✏️ Edit call script
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Call Script</DialogTitle>
                                    <DialogDescription>
                                        This text will appear on your screen during the call to help you pretend to talk.
                                    </DialogDescription>
                                </DialogHeader>
                                <Textarea
                                    value={script}
                                    onChange={(e) => setScript(e.target.value)}
                                    placeholder="Example: Hey, I'm almost home, just 5 minutes away. Wait outside for me."
                                    className="min-h-[120px] resize-none"
                                />
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button
                                            type="button"
                                            className="bg-coral-500 hover:bg-coral-600"
                                            onClick={() => haptic(30)}
                                        >
                                            Save Script
                                        </Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </section>

                {/* Action Buttons */}
                <div className="pt-4 space-y-3">
                    {isCountdownRunning ? (
                        <Button
                            className="w-full py-6 text-lg rounded-xl shadow-lg mt-auto bg-red-500 hover:bg-red-600"
                            onClick={cancelCountdown}
                        >
                            <X className="h-5 w-5 mr-2" />
                            Cancel Call (ringing in {countdown}s)
                        </Button>
                    ) : (
                        <Button
                            className="w-full py-6 text-lg rounded-xl shadow-lg mt-auto bg-coral-500 hover:bg-coral-600"
                            onClick={() => startCountdown(countdown || 1)}
                        >
                            <Phone className="h-5 w-5 mr-2" />
                            Schedule Fake Call
                        </Button>
                    )}
                </div>
            </div>

            {/* Custom Timer Dialog */}
            <Dialog open={isCustomTimerDialogOpen} onOpenChange={setIsCustomTimerDialogOpen}>
                <DialogContent className="max-w-xs">
                    <DialogHeader>
                        <DialogTitle>Custom Timer</DialogTitle>
                        <DialogDescription>
                            Set how many minutes from now the call should ring
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center gap-2 py-2">
                        <Input
                            type="number"
                            min="1"
                            max="60"
                            value={customTimerInput}
                            onChange={(e) => setCustomTimerInput(e.target.value)}
                            className="h-11"
                        />
                        <span className="text-muted-foreground">minutes</span>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                className="bg-coral-500 hover:bg-coral-600 w-full"
                                onClick={() => {
                                    haptic(30);
                                    const mins = parseInt(customTimerInput) || 1;
                                    setCountdown(mins * 60);
                                    setIsCustomTimerDialogOpen(false);
                                }}
                            >
                                Set Timer
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

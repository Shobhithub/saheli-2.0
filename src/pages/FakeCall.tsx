import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, Image, User, Phone, PhoneOff, X } from 'lucide-react';
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

export default function FakeCall() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [callerName, setCallerName] = useState('Dad');
    const [phoneNumber, setPhoneNumber] = useState('+91 98765 43210');
    const [timer, setTimer] = useState<number | null>(null); // seconds
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [showIncomingCall, setShowIncomingCall] = useState(false);
    const [callActive, setCallActive] = useState(false);

    // New Features
    const [callerImage, setCallerImage] = useState<string | null>(null);
    const [script, setScript] = useState('');
    const [isScriptEnabled, setIsScriptEnabled] = useState(false);
    const [isScriptDialogOpen, setIsScriptDialogOpen] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning && timer !== null) {
            interval = setInterval(() => {
                setTimer((prev) => {
                    if (prev !== null && prev <= 1) {
                        clearInterval(interval);
                        setIsTimerRunning(false);
                        setShowIncomingCall(true);
                        return 0;
                    }
                    return prev !== null ? prev - 1 : null;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timer]);

    const startTimer = (seconds: number) => {
        setTimer(seconds);
        setIsTimerRunning(true);
        toast({
            title: "Timer Started",
            description: `Fake call will ring in ${seconds} seconds.`,
        });
    };

    const handleAcceptCall = () => {
        setCallActive(true);
    };

    const handleEndCall = () => {
        setCallActive(false);
        setShowIncomingCall(false);
        setTimer(null);
    };

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleImageSelect = (type: 'camera' | 'gallery' | 'avatar') => {
        if (type === 'avatar') {
            toast({ title: "Avatar", description: "Default avatar selected." });
            setCallerImage(null);
            return;
        }

        if (fileInputRef.current) {
            // If camera, adding capture attribute could work on mobile but here we just trigger click
            // On mobile devices, file input accepts 'image/*' and offers camera option usually
            fileInputRef.current.accept = "image/*";
            if (type === 'camera') {
                fileInputRef.current.setAttribute('capture', 'user');
            } else {
                fileInputRef.current.removeAttribute('capture');
            }
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCallerImage(reader.result as string);
                toast({ title: "Image Set", description: "Caller image updated successfully." });
            };
            reader.readAsDataURL(file);
        }
    };

    if (showIncomingCall) {
        return (
            <div
                className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-between py-20 text-white bg-cover bg-center relative"
                style={{
                    backgroundImage: callerImage
                        ? `url(${callerImage})`
                        : `url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1888&auto=format&fit=crop')`
                }}
            >
                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-black/60 z-0 backdrop-blur-sm" />

                <div className="z-10 flex flex-col items-center mt-10 w-full px-8 text-center animate-in fade-in duration-500">
                    <div className="h-32 w-32 rounded-full bg-gray-300 mb-6 overflow-hidden border-2 border-white/20 shadow-2xl relative">
                        {callerImage ? (
                            <img src={callerImage} alt="Caller" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gray-500 flex items-center justify-center text-4xl font-bold">
                                {callerName.charAt(0)}
                            </div>
                        )}
                    </div>
                    <h1 className="text-4xl font-semibold mb-2 drop-shadow-md">{callerName}</h1>
                    <p className="text-xl opacity-80 font-medium">{callActive ? '00:05' : 'Mobile'}</p>

                    {callActive && isScriptEnabled && script && (
                        <div className="mt-8 p-4 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 w-full max-w-sm text-left animate-in slide-in-from-bottom-5">
                            <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Script</p>
                            <p className="text-sm leading-relaxed">{script}</p>
                        </div>
                    )}
                </div>

                <div className="z-10 w-full px-10 mb-10">
                    {callActive ? (
                        <div className="flex justify-center">
                            <Button
                                onClick={handleEndCall}
                                className="h-20 w-20 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg transform transition-transform hover:scale-110"
                            >
                                <PhoneOff className="h-10 w-10 text-white" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex justify-between items-center w-full max-w-xs mx-auto">
                            <div className="flex flex-col items-center gap-2">
                                <Button
                                    onClick={handleEndCall}
                                    className="h-20 w-20 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg"
                                >
                                    <PhoneOff className="h-10 w-10 text-white" />
                                </Button>
                                <span className="text-sm font-medium drop-shadow">Decline</span>
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <Button
                                    onClick={handleAcceptCall}
                                    className="h-20 w-20 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg animate-bounce"
                                >
                                    <Phone className="h-10 w-10 text-white" />
                                </Button>
                                <span className="text-sm font-medium drop-shadow">Accept</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <div className="p-4 flex items-center gap-4 bg-card border-b sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-semibold">Caller details</h1>
            </div>

            <div className="flex-1 p-6 space-y-8 overflow-y-auto">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                />

                {/* Caller Image Section */}
                <section className="space-y-4">
                    <Label className="text-base text-primary font-medium">Set up caller image</Label>
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            className="flex-1 h-24 flex-col gap-2 rounded-xl border-dashed hover:border-primary/50 hover:bg-primary/5"
                            onClick={() => handleImageSelect('camera')}
                        >
                            <Camera className="h-6 w-6 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Camera</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 h-24 flex-col gap-2 rounded-xl border-dashed hover:border-primary/50 hover:bg-primary/5"
                            onClick={() => handleImageSelect('gallery')}
                        >
                            <Image className="h-6 w-6 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Gallery</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 h-24 flex-col gap-2 rounded-xl border-dashed bg-secondary/20 border-secondary hover:bg-secondary/30"
                            onClick={() => handleImageSelect('avatar')}
                        >
                            <User className="h-6 w-6 text-primary" />
                            <span className="text-xs text-primary font-medium">Avatar</span>
                        </Button>
                    </div>
                </section>

                {/* Caller ID Section */}
                <section className="space-y-4">
                    <Label className="text-base text-primary font-medium">Set up fake caller id</Label>
                    <div className="space-y-4 bg-card p-4 rounded-xl border shadow-sm">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={callerName}
                                onChange={(e) => setCallerName(e.target.value)}
                                className="bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone number</Label>
                            <Input
                                id="phone"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="bg-background"
                            />
                        </div>
                    </div>
                </section>

                {/* Timer Section */}
                <section className="space-y-4">
                    <Label className="text-base text-primary font-medium">Pre-set timer</Label>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {[
                            { label: '5 sec', val: 5 },
                            { label: '1 min', val: 60 },
                            { label: '5 min', val: 300 }
                        ].map((t) => (
                            <Button
                                key={t.val}
                                variant={timer === t.val && !isTimerRunning ? "default" : "outline"}
                                className="rounded-full px-6"
                                onClick={() => setTimer(Number(t.val))}
                            >
                                {t.label}
                            </Button>
                        ))}
                        <Button variant="outline" size="icon" className="rounded-full w-10 h-10 shrink-0">
                            <span className="text-lg">+</span>
                        </Button>
                    </div>
                </section>

                {/* Script Section */}
                <section className="flex items-center justify-between p-4 bg-card rounded-xl border shadow-sm">
                    <div className="flex items-center gap-2">
                        <Switch
                            id="script"
                            checked={isScriptEnabled}
                            onCheckedChange={setIsScriptEnabled}
                        />
                        <Label htmlFor="script">Auto generate script</Label>
                    </div>
                </section>

                <Dialog open={isScriptDialogOpen} onOpenChange={setIsScriptDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="link" className="text-primary pl-0 h-auto p-0">
                            <span className="flex items-center gap-2">
                                ✏️ Make your own script
                            </span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Custom Call Script</DialogTitle>
                            <DialogDescription>
                                Type what you want the fake caller to appear to be saying (visible on screen).
                            </DialogDescription>
                        </DialogHeader>
                        <Textarea
                            value={script}
                            onChange={(e) => setScript(e.target.value)}
                            placeholder="Ex: Hey, I'm almost there. Just wait outside."
                            className="min-h-[100px]"
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button">Save Script</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Button
                    className="w-full py-6 text-lg rounded-xl shadow-lg mt-auto"
                    onClick={() => {
                        if (timer) {
                            startTimer(timer);
                        } else {
                            setShowIncomingCall(true);
                        }
                    }}
                >
                    {isTimerRunning ? `Ringing in ${timer}s...` : 'Save & Start Call'}
                </Button>

            </div>
        </div>
    );
}

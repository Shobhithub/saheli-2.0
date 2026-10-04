import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mic, Video, Trash2, Share2, Play, Pause, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from '@/components/ui/card';
import { BottomNavigation } from '@/components/layout/BottomNavigation';

const INITIAL_RECORDINGS = [
    { id: 1, title: 'Dilsukh Nagar Main Road 2', date: '11 Aug 2024', duration: '03:12', url: null as string | null },
    { id: 2, title: 'Mehdipatnam', date: '13 July 2024', duration: '02:01', url: null as string | null },
    { id: 3, title: 'MG Bus Station', date: '10 July 2024', duration: '01:52', url: null as string | null },
    { id: 4, title: 'Victoria memorial', date: '05 July 2024', duration: '06:12', url: null as string | null },
];

// Helper to format seconds to MM:SS
const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function Recording() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'audio' | 'video'>('audio');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTimer, setRecordingTimer] = useState(0);
    const [recordings, setRecordings] = useState(INITIAL_RECORDINGS);
    const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentRecordingType, setCurrentRecordingType] = useState<'audio' | 'video'>('audio');

    // Refs for media/recording state (avoids stale closures)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const timerIntervalRef = useRef<number | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const audioAnalyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
    const waveformBarsRef = useRef<(HTMLDivElement | null)[]>([]);
    const mediaPlayerRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);

    // Cleanup all recording resources
    const cleanupRecording = () => {
        // Clear timer
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }

        // Stop mic/camera streams (turns off hardware indicator)
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Stop waveform animation
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        audioAnalyserRef.current = null;

        // Clear video preview
        if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = null;
        }

        mediaRecorderRef.current = null;
        setIsRecording(false);
    };

    // Start actual audio/video recording
    const startRecording = async () => {
        try {
            setError(null);
            chunksRef.current = [];
            setRecordingTimer(0);
            setCurrentRecordingType(activeTab);

            // Request mic/camera permissions
            const constraints: MediaStreamConstraints = activeTab === 'audio'
                ? { audio: true, video: false }
                : {
                    audio: true,
                    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
                };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            // Set up live video preview for video recording
            if (activeTab === 'video' && videoPreviewRef.current) {
                videoPreviewRef.current.srcObject = stream;
                videoPreviewRef.current.play();
            }

            // Set up real-time audio waveform visualization
            if (activeTab === 'audio') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                const audioCtx = new AudioContext();
                const source = audioCtx.createMediaStreamSource(stream);
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 64;
                source.connect(analyser);
                audioAnalyserRef.current = analyser;

                // Animate waveform bars with real audio data
                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                const animateWaveform = () => {
                    if (!audioAnalyserRef.current) return;
                    audioAnalyserRef.current.getByteFrequencyData(dataArray);
                    waveformBarsRef.current.forEach((bar, i) => {
                        if (bar) {
                            const value = dataArray[i % dataArray.length] || 0;
                            const height = Math.max(10, (value / 255) * 100);
                            bar.style.height = `${height}%`;
                        }
                    });
                    animationFrameRef.current = requestAnimationFrame(animateWaveform);
                };
                animateWaveform();
            }

            // Pick browser-supported file format
            let mimeType = '';
            if (activeTab === 'audio') {
                const supportedTypes = ['audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
                mimeType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
            } else {
                const supportedTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/mp4'];
                mimeType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
            }

            // Initialize recorder
            const mediaRecorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            // Collect recording chunks as they are generated
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            // Handle recording stop: save file to list
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, {
                    type: mimeType || (activeTab === 'audio' ? 'audio/webm' : 'video/webm')
                });
                const recordingUrl = URL.createObjectURL(blob);

                const newRecording = {
                    id: Date.now(),
                    title: `${activeTab === 'audio' ? 'Audio' : 'Video'} Recording ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                    duration: formatTime(recordingTimer),
                    url: recordingUrl
                };

                setRecordings(prev => [newRecording, ...prev]);
                cleanupRecording();
            };

            // Start recording and timer
            mediaRecorder.start();
            setIsRecording(true);

            let seconds = 0;
            timerIntervalRef.current = window.setInterval(() => {
                seconds++;
                setRecordingTimer(seconds);
            }, 1000);

        } catch (err) {
            console.error('Recording failed:', err);
            setError(
                err instanceof Error && err.name === 'NotAllowedError'
                    ? 'Please allow microphone/camera access to record'
                    : 'Could not start recording. Check your device settings.'
            );
            cleanupRecording();
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        } else {
            cleanupRecording();
        }
    };

    // Play/pause recorded files
    const togglePlayback = (recording: typeof INITIAL_RECORDINGS[0]) => {
        if (!recording.url) return;

        // Pause if currently playing this recording
        if (currentlyPlaying === recording.id && mediaPlayerRef.current) {
            mediaPlayerRef.current.pause();
            mediaPlayerRef.current = null;
            setCurrentlyPlaying(null);
            return;
        }

        // Stop any other active playback
        if (mediaPlayerRef.current) mediaPlayerRef.current.pause();

        // Create new player
        const player = recording.title.toLowerCase().includes('video')
            ? document.createElement('video')
            : new Audio(recording.url);

        player.src = recording.url;
        player.onended = () => {
            setCurrentlyPlaying(null);
            mediaPlayerRef.current = null;
        };
        player.play();
        mediaPlayerRef.current = player;
        setCurrentlyPlaying(recording.id);
    };

    // Delete recording
    const deleteRecording = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setRecordings(prev => {
            const recording = prev.find(r => r.id === id);
            if (recording?.url) URL.revokeObjectURL(recording.url); // Free memory
            return prev.filter(r => r.id !== id);
        });

        if (currentlyPlaying === id) {
            mediaPlayerRef.current?.pause();
            mediaPlayerRef.current = null;
            setCurrentlyPlaying(null);
        }
    };

    // Share recording (if browser supports Web Share API)
    const shareRecording = async (recording: typeof INITIAL_RECORDINGS[0], e: React.MouseEvent) => {
        e.stopPropagation();
        if (!recording.url) {
            setError('Cannot share placeholder recording');
            setTimeout(() => setError(null), 3000);
            return;
        }
        if (!navigator.share) {
            setError('Sharing is not supported on your browser');
            setTimeout(() => setError(null), 3000);
            return;
        }

        try {
            const blob = await fetch(recording.url).then(res => res.blob());
            const file = new File(
                [blob],
                `${recording.title}.${currentRecordingType === 'audio' ? 'webm' : 'webm'}`,
                { type: blob.type }
            );
            await navigator.share({ title: recording.title, files: [file] });
        } catch (err) {
            console.error('Share failed:', err);
        }
    };

    // Cleanup on component unmount (prevent memory leaks/camera staying on)
    useEffect(() => {
        return () => {
            cleanupRecording();
            recordings.forEach(rec => { if (rec.url) URL.revokeObjectURL(rec.url); });
            mediaPlayerRef.current?.pause();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <div className="p-4 pt-6 bg-coral-500 text-white rounded-b-[2rem] shadow-md relative z-10">
                <div className="flex items-center gap-4 mb-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white hover:bg-white/20">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-lg font-semibold flex-1 text-center mr-10">
                        {activeTab === 'audio' ? 'Audio recording' : 'Video recording'}
                    </h1>
                </div>

                <Tabs defaultValue="audio" className="w-full" onValueChange={(v) => setActiveTab(v as 'audio' | 'video')}>
                    <TabsList className="grid w-full grid-cols-2 bg-white/20 p-1 rounded-full">
                        <TabsTrigger
                            value="audio"
                            disabled={isRecording}
                            className="rounded-full data-[state=active]:bg-white data-[state=active]:text-coral-600 text-white disabled:opacity-50"
                        >
                            Audio
                        </TabsTrigger>
                        <TabsTrigger
                            value="video"
                            disabled={isRecording}
                            className="rounded-full data-[state=active]:bg-white data-[state=active]:text-coral-600 text-white disabled:opacity-50"
                        >
                            Video
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="flex-1 px-4 py-6 space-y-4 overflow-y-auto pb-32">
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <h2 className="text-sm font-semibold text-muted-foreground mb-2">All recordings</h2>

                {recordings.map((rec) => (
                    <Card
                        key={rec.id}
                        className="p-4 flex items-center justify-between rounded-xl hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => togglePlayback(rec)}
                    >
                        <div className="flex-1">
                            <h3 className="font-medium text-sm">{rec.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{rec.date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground mr-2">{rec.duration}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-coral-600"
                                onClick={(e) => shareRecording(rec, e)}
                            >
                                <Share2 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                onClick={(e) => deleteRecording(rec.id, e)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-coral-600"
                                disabled={!rec.url}
                            >
                                {currentlyPlaying === rec.id
                                    ? <Pause className="h-4 w-4 fill-coral-600" />
                                    : <Play className="h-4 w-4 fill-coral-600" />
                                }
                            </Button>
                        </div>
                    </Card>
                ))}

                {/* Mock placeholder item */}
                <Card className="p-4 flex items-center justify-between rounded-xl opacity-60 pointer-events-none">
                    <div>
                        <h3 className="font-medium text-sm">Dilsukh Nagar Main Road 1</h3>
                        <p className="text-xs text-muted-foreground mt-1">12 June 2024</p>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">05:32</span>
                </Card>
            </div>

            {/* Recording Action Sheet */}
            <div className="fixed bottom-[80px] left-0 right-0 px-4 z-20">
                <Card className="bg-red-50 border-red-100 shadow-xl rounded-2xl p-4 animate-in slide-in-from-bottom duration-500">
                    {isRecording ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="text-center">
                                <h3 className="font-bold text-lg mb-1">Recording...</h3>
                                <p className="text-3xl font-mono tabular-nums text-red-500">
                                    {formatTime(recordingTimer)}
                                </p>
                            </div>

                            {currentRecordingType === 'audio' ? (
                                // Real-time audio waveform
                                <div className="flex items-center gap-1 h-8 w-full justify-center opacity-70">
                                    {[...Array(20)].map((_, i) => (
                                        <div
                                            key={i}
                                            ref={el => waveformBarsRef.current[i] = el}
                                            className="w-1 bg-red-400 rounded-full transition-all duration-75"
                                            style={{ height: '20%' }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                // Live video preview
                                <video
                                    ref={videoPreviewRef}
                                    className="w-full h-40 object-cover rounded-lg bg-black"
                                    muted
                                    playsInline
                                />
                            )}

                            <Button
                                variant="destructive"
                                size="lg"
                                className="rounded-full h-16 w-32 shadow-lg bg-red-500 hover:bg-red-600 gap-2"
                                onClick={stopRecording}
                            >
                                <Square className="h-6 w-6 fill-white" /> Stop
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <div className="text-center w-full">
                                <h3 className="font-bold text-sm mb-4 text-left pl-2">Ready to record</h3>
                            </div>

                            <Button
                                className="w-full h-14 bg-white text-red-500 border-2 border-red-100 hover:bg-red-50 hover:text-red-600 rounded-xl shadow-sm text-lg font-medium"
                                onClick={startRecording}
                            >
                                {activeTab === 'audio' ? <Mic className="h-6 w-6 mr-2" /> : <Video className="h-6 w-6 mr-2" />}
                                Record {activeTab === 'audio' ? 'Audio' : 'Video'}
                            </Button>
                        </div>
                    )}
                </Card>
            </div>

            <BottomNavigation />
        </div>
    );
}

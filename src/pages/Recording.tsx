import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mic, Video, Trash2, Share2, Play, Pause, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from '@/components/ui/card';
import { BottomNavigation } from '@/components/layout/BottomNavigation';

const RECORDINGS = [
    { id: 1, title: 'Dilsukh Nagar Main Road 2', date: '11 Aug 2024', duration: '03:12' },
    { id: 2, title: 'Mehdipatnam', date: '13 July 2024', duration: '02:01' },
    { id: 3, title: 'MG Bus Station', date: '10 July 2024', duration: '01:52' },
    { id: 4, title: 'Victoria memorial', date: '05 July 2024', duration: '06:12' },
];

export default function Recording() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('audio');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTimer, setRecordingTimer] = useState(0);

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

                <Tabs defaultValue="audio" className="w-full" onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 bg-white/20 p-1 rounded-full">
                        <TabsTrigger value="audio" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-coral-600 text-white">Audio</TabsTrigger>
                        <TabsTrigger value="video" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-coral-600 text-white">Video</TabsTrigger>
                    </TabsList>
                    {/* We just use state to toggle title, content handles checking activeTab too if needed for subtle diffs */}
                </Tabs>
            </div>

            <div className="flex-1 px-4 py-6 space-y-4 overflow-y-auto pb-32">
                <h2 className="text-sm font-semibold text-muted-foreground mb-2">All recordings</h2>

                {RECORDINGS.map((rec) => (
                    <Card key={rec.id} className="p-4 flex items-center justify-between rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                        <div>
                            <h3 className="font-medium text-sm">{rec.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{rec.date}</p>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">{rec.duration}</span>
                    </Card>
                ))}

                {/* New Mock Items to fill list */}
                <Card className="p-4 flex items-center justify-between rounded-xl opacity-60">
                    <div>
                        <h3 className="font-medium text-sm">Dilsukh Nagar Main Road 1</h3>
                        <p className="text-xs text-muted-foreground mt-1">12 June 2024</p>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">05:32</span>
                </Card>
            </div>

            {/* Active Recording / Action Sheet */}
            <div className="fixed bottom-[80px] left-0 right-0 px-4 z-20">
                <Card className="bg-red-50 border-red-100 shadow-xl rounded-2xl p-4 animate-in slide-in-from-bottom duration-500">
                    {isRecording ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="text-center">
                                <h3 className="font-bold text-lg mb-1">Recording...</h3>
                                <p className="text-3xl font-mono tabular-nums text-red-500">00:0{recordingTimer}</p>
                            </div>

                            {/* Waveform Visualization Mock */}
                            <div className="flex items-center gap-1 h-8 w-full justify-center opacity-70">
                                {[...Array(20)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-1 bg-red-400 rounded-full animate-pulse"
                                        style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.05}s` }}
                                    />
                                ))}
                            </div>

                            <Button
                                variant="destructive"
                                size="lg"
                                className="rounded-full h-16 w-32 shadow-lg bg-red-500 hover:bg-red-600 gap-2"
                                onClick={() => setIsRecording(false)}
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
                                onClick={() => {
                                    setIsRecording(true);
                                    let sec = 0;
                                    const timer = setInterval(() => {
                                        sec++;
                                        setRecordingTimer(sec);
                                        if (sec > 99) clearInterval(timer); // just for demo
                                    }, 1000);
                                }}
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

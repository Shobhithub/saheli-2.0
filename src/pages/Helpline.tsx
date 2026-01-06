import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const helplines = [
    { name: 'Police Emergency', number: '100', desc: 'Immediate police assistance' },
    { name: 'Women Helpline', number: '1091', desc: '24/7 support for women in distress' },
    { name: 'Domestic Abuse', number: '181', desc: 'Support for domestic violence victims' },
    { name: 'Ambulance', number: '108', desc: 'Medical emergencies' },
    { name: 'Cyber Crime', number: '1930', desc: 'Report cyber harassment or fraud' },
    { name: 'Child Helpline', number: '1098', desc: 'Support for children in need' },
];

export default function Helpline() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <div className="p-4 flex items-center gap-4 bg-card border-b sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-semibold">Emergency Helpline</h1>
            </div>

            <div className="flex-1 p-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    {helplines.map((item) => (
                        <Card key={item.number} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center justify-between">
                                    {item.name}
                                    <Phone className="h-5 w-5 text-primary" />
                                </CardTitle>
                                <CardDescription>{item.desc}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between bg-secondary/20 p-3 rounded-lg">
                                    <span className="text-xl font-bold tracking-wide">{item.number}</span>
                                    <Button size="sm" asChild>
                                        <a href={`tel:${item.number}`}>Call Now</a>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <h3 className="text-blue-800 font-semibold mb-2">Need Immediate Help?</h3>
                    <p className="text-sm text-blue-700">
                        If you are in immediate danger, please use the <strong>SOS Button</strong> on the home screen to alert your emergency contacts and local authorities instantly.
                    </p>
                </div>
            </div>
        </div>
    );
}

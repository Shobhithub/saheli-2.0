import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Car, Star, Phone, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { BottomNavigation } from '@/components/layout/BottomNavigation';

const TRANSPORT_PROVIDERS = [
    {
        id: 1,
        name: 'Uber Auto',
        type: 'Auto',
        eta: '3 mins',
        price: '₹140',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1620864350731-8da128956973?auto=format&fit=crop&w=100&q=80',
        features: ['Safety Toolkit', 'Share Ride']
    },
    {
        id: 2,
        name: 'Ola Mini',
        type: 'Cab',
        eta: '5 mins',
        price: '₹220',
        rating: 4.5,
        image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=100&q=80',
        features: ['OTP Start', 'SOS']
    },
    {
        id: 3,
        name: 'Rapido Bike',
        type: 'Bike',
        eta: '2 mins',
        price: '₹70',
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=100&q=80',
        features: ['Helmet', 'Fastest']
    },
    {
        id: 4,
        name: 'She-Cabs',
        type: 'Cab',
        eta: '10 mins',
        price: '₹250',
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=100&q=80',
        features: ['Women Drivers', 'Verified']
    }
];

export default function Transport() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleBook = (providerName: string) => {
        toast({
            title: "Booking Request Sent",
            description: `Connecting you to nearby ${providerName} drivers...`,
            className: "bg-teal-600 text-white border-none"
        });
    };

    return (
        <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-teal p-4 pb-8 rounded-b-[2rem] shadow-lg sticky top-0 z-10">
                <div className="flex items-center gap-2 mb-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white hover:bg-white/20" onClick={() => navigate(-1)}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-bold text-white flex-1">24/7 Transport</h1>
                </div>

                {/* Quick Location */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex items-center gap-3 border border-white/20">
                    <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] text-white/70 uppercase font-bold tracking-wider">Pickup</p>
                        <p className="text-sm text-white font-medium truncate">Current Location</p>
                    </div>
                </div>
            </div>

            {/* Providers List */}
            <div className="flex-1 p-4 pb-24 overflow-y-auto space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold text-foreground">Available Rides</h2>
                    <Badge variant="outline" className="text-xs bg-white">
                        <Clock className="w-3 h-3 mr-1" /> Now
                    </Badge>
                </div>

                {TRANSPORT_PROVIDERS.map((provider) => (
                    <Card key={provider.id} className="p-4 border-0 shadow-md flex items-center gap-4 active:scale-[0.99] transition-transform">
                        <img
                            src={provider.image}
                            alt={provider.name}
                            className="w-16 h-16 rounded-lg object-cover bg-gray-100"
                        />

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-base text-foreground">{provider.name}</h3>
                                <span className="font-bold text-base text-foreground">{provider.price}</span>
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                                    {provider.eta}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center">
                                    <Star className="w-3 h-3 text-yellow-500 mr-0.5 fill-yellow-500" />
                                    {provider.rating}
                                </span>
                            </div>

                            <div className="flex gap-1 mt-2 overflow-x-auto pb-1 no-scrollbar">
                                {provider.features.map((feature, idx) => (
                                    <span key={idx} className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100 whitespace-nowrap">
                                        {feature}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-white shadow-sm h-9 px-4 rounded-lg bg-teal-600"
                            onClick={() => handleBook(provider.name)}
                        >
                            Book
                        </Button>
                    </Card>
                ))}

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-6">
                    <div className="flex items-center gap-2 text-yellow-800 mb-1">
                        <Car className="h-4 w-4" />
                        <span className="font-bold text-sm">Safe Check</span>
                    </div>
                    <p className="text-xs text-yellow-700">
                        All drivers are verified. Share your ride details with trusted contacts automatically.
                    </p>
                </div>
            </div>

            <BottomNavigation />
        </div>
    );
}

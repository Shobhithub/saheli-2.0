import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Shield, MapPin, Users, Phone, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Slide {
    id: number;
    title: string;
    description: string;
    icon: React.ReactNode;
    bgColor: string;
}

const slides: Slide[] = [
    {
        id: 1,
        title: '"Instant help at your fingertips"',
        description: 'Activate a panic button with a triple-click or voice command to alert contacts, share your location, and start recording.',
        icon: <Bell className="h-16 w-16 text-coral-500" />,
        bgColor: 'bg-gradient-to-br from-orange-50 to-rose-50',
    },
    {
        id: 2,
        title: '"Find the safest way home"',
        description: 'With real-time route suggestions to help you avoid high-risk areas.',
        icon: <MapPin className="h-16 w-16 text-teal-500" />,
        bgColor: 'bg-gradient-to-br from-teal-50 to-cyan-50',
    },
    {
        id: 3,
        title: '"Community by your side"',
        description: 'Connect with nearby helpers and trusted community members for instant support.',
        icon: <Users className="h-16 w-16 text-coral-500" />,
        bgColor: 'bg-gradient-to-br from-rose-50 to-orange-50',
    },
];

export default function WelcomeSlides() {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setSlideDirection('right');
            setCurrentSlide(currentSlide + 1);
        } else {
            // Mark welcome as seen and go to login
            localStorage.setItem('saheli_welcome_seen', 'true');
            navigate('/login');
        }
    };

    const handleSkip = () => {
        localStorage.setItem('saheli_welcome_seen', 'true');
        navigate('/login');
    };

    const handlePrev = () => {
        if (currentSlide > 0) {
            setSlideDirection('left');
            setCurrentSlide(currentSlide - 1);
        }
    };

    const slide = slides[currentSlide];

    return (
        <div className={`min-h-screen flex flex-col ${slide.bgColor} transition-colors duration-500`}>
            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                {/* Illustration Container */}
                <div
                    className={`w-64 h-64 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center mb-8 shadow-lg animate-fade-in-up`}
                    key={slide.id}
                >
                    <div className="w-48 h-48 rounded-full bg-white/50 flex items-center justify-center">
                        {slide.icon}
                    </div>
                </div>

                {/* Text Content */}
                <div className="text-center max-w-sm animate-fade-in" key={`text-${slide.id}`}>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        {slide.title}
                    </h2>
                    <p className="text-gray-600 leading-relaxed">
                        {slide.description}
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <div className="px-6 py-8 flex items-center justify-between">
                {/* Skip Button */}
                <button
                    onClick={handleSkip}
                    className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
                >
                    Skip
                </button>

                {/* Dot Indicators */}
                <div className="flex gap-2">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${index === currentSlide
                                ? 'bg-coral-500 w-6'
                                : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                        />
                    ))}
                </div>

                {/* Next Button */}
                <button
                    onClick={handleNext}
                    className="text-gray-700 hover:text-gray-900 font-medium transition-colors flex items-center gap-1"
                >
                    {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

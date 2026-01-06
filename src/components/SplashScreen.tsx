import React, { useState, useEffect } from 'react';
import splashBg from '@/assets/saheli-splash-bg.png';

interface SplashScreenProps {
    onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
    const [fadeOut, setFadeOut] = useState(false);
    const [fadeIn, setFadeIn] = useState(false);

    // Trigger fade-in animation on mount
    useEffect(() => {
        const timer = setTimeout(() => setFadeIn(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleGetStarted = () => {
        setFadeOut(true);
        setTimeout(onComplete, 500);
    };

    return (
        <div
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-1000 ${fadeOut ? 'opacity-0' : fadeIn ? 'opacity-100' : 'opacity-0'
                }`}
            style={{
                backgroundImage: `url(${splashBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
                backgroundRepeat: 'no-repeat',
                backgroundColor: '#3db4a8'
            }}
        >
            {/* Semi-transparent overlay for better text visibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(32,178,170,0.7)]" />

            {/* Content positioned in lower half */}
            <div className="relative z-10 flex flex-col items-center mt-auto pb-12 px-6">
                {/* Title */}
                <h1
                    className="text-2xl md:text-3xl lg:text-4xl text-white text-center mb-3"
                    style={{
                        fontStyle: 'italic',
                        fontWeight: '600',
                        textShadow: '2px 2px 8px rgba(0,0,0,0.4), 0 0 20px rgba(0,0,0,0.2)'
                    }}
                >
                    Welcome to your safety companion
                </h1>

                {/* Subtitle */}
                <p
                    className="text-white text-center text-sm md:text-base max-w-md mx-auto mb-8 leading-relaxed"
                    style={{
                        textShadow: '1px 1px 6px rgba(0,0,0,0.5), 0 0 15px rgba(0,0,0,0.3)'
                    }}
                >
                    "Powerful tools to keep you safe, day and night
                    <br />
                    —we've got your back, wherever you are."
                </p>

                {/* Get Started Button */}
                <button
                    onClick={handleGetStarted}
                    className="px-12 py-4 text-white font-semibold text-base rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300"
                    style={{
                        backgroundColor: '#f08b7d',
                        boxShadow: '0 4px 20px rgba(240, 139, 125, 0.5)'
                    }}
                >
                    Let's get started
                </button>
            </div>

            {/* Decorative sparkle */}
            <div
                className="absolute bottom-6 right-6 text-3xl animate-pulse"
                style={{ color: '#7dd4cc' }}
            >
                ✦
            </div>
        </div>
    );
}

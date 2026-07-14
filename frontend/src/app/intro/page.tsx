'use client';

import AppProviderWrapper from '@/components/main/AppProviderWrapper';
import LandingHeader from './Header';
import HeroSection from './HeroSection';

export default function LandingPage() {
    return (
        <AppProviderWrapper>
            <LandingHeader />
            <HeroSection />
        </AppProviderWrapper>
    );
}

'use client';

import AppProviderWrapper from '@/components/main/AppProviderWrapper';
import LandingHeader from './Header';
import HeroSection from './HeroSection';
import TargetSection from './TargetSection';
import ContactSection from './ContactSection';

export default function LandingPage() {
    return (
        <AppProviderWrapper>
            <LandingHeader />
            <HeroSection />
            <TargetSection />
            <ContactSection />
        </AppProviderWrapper>
    );
}

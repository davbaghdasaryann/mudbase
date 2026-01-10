'use client';

import Carousel from '@/app/intro/IntroCarousel';
import InfoSection from '@/app/intro/IntroInfoSection';
import ProcessTimeline from '@/app/intro/IntroProcessTimelineLabels';
import TabbedFeatures from '@/app/intro/IntroTabbedCards';
import VideoSection from '@/app/intro/IntroVideoSection';
import ContactSection from '@/app/intro/IntroContactSection';
import PageContents from '@/components/PageContents';
import { youtubeUrl } from '@/theme';
import { AppBar, Box, Button, Toolbar } from '@mui/material';
import Footer from '@/app/intro/Footer';
import Header from '@/app/intro/Header';

export default function IntroPage() {
    return (
        <>
          
        <Header/>
            <Carousel />
            <InfoSection />
            <ProcessTimeline />
            <TabbedFeatures />
            <VideoSection youtubeUrl={youtubeUrl} />
            <ContactSection />
            <Footer/>
        </>
    );
}

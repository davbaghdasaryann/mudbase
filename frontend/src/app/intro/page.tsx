'use client';

import { Box } from '@mui/material';
import LandingHeader from './Header';
import AppProviderWrapper from '@/components/main/AppProviderWrapper';

export default function LandingPage() {
    return (
        <AppProviderWrapper>
            <Box sx={{ minHeight: '100vh', backgroundColor: '#f0f4f5' }}>
                <LandingHeader />
            </Box>
        </AppProviderWrapper>
    );
}

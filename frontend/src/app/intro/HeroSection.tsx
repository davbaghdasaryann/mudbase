'use client';

import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';


export default function HeroSection() {
    const { i18n } = useTranslation();
    const isAm = i18n.language === 'am';

    const [skylineOpacity, setSkylineOpacity] = useState(0.25);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const heroHeight = window.innerHeight;
            // Start fading in at 20% scroll, reach full opacity at 75%
            const start = heroHeight * 0.2;
            const end = heroHeight * 0.75;
            const progress = Math.min(1, Math.max(0, (scrollY - start) / (end - start)));
            setSkylineOpacity(0.25 + progress * 0.75);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <Box sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            position: 'relative',
            pt: { xs: 5, sm: 7, md: 10 },
            pb: 0,
            overflow: 'hidden',
            backgroundColor: '#ffffff',
        }}>
            {/* M Logo animation */}
            <Box sx={{ mb: { xs: 1.5, md: 2 }, lineHeight: 0 }}>
                <video
                    src='/images/mudbase_intro.mp4'
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{ width: 'min(58vw, 380px)', height: 'min(58vw, 380px)', display: 'block', objectFit: 'contain' }}
                />
            </Box>

            {/* Headline — minimalistic */}
            <Box sx={{
                textAlign: 'center',
                px: 3,
                '@keyframes fadeUp': {
                    from: { opacity: 0, transform: 'translateY(14px)' },
                    to:   { opacity: 1, transform: 'translateY(0)' },
                },
            }}>
                {/* Desktop: one row with dot separators */}
                <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', justifyContent: 'center', gap: 2.5 }}>
                    {[
                        { am: 'Հաշվարկիր', en: 'Calculate', color: '#4aab49' },
                        { am: 'Վերլուծիր', en: 'Analyze',   color: '#00a896' },
                        { am: 'կառավարիր', en: 'Manage',    color: '#00abbe' },
                    ].map((item, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                            <Typography component='span' sx={{
                                fontWeight: 400,
                                fontSize: { sm: '0.9rem', md: '1.05rem' },
                                letterSpacing: '0.28em',
                                textTransform: 'uppercase',
                                color: item.color,
                                opacity: 0.72,
                                animation: 'fadeUp 0.8s ease both',
                                animationDelay: `${0.15 + i * 0.18}s`,
                            }}>
                                {isAm ? item.am : item.en}
                            </Typography>
                            {i < 2 && (
                                <Box component='span' sx={{ color: '#c8d8dc', fontSize: '0.45rem', lineHeight: 1 }}>&#9679;</Box>
                            )}
                        </Box>
                    ))}
                </Box>

                {/* Mobile: stacked column, no dots */}
                <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
                    {[
                        { am: 'Հաշվարկիր', en: 'Calculate', color: '#4aab49' },
                        { am: 'Վերլուծիր', en: 'Analyze',   color: '#00a896' },
                        { am: 'կառավարիր', en: 'Manage',    color: '#00abbe' },
                    ].map((item, i) => (
                        <Typography key={i} component='span' sx={{
                            fontWeight: 400,
                            fontSize: '0.78rem',
                            letterSpacing: '0.22em',
                            textTransform: 'uppercase',
                            color: item.color,
                            opacity: 0.72,
                            animation: 'fadeUp 0.8s ease both',
                            animationDelay: `${0.15 + i * 0.18}s`,
                        }}>
                            {isAm ? item.am : item.en}
                        </Typography>
                    ))}
                </Box>
            </Box>

            {/* City skyline — anchored at hero section bottom */}
            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src='/images/hero_skyline.svg' alt='' style={{ width: '100%', display: 'block', transform: 'translateY(23%)', opacity: skylineOpacity, transition: 'opacity 0.1s linear' }} />
            </Box>
        </Box>
    );
}

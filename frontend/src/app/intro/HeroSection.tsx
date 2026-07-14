'use client';

import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';


export default function HeroSection() {
    const { i18n } = useTranslation();
    const isAm = i18n.language === 'am';

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            pt: 12,
            pb: 0,
            overflow: 'hidden',
        }}>
            {/* M Logo */}
            <Box sx={{ mb: 5 }}>
                <Image src='/images/logo_square.svg' alt='Mudbase' width={130} height={130} priority />
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
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: { xs: 1.5, md: 2.5 } }}>
                    {[
                        { am: 'Հաշվարկիր', en: 'Calculate', color: '#4aab49' },
                        { am: 'Վերլուծիր', en: 'Analyze',   color: '#00a896' },
                        { am: 'կառավարիր', en: 'Manage',    color: '#00abbe' },
                    ].map((item, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2.5 } }}>
                            <Typography
                                component='span'
                                sx={{
                                    fontWeight: 400,
                                    fontSize: { xs: '0.8rem', sm: '0.95rem', md: '1.05rem' },
                                    letterSpacing: '0.28em',
                                    textTransform: 'uppercase',
                                    color: item.color,
                                    opacity: 0.72,
                                    animation: 'fadeUp 0.8s ease both',
                                    animationDelay: `${0.15 + i * 0.18}s`,
                                }}
                            >
                                {isAm ? item.am : item.en}
                            </Typography>
                            {i < 2 && (
                                <Box component='span' sx={{ color: '#c8d8dc', fontSize: '0.45rem', lineHeight: 1 }}>&#9679;</Box>
                            )}
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* City skyline — anchored at viewport bottom */}
            <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, lineHeight: 0, zIndex: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src='/images/hero_skyline.svg' alt='' style={{ width: '100%', display: 'block', transform: 'translateY(23%)' }} />
            </Box>
        </Box>
    );
}

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

            {/* Headline — three action words in logo colors */}
            <Box sx={{ textAlign: 'center', px: 3 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'baseline', gap: { xs: 0.5, md: 1 } }}>
                    {[
                        { am: 'Հաշվարկիր', en: 'Calculate', color: '#41a240' },
                        { am: 'Վերլուծիր', en: 'Analyze',   color: '#00a390' },
                        { am: 'կառավարիր', en: 'Manage',    color: '#00abbe' },
                    ].map((item, i) => (
                        <Box key={i} component='span' sx={{ display: 'inline-flex', alignItems: 'baseline' }}>
                            <Typography component='span' sx={{ fontWeight: 800, fontSize: { xs: '2.4rem', sm: '3.2rem', md: '4rem' }, lineHeight: 1.15, color: item.color, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'inline' }}>
                                {isAm ? item.am : item.en}
                            </Typography>
                            {i < 2 && (
                                <Typography component='span' sx={{ fontWeight: 800, fontSize: { xs: '2.4rem', sm: '3.2rem', md: '4rem' }, color: '#ccc', lineHeight: 1.15, mx: 0.5 }}>{','}</Typography>
                            )}
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* City skyline — anchored at viewport bottom */}
            <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, lineHeight: 0, zIndex: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src='/images/hero_skyline.svg' alt='' style={{ width: '100%', display: 'block' }} />
            </Box>
        </Box>
    );
}

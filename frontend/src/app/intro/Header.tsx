'use client';

import { Box, Button, Typography } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import EastIcon from '@mui/icons-material/East';

export default function LandingHeader() {
    const { t } = useTranslation();
    const router = useRouter();

    const navLinks = [
        { key: 'Tools', label: t('Tools') },
        { key: 'Subscription', label: t('Subscription') },
        { key: 'Contacts', label: t('Contacts') },
    ];

    return (
        <Box sx={{ position: 'fixed', top: 20, left: 0, right: 0, zIndex: 1200, display: 'flex', justifyContent: 'center', px: 3 }}>
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                backgroundColor: '#fff',
                borderRadius: '60px',
                boxShadow: '0 4px 32px rgba(0,0,0,0.09), 0 1px 6px rgba(0,0,0,0.05)',
                px: 3,
                py: 1.25,
                width: '100%',
                maxWidth: 800,
            }}>
                {/* Logo — far left */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Image src='/images/logo_square.svg' alt='Mudbase' width={34} height={34} />
                </Box>

                {/* Nav links — truly centered */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {navLinks.map(link => (
                        <Typography
                            key={link.key}
                            sx={{
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                color: '#222',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'color 0.15s',
                                '&:hover': { color: '#00ABBE' },
                            }}
                        >
                            {link.label}
                        </Typography>
                    ))}
                </Box>

                {/* Auth actions — far right */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                        onClick={() => router.push('/login')}
                        disableRipple
                        sx={{
                            color: '#00ABBE',
                            fontWeight: 600,
                            textTransform: 'none',
                            fontSize: '0.88rem',
                            minWidth: 0,
                            px: 1.5,
                            py: 0.75,
                            borderRadius: '8px',
                            background: 'transparent',
                            '&:hover': { background: 'rgba(0,171,190,0.06)' },
                        }}
                    >
                        {t('Login')}
                    </Button>
                    <Button
                        onClick={() => router.push('/signup')}
                        variant='contained'
                        endIcon={<EastIcon sx={{ fontSize: '0.9rem !important' }} />}
                        sx={{
                            backgroundColor: '#00ABBE',
                            color: '#fff',
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.88rem',
                            borderRadius: '10px',
                            px: 2.5,
                            py: 0.75,
                            boxShadow: 'none',
                            whiteSpace: 'nowrap',
                            '&:hover': { backgroundColor: '#009aab', boxShadow: 'none' },
                        }}
                    >
                        {t('Register')}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}

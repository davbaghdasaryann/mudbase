'use client';

import { Box, Button, Menu, MenuItem, Typography } from '@mui/material';
import EastIcon from '@mui/icons-material/East';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

function HamburgerIcon({ open }: { open: boolean }) {
    const lineBase = {
        display: 'block',
        width: 20,
        height: 2,
        backgroundColor: '#222',
        borderRadius: 2,
        transition: 'transform 0.25s ease, opacity 0.25s ease',
        transformOrigin: 'center',
    };
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '5px', cursor: 'pointer', p: '6px' }}>
            <Box component='span' sx={{
                ...lineBase,
                transform: open ? 'translateY(3.5px) rotate(45deg)' : 'none',
            }} />
            <Box component='span' sx={{
                ...lineBase,
                transform: open ? 'translateY(-3.5px) rotate(-45deg)' : 'none',
            }} />
        </Box>
    );
}

export default function LandingHeader() {
    const { t } = useTranslation();
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const navLinks = [
        { key: 'Tools', label: t('Tools') },
        { key: 'Subscription', label: t('Subscription') },
        { key: 'Contacts', label: t('Contacts') },
    ];

    return (
        <Box sx={{ position: 'fixed', top: 20, left: 0, right: 0, zIndex: 1200, display: 'flex', justifyContent: 'center', px: 3 }}>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#fff',
                borderRadius: '60px',
                boxShadow: '0 4px 32px rgba(0,0,0,0.09), 0 1px 6px rgba(0,0,0,0.05)',
                px: 3,
                py: 1.25,
                width: '100%',
                maxWidth: 800,
            }}>
                {/* Logo */}
                <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <Image src='/images/logo_square.svg' alt='Mudbase' width={34} height={34} />
                </Box>

                {/* Nav links — desktop only, centered */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' }}>
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

                {/* Spacer — desktop */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, flex: 1 }} />

                {/* Right side: hamburger (mobile) + action buttons */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>

                    {/* Animated hamburger — mobile only */}
                    <Box
                        sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}
                        onClick={e => setAnchorEl(open ? null : e.currentTarget as HTMLElement)}
                    >
                        <HamburgerIcon open={open} />
                    </Box>
                    <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={() => setAnchorEl(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        PaperProps={{
                            sx: { borderRadius: '14px', mt: 1, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', minWidth: 160 }
                        }}
                    >
                        {navLinks.map(link => (
                            <MenuItem
                                key={link.key}
                                onClick={() => setAnchorEl(null)}
                                sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#222', py: 1.25 }}
                            >
                                {link.label}
                            </MenuItem>
                        ))}
                    </Menu>

                    {/* Auth buttons */}
                    <Button
                        onClick={() => router.push('/login')}
                        disableRipple
                        sx={{
                            color: '#00ABBE',
                            fontWeight: 600,
                            textTransform: 'none',
                            fontSize: { xs: '0.78rem', md: '0.88rem' },
                            minWidth: 0,
                            px: { xs: 1, md: 1.5 },
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
                        endIcon={<EastIcon sx={{ fontSize: '0.9rem !important', display: { xs: 'none', sm: 'inline-flex' } }} />}
                        sx={{
                            backgroundColor: '#00ABBE',
                            color: '#fff',
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: { xs: '0.78rem', md: '0.88rem' },
                            borderRadius: '10px',
                            px: { xs: 1.5, md: 2.5 },
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

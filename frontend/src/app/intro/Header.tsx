'use client';

import { Box, Button, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EastIcon from '@mui/icons-material/East';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

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
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fff',
                borderRadius: '60px',
                boxShadow: '0 4px 32px rgba(0,0,0,0.09), 0 1px 6px rgba(0,0,0,0.05)',
                px: 3,
                py: 1.25,
                width: '100%',
                maxWidth: 800,
                minHeight: 56,
            }}>
                {/* Logo — absolutely pinned to left edge */}
                <Box sx={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                    <Image src='/images/logo_square.svg' alt='Mudbase' width={34} height={34} />
                </Box>

                {/* Desktop nav — the only in-flow child on desktop, centered by justify-content:center on parent */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 4 }}>
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

                {/* Auth buttons — absolutely pinned to right edge */}
                <Box sx={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
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

                {/* Mobile: login + register buttons (centered in-flow) */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1 }}>
                    <Button
                        onClick={() => router.push('/login')}
                        disableRipple
                        sx={{
                            color: '#00ABBE',
                            fontWeight: 600,
                            textTransform: 'none',
                            fontSize: '0.78rem',
                            minWidth: 0,
                            px: 1.2,
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
                        sx={{
                            backgroundColor: '#00ABBE',
                            color: '#fff',
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.78rem',
                            borderRadius: '10px',
                            px: 1.8,
                            py: 0.75,
                            boxShadow: 'none',
                            whiteSpace: 'nowrap',
                            '&:hover': { backgroundColor: '#009aab', boxShadow: 'none' },
                        }}
                    >
                        {t('Register')}
                    </Button>
                </Box>

                {/* Mobile: hamburger — absolutely pinned to right edge */}
                <Box sx={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
                    <IconButton
                        size='small'
                        onClick={e => setAnchorEl(open ? null : e.currentTarget)}
                        sx={{
                            color: '#222',
                            transition: 'transform 0.2s ease',
                            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
                        }}
                    >
                        {open
                            ? <CloseRoundedIcon sx={{ fontSize: 22 }} />
                            : <MenuRoundedIcon sx={{ fontSize: 22 }} />
                        }
                    </IconButton>
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
                </Box>
            </Box>
        </Box>
    );
}

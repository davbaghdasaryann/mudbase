'use client';

import { Box, Typography } from '@mui/material';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import { ElementType } from 'react';

const CARDS: { Icon: ElementType; label: string; color: string; bgColor: string }[] = [
    { Icon: ConstructionOutlinedIcon, label: 'Շինարարություն', color: '#00ABBE', bgColor: 'rgba(0,171,190,0.08)' },
    { Icon: AccountBalanceOutlinedIcon, label: 'Ապահովագրական', color: '#41A240', bgColor: 'rgba(65,162,64,0.08)' },
    { Icon: ApartmentOutlinedIcon,     label: 'Կառուցապատող', color: '#1CA461', bgColor: 'rgba(28,164,97,0.08)' },
    { Icon: DrawOutlinedIcon,          label: 'Նախագծում', color: '#00A390', bgColor: 'rgba(0,163,144,0.08)' },
    { Icon: CalculateOutlinedIcon,     label: 'Գնահատող', color: '#00A390', bgColor: 'rgba(0,163,144,0.08)' },
    { Icon: EngineeringOutlinedIcon,     label: 'Բանկեր', color: '#1CA461', bgColor: 'rgba(28,164,97,0.08)' },
];

export default function AudienceSection() {
    return (
        <Box sx={{
            pt: { xs: 6, md: 10 },
            pb: { xs: 6, md: 10 },
            px: { xs: 2, md: 4 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#07282C',
        }}>
            {/* Pill header */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 3, md: 5 } }}>
                <Box sx={{
                    display: 'inline-block',
                    backgroundColor: 'rgba(0,171,190,0.12)',
                    border: '1px solid rgba(0,171,190,0.35)',
                    borderRadius: '100px',
                    px: 2, py: 0.55,
                }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.13em', color: '#00ABBE', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        Ում համար է նախատասված Մադբեյзը
                    </Typography>
                </Box>
            </Box>

            {/* Cards — 3×2 grid */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                gap: { xs: 2, md: 2.5 },
                width: '100%',
                maxWidth: 1100,
            }}>
                {CARDS.map(({ Icon, label, color }, i) => (
                    <Box key={i} sx={{
                        backgroundColor: 'rgba(255,255,255,0.045)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderTop: `3px solid ${color}`,
                        display: 'flex',
                        flexDirection: 'column',
                        pt: 3,
                        pb: 3,
                        px: 3,
                        gap: 2,
                        transition: 'background 0.22s, transform 0.22s, box-shadow 0.22s',
                        '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            transform: 'translateY(-4px)',
                            boxShadow: '0 16px 48px rgba(0,0,0,0.35)',
                        },
                    }}>
                        <Box sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '10px',
                            backgroundColor: 'rgba(255,255,255,0.07)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <Icon sx={{ fontSize: '1.4rem', color: color }} />
                        </Box>
                        <Typography sx={{
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            color: '#E8F5F7',
                            lineHeight: 1.3,
                        }}>
                            {label}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

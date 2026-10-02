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
            backgroundColor: '#f8fafb',
        }}>
            {/* Pill header */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 3, md: 4 } }}>
                <Box sx={{
                    display: 'inline-block',
                    backgroundColor: 'rgba(0,163,144,0.07)',
                    border: '1px solid rgba(0,163,144,0.18)',
                    borderRadius: '100px',
                    px: 2, py: 0.55,
                }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.13em', color: '#00A390', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        Ում համար է նախատասված Մադբեյզը
                    </Typography>
                </Box>
            </Box>


            {/* Cards */}
            <Box sx={{
                display: 'flex',
                gap: { xs: 1.5, md: 2 },
                width: '100%',
                maxWidth: 1500,
                flexWrap: { xs: 'wrap', md: 'nowrap' },
                justifyContent: 'center',
            }}>
                {CARDS.map(({ Icon, label, color, bgColor }, i) => (
                    <Box key={i} sx={{
                        flex: '1 1 0',
                        minWidth: { xs: 'calc(50% - 8px)', md: 0 },
                        maxWidth: { xs: 'calc(50% - 8px)', md: 'none' },
                        minHeight: { xs: 160, md: 240 },
                        backgroundColor: '#fff',
                        borderRadius: '18px',
                        border: '1px solid rgba(0,171,190,0.22)',
                        boxShadow: '0 2px 12px rgba(0,171,190,0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pt: 4,
                        pb: 4,
                        px: 2,
                        gap: 2,
                        transition: 'box-shadow 0.25s, border-color 0.25s, transform 0.25s',
                        '&:hover': {
                            boxShadow: '0 12px 36px rgba(0,171,190,0.18)',
                            borderColor: 'rgba(0,171,190,0.55)',
                            transform: 'translateY(-8px)',
                        },
                    }}>
                        <Box sx={{
                            width: 70,
                            height: 70,
                            borderRadius: '50%',
                            backgroundColor: bgColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <Icon sx={{ fontSize: '2rem', color: color }} />
                        </Box>
                        <Typography sx={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: '#2a3a3a',
                            textAlign: 'center',
                            lineHeight: 1.4,
                        }}>
                            {label}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

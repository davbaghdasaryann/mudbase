'use client';

import { Box, Typography } from '@mui/material';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import { ElementType } from 'react';

const CARDS: { Icon: ElementType; circleBg: string; iconColor: string }[] = [
    { Icon: ConstructionOutlinedIcon, circleBg: 'rgba(245,158,11,0.13)',  iconColor: '#D97706' },
    { Icon: DrawOutlinedIcon,         circleBg: 'rgba(0,171,190,0.12)',   iconColor: '#00ABBE' },
    { Icon: ApartmentOutlinedIcon,    circleBg: 'rgba(99,102,241,0.12)',  iconColor: '#6366F1' },
    { Icon: AccountBalanceOutlinedIcon, circleBg: 'rgba(14,165,233,0.13)', iconColor: '#0EA5E9' },
    { Icon: CalculateOutlinedIcon,    circleBg: 'rgba(34,197,94,0.12)',   iconColor: '#16A34A' },
];

export default function TargetSection() {
    return (
        <Box sx={{
            py: { xs: 8, md: 11 },
            px: { xs: 3, md: 6 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#fff',
        }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
                {/* Pill badge */}
                <Box sx={{
                    display: 'inline-block',
                    backgroundColor: 'rgba(0,171,190,0.07)',
                    border: '1px solid rgba(0,171,190,0.18)',
                    borderRadius: '100px',
                    px: 2,
                    py: 0.55,
                    mb: 2.5,
                }}>
                    <Typography sx={{
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        letterSpacing: '0.13em',
                        color: '#00ABBE',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                    }}>
                        Թիրախային Լսարան
                    </Typography>
                </Box>

                {/* Main heading */}
                <Typography sx={{
                    fontWeight: 700,
                    fontSize: { xs: '1.55rem', md: '2.1rem' },
                    color: '#1a2e35',
                    lineHeight: 1.3,
                    mb: 1.5,
                }}>
                    Ում համար է նախատեսված Մադբեյզը
                </Typography>

                {/* Subheading */}
                <Typography sx={{
                    fontSize: { xs: '0.875rem', md: '0.95rem' },
                    color: '#94a3ac',
                    fontWeight: 400,
                }}>
                    Յուրախանչնուրը գտնում է իր օգութը համակարգի տվյալնևրին
                </Typography>
            </Box>

            {/* Cards row */}
            <Box sx={{
                display: 'flex',
                gap: { xs: 1.5, md: 2 },
                width: '100%',
                maxWidth: 1060,
                flexWrap: { xs: 'wrap', md: 'nowrap' },
                justifyContent: 'center',
            }}>
                {CARDS.map(({ Icon, circleBg, iconColor }, i) => (
                    <Box
                        key={i}
                        sx={{
                            flex: '1 1 0',
                            minWidth: { xs: 130, md: 0 },
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            py: { xs: 5, md: 9 },
                            borderRadius: '18px',
                            border: '1.5px solid rgba(0,171,190,0.22)',
                            boxShadow: '0 4px 24px rgba(0,171,190,0.06), 0 1px 4px rgba(0,0,0,0.03)',
                            backgroundColor: '#fff',
                            gap: 3,
                            transition: 'box-shadow 0.2s',
                            '&:hover': {
                                boxShadow: '0 8px 32px rgba(0,171,190,0.13), 0 2px 8px rgba(0,0,0,0.05)',
                            },
                        }}
                    >
                        {/* Icon circle */}
                        <Box sx={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            backgroundColor: circleBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Icon sx={{ fontSize: 28, color: iconColor }} />
                        </Box>

                        {/* Link */}
                        <Typography sx={{
                            fontSize: '0.78rem',
                            color: '#94a3ac',
                            cursor: 'pointer',
                            userSelect: 'none',
                            transition: 'color 0.15s',
                            '&:hover': { color: '#00ABBE' },
                        }}>
                            Պտտել ›
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

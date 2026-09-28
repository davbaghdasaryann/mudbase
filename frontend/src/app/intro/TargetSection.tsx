'use client';

import { Box, Typography } from '@mui/material';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import { ElementType, useState } from 'react';

const STROKE = '#3FA297';

const CARDS: { Icon: ElementType; circleBg: string; iconColor: string }[] = [
    { Icon: ConstructionOutlinedIcon, circleBg: 'rgba(28,164,97,0.10)',  iconColor: '#00A390' },
    { Icon: DrawOutlinedIcon,         circleBg: 'rgba(0,171,190,0.10)',  iconColor: '#00ABBE' },
    { Icon: ApartmentOutlinedIcon,    circleBg: 'rgba(57,176,117,0.15)', iconColor: '#39B075' },
];

export default function TargetSection() {
    const [flipped, setFlipped] = useState<boolean[]>([false, false, false]);

    const toggle = (i: number) =>
        setFlipped(prev => prev.map((v, idx) => (idx === i ? !v : v)));

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
                <Box sx={{
                    display: 'inline-block',
                    backgroundColor: 'rgba(0,171,190,0.07)',
                    border: '1px solid rgba(0,171,190,0.18)',
                    borderRadius: '100px',
                    px: 2, py: 0.55, mb: 2.5,
                }}>
                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.13em', color: '#00ABBE', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        Թիրախային Լսարան
                    </Typography>
                </Box>

                <Typography sx={{ fontWeight: 700, fontSize: { xs: '1.55rem', md: '2.1rem' }, color: '#1a2e35', lineHeight: 1.3, mb: 1.5 }}>
                    Ում համար է նախատեսված Մադբեյզը
                </Typography>

                <Typography sx={{ fontSize: { xs: '0.875rem', md: '0.95rem' }, color: '#94a3ac', fontWeight: 400 }}>
                    Յուրախանչնուրը գտնում է իր օգութը համակարգի տվյալնևրին
                </Typography>
            </Box>

            {/* Cards row */}
            <Box sx={{
                display: 'flex',
                gap: { xs: 1.5, md: 2 },
                width: '100%',
                maxWidth: 860,
                flexWrap: { xs: 'wrap', md: 'nowrap' },
                justifyContent: 'center',
            }}>
                {CARDS.map(({ Icon, circleBg, iconColor }, i) => (
                    <Box
                        key={i}
                        sx={{
                            flex: '1 1 0',
                            minWidth: { xs: 200, md: 0 },
                            perspective: '1000px',
                        }}
                    >
                        {/* Flip container */}
                        <Box sx={{
                            position: 'relative',
                            width: '100%',
                            height: { xs: 240, md: 320 },
                            transformStyle: 'preserve-3d',
                            transition: 'transform 0.6s cubic-bezier(0.4,0.2,0.2,1)',
                            transform: flipped[i] ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        }}>
                            {/* Front face */}
                            <Box sx={{
                                position: 'absolute',
                                inset: 0,
                                backfaceVisibility: 'hidden',
                                WebkitBackfaceVisibility: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '18px',
                                border: `1.5px solid ${STROKE}26`,
                                boxShadow: '0 4px 24px rgba(63,162,151,0.08), 0 1px 4px rgba(0,0,0,0.03)',
                                backgroundColor: '#fff',
                                gap: 3,
                                '&:hover': { boxShadow: '0 8px 32px rgba(63,162,151,0.15), 0 2px 8px rgba(0,0,0,0.05)' },
                            }}>
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

                                <Typography
                                    onClick={() => toggle(i)}
                                    sx={{
                                        fontSize: '0.78rem',
                                        color: '#94a3ac',
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        transition: 'color 0.15s',
                                        '&:hover': { color: '#00ABBE' },
                                    }}
                                >
                                    Պտտել ›
                                </Typography>
                            </Box>

                            {/* Back face */}
                            <Box sx={{
                                position: 'absolute',
                                inset: 0,
                                backfaceVisibility: 'hidden',
                                WebkitBackfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                borderRadius: '18px',
                                border: `1.5px solid ${STROKE}26`,
                                boxShadow: '0 4px 24px rgba(63,162,151,0.08), 0 1px 4px rgba(0,0,0,0.03)',
                                backgroundColor: '#fff',
                                pb: 3,
                            }}>
                                <Typography
                                    onClick={() => toggle(i)}
                                    sx={{
                                        fontSize: '0.78rem',
                                        color: '#94a3ac',
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        transition: 'color 0.15s',
                                        '&:hover': { color: '#00ABBE' },
                                    }}
                                >
                                    ‹ Պտտել
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

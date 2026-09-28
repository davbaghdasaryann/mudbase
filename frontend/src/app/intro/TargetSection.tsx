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
    const [flipped, setFlipped] = useState<number | null>(null);

    const toggle = (i: number) =>
        setFlipped(prev => (prev === i ? null : i));

    return (
        <Box sx={{
            py: { xs: 6, md: 8 },
            px: { xs: 3, md: 6 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#fff',
        }}>
            {/* Cards row */}
            <Box sx={{
                display: 'flex',
                gap: { xs: 2, md: 3 },
                width: '100%',
                maxWidth: 1100,
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
                            height: { xs: 300, md: 460 },
                            transformStyle: 'preserve-3d',
                            transition: 'transform 0.6s cubic-bezier(0.4,0.2,0.2,1)',
                            transform: flipped === i ? 'rotateY(180deg)' : 'rotateY(0deg)',
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
                                    width: 90,
                                    height: 90,
                                    borderRadius: '50%',
                                    backgroundColor: circleBg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Icon sx={{ fontSize: 40, color: iconColor }} />
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
                                border: `1px solid ${iconColor}`,
                                boxShadow: `0 4px 24px ${iconColor}26, 0 1px 4px rgba(0,0,0,0.03)`,
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

'use client';

import { Box, Typography } from '@mui/material';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import { ElementType } from 'react';

const CARDS: { Icon: ElementType; label: string }[] = [
    { Icon: ConstructionOutlinedIcon, label: 'Շինարարություն' },
    { Icon: DrawOutlinedIcon,          label: 'Նախագծում' },
    { Icon: ApartmentOutlinedIcon,     label: 'Կառուցապատող' },
    { Icon: AccountBalanceOutlinedIcon,label: 'Ապահովագրական' },
    { Icon: CalculateOutlinedIcon,     label: 'Գնահատող' },
    { Icon: EngineeringOutlinedIcon,   label: 'Բանկեր' },
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
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 1.5, md: 2 } }}>
                <Box sx={{
                    display: 'inline-block',
                    backgroundColor: 'rgba(0,163,144,0.07)',
                    border: '1px solid rgba(0,163,144,0.18)',
                    borderRadius: '100px',
                    px: 2, py: 0.55,
                }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.13em', color: '#00A390', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        Թիռանակաին Լսարան
                    </Typography>
                </Box>
            </Box>

            {/* Title */}
            <Typography variant='h4' sx={{
                fontWeight: 700,
                fontSize: { xs: '1.5rem', md: '2rem' },
                color: '#1a2a2a',
                textAlign: 'center',
                mb: { xs: 3, md: 4 },
            }}>
                Ում համար է նախատասված
            </Typography>

            {/* Cards */}
            <Box sx={{
                display: 'flex',
                gap: { xs: 1.5, md: 2 },
                width: '100%',
                maxWidth: 1500,
                flexWrap: { xs: 'wrap', md: 'nowrap' },
                justifyContent: 'center',
            }}>
                {CARDS.map(({ Icon, label }, i) => (
                    <Box key={i} sx={{
                        flex: '1 1 0',
                        minWidth: { xs: 'calc(50% - 8px)', md: 0 },
                        maxWidth: { xs: 'calc(50% - 8px)', md: 'none' },
                        minHeight: { xs: 200, md: 320 },
                        backgroundColor: '#fff',
                        borderRadius: '18px',
                        border: '1px solid rgba(0,171,190,0.22)',
                        boxShadow: '0 2px 12px rgba(0,171,190,0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pt: 6,
                        pb: 5,
                        px: 3,
                        gap: 3,
                        transition: 'box-shadow 0.2s, border-color 0.2s',
                        '&:hover': {
                            boxShadow: '0 6px 24px rgba(0,171,190,0.14)',
                            borderColor: 'rgba(0,171,190,0.5)',
                        },
                    }}>
                        <Box sx={{
                            width: 88,
                            height: 88,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0,171,190,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <Icon sx={{ fontSize: '2.4rem', color: '#00ABBE' }} />
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

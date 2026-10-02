'use client';

import { Box, Typography } from '@mui/material';

export default function AudienceSection() {
    return (
        <Box sx={{
            pt: { xs: 4, md: 6 },
            pb: { xs: 4, md: 6 },
            px: { xs: 3, md: 6 },
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
        </Box>
    );
}

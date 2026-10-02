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

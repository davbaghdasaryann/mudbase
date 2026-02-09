import React from 'react';
import { Box, Button, Typography } from '@mui/material';

const Footer: React.FC = () => {
    return (
        <Box
            component="footer"
            sx={{
                backgroundColor: '#07282C',
                py: 2,
                px: 4,
                mt: 'auto',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap', // allows stacking on small screens
                }}
            >
                <Typography variant="body2" color="textSecondary">
                    © {new Date().getFullYear()} © 2025 “Ունո Փարթներս ընդ Քո" ՍՊԸ
                </Typography>

                <Button
                    variant="contained"
                    size="large"
                    sx={{
                        mt: { xs: 1, sm: 0 }, // margin top only on small screens
                        bgcolor: '#00ABBE',
                        '&:hover': { bgcolor: '#008f7c' },
                        color: '#F5F7FA'
                    }}
                >
                    Գրանցվել հիմա
                </Button>
            </Box>
        </Box>
    );
};

export default Footer;

'use client';

import { Box, Typography, IconButton, Button, Divider } from '@mui/material';
import Image from 'next/image';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import TelegramIcon from '@mui/icons-material/Telegram';
import YouTubeIcon from '@mui/icons-material/YouTube';

const BG   = '#07282C';
const TEAL = '#00A390';

export default function Footer() {
    return (
        <Box component="footer" sx={{ backgroundColor: BG, pt: { xs: 4, md: 5 }, pb: 0 }}>
            <Box sx={{
                maxWidth: 1100,
                mx: 'auto',
                px: { xs: 3, md: 6 },
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: { xs: 6, md: 5 },
                pb: { xs: 4, md: 5 },
            }}>

                {/* Col 1: Logo + description */}
                <Box sx={{ flex: '0 0 auto', width: { xs: '100%', md: '28%' } }}>
                    <Box sx={{ mb: 2.5 }}>
                        <Image src="/images/logo_square.svg" alt="Mudbase" width={110} height={38} style={{ objectFit: 'contain', objectPosition: 'left' }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, maxWidth: 260 }}>
                        Շինարարական աշխատանքների արժեքի հաշվարկման եվ վերլուծման էլեկտրոնային համակարգ
                    </Typography>
                </Box>

                {/* Col 2: Navigation */}
                <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.14em', color: TEAL, textTransform: 'uppercase', mb: 2.5 }}>
                        Նավիգացիա
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {['Գործիքներ', 'Բաժանանորդագրություն', 'Կոնտակտներ'].map((link) => (
                            <Typography key={link} component="a" href="#" sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)', textDecoration: 'none', '&:hover': { color: '#fff' } }}>
                                {link}
                            </Typography>
                        ))}
                    </Box>
                </Box>

                {/* Col 3: Legal */}
                <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.14em', color: '#00ABBE', textTransform: 'uppercase', mb: 2.5 }}>
                        Իրավական
                    </Typography>
                    <Typography component="a" href="#" sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)', textDecoration: 'none', '&:hover': { color: '#fff' } }}>
                        Գաղտնիության կաղակականության
                    </Typography>
                </Box>

                {/* Col 4: Contact + social + CTA */}
                <Box sx={{ flex: '0 0 auto', width: { xs: '100%', md: '22%' } }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.14em', color: '#FFFFFF', textTransform: 'uppercase', mb: 2.5 }}>
                        Կապ մեզ հետ
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
                        {[InstagramIcon, FacebookIcon, TelegramIcon, YouTubeIcon].map((Icon, i) => (
                            <IconButton key={i} size="small" sx={{
                                backgroundColor: 'rgba(255,255,255,0.07)',
                                color: 'rgba(255,255,255,0.7)',
                                width: 34, height: 34,
                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.14)', color: '#fff' },
                            }}>
                                <Icon sx={{ fontSize: 17 }} />
                            </IconButton>
                        ))}
                    </Box>
                    <Button variant="contained" href="/register" sx={{ width: '160px',
                        backgroundColor: TEAL,
                        color: '#fff',
                        fontWeight: 500,
                        fontSize: '0.78rem',
                        letterSpacing: '0.08em',
                        borderRadius: '8px',
                        py: '7px',
                        boxShadow: 'none',
                        textTransform: 'none',
                        '&:hover': { backgroundColor: '#00897a', boxShadow: 'none' },
                    }}>
                        Գրանցվել →
                    </Button>
                </Box>
            </Box>

            {/* Copyright */}
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)' }} />
            <Box sx={{ py: 2.5, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>
                    © 2026 &quot;Ունո Փարթներս Էնդ Քո&quot; ՍՊԸ
                </Typography>
            </Box>
        </Box>
    );
}

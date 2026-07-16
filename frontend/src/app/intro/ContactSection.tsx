'use client';

import { Box, Typography, TextField, Button } from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import { ElementType } from 'react';

const TEAL = '#00A390';
const ICON_BG = 'rgba(0,163,144,0.09)';

const CONTACTS: { Icon: ElementType; label: string; value: string }[] = [
    { Icon: EmailOutlinedIcon,      label: 'Էլ. հաշե',   value: 'info@mudbase.am' },
    { Icon: LocationOnOutlinedIcon, label: 'Հաշե',  value: 'Yerevan, Armenia' },
    { Icon: PhoneOutlinedIcon,      label: 'տելեփոն',  value: '+374 (10) 55-00-55' },
];

const inputSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '10px',
        fontSize: '0.875rem',
        '& fieldset': { borderColor: '#e2e8f0' },
        '&:hover fieldset': { borderColor: '#b2d8de' },
        '&.Mui-focused fieldset': { borderColor: TEAL, borderWidth: 1.5 },
    },
    '& .MuiInputLabel-root': {
        fontSize: '0.68rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        color: '#94a3ac',
        textTransform: 'uppercase',
    },
    '& .MuiInputLabel-root.Mui-focused': { color: TEAL },
};

export default function ContactSection() {
    return (
        <Box sx={{
            py: { xs: 8, md: 12 },
            px: { xs: 3, md: 8 },
            backgroundColor: '#fff',
            display: 'flex',
            justifyContent: 'center',
        }}>
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: { xs: 6, md: 8 },
                width: '100%',
                maxWidth: 1060,
                alignItems: { xs: 'flex-start', md: 'flex-start' },
            }}>

                {/* ── LEFT COLUMN ── */}
                <Box sx={{ flex: '0 0 auto', width: { xs: '100%', md: '42%' } }}>
                    {/* Pill badge */}
                    <Box sx={{
                        display: 'inline-block',
                        backgroundColor: 'rgba(0,163,144,0.07)',
                        border: '1px solid rgba(0,163,144,0.18)',
                        borderRadius: '100px',
                        px: 2, py: 0.55, mb: 2.5,
                    }}>
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.13em', color: TEAL, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                            Հետադարձ կապ
                        </Typography>
                    </Box>

                    {/* Heading */}
                    <Typography sx={{ fontWeight: 700, fontSize: { xs: '1.7rem', md: '2.1rem' }, color: '#1a2e35', lineHeight: 1.25, mb: 2 }}>
                        Ունեք՞ հարծեր:<br />Պատրասուն ենք աջակցել
                    </Typography>

                    {/* Description */}
                    <Typography sx={{ fontSize: '0.9rem', color: '#7a9098', lineHeight: 1.7, mb: 4 }}>
                        Մեր տիմակ սիրով կպատասխանենք Ձեր հարծերնին համակարգի եվ API ինտեգրման.
                    </Typography>

                    {/* Contact items */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {CONTACTS.map(({ Icon, label, value }, i) => (
                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: '50%',
                                    backgroundColor: ICON_BG,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <Icon sx={{ fontSize: 18, color: TEAL }} />
                                </Box>
                                <Box>
                                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: '#94a3ac', textTransform: 'uppercase', mb: 0.25 }}>
                                        {label}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#1a2e35' }}>
                                        {value}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* ── RIGHT COLUMN — form card ── */}
                <Box sx={{
                    flex: 1,
                    backgroundColor: '#fff',
                    borderRadius: '20px',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 2px 12px rgba(0,0,0,0.04)',
                    p: { xs: 3, md: 5 },
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                }}>
                    {/* Name + Email row */}
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                        <TextField
                            label='Անուն Ազգանուն'
                            placeholder='JOHN DOE'
                            fullWidth
                            size='medium'
                            InputLabelProps={{ shrink: true }}
                            sx={{...inputSx}}
                        />
                        <TextField
                            label='Էլ. Հաշե'
                            placeholder='johndoe@example.com'
                            fullWidth
                            size='medium'
                            InputLabelProps={{ shrink: true }}
                            sx={{...inputSx}}
                        />
                    </Box>

                    {/* Subject */}
                    <TextField
                        label='Թեմա'
                        placeholder=''
                        fullWidth
                        size='small'
                        InputLabelProps={{ shrink: true }}
                        sx={{...inputSx}}
                    />

                    {/* Message */}
                    <TextField
                        label='Հաղորդագրություն'
                        placeholder=''
                        fullWidth
                        multiline
                        rows={9}
                        InputLabelProps={{ shrink: true }}
                        sx={{
                            ...inputSx,
                            '& .MuiOutlinedInput-root': {
                                ...inputSx['& .MuiOutlinedInput-root'],
                                alignItems: 'flex-start',
                            },
                        }}
                    />

                    {/* Send button */}
                    <Button
                        variant='contained'
                        fullWidth
                        sx={{
                            backgroundColor: TEAL,
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            borderRadius: '10px',
                            py: 1.5,
                            boxShadow: 'none',
                            '&:hover': { backgroundColor: '#00897a', boxShadow: 'none' },
                        }}
                    >
                        Ողարկել
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}

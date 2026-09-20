'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Stack, Typography } from '@mui/material';
import ExtensionIcon from '@mui/icons-material/Extension';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import ImgElement from '@/tsui/DomElements/ImgElement';
import { mainPrimaryColor } from '@/theme';

const cards = [
    { key: 'By Market Value',           gradientId: 'comparativeGradientGreen' },
    { key: 'By Submitted Estimations',  gradientId: 'comparativeGradientBlue'  },
    { key: 'By Base Proposals',         gradientId: 'comparativeGradientTeal'  },
];

interface Props {
    open: boolean;
    onClose: () => void;
    onSelect: (key: string) => void;
}

export default function ComparativeCreateDialog({ open, onClose, onSelect }: Props) {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ pb: 2 }}>
                <Stack direction='row' alignItems='center' sx={{ position: 'relative' }}>
                    <ImgElement src='/images/mudbase_header_title.svg' sx={{ height: 28 }} />
                    <Typography variant='h6' sx={{ fontWeight: 600, position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                        {t('Create')}
                    </Typography>
                </Stack>
            </DialogTitle>

            <DialogContent dividers sx={{ px: 3, py: 3 }}>
                <Stack direction='row' spacing={3} flexWrap='wrap' useFlexGap justifyContent='center'>
                    {cards.map((card) => (
                        <Box
                            key={card.key}
                            role='button'
                            tabIndex={0}
                            onClick={() => { onSelect(card.key); onClose(); }}
                            sx={{
                                position: 'relative',
                                width: 180,
                                minHeight: 160,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1.5,
                                px: 2,
                                py: 3,
                                cursor: 'pointer',
                                borderRadius: 3,
                                background: 'rgba(255,255,255,0.55)',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255,255,255,0.4)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
                                    borderColor: mainPrimaryColor,
                                },
                            }}
                        >
                            <AddIcon sx={{ position: 'absolute', top: 12, left: 12, fontSize: 20, color: 'text.primary' }} />
                            <ExtensionIcon sx={{ fontSize: 56, fill: `url(#${card.gradientId})` }} />
                            <Typography variant='body2' align='center' sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {t(card.key)}
                            </Typography>
                        </Box>
                    ))}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} sx={{ color: mainPrimaryColor, fontWeight: 600 }}>
                    {t('Cancel')}
                </Button>
            </DialogActions>

            {/* SVG gradient defs */}
            <Box component='svg' width={0} height={0} sx={{ position: 'absolute' }}>
                <defs>
                    <linearGradient id='comparativeGradientGreen' x1='0%' y1='0%' x2='100%' y2='100%'>
                        <stop offset='0%' stopColor='#2ECC71' /><stop offset='100%' stopColor='#1CA461' />
                    </linearGradient>
                    <linearGradient id='comparativeGradientBlue' x1='0%' y1='0%' x2='100%' y2='100%'>
                        <stop offset='0%' stopColor='#29B6F6' /><stop offset='100%' stopColor='#0288D1' />
                    </linearGradient>
                    <linearGradient id='comparativeGradientTeal' x1='0%' y1='0%' x2='100%' y2='100%'>
                        <stop offset='0%' stopColor='#1CA461' /><stop offset='100%' stopColor='#00ABBE' />
                    </linearGradient>
                </defs>
            </Box>
        </Dialog>
    );
}

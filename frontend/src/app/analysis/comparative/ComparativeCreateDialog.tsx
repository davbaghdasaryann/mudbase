'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Stack, Typography } from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import InputIcon from '@mui/icons-material/Input';
import { useTranslation } from 'react-i18next';
import ImgElement from '@/tsui/DomElements/ImgElement';
import { mainPrimaryColor } from '@/theme';

const cards = [
    { key: 'By Market Value',          icon: ShowChartIcon,      color: '#00ABBE' },
    { key: 'By Submitted Estimations', icon: FactCheckIcon,      color: '#1CA461' },
    { key: 'By Base Proposals',        icon: AccountBalanceIcon, color: '#0288D1' },
    { key: 'By Entered Data',          label: 'Ըստ մուտքագրված տվյալների', icon: InputIcon, color: '#E67E22' },
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
                    {cards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <Box
                                key={card.key}
                                role='button'
                                tabIndex={0}
                                onClick={() => { onSelect(card.key); onClose(); }}
                                sx={{
                                    width: 180,
                                    minHeight: 160,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 2,
                                    px: 2,
                                    py: 3,
                                    cursor: 'pointer',
                                    borderRadius: 3,
                                    border: '1.5px solid rgba(0,0,0,0.10)',
                                    background: '#fff',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.15s',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: `0 8px 24px ${card.color}22`,
                                        borderColor: card.color,
                                        background: `${card.color}08`,
                                    },
                                    '&:hover .ci': { opacity: 1 },
                                }}
                            >
                                <Box className='ci' sx={{
                                    width: 56, height: 56,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: 2,
                                    bgcolor: `${card.color}14`,
                                    opacity: 0.55,
                                    transition: 'opacity 0.2s ease',
                                }}>
                                    <Icon sx={{ fontSize: 30, color: card.color }} />
                                </Box>
                                <Typography variant='body2' align='center' sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}>
                                    {card.label ?? t(card.key)}
                                </Typography>
                            </Box>
                        );
                    })}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} sx={{ color: mainPrimaryColor, fontWeight: 600 }}>
                    {t('Cancel')}
                </Button>
            </DialogActions>

        </Dialog>
    );
}

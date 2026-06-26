'use client';

import { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Stack, Stepper, Step, StepLabel,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ForestIcon from '@mui/icons-material/Forest';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SummarizeIcon from '@mui/icons-material/Summarize';
import { useTranslation } from 'react-i18next';
import ImgElement from '@/tsui/DomElements/ImgElement';
import { mainPrimaryColor } from '@/theme';

export type ChronologicalSourceType = 'work_repository' | 'materials_repository' | 'list_of_estimates' | 'consolidated_estimates';

interface Props {
    open: boolean;
    onClose: () => void;
    onContinue: (type: ChronologicalSourceType) => void;
}

const STEPS = ['Source', 'Select Item', 'Date Range'];

const OPTIONS: { type: ChronologicalSourceType; icon: React.ReactNode; titleKey: string; descKey: string }[] = [
    {
        type: 'work_repository',
        icon: <MenuBookIcon sx={{ fontSize: 28, color: '#00ABBE' }} />,
        titleKey: 'Labors catalog',
        descKey: 'Shows the list of available works in the catalog',
    },
    {
        type: 'materials_repository',
        icon: <ForestIcon sx={{ fontSize: 28, color: '#00ABBE' }} />,
        titleKey: 'Materials Catalog',
        descKey: 'Shows the list of available materials in the catalog',
    },
    {
        type: 'list_of_estimates',
        icon: <ListAltIcon sx={{ fontSize: 28, color: '#00ABBE' }} />,
        titleKey: 'Estimations List',
        descKey: 'Shows the list of estimates created by you',
    },
    {
        type: 'consolidated_estimates',
        icon: <SummarizeIcon sx={{ fontSize: 28, color: '#00ABBE' }} />,
        titleKey: 'Aggregated Catalog',
        descKey: 'Shows the list of consolidated estimates in the catalog',
    },
];

export default function ChronologicalCreateDialog({ open, onClose, onContinue }: Props) {
    const { t } = useTranslation();
    const [selected, setSelected] = useState<ChronologicalSourceType | null>(null);

    const handleCardClick = (type: ChronologicalSourceType) => {
        setSelected(type);
        onContinue(type);
    };

    const handleContinue = () => {
        if (selected) onContinue(selected);
    };

    const handleClose = () => {
        setSelected(null);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ pb: 2 }}>
                <Stack direction='row' alignItems='center' sx={{ position: 'relative' }}>
                    <ImgElement src='/images/mudbase_header_title.svg' sx={{ height: 28 }} />
                    <Typography variant='h6' sx={{ fontWeight: 600, position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                        {t('Create')}
                    </Typography>
                </Stack>
            </DialogTitle>

            <Box sx={{ px: 3, pt: 2, pb: 1 }}>
                <Stepper activeStep={0} alternativeLabel>
                    {STEPS.map((label) => (
                        <Step key={label}><StepLabel>{t(label)}</StepLabel></Step>
                    ))}
                </Stepper>
            </Box>

            <DialogContent dividers sx={{ px: 3, py: 2.5 }}>
                <Stack spacing={1.5}>
                    {OPTIONS.map((opt) => {
                        const isSelected = selected === opt.type;
                        return (
                            <Box
                                key={opt.type}
                                onClick={() => handleCardClick(opt.type)}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    px: 2.5,
                                    py: 1.75,
                                    border: '1.5px solid',
                                    borderColor: isSelected ? mainPrimaryColor : 'rgba(0,0,0,0.12)',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    backgroundColor: isSelected ? `${mainPrimaryColor}12` : '#fff',
                                    transition: 'border-color 0.15s, background-color 0.15s, box-shadow 0.15s',
                                    '&:hover': {
                                        borderColor: mainPrimaryColor,
                                        backgroundColor: `${mainPrimaryColor}08`,
                                        boxShadow: `0 2px 10px ${mainPrimaryColor}22`,
                                    },
                                }}
                            >
                                <Box sx={{
                                    width: 44,
                                    height: 44,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '8px',
                                    backgroundColor: isSelected ? `${mainPrimaryColor}20` : 'rgba(0,171,190,0.08)',
                                    flexShrink: 0,
                                }}>
                                    {opt.icon}
                                </Box>
                                <Box>
                                    <Typography variant='body1' sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                                        {t(opt.titleKey)}
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary' sx={{ mt: 0.25 }}>
                                        {t(opt.descKey)}
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    })}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button onClick={handleClose} sx={{ color: mainPrimaryColor, fontWeight: 600 }}>
                    {t('Cancel')}
                </Button>
                <Button
                    variant='contained'
                    disabled={!selected}
                    onClick={handleContinue}
                    sx={{ borderRadius: '20px', px: 3, backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: '#007a6e' } }}
                >
                    {t('Continue')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

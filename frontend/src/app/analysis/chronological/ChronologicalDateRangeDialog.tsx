'use client';

import { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Stack, IconButton, TextField,
    Stepper, Step, StepLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import ImgElement from '@/tsui/DomElements/ImgElement';
import { mainPrimaryColor } from '@/theme';

interface Props {
    open: boolean;
    itemName: string;
    onClose: () => void;
    onPrevious: () => void;
    onDone: (fromDate: string, toDate: string) => void;
}

const STEPS = ['Source', 'Select Item', 'Date Range'];
const TODAY = new Date().toISOString().slice(0, 10);
const FROM_DEFAULT = '2025-01-01';

export default function ChronologicalDateRangeDialog({ open, itemName, onClose, onPrevious, onDone }: Props) {
    const { t } = useTranslation();
    const [fromDate, setFromDate] = useState(FROM_DEFAULT);
    const [toDate, setToDate] = useState(TODAY);

    const handleDone = () => onDone(fromDate, toDate);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth='sm'
            fullWidth
            PaperProps={{ sx: { borderRadius: 2 } }}
        >
            <DialogTitle sx={{ pb: 1.5 }}>
                <Stack direction='row' alignItems='center' sx={{ position: 'relative' }}>
                    <ImgElement src='/images/mudbase_header_title.svg' sx={{ height: 28 }} />
                    <Typography
                        variant='h6'
                        sx={{
                            fontWeight: 600,
                            position: 'absolute',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            whiteSpace: 'nowrap',
                            maxWidth: '55%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {itemName}
                    </Typography>
                    <Box sx={{ ml: 'auto' }}>
                        <IconButton size='small' onClick={onClose} sx={{ color: 'text.secondary' }}>
                            <CloseIcon fontSize='small' />
                        </IconButton>
                    </Box>
                </Stack>
            </DialogTitle>

            <Box sx={{ px: 3, pt: 2, pb: 1 }}>
                <Stepper activeStep={2} alternativeLabel>
                    {STEPS.map((label) => (
                        <Step key={label}><StepLabel>{t(label)}</StepLabel></Step>
                    ))}
                </Stepper>
            </Box>

            <DialogContent sx={{ pt: 3, pb: 2 }}>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 2.5 }}>
                    {t('Select the date range for analysis')}
                </Typography>
                <Stack direction='row' spacing={2}>
                    <TextField
                        type='date'
                        label={t('From')}
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        inputProps={{ min: '2023-01-01', max: TODAY }}
                        slotProps={{ inputLabel: { shrink: true } }}
                        fullWidth
                    />
                    <TextField
                        type='date'
                        label={t('To')}
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        inputProps={{ min: '2023-01-01', max: TODAY }}
                        slotProps={{ inputLabel: { shrink: true } }}
                        fullWidth
                    />
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, justifyContent: 'flex-end', gap: 1 }}>
                <Button onClick={onPrevious} sx={{ color: mainPrimaryColor, fontWeight: 600 }}>
                    {t('Previous')}
                </Button>
                <Button
                    variant='contained'
                    onClick={handleDone}
                    sx={{ borderRadius: '20px', px: 3, backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: '#007a6e' } }}
                >
                    {t('Done')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

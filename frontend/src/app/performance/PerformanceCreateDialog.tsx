'use client';

import { useEffect, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Stack, CircularProgress, Radio,
    Table, TableHead, TableBody, TableRow, TableCell, TextField,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import ImgElement from '@/tsui/DomElements/ImgElement';
import { mainPrimaryColor } from '@/theme';
import { formatDate } from '@/lib/format_date';
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';

interface Props {
    open: boolean;
    onClose: () => void;
    onSelect: (estimate: EstimatesApi.ApiEstimate, dateFrom: string, dateTo: string) => void;
}

type Step = 'dates' | 'estimation';

export default function PerformanceCreateDialog({ open, onClose, onSelect }: Props) {
    const { t } = useTranslation();
    const [step, setStep] = useState<Step>('dates');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [estimates, setEstimates] = useState<EstimatesApi.ApiEstimate[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        if (!open) { setStep('dates'); setSelectedId(null); setDateFrom(''); setDateTo(''); return; }
    }, [open]);

    const handleContinue = () => {
        setLoading(true);
        setSelectedId(null);
        Api.requestSession<EstimatesApi.ApiEstimate[]>({
            command: 'estimates/fetch',
            args: { searchVal: 'empty' },
        }).then(data => {
            setEstimates(data ?? []);
            setLoading(false);
            setStep('estimation');
        }).catch(() => setLoading(false));
    };

    const selectedEstimate = estimates.find(e => e._id === selectedId);
    const datesValid = dateFrom && dateTo && dateFrom <= dateTo;

    return (
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ pb: 2 }}>
                <Stack direction='row' alignItems='center' sx={{ position: 'relative' }}>
                    <ImgElement src='/images/mudbase_header_title.svg' sx={{ height: 28 }} />
                    <Typography variant='h6' sx={{ fontWeight: 600, position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                        {step === 'dates' ? t('Choose Date Range') : t('Choose an Estimation')}
                    </Typography>
                </Stack>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3 }}>
                {step === 'dates' && (
                    <Box sx={{ display: 'flex', gap: 3, pt: 1 }}>
                        <TextField
                            label={t('From')}
                            type='date'
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                        <TextField
                            label={t('To')}
                            type='date'
                            value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: dateFrom }}
                            fullWidth
                        />
                    </Box>
                )}

                {step === 'estimation' && (
                    loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                            <CircularProgress size={32} />
                        </Box>
                    ) : (
                        <Table sx={{ mt: -1 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, width: 60 }}>{t('No.')}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{t('Name')}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Date of Creation')}</TableCell>
                                    <TableCell sx={{ width: 48 }} />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {estimates.map((estimate, index) => (
                                    <TableRow
                                        key={estimate._id}
                                        onClick={() => setSelectedId(estimate._id)}
                                        hover
                                        sx={{
                                            cursor: 'pointer',
                                            backgroundColor: selectedId === estimate._id
                                                ? `${mainPrimaryColor}22`
                                                : index % 2 === 1 ? '#F5F5F5' : '#ffffff',
                                            '&.MuiTableRow-hover:hover': { backgroundColor: `${mainPrimaryColor}15 !important` },
                                        }}
                                    >
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{estimate.name}</TableCell>
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(estimate.createdAt)}</TableCell>
                                        <TableCell align='right' sx={{ pr: 1 }}>
                                            <Radio
                                                checked={selectedId === estimate._id}
                                                onChange={() => setSelectedId(estimate._id)}
                                                size='small'
                                                sx={{ color: mainPrimaryColor, '&.Mui-checked': { color: mainPrimaryColor } }}
                                                onClick={e => e.stopPropagation()}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                {step === 'dates' && <>
                    <Button onClick={onClose} sx={{ color: mainPrimaryColor, fontWeight: 600 }}>{t('Cancel')}</Button>
                    <Button
                        variant='contained'
                        disabled={!datesValid}
                        onClick={handleContinue}
                        sx={{ borderRadius: '20px', px: 3, backgroundColor: mainPrimaryColor }}
                    >
                        {t('Continue')}
                    </Button>
                </>}
                {step === 'estimation' && <>
                    <Button onClick={() => setStep('dates')} sx={{ color: mainPrimaryColor, fontWeight: 600 }}>{t('Back')}</Button>
                    <Button
                        variant='contained'
                        disabled={!selectedEstimate}
                        onClick={() => selectedEstimate && onSelect(selectedEstimate, dateFrom, dateTo)}
                        sx={{ borderRadius: '20px', px: 3, backgroundColor: mainPrimaryColor }}
                    >
                        {t('Select')}
                    </Button>
                </>}
            </DialogActions>
        </Dialog>
    );
}

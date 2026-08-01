'use client';

import React, { useEffect, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, InputBase, Table, TableHead, TableBody,
    TableRow, TableCell, Radio, CircularProgress,
} from '@mui/material';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from 'react-i18next';
import { mainPrimaryColor } from '@/theme';
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';
import { formatDate } from '@/lib/format_date';
import { type CostHistoryEntry } from './page';

interface Props {
    open: boolean;
    onClose: () => void;
    onCostAdded: (entry: CostHistoryEntry) => void;
}

const INPUT_SX = { border: '1px solid #e0f5f7', borderRadius: 1.5, px: 1.5, py: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, cursor: 'text' };

function Field({ label, value, onChange, autoFocus }: { label: string; value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
    const ref = React.useRef<HTMLInputElement>(null);
    return (
        <Box sx={INPUT_SX} onClick={() => ref.current?.focus()}>
            <Typography sx={{ fontSize: '0.85rem', color: '#555', flex: 1 }}>{label}</Typography>
            <InputBase autoFocus={autoFocus} value={value} inputRef={ref}
                onChange={ev => onChange(ev.target.value)}
                placeholder='—'
                inputProps={{ style: { textAlign: 'right', width: 130, padding: 0, fontSize: '0.92rem', fontWeight: 600, color: '#333' } }}
            />
        </Box>
    );
}

function NumField({ label, value, onChange, suffix }: { label: string; value: string; onChange: (v: string) => void; suffix?: string }) {
    const ref = React.useRef<HTMLInputElement>(null);
    return (
        <Box sx={INPUT_SX} onClick={() => ref.current?.focus()}>
            <Typography sx={{ fontSize: '0.85rem', color: '#555', flex: 1 }}>{label}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <InputBase value={value} inputRef={ref}
                    onChange={ev => onChange(ev.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder='0'
                    inputProps={{ style: { textAlign: 'right', width: 110, padding: 0, fontSize: '0.92rem', fontWeight: 600, color: '#333' } }}
                />
                {suffix && <Typography sx={{ fontSize: '0.78rem', color: '#aaa' }}>{suffix}</Typography>}
            </Box>
        </Box>
    );
}

export default function UnforeseenDialog({ open, onClose, onCostAdded }: Props) {
    const { t } = useTranslation();
    const [step, setStep] = useState<'choose' | 'form'>('choose');
    const [estimates, setEstimates] = useState<EstimatesApi.ApiEstimate[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedEstimate, setSelectedEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);

    const [workName, setWorkName] = useState('');
    const [qty, setQty] = useState('');
    const [unitPrice, setUnitPrice] = useState('');

    useEffect(() => {
        if (!open) return;
        setStep('choose');
        setSelectedEstimate(null);
        setWorkName(''); setQty(''); setUnitPrice('');
        setLoading(true);
        Api.requestSession<EstimatesApi.ApiEstimate[]>({
            command: 'estimates/fetch',
            args: { searchVal: 'empty' },
        }).then(data => {
            const filtered = (data ?? []).filter(e =>
                Array.isArray(e.otherExpenses) &&
                e.otherExpenses.some(exp => 'unforeseenWorks' in exp && (exp as any).unforeseenWorks > 0)
            );
            setEstimates(filtered);
        }).catch(() => setEstimates([])).finally(() => setLoading(false));
    }, [open]);

    const n_qty = parseFloat(qty.replace(',', '.')) || 0;
    const n_price = parseFloat(unitPrice.replace(',', '.')) || 0;
    const total = n_qty * n_price;
    const canAdd = workName.trim().length > 0 && total > 0;

    const handleClose = () => {
        setStep('choose'); setSelectedEstimate(null);
        setWorkName(''); setQty(''); setUnitPrice('');
        onClose();
    };

    const handleAdd = () => {
        if (!canAdd) return;
        onCostAdded({
            id: String(Date.now() + Math.random()),
            workName: workName.trim(),
            unit: '',
            quantity: n_qty,
            unitPrice: n_price,
            total,
            addedAt: new Date(),
            paymentMethod: 'unforeseen',
            note: selectedEstimate ? selectedEstimate.name : undefined,
        });
        handleClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth={step === 'choose' ? 'md' : 'xs'} fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, color: mainPrimaryColor, pb: 1 }}>
                {step === 'form' && (
                    <Box component='span' onClick={() => setStep('choose')} sx={{ cursor: 'pointer', display: 'flex', mr: 0.5 }}>
                        <ArrowBackIcon sx={{ fontSize: 20, color: '#888' }} />
                    </Box>
                )}
                <ReportProblemOutlinedIcon sx={{ fontSize: 22 }} />
                {t('Unforeseen Works')}
            </DialogTitle>

            {step === 'choose' && (
                <>
                    <DialogContent sx={{ p: 0, pt: 1, pl: 3 }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                <CircularProgress size={28} sx={{ color: mainPrimaryColor }} />
                            </Box>
                        ) : estimates.length === 0 ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
                                <Typography variant='body2' color='text.secondary'>{t('No estimations with unforeseen works')}</Typography>
                            </Box>
                        ) : (
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, width: 60 }}>{t('No.')}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{t('Name')}</TableCell>
                                        <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Date of Creation')}</TableCell>
                                        <TableCell sx={{ width: 48 }} />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {estimates.map((est, index) => (
                                        <TableRow
                                            key={est._id}
                                            onClick={() => setSelectedEstimate(est)}
                                            hover
                                            sx={{
                                                cursor: 'pointer',
                                                backgroundColor: selectedEstimate?._id === est._id ? `${mainPrimaryColor}22` : index % 2 === 1 ? '#F5F5F5' : '#ffffff',
                                                '&.MuiTableRow-hover:hover': { backgroundColor: `${mainPrimaryColor}15 !important` },
                                            }}
                                        >
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{est.name}</TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(est.createdAt)}</TableCell>
                                            <TableCell align='right' sx={{ pr: 1 }}>
                                                <Radio
                                                    checked={selectedEstimate?._id === est._id}
                                                    onChange={() => setSelectedEstimate(est)}
                                                    size='small'
                                                    sx={{ color: mainPrimaryColor, '&.Mui-checked': { color: mainPrimaryColor } }}
                                                    onClick={e => e.stopPropagation()}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                        <Button onClick={handleClose} sx={{ borderRadius: '20px', color: '#888' }}>{t('Cancel')}</Button>
                        <Button variant='contained' disabled={!selectedEstimate}
                            onClick={() => setStep('form')}
                            sx={{ borderRadius: '20px', backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: '#009aab' } }}>
                            {t('Select')}
                        </Button>
                    </DialogActions>
                </>
            )}

            {step === 'form' && (
                <>
                    <DialogContent sx={{ pt: 1 }}>
                        {selectedEstimate && (
                            <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 1.5, px: 0.5 }}>
                                {selectedEstimate.name}
                            </Typography>
                        )}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                            <Field autoFocus label='Աշխատանքի անվանումը' value={workName} onChange={setWorkName} />
                            <NumField label='Քանակը' value={qty} onChange={setQty} />
                            <NumField label='Միավորի արժեք' value={unitPrice} onChange={setUnitPrice} suffix='AMD' />
                            {total > 0 && (
                                <Typography sx={{ fontSize: '0.8rem', color: '#555', px: 0.5 }}>
                                    Ընդհանուր արժեք: <strong style={{ color: mainPrimaryColor }}>{total.toLocaleString(undefined, { maximumFractionDigits: 0 })} AMD</strong>
                                </Typography>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                        <Button onClick={handleClose} sx={{ borderRadius: '20px', color: '#888' }}>Կնքել</Button>
                        <Button variant='contained' onClick={handleAdd} disabled={!canAdd}
                            sx={{ borderRadius: '20px', backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: '#009aab' } }}>
                            Ավելացնել
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
}

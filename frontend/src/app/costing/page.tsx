'use client';

import { useState } from 'react';
import {
    Box, Button, Tab, Typography, Table, TableHead, TableBody, TableRow, TableCell,
    Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip,
    InputBase, Radio, RadioGroup, FormControlLabel, TextField, Chip,
} from '@mui/material';
import { TabContext, TabList } from '@mui/lab';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import ChooseEstimationDialog from '@/app/analysis/structural/ChooseEstimationDialog';
import CostingTable from './CostingTable';
import { mainPrimaryColor } from '@/theme';
import * as EstimatesApi from '@/api/estimate';
import { formatCurrencyRounded } from '@/lib/format_currency';

export interface SectionRow {
    id: string;
    description: string;
    quantity: string;
    unitPrice: string;
}

export interface CostHistoryEntry {
    id: string;
    workName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    total: number;
    addedAt: Date;
    contractor?: string;
    isSubcontractor?: boolean;
    note?: string;
    paymentMethod?: string;
    paymentValue?: string;
    laborRows?: SectionRow[];
    mechanismRows?: SectionRow[];
    materialRows?: SectionRow[];
}

const outlinedCreateSx = {
    borderRadius: '25px',
    height: '40px',
    mt: 1,
    '&:hover': { backgroundColor: mainPrimaryColor, color: '#ffffff', borderColor: mainPrimaryColor },
};

type TabValue = 'main' | 'history';

const newRow = (): SectionRow => ({ id: String(Date.now() + Math.random()), description: '', quantity: '', unitPrice: '' });

// Informative detail row — label left, content right, with bottom border
function DetailRow({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 40, gap: 3, borderBottom: last ? 'none' : '1px solid #eef0f3' }}>
            <Typography sx={{ fontSize: '0.78rem', color: '#999', width: 160, flexShrink: 0 }}>{label}</Typography>
            <Box sx={{ flex: 1 }}>{children}</Box>
        </Box>
    );
}

const calcTotal = (rows: SectionRow[]) =>
    rows.reduce((s, r) => s + (parseFloat(r.quantity.replace(',', '.')) || 0) * (parseFloat(r.unitPrice.replace(',', '.')) || 0), 0);

interface SectionBlockProps {
    num: number;
    title: string;
    rows: SectionRow[];
    onChange: (rows: SectionRow[]) => void;
    onPlusClick?: () => void;
    descLabel?: string;
    disabled?: boolean;
    last?: boolean;
}

function SectionBlock({ num, title, rows, onChange, onPlusClick, descLabel, disabled, last }: SectionBlockProps) {
    const { t } = useTranslation();
    const addRow = () => onChange([...rows, newRow()]);
    const updateRow = (id: string, field: keyof SectionRow, val: string) =>
        onChange(rows.map(r => r.id === id ? { ...r, [field]: val } : r));
    const removeRow = (id: string) => onChange(rows.filter(r => r.id !== id));
    const secTotal = calcTotal(rows);
    const colLabel = descLabel ?? t('Description of Work');

    return (
        <Box sx={{ opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? 'none' : 'auto', borderBottom: last ? 'none' : '1px solid #eef0f3', py: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 40, background: 'linear-gradient(90deg, rgba(0,171,190,0.07) 0%, rgba(0,171,190,0.02) 100%)', borderRadius: 1.5, px: 1.5, mb: rows.length > 0 ? 0.75 : 0 }}>
                <Box sx={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: 'rgba(0,171,190,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5, flexShrink: 0 }}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: mainPrimaryColor, lineHeight: 1 }}>{num}</Typography>
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#111', flex: 1 }}>{title}</Typography>
                {secTotal > 0 && (
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: mainPrimaryColor, mr: 0.5 }}>{formatCurrencyRounded(secTotal)} AMD</Typography>
                )}
                <IconButton size='small' onClick={onPlusClick ?? addRow} sx={{ color: mainPrimaryColor }}>
                    <AddCircleOutlineIcon fontSize='small' />
                </IconButton>
            </Box>
            {rows.length > 0 && (
                <Box sx={{ border: '1px solid #eaedf0', borderRadius: 1.5, overflow: 'hidden', mb: 0.75 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 68px 118px 28px', backgroundColor: '#f7f9fa', px: 1.5, py: 0.6 }}>
                        {[colLabel, t('Qty'), t('Unit Price'), ''].map((h, i) => (
                            <Typography key={i} sx={{ fontSize: '0.69rem', fontWeight: 700, color: '#888', textAlign: i === 0 ? 'left' : i < 3 ? 'right' : 'center', whiteSpace: 'nowrap', letterSpacing: '0.02em', textTransform: 'uppercase' }}>{h}</Typography>
                        ))}
                    </Box>
                    {rows.map((row, idx) => (
                        <Box key={row.id} sx={{ display: 'grid', gridTemplateColumns: '1fr 68px 118px 28px', borderTop: '1px solid #f0f2f4', px: 1.5, py: 0.4, alignItems: 'center', backgroundColor: idx % 2 === 1 ? '#fafafa' : '#fff', '&:hover': { backgroundColor: '#f4fbfc' } }}>
                            <InputBase
                                value={row.description}
                                onChange={e => updateRow(row.id, 'description', e.target.value)}
                                placeholder='—'
                                sx={{ fontSize: '0.81rem', color: '#333', '& input': { p: 0, pr: 1 } }}
                            />
                            <InputBase
                                value={row.quantity}
                                onChange={e => updateRow(row.id, 'quantity', e.target.value)}
                                placeholder='0'
                                inputProps={{ style: { textAlign: 'right', padding: 0, paddingRight: 6 } }}
                                sx={{ fontSize: '0.81rem', color: '#333' }}
                            />
                            <InputBase
                                value={row.unitPrice}
                                onChange={e => updateRow(row.id, 'unitPrice', e.target.value)}
                                placeholder='0'
                                inputProps={{ style: { textAlign: 'right', padding: 0, paddingRight: 6 } }}
                                sx={{ fontSize: '0.81rem', color: '#333' }}
                            />
                            <IconButton size='small' onClick={() => removeRow(row.id)} sx={{ p: 0.25, color: '#ccc', '&:hover': { color: '#e53935' } }}>
                                <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}

export default function CostingPage() {
    const { t } = useTranslation();
    const [tab, setTab] = useState<TabValue>('main');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedEstimate, setSelectedEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);
    const [costHistory, setCostHistory] = useState<CostHistoryEntry[]>([]);

    // Details modal state
    const [editEntry, setEditEntry] = useState<CostHistoryEntry | null>(null);
    const [editUnit, setEditUnit] = useState('');
    const [editQuantityStr, setEditQuantityStr] = useState('');
    const [editIsSubcontractor, setEditIsSubcontractor] = useState(false);
    const [editNote, setEditNote] = useState('');
    const [editPaymentMethod, setEditPaymentMethod] = useState('');
    const [editPaymentValue, setEditPaymentValue] = useState('');
    const [editLaborRows, setEditLaborRows] = useState<SectionRow[]>([]);
    const [editMechanismRows, setEditMechanismRows] = useState<SectionRow[]>([]);
    const [editMaterialRows, setEditMaterialRows] = useState<SectionRow[]>([]);

    // Payment method modal
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [tempPaymentMethod, setTempPaymentMethod] = useState('');
    const [tempPaymentValue, setTempPaymentValue] = useState('');

    const handleSelect = (estimate: EstimatesApi.ApiEstimate) => {
        setDialogOpen(false);
        setSelectedEstimate(estimate);
    };

    const handleCostAdded = (entry: CostHistoryEntry) => {
        setCostHistory(prev => [entry, ...prev]);
    };

    const openEditModal = (entry: CostHistoryEntry) => {
        setEditEntry(entry);
        setEditUnit(entry.unit);
        setEditQuantityStr(String(entry.quantity));
        setEditIsSubcontractor(entry.isSubcontractor ?? false);
        setEditNote(entry.note ?? '');
        setEditPaymentMethod(entry.paymentMethod ?? '');
        setEditPaymentValue(entry.paymentValue ?? '');
        setEditLaborRows(entry.laborRows ?? []);
        setEditMechanismRows(entry.mechanismRows ?? []);
        setEditMaterialRows(entry.materialRows ?? []);
    };

    const handleEditSave = () => {
        if (!editEntry) return;
        const qty = parseFloat(editQuantityStr.replace(',', '.')) || editEntry.quantity;
        setCostHistory(prev => prev.map(e =>
            e.id === editEntry.id
                ? { ...e, unit: editUnit, quantity: qty, isSubcontractor: editIsSubcontractor, note: editNote, paymentMethod: editPaymentMethod, paymentValue: editPaymentValue, laborRows: editLaborRows, mechanismRows: editMechanismRows, materialRows: editMaterialRows }
                : e
        ));
        setEditEntry(null);
    };

    const openPaymentModal = () => {
        setTempPaymentMethod(editPaymentMethod);
        setTempPaymentValue(editPaymentValue);
        setPaymentModalOpen(true);
    };

    const handlePaymentSave = () => {
        setEditPaymentMethod(tempPaymentMethod);
        setEditPaymentValue(tempPaymentValue);
        const row: SectionRow = { id: String(Date.now() + Math.random()), description: t(tempPaymentMethod), quantity: '', unitPrice: tempPaymentValue };
        setEditLaborRows(prev => [...prev, row]);
        setPaymentModalOpen(false);
    };

    return (
        <PageContents title='Costing'>
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

                <TabContext value={tab}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                        <TabList onChange={(_, v) => setTab(v as TabValue)}>
                            <Tab label={t('Main')} value='main' />
                            <Tab label={t('Costs History')} value='history' />
                        </TabList>
                    </Box>
                </TabContext>

                {tab === 'main' && (
                    <>
                        {!selectedEstimate && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2, pb: 8 }}>
                                <RequestQuoteOutlinedIcon sx={{ fontSize: 90, color: '#00ABBE', opacity: 0.25 }} />
                                <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>{t('No Costings created yet')}</Typography>
                                <PageButton variant='outlined' label='Create' size='large' sx={outlinedCreateSx} onClick={() => setDialogOpen(true)} />
                            </Box>
                        )}
                        {selectedEstimate && (
                            <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                                <Button startIcon={<ArrowBackIcon fontSize='small' />} size='small' onClick={() => setSelectedEstimate(null)}
                                    sx={{ color: 'text.secondary', pl: 0, mb: 1.5, '&:hover': { background: 'transparent', color: 'primary.main' } }}>
                                    {t('Back')}
                                </Button>
                                <Typography sx={{ fontWeight: 600, fontSize: '1.5rem', mb: 3 }}>{selectedEstimate.name}</Typography>
                                <CostingTable estimate={selectedEstimate} onCostAdded={handleCostAdded} />
                            </Box>
                        )}
                    </>
                )}

                {tab === 'history' && (
                    <>
                        {costHistory.length === 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2, pb: 8 }}>
                                <RequestQuoteOutlinedIcon sx={{ fontSize: 90, color: '#00ABBE', opacity: 0.25 }} />
                                <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>{t('No costs added yet')}</Typography>
                            </Box>
                        ) : (
                            <Box sx={{ overflow: 'auto' }}>
                                <Table size='small' sx={{ minWidth: 700 }}>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: '#f0fbfc' }}>
                                            <TableCell sx={{ fontWeight: 700, color: mainPrimaryColor }}>{t('Description of Work')}</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: mainPrimaryColor }}>{t('Unit')}</TableCell>
                                            <TableCell align='right' sx={{ fontWeight: 700, color: mainPrimaryColor }}>{t('Quantity')}</TableCell>
                                            <TableCell align='right' sx={{ fontWeight: 700, color: mainPrimaryColor }}>{t('Unit Price')}</TableCell>
                                            <TableCell align='right' sx={{ fontWeight: 700, color: mainPrimaryColor }}>{t('Total')}</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: mainPrimaryColor }}>{t('Date of Creation')}</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: mainPrimaryColor }}>{t('Contractor')}</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: mainPrimaryColor }}>{t('Note')}</TableCell>
                                            <TableCell sx={{ width: 40 }} />
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {costHistory.map(entry => (
                                            <TableRow key={entry.id} hover onDoubleClick={() => openEditModal(entry)} sx={{ cursor: 'pointer' }}>
                                                <TableCell>{entry.workName}</TableCell>
                                                <TableCell>{entry.unit}</TableCell>
                                                <TableCell align='right'>{entry.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                                                <TableCell align='right'>{formatCurrencyRounded(entry.unitPrice)}</TableCell>
                                                <TableCell align='right' sx={{ fontWeight: 600, color: mainPrimaryColor }}>{formatCurrencyRounded(entry.total)} AMD</TableCell>
                                                <TableCell sx={{ color: '#888', fontSize: '0.82rem' }}>{entry.addedAt.toLocaleDateString()}</TableCell>
                                                <TableCell sx={{ fontSize: '0.82rem' }}>
                                                    {entry.isSubcontractor
                                                        ? <Chip label={t('Subcontractor')} size='small' sx={{ fontSize: '0.72rem', height: 20, backgroundColor: '#fff3e0', color: '#e65100' }} />
                                                        : <span style={{ color: entry.contractor ? '#333' : '#ccc' }}>{entry.contractor || '—'}</span>
                                                    }
                                                </TableCell>
                                                <TableCell sx={{ color: entry.note ? '#333' : '#ccc', fontSize: '0.82rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.note || '—'}</TableCell>
                                                <TableCell padding='none'>
                                                    <Tooltip title={t('Edit')}>
                                                        <IconButton size='small' onClick={() => openEditModal(entry)} sx={{ color: '#aaa', '&:hover': { color: mainPrimaryColor } }}>
                                                            <EditOutlinedIcon fontSize='small' />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        )}
                    </>
                )}
            </Box>

            <ChooseEstimationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSelect={handleSelect} />

            {/* Cost details modal — does not close on backdrop click */}
            <Dialog
                open={!!editEntry}
                onClose={(_, reason) => { if (reason !== 'backdropClick') setEditEntry(null); }}
                maxWidth={false}
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, width: '100%', maxWidth: 680, backgroundColor: '#fafcfc', boxShadow: '0 24px 48px rgba(0,0,0,0.12), 0 8px 24px rgba(0,171,190,0.08)' } }}
            >
                <DialogTitle sx={{ fontWeight: 700, color: mainPrimaryColor, pb: 0.5 }}>{t('Cost Details')}</DialogTitle>
                <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>

                    {/* Info rows */}
                    <Box sx={{ border: '1px solid #eaedf0', borderRadius: 2, px: 2, backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <DetailRow label={t('Description of Work')}>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#222' }}>{editEntry?.workName}</Typography>
                        </DetailRow>
                        <DetailRow label={t('Date of Creation')}>
                            <Typography sx={{ fontSize: '0.88rem', color: '#555' }}>{editEntry?.addedAt.toLocaleString()}</Typography>
                        </DetailRow>
                        <DetailRow label={t('Unit')}>
                            <InputBase value={editUnit} onChange={e => setEditUnit(e.target.value)} sx={{ fontSize: '0.88rem', color: '#222', '& input': { p: 0 } }} />
                        </DetailRow>
                        <DetailRow label={t('Quantity')}>
                            <InputBase value={editQuantityStr} onChange={e => setEditQuantityStr(e.target.value)} inputProps={{ style: { padding: 0 } }} sx={{ fontSize: '0.88rem', color: '#222' }} />
                        </DetailRow>
                        <DetailRow label={t('Subcontractor')}>
                            <Chip
                                label={editIsSubcontractor ? t('Active') : t('Inactive')}
                                size='small'
                                onClick={() => setEditIsSubcontractor(v => !v)}
                                sx={{
                                    fontSize: '0.72rem',
                                    cursor: 'pointer',
                                    backgroundColor: editIsSubcontractor ? '#e65100' : '#f4f6f8',
                                    color: editIsSubcontractor ? '#fff' : '#666',
                                    border: `1px solid ${editIsSubcontractor ? '#e65100' : '#dde0e4'}`,
                                    fontWeight: editIsSubcontractor ? 700 : 400,
                                    '&:hover': { opacity: 0.85 },
                                }}
                            />
                        </DetailRow>
                        {/* Section totals — live from second block */}
                        {(() => {
                            const lTotal = calcTotal(editLaborRows);
                            const mTotal = calcTotal(editMechanismRows);
                            const matTotal = calcTotal(editMaterialRows);
                            const fmt = (v: number) => v > 0 ? <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: mainPrimaryColor }}>{formatCurrencyRounded(v)} AMD</Typography> : <Typography sx={{ fontSize: '0.88rem', color: '#ccc' }}>—</Typography>;
                            return (
                                <>
                                    <DetailRow label={t('Labor / Wages')}>{fmt(lTotal)}</DetailRow>
                                    <DetailRow label={t('Mechanisms')}>{fmt(mTotal)}</DetailRow>
                                    <DetailRow label={t('Materials')} last>{fmt(matTotal)}</DetailRow>
                                </>
                            );
                        })()}
                    </Box>

                    {/* 3 cost sections */}
                    <Box sx={{ border: '1px solid #eaedf0', borderRadius: 2, px: 2, backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <SectionBlock
                            num={1}
                            title={t('Labor / Wages')}
                            rows={editLaborRows}
                            onChange={setEditLaborRows}
                            descLabel={t('Payment Method')}
                            onPlusClick={editPaymentMethod ? () => setEditLaborRows(prev => [...prev, { id: String(Date.now() + Math.random()), description: t(editPaymentMethod), quantity: '', unitPrice: '' }]) : openPaymentModal}
                            disabled={editIsSubcontractor}
                        />
                        <SectionBlock num={2} title={t('Operation of Mechanisms')} rows={editMechanismRows} onChange={setEditMechanismRows} descLabel={t('Mechanism Name')} disabled={editIsSubcontractor} />
                        <SectionBlock num={3} title={t('Materials')} rows={editMaterialRows} onChange={setEditMaterialRows} descLabel={t('Material Name')} disabled={editIsSubcontractor} last />
                    </Box>

                    {/* Note — soft border matching the boxes above */}
                    <TextField
                        label={t('Note')}
                        value={editNote}
                        onChange={e => setEditNote(e.target.value)}
                        size='small'
                        fullWidth
                        multiline
                        rows={2}
                        placeholder={t('Additional notes') + '...'}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                fontSize: '0.88rem',
                                '& fieldset': { borderColor: '#e8f7f9' },
                                '&:hover fieldset': { borderColor: '#b2e8ed' },
                                '&.Mui-focused fieldset': { borderColor: mainPrimaryColor, borderWidth: 1 },
                            },
                            '& .MuiInputLabel-root': { fontSize: '0.85rem', color: '#999' },
                            '& .MuiInputLabel-root.Mui-focused': { color: mainPrimaryColor },
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setEditEntry(null)} sx={{ borderRadius: '20px', color: '#888' }}>{t('Cancel')}</Button>
                    <Button variant='contained' onClick={handleEditSave}
                        sx={{ borderRadius: '20px', backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: '#009aab' } }}>
                        {t('Save')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Payment Method modal */}
            <Dialog
                open={paymentModalOpen}
                onClose={(_, reason) => { if (reason !== 'backdropClick') setPaymentModalOpen(false); }}
                maxWidth='xs'
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, color: mainPrimaryColor, pb: 0.5 }}>{t('Payment Method')}</DialogTitle>
                <DialogContent sx={{ pt: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <RadioGroup value={tempPaymentMethod} onChange={e => setTempPaymentMethod(e.target.value)}>
                        {(['Hourly', 'Piece-rate', 'Rate-based'] as const).map(method => (
                            <FormControlLabel
                                key={method}
                                value={method}
                                control={<Radio sx={{ color: mainPrimaryColor, '&.Mui-checked': { color: mainPrimaryColor } }} />}
                                label={<Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{t(method)}</Typography>}
                            />
                        ))}
                    </RadioGroup>
                    {tempPaymentMethod && (
                        <TextField
                            label={t('Value')}
                            value={tempPaymentValue}
                            onChange={e => setTempPaymentValue(e.target.value)}
                            size='small'
                            fullWidth
                            placeholder='0'
                            type='number'
                            inputProps={{ min: 0 }}
                        />
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setPaymentModalOpen(false)} sx={{ borderRadius: '20px', color: '#888' }}>{t('Cancel')}</Button>
                    <Button variant='contained' onClick={handlePaymentSave} disabled={!tempPaymentMethod}
                        sx={{ borderRadius: '20px', backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: '#009aab' } }}>
                        {t('Save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </PageContents>
    );
}

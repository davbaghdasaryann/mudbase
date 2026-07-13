'use client';

import { useState } from 'react';
import {
    Box, Button, Tab, Typography, Table, TableHead, TableBody, TableRow, TableCell,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Tooltip,
    Divider, InputBase,
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
    date?: string;
    contractor?: string;
    note?: string;
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

interface SectionBlockProps {
    title: string;
    rows: SectionRow[];
    onChange: (rows: SectionRow[]) => void;
}

function SectionBlock({ title, rows, onChange }: SectionBlockProps) {
    const { t } = useTranslation();
    const addRow = () => onChange([...rows, newRow()]);
    const updateRow = (id: string, field: keyof SectionRow, val: string) =>
        onChange(rows.map(r => r.id === id ? { ...r, [field]: val } : r));
    const removeRow = (id: string) => onChange(rows.filter(r => r.id !== id));

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#00818f' }}>{title}</Typography>
                <IconButton size='small' onClick={addRow} sx={{ color: mainPrimaryColor }}>
                    <AddCircleOutlineIcon fontSize='small' />
                </IconButton>
            </Box>
            {rows.length > 0 && (
                <Box sx={{ border: '1px solid #e0f5f7', borderRadius: 1.5, overflow: 'hidden', mb: 0.5 }}>
                    {/* mini header */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 32px', gap: 0, backgroundColor: '#f0fbfc', px: 1, py: 0.5 }}>
                        {[t('Description of Work'), t('Qty'), t('Unit Price'), ''].map((h, i) => (
                            <Typography key={i} sx={{ fontSize: '0.72rem', fontWeight: 700, color: mainPrimaryColor, textAlign: i > 0 ? 'right' : 'left', pr: i > 0 && i < 3 ? 1 : 0 }}>{h}</Typography>
                        ))}
                    </Box>
                    {rows.map(row => {
                        const q = parseFloat(row.quantity.replace(',', '.')) || 0;
                        const p = parseFloat(row.unitPrice.replace(',', '.')) || 0;
                        const tot = q * p;
                        return (
                            <Box key={row.id} sx={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 32px', gap: 0, borderTop: '1px solid #e0f5f7', px: 1, py: 0.25, alignItems: 'center', '&:hover': { backgroundColor: '#fafeff' } }}>
                                <InputBase value={row.description} onChange={e => updateRow(row.id, 'description', e.target.value)} placeholder='...' sx={{ fontSize: '0.82rem', pr: 1 }} />
                                <InputBase value={row.quantity} onChange={e => updateRow(row.id, 'quantity', e.target.value)} placeholder='0' inputProps={{ style: { textAlign: 'right' } }} sx={{ fontSize: '0.82rem', pr: 1 }} />
                                <InputBase value={row.unitPrice} onChange={e => updateRow(row.id, 'unitPrice', e.target.value)} placeholder='0' inputProps={{ style: { textAlign: 'right' } }} sx={{ fontSize: '0.82rem', pr: 1 }} />
                                <IconButton size='small' onClick={() => removeRow(row.id)} sx={{ color: '#ccc', '&:hover': { color: '#e53935' } }}>
                                    <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Box>
                        );
                    })}
                    {/* section total */}
                    {rows.length > 0 && (() => {
                        const secTotal = rows.reduce((s, r) => {
                            const q = parseFloat(r.quantity.replace(',', '.')) || 0;
                            const p = parseFloat(r.unitPrice.replace(',', '.')) || 0;
                            return s + q * p;
                        }, 0);
                        return secTotal > 0 ? (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1, py: 0.5, borderTop: '1px solid #e0f5f7', backgroundColor: '#f7fdfe' }}>
                                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: mainPrimaryColor }}>{formatCurrencyRounded(secTotal)} AMD</Typography>
                            </Box>
                        ) : null;
                    })()}
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

    // Details modal
    const [editEntry, setEditEntry] = useState<CostHistoryEntry | null>(null);
    const [editDate, setEditDate] = useState('');
    const [editContractor, setEditContractor] = useState('');
    const [editNote, setEditNote] = useState('');
    const [editLaborRows, setEditLaborRows] = useState<SectionRow[]>([]);
    const [editMechanismRows, setEditMechanismRows] = useState<SectionRow[]>([]);
    const [editMaterialRows, setEditMaterialRows] = useState<SectionRow[]>([]);

    const handleSelect = (estimate: EstimatesApi.ApiEstimate) => {
        setDialogOpen(false);
        setSelectedEstimate(estimate);
    };

    const handleCostAdded = (entry: CostHistoryEntry) => {
        setCostHistory(prev => [entry, ...prev]);
    };

    const openEditModal = (entry: CostHistoryEntry) => {
        setEditEntry(entry);
        setEditDate(entry.date ?? '');
        setEditContractor(entry.contractor ?? '');
        setEditNote(entry.note ?? '');
        setEditLaborRows(entry.laborRows ?? []);
        setEditMechanismRows(entry.mechanismRows ?? []);
        setEditMaterialRows(entry.materialRows ?? []);
    };

    const handleEditSave = () => {
        if (!editEntry) return;
        setCostHistory(prev => prev.map(e =>
            e.id === editEntry.id
                ? { ...e, date: editDate, contractor: editContractor, note: editNote, laborRows: editLaborRows, mechanismRows: editMechanismRows, materialRows: editMaterialRows }
                : e
        ));
        setEditEntry(null);
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
                                            <TableCell sx={{ fontWeight: 700, color: mainPrimaryColor }}>{t('Date')}</TableCell>
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
                                                <TableCell sx={{ color: entry.date ? '#333' : '#ccc', fontSize: '0.82rem' }}>{entry.date || '—'}</TableCell>
                                                <TableCell sx={{ color: entry.contractor ? '#333' : '#ccc', fontSize: '0.82rem' }}>{entry.contractor || '—'}</TableCell>
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

            {/* Cost details modal */}
            <Dialog open={!!editEntry} onClose={() => setEditEntry(null)} maxWidth='sm' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, color: mainPrimaryColor, pb: 0.5 }}>{t('Cost Details')}</DialogTitle>
                <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {editEntry && (
                        <Box sx={{ backgroundColor: '#f0fbfc', borderRadius: 2, px: 2, py: 1.5 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#333' }}>{editEntry.workName}</Typography>
                            <Typography sx={{ fontSize: '0.8rem', color: '#888', mt: 0.25 }}>
                                {editEntry.unit} · {t('Quantity')}: {editEntry.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })} · {t('Total')}: {formatCurrencyRounded(editEntry.total)} AMD
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField label={t('Date')} type='date' value={editDate} onChange={e => setEditDate(e.target.value)} size='small' InputLabelProps={{ shrink: true }} fullWidth />
                        <TextField label={t('Contractor')} value={editContractor} onChange={e => setEditContractor(e.target.value)} size='small' fullWidth placeholder={t('Contractor name') + '...'} />
                    </Box>
                    <TextField label={t('Note')} value={editNote} onChange={e => setEditNote(e.target.value)} size='small' fullWidth multiline rows={2} placeholder={t('Additional notes') + '...'} />

                    <Divider />

                    <SectionBlock title='1. Աշխատավարձ' rows={editLaborRows} onChange={setEditLaborRows} />
                    <SectionBlock title='2. Մեխանիզմների շահագործում' rows={editMechanismRows} onChange={setEditMechanismRows} />
                    <SectionBlock title='3. Նյութեր' rows={editMaterialRows} onChange={setEditMaterialRows} />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setEditEntry(null)} sx={{ borderRadius: '20px', color: '#888' }}>{t('Cancel')}</Button>
                    <Button variant='contained' onClick={handleEditSave}
                        sx={{ borderRadius: '20px', backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: '#009aab' } }}>
                        {t('Save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </PageContents>
    );
}

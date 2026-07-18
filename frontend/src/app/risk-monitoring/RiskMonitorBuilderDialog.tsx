'use client';

import React, { useState } from 'react';
import {
    Dialog, DialogContent, DialogActions, Box, Stack, Typography,
    Button, TextField, IconButton, InputAdornment, OutlinedInput,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import StraightenIcon from '@mui/icons-material/Straighten';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTranslation } from 'react-i18next';
import WidgetItemHierarchyPicker from '@/components/dashboard/WidgetItemHierarchyPicker';
import WidgetEstimatesListPicker from '@/components/dashboard/WidgetEstimatesListPicker';
import WidgetEciHierarchyPicker from '@/components/dashboard/WidgetEciHierarchyPicker';
import { formatCurrencyRounded } from '@/lib/format_currency';

const TEAL = '#00ABBE';
const STEP_COUNT = 4;

const CATALOG_SOURCES = [
    { id: 'labor',     labelKey: 'Labor Catalog',      descKey: 'Shows the list of available works in the catalog',        icon: MenuBookIcon,     iconColor: TEAL },
    { id: 'materials', labelKey: 'Materials Catalog',   descKey: 'Shows the list of available materials in the catalog',    icon: LocalFloristIcon, iconColor: '#6b8e6b' },
    { id: 'estimates', labelKey: 'Estimations List',    descKey: 'Shows the list of estimates created by you',              icon: StraightenIcon,   iconColor: '#5eb8e0' },
    { id: 'eci',       labelKey: 'Aggregated Catalog',  descKey: 'Shows the list of consolidated estimates in the catalog', icon: AssignmentIcon,   iconColor: '#9b7ec8' },
];

export interface RiskMonitorConfig {
    groupName: string;
    dataSource: string;
    dataSourceLabel: string;
    selectedItem: any;
    baselinePrice: number;
    budget: number;
    minMarketPrice?: number;
}

interface Props {
    onClose: () => void;
    onConfirm: (config: RiskMonitorConfig) => void;
    presetGroupName?: string; // if set, skip step 0 and use this as group name
}

function getBaselinePrice(item: any, dataSource: string): number {
    if (dataSource === 'estimates' || dataSource === 'eci') {
        return item?.totalCostWithOtherExpenses ?? item?.totalCost ?? 0;
    }
    return item?.averagePrice ?? item?.changableAveragePrice ?? 0;
}

export default function RiskMonitorBuilderDialog({ onClose, onConfirm, presetGroupName }: Props) {
    const { t } = useTranslation();
    const firstStep = presetGroupName ? 1 : 0;
    const STEP_COUNT = presetGroupName ? 3 : 4;
    const [step, setStep] = useState(firstStep);
    const [groupName, setGroupName] = useState(presetGroupName ?? '');
    const [dataSource, setDataSource] = useState('');
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [budgetInput, setBudgetInput] = useState('');
    const [minPriceInput, setMinPriceInput] = useState('');

    const baselinePrice = selectedItem ? getBaselinePrice(selectedItem, dataSource) : 0;
    const budgetValue = parseFloat(budgetInput.replace(/[^0-9.]/g, '')) || 0;
    const minPriceValue = parseFloat(minPriceInput.replace(/[^0-9.]/g, '')) || 0;
    const ceilingPct = baselinePrice > 0 && budgetValue > 0
        ? Math.round((budgetValue / baselinePrice) * 100)
        : null;
    const minPricePct = baselinePrice > 0 && minPriceValue > 0
        ? Math.round((minPriceValue / baselinePrice) * 100)
        : null;

    // Display step index (0-based from user's perspective)
    const displayStep = step - firstStep;
    const lastStep = firstStep + STEP_COUNT - 1;

    const canProceed = () => {
        if (step === 0) return !!groupName.trim();
        if (step === 1) return !!dataSource;
        if (step === 2) return selectedItem != null;
        if (step === 3) return budgetValue > 0;
        return false;
    };

    const handleNext = () => { if (step < lastStep) setStep(s => s + 1); };
    const handleBack = () => { if (step > firstStep) setStep(s => s - 1); };

    const handleFinish = () => {
        const src = CATALOG_SOURCES.find(s => s.id === dataSource);
        onConfirm({
            groupName: presetGroupName ?? groupName,
            dataSource,
            dataSourceLabel: src ? t(src.labelKey) : dataSource,
            selectedItem,
            baselinePrice,
            budget: budgetValue,
            minMarketPrice: minPriceValue > 0 ? minPriceValue : undefined,
        });
    };

    const ALL_STEP_LABELS = ['Group Name', 'Select Catalog', 'Select Item', 'Set Budget'];
    const STEP_LABELS = presetGroupName ? ALL_STEP_LABELS.slice(1) : ALL_STEP_LABELS;
    const primaryLabel = step === lastStep ? t('Confirm') : t('Continue');
    const secondaryLabel = step > firstStep ? t('Previous') : t('Cancel');

    return (
        <Dialog
            open
            onClose={onClose}
            maxWidth='md'
            fullWidth
            PaperProps={{ sx: { borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minHeight: step === 2 ? 560 : undefined } }}
        >
            {/* ── Header / stepper ─────────────────────────────────────────── */}
            <Box sx={{ position: 'relative', pt: 2.5, px: 3, pb: 1 }}>
                <IconButton onClick={onClose} size='small'
                    sx={{ position: 'absolute', right: 12, top: 12, color: 'grey.500' }}>
                    <CloseIcon fontSize='small' />
                </IconButton>
                <Typography variant='h6' fontWeight='bold' color='text.primary'>
                    {t('Configuration')}
                </Typography>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.25 }}>
                    {t('Step {{current}} of {{total}}', { current: displayStep + 1, total: STEP_COUNT })} — {t(STEP_LABELS[displayStep])}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                    {Array.from({ length: STEP_COUNT }).map((_, i) => (
                        <Box key={i} sx={{ flex: 1, height: 4, borderRadius: 1, bgcolor: i <= displayStep ? TEAL : 'grey.300', transition: 'background-color 0.3s' }} />
                    ))}
                </Box>
            </Box>

            <DialogContent sx={{ px: 3, pt: 2, pb: 3 }}>

                {/* ── Step 0: Group name ───────────────────────────────────── */}
                {step === 0 && (
                    <Stack spacing={2.5}>
                        <Box>
                            <Typography variant='subtitle2' fontWeight={600} sx={{ mb: 0.75 }}>
                                {t('Group Name')}
                            </Typography>
                            <TextField
                                fullWidth size='small' autoFocus
                                placeholder={t('Enter a name for this monitoring group')}
                                value={groupName}
                                onChange={e => setGroupName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && groupName.trim()) handleNext(); }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, '& fieldset': { borderColor: '#d5eef0' }, '&:hover fieldset': { borderColor: TEAL }, '&.Mui-focused fieldset': { borderColor: TEAL } } }}
                            />
                        </Box>
                    </Stack>
                )}

                {/* ── Step 1: Catalog ──────────────────────────────────────── */}
                {step === 1 && (
                    <Stack spacing={1.5}>
                        {CATALOG_SOURCES.map(src => {
                            const Icon = src.icon;
                            const sel = dataSource === src.id;
                            return (
                                <Box key={src.id} onClick={() => { setDataSource(src.id); setSelectedItem(null); }}
                                    sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, border: '1px solid', borderColor: sel ? TEAL : 'grey.300', bgcolor: sel ? 'rgba(0,171,190,0.04)' : 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'border-color 0.2s, background-color 0.2s', '&:hover': { borderColor: TEAL, bgcolor: 'rgba(0,171,190,0.04)' } }}>
                                    <Box sx={{ width: 42, height: 42, borderRadius: 1.5, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Icon sx={{ color: src.iconColor, fontSize: 24 }} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant='subtitle2' fontWeight={700}>{t(src.labelKey)}</Typography>
                                        <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.78rem' }}>{t(src.descKey)}</Typography>
                                    </Box>
                                    {sel && <CheckCircleIcon sx={{ color: TEAL, fontSize: 22, flexShrink: 0 }} />}
                                </Box>
                            );
                        })}
                    </Stack>
                )}

                {/* ── Step 2: Item picker ──────────────────────────────────── */}
                {step === 2 && (
                    <Box sx={{ minHeight: 380 }}>
                        {(dataSource === 'labor' || dataSource === 'materials') && (
                            <WidgetItemHierarchyPicker
                                catalogType={dataSource as 'labor' | 'material'}
                                selectedId={selectedItem?._id ?? null}
                                onSelect={setSelectedItem}
                            />
                        )}
                        {dataSource === 'estimates' && (
                            <WidgetEstimatesListPicker
                                selectedId={selectedItem?._id ?? null}
                                onSelect={setSelectedItem}
                            />
                        )}
                        {dataSource === 'eci' && (
                            <WidgetEciHierarchyPicker
                                selectedId={selectedItem?._id ?? null}
                                onSelect={setSelectedItem}
                                filterEmpty
                            />
                        )}
                        {selectedItem && (
                            <Box sx={{ mt: 2, px: 2, py: 1.5, borderRadius: 2, border: `1px solid ${TEAL}30`, bgcolor: `${TEAL}06`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#111' }}>
                                    {selectedItem.name ?? selectedItem.estimateNumber ?? selectedItem.title ?? '—'}
                                </Typography>
                                {baselinePrice > 0 && (
                                    <Typography sx={{ fontSize: '0.8rem', color: TEAL, fontWeight: 700 }}>
                                        {formatCurrencyRounded(baselinePrice)} AMD
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Box>
                )}

                {/* ── Step 3: Budget input ─────────────────────────────────── */}
                {step === 3 && (
                    <Stack spacing={2.5}>
                        {/* Summary of previous selections */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ flex: 1, px: 2, py: 1.5, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.200' }}>
                                <Typography sx={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.3 }}>{t('Group')}</Typography>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#111' }}>{groupName}</Typography>
                            </Box>
                            <Box sx={{ flex: 1, px: 2, py: 1.5, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.200' }}>
                                <Typography sx={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.3 }}>{t('Catalog')}</Typography>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#111' }}>
                                    {CATALOG_SOURCES.find(s => s.id === dataSource) ? t(CATALOG_SOURCES.find(s => s.id === dataSource)!.labelKey) : dataSource}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Baseline display */}
                        {baselinePrice > 0 && (
                            <Box sx={{ px: 2, py: 1.5, borderRadius: 2, background: 'rgba(0,171,190,0.06)', border: '1px solid rgba(0,171,190,0.18)' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: TEAL }} />
                                        <Typography sx={{ fontSize: '0.8rem', color: '#555' }}>{t('Market Average Baseline')}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#111' }}>
                                            {formatCurrencyRounded(baselinePrice)} AMD
                                        </Typography>
                                        <Box sx={{ px: 0.8, py: 0.2, borderRadius: 1, bgcolor: '#e0f7fa', minWidth: 38, textAlign: 'center' }}>
                                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#00838f' }}>100%</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        )}

                        {/* Budget input */}
                        <Box>
                            <Typography variant='subtitle2' fontWeight={600} sx={{ mb: 0.75 }}>
                                {t('Maximum Approved Budget')}
                            </Typography>
                            <OutlinedInput
                                fullWidth size='small' autoFocus
                                value={budgetInput}
                                onChange={e => setBudgetInput(e.target.value.replace(/[^0-9.]/g, ''))}
                                placeholder='0'
                                endAdornment={
                                    <InputAdornment position='end'>
                                        <Typography sx={{ fontSize: '0.8rem', color: '#888', fontWeight: 600 }}>AMD</Typography>
                                    </InputAdornment>
                                }
                                sx={{ borderRadius: 2, fontWeight: 600, fontSize: '1.05rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d5eef0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: TEAL }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: TEAL } }}
                            />
                            <Typography sx={{ fontSize: '0.72rem', color: '#aaa', mt: 0.8 }}>
                                {t('The gauge will alert when the market price exceeds this ceiling.')}
                            </Typography>
                        </Box>

                        {/* Live ceiling preview */}
                        {ceilingPct !== null && (
                            <Box sx={{ px: 2, py: 1.5, borderRadius: 2, border: `1px solid ${ceilingPct > 100 ? 'rgba(229,57,53,0.3)' : 'rgba(67,160,71,0.3)'}`, bgcolor: ceilingPct > 100 ? 'rgba(229,57,53,0.05)' : 'rgba(67,160,71,0.05)' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ceilingPct > 100 ? '#e53935' : '#43a047' }} />
                                        <Typography sx={{ fontSize: '0.8rem', color: '#555' }}>{t('Your Budget Ceiling')}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#111' }}>
                                            {formatCurrencyRounded(budgetValue)} AMD
                                        </Typography>
                                        <Box sx={{ px: 0.8, py: 0.2, borderRadius: 1, minWidth: 38, textAlign: 'center', bgcolor: ceilingPct > 100 ? 'rgba(229,57,53,0.12)' : 'rgba(67,160,71,0.12)' }}>
                                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: ceilingPct > 100 ? '#c62828' : '#2e7d32' }}>
                                                {ceilingPct}%
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        )}

                        {/* Minimum market price input (optional) */}
                        <Box>
                            <Typography variant='subtitle2' fontWeight={600} sx={{ mb: 0.75 }}>
                                {t('Minimum Market Price')}
                                <Typography component='span' sx={{ fontSize: '0.72rem', color: '#aaa', fontWeight: 400, ml: 1 }}>({t('optional')})</Typography>
                            </Typography>
                            <OutlinedInput
                                fullWidth size='small'
                                value={minPriceInput}
                                onChange={e => setMinPriceInput(e.target.value.replace(/[^0-9.]/g, ''))}
                                placeholder='0'
                                onKeyDown={e => { if (e.key === 'Enter' && budgetValue > 0) handleFinish(); }}
                                endAdornment={
                                    <InputAdornment position='end'>
                                        <Typography sx={{ fontSize: '0.8rem', color: '#888', fontWeight: 600 }}>AMD</Typography>
                                    </InputAdornment>
                                }
                                sx={{ borderRadius: 2, fontWeight: 600, fontSize: '1.05rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d5eef0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: TEAL }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: TEAL } }}
                            />
                            <Typography sx={{ fontSize: '0.72rem', color: '#aaa', mt: 0.8 }}>
                                {t('The lowest known market price — shown as a reference marker on the gauge.')}
                            </Typography>
                        </Box>

                        {/* Live min price preview */}
                        {minPricePct !== null && (
                            <Box sx={{ px: 2, py: 1.5, borderRadius: 2, border: '1px solid rgba(0,77,64,0.25)', bgcolor: 'rgba(0,77,64,0.04)' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#004D40' }} />
                                        <Typography sx={{ fontSize: '0.8rem', color: '#555' }}>{t('Min Market Price')}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#111' }}>
                                            {formatCurrencyRounded(minPriceValue)} AMD
                                        </Typography>
                                        <Box sx={{ px: 0.8, py: 0.2, borderRadius: 1, minWidth: 38, textAlign: 'center', bgcolor: 'rgba(0,77,64,0.10)' }}>
                                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#004D40' }}>
                                                {minPricePct}%
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        )}

                        {/* Preview summary */}
                        {selectedItem && (
                            <Box sx={{ p: 2, borderRadius: 2, border: `1px solid ${TEAL}25`, bgcolor: `${TEAL}06` }}>
                                <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 1.5 }}>
                                    <MonitorHeartOutlinedIcon sx={{ color: TEAL, fontSize: '1rem' }} />
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#111' }}>{t('Preliminary View')}</Typography>
                                </Stack>
                                <Typography sx={{ fontSize: '0.8rem', color: '#555' }}>
                                    {selectedItem.name ?? selectedItem.estimateNumber ?? selectedItem.title ?? '—'}
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2.5, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
                <Button onClick={step > firstStep ? handleBack : onClose} sx={{ color: TEAL, textTransform: 'none', fontWeight: 600 }}>
                    {secondaryLabel}
                </Button>
                <Button variant='contained' disabled={!canProceed()}
                    onClick={step === lastStep ? handleFinish : handleNext}
                    sx={{ borderRadius: '20px', px: 3, bgcolor: TEAL, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#006f7a' } }}>
                    {primaryLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

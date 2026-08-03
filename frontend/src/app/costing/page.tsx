'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box, Button, Tab, Typography, Table, TableHead, TableBody, TableRow, TableCell,
    Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip,
    InputBase, Radio, RadioGroup, FormControlLabel, Checkbox, TextField, Chip, Paper, CircularProgress,
} from '@mui/material';
import { TabContext, TabList } from '@mui/lab';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EngineeringIcon from '@mui/icons-material/Engineering';
import BuildIcon from '@mui/icons-material/Build';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import HistoryIcon from '@mui/icons-material/History';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import InsightsIcon from '@mui/icons-material/Insights';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import StraightenIcon from '@mui/icons-material/Straighten';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import ChooseEstimationDialog from '@/app/analysis/structural/ChooseEstimationDialog';
import CostingTable from './CostingTable';
import PahestMainMaterials, { type PahestEntry } from './PahestMainMaterials';
import PahestAylMaterials, { type AylEntry } from './PahestAylMaterials';
import VolumesDialog from './VolumesDialog';
import MaterialsDialog from './MaterialsDialog';
import SalaryDialog from './SalaryDialog';
import SubcontractorDialog from './SubcontractorDialog';
import UnforeseenDialog from './UnforeseenDialog';
import AnalysisTab from './AnalysisTab';
import { mainPrimaryColor } from '@/theme';
import * as EstimatesApi from '@/api/estimate';
import * as Api from '@/api';
import { formatCurrencyRounded, formatCurrencyRoundedSymbol } from '@/lib/format_currency';
import CostBreakdownChart from '@/app/analysis/structural/CostBreakdownChart';
import OtherExpensesChart from '@/app/analysis/structural/OtherExpensesChart';
import BreakdownTable from '@/app/analysis/structural/BreakdownTable';

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
    laborItemId?: string;
}

interface SnapshotLaborRow {
    _id: string;
    laborOfferItemName: string;
    catalogName: string;
    unitSymbol: string;
    quantity: number;
    changableAveragePrice: number;
    cost: number;
    subsectionName: string;
    sectionName: string;
}
interface SnapshotSection { _id: string; name: string; displayIndex: number; totalCost?: number; }
interface SnapshotSubsection { _id: string; estimateSectionId: string; name: string; displayIndex: number; }
interface EstimateSnapshot {
    laborRows: SnapshotLaborRow[];
    sections: SnapshotSection[];
    subsections: SnapshotSubsection[];
}

interface CostingRecord {
    _id: string;
    estimateId: string;
    estimateName: string;
    costHistory: CostHistoryEntry[];
    pahestEntries: PahestEntry[];
    aylEntries: AylEntry[];
    actualData: Record<string, { quantity: string; unitPrice: string; spent?: string }>;
    estimateSnapshot?: EstimateSnapshot;
    unforeseenEstimateSnapshot?: EstimateSnapshot;
    unforeseenEstimateId?: string;
    unforeseenCostingId?: string;
    isUnforeseen?: boolean;
    parentCostingId?: string;
    createdAt: string;
}

const MetricCard = ({ label, value, actualValue }: { label: string; value: number; actualValue?: number }) => (
    <Paper elevation={0} sx={{ border: '1px solid #d0f0f4', borderRadius: 3, p: 2.5, background: 'linear-gradient(135deg,#ffffff 0%,#edfbfc 100%)', transition: 'transform 0.2s,box-shadow 0.2s,border-color 0.2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,171,190,0.18)', borderColor: mainPrimaryColor } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <ChatBubbleOutlineIcon sx={{ fontSize: 20, color: mainPrimaryColor, flexShrink: 0 }} />
            <Typography variant='body2' sx={{ color: 'text.secondary', fontWeight: 600 }}>{label}</Typography>
        </Box>
        <Typography variant='caption' sx={{ color: '#aaa', display: 'block', mb: 0.4 }}>Նախահաշիվ / Փաստացի</Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, flexWrap: 'wrap' }}>
            <Typography variant='body1' sx={{ fontWeight: 700, color: '#333' }}>{formatCurrencyRoundedSymbol(value)}</Typography>
            <Typography sx={{ color: '#bbb', fontWeight: 400 }}>/</Typography>
            {actualValue !== undefined ? (
                <Typography variant='body1' sx={{ fontWeight: 700, color: actualValue > value ? '#e53935' : mainPrimaryColor }}>{formatCurrencyRoundedSymbol(actualValue)}</Typography>
            ) : (
                <Typography variant='body1' sx={{ fontWeight: 400, color: '#bbb' }}>—</Typography>
            )}
        </Box>
    </Paper>
);

const ParamCard = ({ label, icon, value }: { label: string; icon: React.ReactNode; value: number | string }) => (
    <Paper elevation={0} sx={{ border: '1px solid #E8E8E8', borderRadius: 3, p: 2, display: 'flex', flexDirection: 'column', gap: 0.5, transition: 'transform 0.2s,box-shadow 0.2s,border-color 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(0,171,190,0.14)', borderColor: mainPrimaryColor } }}>
        <Typography variant='caption' sx={{ color: 'text.secondary', lineHeight: 1.2 }}>{label}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
            <Box sx={{ color: mainPrimaryColor }}>{icon}</Box>
            <Typography variant='h6' sx={{ fontWeight: 700 }}>{typeof value === 'number' ? formatCurrencyRounded(value) : value}</Typography>
        </Box>
    </Paper>
);

const TripleParamCard = ({ label, icon, estimate, current, completed, subLabel }: { label: string; icon: React.ReactNode; estimate: number; current: number; completed: number; subLabel: string }) => (
    <Paper elevation={0} sx={{ border: '1px solid #d0f0f4', borderRadius: 3, p: 2.5, background: 'linear-gradient(135deg,#ffffff 0%,#edfbfc 100%)', transition: 'transform 0.2s,box-shadow 0.2s,border-color 0.2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,171,190,0.18)', borderColor: mainPrimaryColor } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Box sx={{ color: mainPrimaryColor }}>{icon}</Box>
            <Typography variant='body2' sx={{ color: 'text.secondary', fontWeight: 600 }}>{label}</Typography>
        </Box>
        <Typography variant='caption' sx={{ color: '#aaa', display: 'block', mb: 0.4 }}>{subLabel}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
            <Typography variant='body1' sx={{ fontWeight: 700, color: '#333' }}>{estimate}</Typography>
            <Typography sx={{ color: '#bbb', fontWeight: 400 }}>/</Typography>
            <Typography variant='body1' sx={{ fontWeight: 700, color: mainPrimaryColor }}>{current}</Typography>
            <Typography sx={{ color: '#bbb', fontWeight: 400 }}>/</Typography>
            <Typography variant='body1' sx={{ fontWeight: 700, color: '#4caf50' }}>{completed}</Typography>
        </Box>
    </Paper>
);

const HISTORY_TYPE_GROUPS: { key: string; label: string; match: (pm: string, isSub?: boolean) => boolean }[] = [
    { key: 'pahest',            label: 'Մուտք Պահեստ', match: pm => pm === 'pahest_main' || pm === 'pahest_ayl' },
    { key: 'nyuth',             label: 'Նյութի Ծախսագրում', match: pm => pm === 'nyuth_tsakhsagrum' },
    { key: 'salary_gorcarqayin',label: 'Աշխատավարձ «Գործարքային»', match: pm => pm === 'salary_gorcarqayin' },
    { key: 'salary_miavorzham', label: 'Աշխատավարձ «Դրույքային»', match: pm => pm === 'salary_miavorzham' },
    { key: 'subcontractor',     label: 'Ենթակապալ', match: (pm, isSub) => pm === 'subcontractor' || !!isSub },
    { key: 'unforeseen',        label: 'Չնախատեսված աշխատանքներ', match: pm => pm === 'unforeseen' },
    { key: 'volume',            label: 'Ծավալի հաշվառում', match: pm => !pm || pm === '' || pm === 'salary_druqayin' },
];

const getHistoryTypeKey = (pm: string, isSub?: boolean): string => {
    for (const g of HISTORY_TYPE_GROUPS) { if (g.match(pm, isSub)) return g.key; }
    return 'volume';
};


const outlinedCreateSx = {
    borderRadius: '25px',
    height: '40px',
    mt: 1,
    '&:hover': { backgroundColor: mainPrimaryColor, color: '#ffffff', borderColor: mainPrimaryColor },
};

type TabValue = 'general' | 'main' | 'history' | 'pahest' | 'analysis';

const newRow = (): SectionRow => ({ id: String(Date.now() + Math.random()), description: '', quantity: '', unitPrice: '' });

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
                <Box sx={{ border: '1px solid #e0f5f7', borderRadius: 1.5, overflow: 'hidden', mb: 0.75 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 68px 118px 28px', backgroundColor: '#edf9fb', px: 1.5, py: 0.6 }}>
                        {[colLabel, t('Qty'), t('Unit Price'), ''].map((h, i) => (
                            <Typography key={i} sx={{ fontSize: '0.69rem', fontWeight: 700, color: '#00818f', textAlign: i === 0 ? 'left' : i < 3 ? 'right' : 'center', whiteSpace: 'nowrap', letterSpacing: '0.01em' }}>{h}</Typography>
                        ))}
                    </Box>
                    {rows.map((row, idx) => (
                        <Box key={row.id} sx={{ display: 'grid', gridTemplateColumns: '1fr 68px 118px 28px', borderTop: '1px solid #e8f7f9', px: 1.5, py: 0.4, alignItems: 'center', backgroundColor: idx % 2 === 1 ? '#fbfeff' : '#fff', '&:hover': { backgroundColor: '#f2fcfd' } }}>
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

const COST_SEGMENTS = [
    { key: 'labor',     inner: '#00CCDD', outer: '#00899B', dot: '#00899B' },
    { key: 'materials', inner: '#4EE89A', outer: '#1CA461', dot: '#1CA461' },
    { key: 'other',     inner: '#A8DED9', outer: '#5CB8B0', dot: '#5CB8B0' },
];

const ACTUAL_SEGMENTS = COST_SEGMENTS;

function ActualCostsChart({ pahestEntries, costHistory, height = 260 }: { pahestEntries: PahestEntry[]; costHistory: CostHistoryEntry[]; height?: number }) {
    const { t } = useTranslation();
    const chartHeight = Math.max(100, height - 72);

    const materialsTotal = pahestEntries.reduce(
        (sum, e) => sum + e.history.reduce((s, r) => s + r.quantity * r.costPerUnit, 0),
        0
    );

    const laborTotal = costHistory
        .filter(e => e.paymentMethod?.startsWith('salary_'))
        .reduce((s, e) => s + e.total, 0);

    const data = [
        { key: 'labor',     name: t('Labor'),         value: laborTotal },
        { key: 'materials', name: t('Materials'),      value: materialsTotal },
        { key: 'other',     name: t('Other Expenses'), value: 0 },
    ].filter(d => d.value > 0);

    const total = data.reduce((s, d) => s + d.value, 0);

    return (
        <Paper elevation={0} sx={{ flex: 1, border: '1px solid #e0f0f4', borderRadius: 3, p: 2.5, background: '#fff', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            <Typography variant='subtitle1' sx={{ fontWeight: 700, mb: 1 }}>{t('Actual')}</Typography>
            {data.length === 0 ? (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant='body2' color='text.secondary'>—</Typography>
                </Box>
            ) : (
                <>
                    <Box sx={{ flex: 1, minHeight: chartHeight }}>
                        <ResponsiveContainer width='100%' height='100%'>
                            <PieChart>
                                <defs>
                                    {ACTUAL_SEGMENTS.map(s => (
                                        <radialGradient key={s.key} id={`actual-grad-${s.key}`} cx='50%' cy='50%' r='50%'>
                                            <stop offset='0%' stopColor={s.inner} />
                                            <stop offset='100%' stopColor={s.outer} />
                                        </radialGradient>
                                    ))}
                                </defs>
                                <Pie data={data} cx='50%' cy='50%' innerRadius={42} outerRadius={70} paddingAngle={2} dataKey='value' strokeWidth={0}>
                                    {data.map(entry => {
                                        const seg = ACTUAL_SEGMENTS.find(s => s.key === entry.key);
                                        return <Cell key={entry.key} fill={seg ? `url(#actual-grad-${seg.key})` : '#ccc'} stroke={seg?.outer ?? '#ccc'} strokeWidth={0.5} />;
                                    })}
                                </Pie>
                                <RechartsTooltip
                                    content={({ active, payload }: any) => {
                                        if (!active || !payload?.length) return null;
                                        const e = payload[0];
                                        return (
                                            <Paper elevation={3} sx={{ p: 1.5, borderRadius: 2, minWidth: 140 }}>
                                                <Typography variant='caption' sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>{e.name}</Typography>
                                                <Typography variant='body2' sx={{ color: '#00ABBE' }}>{Number(e.value).toLocaleString()} AMD</Typography>
                                                <Typography variant='caption' sx={{ color: 'text.secondary' }}>{total > 0 ? ((e.value / total) * 100).toFixed(1) : 0}%</Typography>
                                            </Paper>
                                        );
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center', mt: 1 }}>
                        {data.map(d => {
                            const seg = ACTUAL_SEGMENTS.find(s => s.key === d.key);
                            return (
                                <Box key={d.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Box sx={{ width: 9, height: 9, borderRadius: '50%', background: seg?.dot ?? '#ccc', flexShrink: 0 }} />
                                    <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                        {d.name} {total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                </>
            )}
        </Paper>
    );
}

function CombinedCostWidget({ estimate, pahestEntries, costHistory, height = 240 }: { estimate: EstimatesApi.ApiEstimate; pahestEntries: PahestEntry[]; costHistory: CostHistoryEntry[]; height?: number }) {
    const { t } = useTranslation();
    const chartH = Math.max(80, height - 80);

    const estData = (() => {
        const labor = estimate.laborTotalCost ?? 0;
        const materials = estimate.materialTotalCost ?? 0;
        const base = estimate.totalCost ?? 0;
        const withOther = estimate.totalCostWithOtherExpenses ?? base;
        const other = Math.max(0, withOther - base);
        const total = labor + materials + other;
        if (total === 0) return [];
        return [
            { key: 'labor',     name: t('Labor'),         value: labor,     pct: ((labor / total) * 100).toFixed(1) },
            { key: 'materials', name: t('Materials'),      value: materials, pct: ((materials / total) * 100).toFixed(1) },
            { key: 'other',     name: t('Other Expenses'), value: other,     pct: ((other / total) * 100).toFixed(1) },
        ].filter(d => d.value > 0);
    })();

    const actData = (() => {
        const materialsTotal = pahestEntries.reduce((s, e) => s + e.history.reduce((ss, r) => ss + r.quantity * r.costPerUnit, 0), 0);
        const laborTotal = costHistory.filter(e => e.paymentMethod?.startsWith('salary_')).reduce((s, e) => s + e.total, 0);
        const total = materialsTotal + laborTotal;
        if (total === 0) return [];
        return [
            { key: 'labor',     name: t('Labor'),    value: laborTotal,     pct: ((laborTotal / total) * 100).toFixed(1) },
            { key: 'materials', name: t('Materials'), value: materialsTotal, pct: ((materialsTotal / total) * 100).toFixed(1) },
        ].filter(d => d.value > 0);
    })();

    const donut = (data: typeof estData, gradPrefix: string) => (
        <Box sx={{ flex: 1, minHeight: chartH }}>
            <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                    <defs>
                        {COST_SEGMENTS.map(s => (
                            <radialGradient key={s.key} id={`${gradPrefix}-${s.key}`} cx='50%' cy='50%' r='50%'>
                                <stop offset='0%' stopColor={s.inner} />
                                <stop offset='100%' stopColor={s.outer} />
                            </radialGradient>
                        ))}
                    </defs>
                    <Pie data={data} cx='50%' cy='50%' innerRadius={38} outerRadius={62} paddingAngle={2} dataKey='value' strokeWidth={0}>
                        {data.map(entry => {
                            const seg = COST_SEGMENTS.find(s => s.key === entry.key);
                            return <Cell key={entry.key} fill={seg ? `url(#${gradPrefix}-${seg.key})` : '#ccc'} stroke={seg?.outer ?? '#ccc'} strokeWidth={0.5} />;
                        })}
                    </Pie>
                    <RechartsTooltip content={({ active, payload }: any) => {
                        if (!active || !payload?.length) return null;
                        const e = payload[0];
                        return (
                            <Paper elevation={3} sx={{ p: 1.5, borderRadius: 2, minWidth: 130 }}>
                                <Typography variant='caption' sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>{e.name}</Typography>
                                <Typography variant='body2' sx={{ color: '#00A390' }}>{Number(e.value).toLocaleString()} AMD</Typography>
                                <Typography variant='caption' sx={{ color: 'text.secondary' }}>{e.payload.pct}%</Typography>
                            </Paper>
                        );
                    }} />
                </PieChart>
            </ResponsiveContainer>
        </Box>
    );

    const legend = (data: typeof estData) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 0.5 }}>
            {data.map(d => {
                const seg = COST_SEGMENTS.find(s => s.key === d.key);
                return (
                    <Box key={d.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: seg?.dot ?? '#ccc', flexShrink: 0 }} />
                        <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>{d.name} {d.pct}%</Typography>
                    </Box>
                );
            })}
        </Box>
    );

    return (
        <Paper elevation={0} sx={{ height: '100%', border: '1px solid #e0f0f4', borderRadius: 3, p: 2, background: '#fff', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant='caption' sx={{ fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem', textAlign: 'center', mb: 0.5 }}>Նախահաշիվ</Typography>
                    {estData.length === 0
                        ? <Box sx={{ flex: 1, minHeight: chartH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography variant='body2' color='text.secondary'>—</Typography></Box>
                        : donut(estData, 'est')
                    }
                    {estData.length > 0 && legend(estData)}
                </Box>
                <Box sx={{ width: '1px', background: '#f0f0f0', mx: 0.5, alignSelf: 'stretch' }} />
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant='caption' sx={{ fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem', textAlign: 'center', mb: 0.5 }}>Փաստացի</Typography>
                    {actData.length === 0
                        ? <Box sx={{ flex: 1, minHeight: chartH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography variant='body2' color='text.secondary'>—</Typography></Box>
                        : donut(actData, 'act')
                    }
                    {actData.length > 0 && legend(actData)}
                </Box>
            </Box>
        </Paper>
    );
}

export default function CostingPage() {
    const { t } = useTranslation();
    const VALID_TABS: TabValue[] = ['general', 'main', 'history', 'pahest', 'analysis'];
    const [tab, setTab] = useState<TabValue>('general');
    useEffect(() => {
        const saved = localStorage.getItem('costingTab') as TabValue | null;
        if (saved && VALID_TABS.includes(saved)) setTab(saved);
    }, []);
    const [volumesOpen, setVolumesOpen] = useState(false);
    const [materialsOpen, setMaterialsOpen] = useState(false);
    const [salaryOpen, setSalaryOpen] = useState(false);
    const [subcontractorOpen, setSubcontractorOpen] = useState(false);
    const [unforeseenOpen, setUnforeseenOpen] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);
    const [exportTypes, setExportTypes] = useState<Set<string>>(new Set());
    const [unforeseenEstimate, setUnforeseenEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);
    const [unforeseenCostingId, setUnforeseenCostingId] = useState<string>('');
    const [estimateSnapshot, setEstimateSnapshot] = useState<EstimateSnapshot | null>(null);
    const [unforeseenSnapshot, setUnforeseenSnapshot] = useState<EstimateSnapshot | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const [records, setRecords] = useState<CostingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<CostingRecord | null>(null);
    const [fullEstimate, setFullEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);
    const didRestoreRef = useRef(false);

    const [costHistory, setCostHistory] = useState<CostHistoryEntry[]>([]);
    const [pahestEntries, setPahestEntries] = useState<PahestEntry[]>([]);
    const [aylEntries, setAylEntries] = useState<AylEntry[]>([]);
    const [actualData, setActualData] = useState<Record<string, { quantity: string; unitPrice: string; spent?: string }>>({});

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
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [tempPaymentMethod, setTempPaymentMethod] = useState('');
    const [tempPaymentValue, setTempPaymentValue] = useState('');

    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLoadingRef = useRef(false);
    const unforeseenCostingIdRef = useRef<string>('');
    const unforeseenSectionRef = useRef<HTMLDivElement>(null);
    const mainScrollContainerRef = useRef<HTMLDivElement>(null);
    const scrollToUnforeseenRef = useRef(false);

    const loadRecords = useCallback(() => {
        setLoading(true);
        Api.requestSession<CostingRecord[]>({ command: 'costing/fetch_all', args: {} })
            .then(data => {
                const list = data ?? [];
                setRecords(list);
                if (!didRestoreRef.current && typeof window !== 'undefined') {
                    didRestoreRef.current = true;
                    const id = new URLSearchParams(window.location.search).get('id');
                    if (id) {
                        const found = list.find(r => r._id === id);
                        if (found) openRecord(found);
                    }
                }
            })
            .catch(() => setRecords([]))
            .finally(() => setLoading(false));
    }, []); // eslint-disable-line

    useEffect(() => { loadRecords(); }, [loadRecords]);

    const openRecord = (rec: CostingRecord) => {
        isLoadingRef.current = true;
        setSelected(rec);
        setFullEstimate(null);
        setCostHistory((rec.costHistory ?? []).map(e => ({ ...e, addedAt: new Date(e.addedAt) })));
        setPahestEntries((rec.pahestEntries ?? []).map(e => ({
            ...e,
            history: (e.history ?? []).map(r => ({ ...r, addedAt: new Date(r.addedAt) })),
        })));
        setAylEntries((rec.aylEntries ?? []).map(e => ({
            ...e,
            history: (e.history ?? []).map(r => ({ ...r, addedAt: new Date(r.addedAt) })),
        })));
        setActualData(rec.actualData ?? {});
        setUnforeseenEstimate(null);
        unforeseenCostingIdRef.current = rec.unforeseenCostingId ?? '';
        setUnforeseenCostingId(rec.unforeseenCostingId ?? '');
        setEstimateSnapshot(rec.estimateSnapshot ?? null);
        setUnforeseenSnapshot(rec.unforeseenEstimateSnapshot ?? null);
        Api.requestSession<EstimatesApi.ApiEstimate>({ command: 'estimate/get', args: { estimateId: rec.estimateId } })
            .then(est => setFullEstimate(est))
            .catch(console.error);
        if (rec.unforeseenEstimateId) {
            Api.requestSession<EstimatesApi.ApiEstimate>({ command: 'estimate/get', args: { estimateId: rec.unforeseenEstimateId } })
                .then(est => setUnforeseenEstimate(est))
                .catch(() => {});
        }
        if (typeof window !== 'undefined') {
            window.history.pushState({}, '', `/costing?id=${rec._id}`);
        }
        setTimeout(() => { isLoadingRef.current = false; }, 50);
    };

    const closeRecord = () => {
        setSelected(null);
        setUnforeseenEstimate(null);
        unforeseenCostingIdRef.current = '';
        setUnforeseenCostingId('');
        setEstimateSnapshot(null);
        setUnforeseenSnapshot(null);
        if (typeof window !== 'undefined') window.history.pushState({}, '', '/costing');
    };

    const saveToBackend = useCallback((
        id: string,
        ch: CostHistoryEntry[],
        pe: PahestEntry[],
        ae: AylEntry[],
        ad: Record<string, { quantity: string; unitPrice: string }>,
        unforeseenId?: string | null
    ) => {
        if (isLoadingRef.current) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            Api.requestSession({ command: 'costing/save', args: { id }, json: { costHistory: ch, pahestEntries: pe, aylEntries: ae, actualData: ad, unforeseenEstimateId: unforeseenId ?? '', unforeseenCostingId: unforeseenCostingIdRef.current ?? '' } }).catch(console.error);
        }, 800);
    }, []);

    useEffect(() => {
        if (!selected) return;
        setRecords(prev => prev.map(r => r._id === selected._id
            ? { ...r, costHistory, pahestEntries, aylEntries, actualData }
            : r
        ));
        saveToBackend(selected._id, costHistory, pahestEntries, aylEntries, actualData);
    }, [costHistory, pahestEntries, aylEntries, actualData, selected, saveToBackend]);

    useEffect(() => {
        if (!unforeseenEstimate || tab !== 'main' || !scrollToUnforeseenRef.current) return;
        scrollToUnforeseenRef.current = false;
        const timer = setTimeout(() => {
            const container = mainScrollContainerRef.current;
            const section = unforeseenSectionRef.current;
            if (container && section) {
                container.scrollTop = section.offsetTop - 16;
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [unforeseenEstimate, tab]);

    const handleCreate = useCallback(async (estimate: EstimatesApi.ApiEstimate) => {
        setDialogOpen(false);
        const created = await Api.requestSession<CostingRecord>({
            command: 'costing/create',
            args: { estimateId: String(estimate._id), estimateName: estimate.name },
        });
        setRecords(prev => [created, ...prev]);
        openRecord(created);
    }, []); // eslint-disable-line

    const handleDelete = useCallback(async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await Api.requestSession({ command: 'costing/delete', args: { id } });
        setRecords(prev => prev.filter(r => r._id !== id));
        if (selected?._id === id) closeRecord();
    }, [selected]); // eslint-disable-line

    const handleDeleteUnforeseen = useCallback(() => {
        const childId = unforeseenCostingIdRef.current;
        setUnforeseenEstimate(null);
        unforeseenCostingIdRef.current = '';
        setUnforeseenCostingId('');
        if (selected) saveToBackend(selected._id, costHistory, pahestEntries, aylEntries, actualData, '');
        if (childId) {
            Api.requestSession({ command: 'costing/delete', args: { id: childId } }).catch(console.error);
            setRecords(prev => prev.filter(r => r._id !== childId));
        }
    }, [selected, costHistory, pahestEntries, aylEntries, actualData, saveToBackend]); // eslint-disable-line

    const handleUnforeseenEstimateSelected = useCallback(async (est: EstimatesApi.ApiEstimate) => {
        scrollToUnforeseenRef.current = true;
        setUnforeseenEstimate(est);
        setTab('main');
        localStorage.setItem('costingTab', 'main');
        if (!selected) return;
        let newId = unforeseenCostingIdRef.current;
        if (!newId) {
            const created = await Api.requestSession<CostingRecord>({
                command: 'costing/create',
                args: { estimateId: String(est._id), estimateName: est.name, isUnforeseen: 'true', parentCostingId: selected._id },
            });
            setRecords(prev => [created, ...prev]);
            newId = created._id;
            unforeseenCostingIdRef.current = newId;
            setUnforeseenCostingId(newId);
            if (created.estimateSnapshot) setUnforeseenSnapshot(created.estimateSnapshot);
        }
        saveToBackend(selected._id, costHistory, pahestEntries, aylEntries, actualData, String(est._id));
    }, [selected, costHistory, pahestEntries, aylEntries, actualData, saveToBackend]); // eslint-disable-line

    const handleCostAdded = (entry: CostHistoryEntry) => {
        setCostHistory(prev => [entry, ...prev]);
    };

    const handlePahestCostedUpdate = (materialItemId: string, qty: number) => {
        setPahestEntries(prev => prev.map(e =>
            e.materialItemId === materialItemId
                ? { ...e, costedQuantity: (e.costedQuantity ?? 0) + qty }
                : e
        ));
        setMaterialsOpen(false);
        setTab('pahest');
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

    // ── LIST VIEW ─────────────────────────────────────────────────────────────
    if (!selected) {
        return (
            <PageContents title='Costing'>
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                            <CircularProgress size={28} sx={{ color: mainPrimaryColor }} />
                        </Box>
                    )}

                    {!loading && records.filter(r => !r.isUnforeseen).length === 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2, pb: 8 }}>
                            <RequestQuoteOutlinedIcon sx={{ fontSize: 90, color: '#00ABBE', opacity: 0.25 }} />
                            <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>{t('No Costings created yet')}</Typography>
                            <PageButton variant='outlined' label='Create' size='large' sx={outlinedCreateSx} onClick={() => setDialogOpen(true)} />
                        </Box>
                    )}

                    {!loading && records.filter(r => !r.isUnforeseen).length > 0 && (
                        <Box sx={{ flex: 1, minHeight: 0 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                                <PageButton variant='outlined' label='Create' size='medium' sx={{ ...outlinedCreateSx, mt: 0 }} onClick={() => setDialogOpen(true)} />
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {records.filter(r => !r.isUnforeseen).map(rec => (
                                    <Box
                                        key={rec._id}
                                        onClick={() => openRecord(rec)}
                                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.8, borderRadius: 2, border: '1px solid #e0f5f7', backgroundColor: '#fafeff', cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s', '&:hover': { boxShadow: '0 2px 12px rgba(0,171,190,0.12)', borderColor: mainPrimaryColor } }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <RequestQuoteOutlinedIcon sx={{ color: mainPrimaryColor, opacity: 0.7, fontSize: 22 }} />
                                            <Box>
                                                <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#222' }}>{rec.estimateName}</Typography>
                                                <Typography variant='caption' color='text.secondary'>
                                                    {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : '—'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <IconButton size='small' onClick={e => handleDelete(rec._id, e)} sx={{ color: '#bbb', '&:hover': { color: '#e53935' } }}>
                                            <DeleteOutlineIcon fontSize='small' />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}
                </Box>
                <ChooseEstimationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSelect={handleCreate} />
            </PageContents>
        );
    }

    // ── DETAIL VIEW ───────────────────────────────────────────────────────────
    const selectedEstimate = fullEstimate ?? ({ _id: selected.estimateId, name: selected.estimateName } as unknown as EstimatesApi.ApiEstimate);

    return (
        <PageContents title='Costing'>
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <TabContext value={tab}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton size='small' onClick={closeRecord} sx={{ color: 'text.secondary', mr: 0.5, '&:hover': { color: mainPrimaryColor } }}>
                                <ArrowBackIcon fontSize='small' />
                            </IconButton>
                            <TabList onChange={(_, v) => { const t = v as TabValue; setTab(t); localStorage.setItem('costingTab', t); }} sx={{ '& .MuiTabs-indicator': { backgroundColor: '#00A390' }, '& .MuiTab-root.Mui-selected': { color: '#00A390' } }}>
                                <Tab label={<Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><TuneOutlinedIcon sx={{ fontSize: 18 }} />{t('General')}</Box>} value='general' />
                                <Tab label={<Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><FormatListBulletedIcon sx={{ fontSize: 18 }} />{t('Main')}</Box>} value='main' />
                                <Tab label={<Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><WarehouseOutlinedIcon sx={{ fontSize: 18 }} />{t('Pahest')}</Box>} value='pahest' />
                                <Tab label={<Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><InsightsIcon sx={{ fontSize: 18 }} />Վերլուծություն</Box>} value='analysis' />
                                <Tab label={<Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><HistoryIcon sx={{ fontSize: 18 }} />{t('History')}</Box>} value='history' />
                            </TabList>
                        </Box>
                    </Box>
                </TabContext>

                {tab === 'general' && (
                    <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
                            <Button variant='outlined' startIcon={<CategoryOutlinedIcon sx={{ fontSize: 18 }} />} onClick={() => setMaterialsOpen(true)} sx={{ borderRadius: '20px', textTransform: 'none', borderColor: mainPrimaryColor, color: mainPrimaryColor, fontWeight: 600, px: 2.5, fontSize: '14px', '&:hover': { bgcolor: 'rgba(0,171,190,0.06)', borderColor: mainPrimaryColor } }}>{t('Materials Cost Recording')}</Button>
                            <Button variant='outlined' startIcon={<AccountBalanceWalletOutlinedIcon sx={{ fontSize: 18 }} />} onClick={() => setSalaryOpen(true)} sx={{ borderRadius: '20px', textTransform: 'none', borderColor: mainPrimaryColor, color: mainPrimaryColor, fontWeight: 600, px: 2.5, fontSize: '14px', '&:hover': { bgcolor: 'rgba(0,171,190,0.06)', borderColor: mainPrimaryColor } }}>{t('Salary Cost Recording')}</Button>
                            <Button variant='outlined' startIcon={<StraightenIcon sx={{ fontSize: 18 }} />} onClick={() => setVolumesOpen(true)} sx={{ borderRadius: '20px', textTransform: 'none', borderColor: mainPrimaryColor, color: mainPrimaryColor, fontWeight: 600, px: 2.5, fontSize: '14px', '&:hover': { bgcolor: 'rgba(0,171,190,0.06)', borderColor: mainPrimaryColor } }}>{t('Volume Registration')}</Button>
                            <Button variant='outlined' startIcon={<HandshakeOutlinedIcon sx={{ fontSize: 18 }} />} onClick={() => setSubcontractorOpen(true)} sx={{ borderRadius: '20px', textTransform: 'none', borderColor: mainPrimaryColor, color: mainPrimaryColor, fontWeight: 600, px: 2.5, fontSize: '14px', '&:hover': { bgcolor: 'rgba(0,171,190,0.06)', borderColor: mainPrimaryColor } }}>{t('Subcontractor')}</Button>
                            <Button variant='outlined' startIcon={<ReportProblemOutlinedIcon sx={{ fontSize: 18 }} />} onClick={() => setUnforeseenOpen(true)} sx={{ borderRadius: '20px', textTransform: 'none', borderColor: mainPrimaryColor, color: mainPrimaryColor, fontWeight: 600, px: 2.5, fontSize: '14px', '&:hover': { bgcolor: 'rgba(0,171,190,0.06)', borderColor: mainPrimaryColor } }}>{t('Unforeseen Works')}</Button>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'stretch', mb: 2 }}>
                            <Box sx={{ flex: 2, minHeight: 220 }}>
                                <CombinedCostWidget estimate={selectedEstimate} pahestEntries={pahestEntries} costHistory={costHistory} height={220} />
                            </Box>
                            <Box sx={{ flex: 1, minHeight: 220 }}>
                                <OtherExpensesChart estimate={selectedEstimate} height={220} />
                            </Box>
                        </Box>
                        {(() => {
                            const actualMaterials = pahestEntries.reduce((sum, e) => sum + e.history.reduce((s, r) => s + r.quantity * r.costPerUnit, 0), 0);
                            const actualLabor = costHistory.filter(e => !e.paymentMethod?.startsWith('pahest_')).reduce((s, e) => s + e.total, 0);
                            const actualTotal = actualMaterials + actualLabor;
                            const laborCurrent = new Set(costHistory.filter(e => e.laborItemId && !e.paymentMethod?.startsWith('pahest_')).map(e => e.laborItemId)).size;
                            const laborCompleted = estimateSnapshot ? estimateSnapshot.laborRows.filter(row => {
                                const spent = parseFloat(actualData[row._id]?.spent || '0') || 0;
                                return row.cost > 0 && spent >= row.cost;
                            }).length : 0;
                            const materialCurrent = pahestEntries.length;
                            const materialCompleted = pahestEntries.filter(e => (e.costedQuantity ?? 0) >= e.estimateQuantity && e.estimateQuantity > 0).length;
                            return (
                                <>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                                    <TripleParamCard label={t('Quantity of Labor')} icon={<EngineeringIcon sx={{ fontSize: 22 }} />} estimate={selectedEstimate.laborItemCount ?? 0} current={laborCurrent} completed={laborCompleted} subLabel='Նախահաշիվ / Ընթացիկ / Ավարտված' />
                                    <TripleParamCard label={t('Quantity of Materials')} icon={<BuildIcon sx={{ fontSize: 22 }} />} estimate={selectedEstimate.materialItemCount ?? 0} current={materialCurrent} completed={materialCompleted} subLabel='Նախահաշիվ / Ընթացիկ / Ավարտված' />
                                </Box>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
                                    <MetricCard label={t('Total Cost')} value={selectedEstimate.totalCostWithOtherExpenses ?? selectedEstimate.totalCost ?? 0} actualValue={actualTotal > 0 ? actualTotal : undefined} />
                                    <MetricCard label={t('Materials Cost')} value={selectedEstimate.materialTotalCost ?? 0} actualValue={actualMaterials > 0 ? actualMaterials : undefined} />
                                    <MetricCard label={t('Labor Cost')} value={selectedEstimate.laborTotalCost ?? 0} actualValue={actualLabor > 0 ? actualLabor : undefined} />
                                </Box>
                                </>
                            );
                        })()}
                        <BreakdownTable estimate={selectedEstimate} />
                    </Box>
                )}

                {tab === 'main' && (
                    <Box ref={mainScrollContainerRef} sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '1.5rem', mb: 3 }}>{selected.estimateName}</Typography>
                        <CostingTable estimate={selectedEstimate} estimateSnapshot={estimateSnapshot} onCostAdded={handleCostAdded} actualData={actualData} onActualDataChange={setActualData} costHistory={costHistory} />
                        {unforeseenEstimate && (() => {
                            return (
                            <Box ref={unforeseenSectionRef} sx={{ mt: 4, borderTop: '2px solid #ffe0cc', pt: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <ReportProblemOutlinedIcon sx={{ fontSize: 20, color: '#e65100' }} />
                                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#e65100' }}>Չնախատեսված աշխատանքներ</Typography>
                                    <Typography sx={{ fontSize: '0.82rem', color: '#999', ml: 0.5 }}>({unforeseenEstimate.name})</Typography>
                                    <IconButton size='small' onClick={handleDeleteUnforeseen} sx={{ ml: 'auto', color: '#bbb', '&:hover': { color: '#e53935' } }}>
                                        <DeleteOutlineIcon fontSize='small' />
                                    </IconButton>
                                </Box>
                                <CostingTable estimate={unforeseenEstimate} estimateSnapshot={(unforeseenEstimate as any)?.isUnforeseenOnly ? null : unforeseenSnapshot} onCostAdded={handleCostAdded} actualData={actualData} onActualDataChange={setActualData} costHistory={costHistory} />
                            </Box>
                            );
                        })()}
                    </Box>
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
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                <Button variant='outlined' size='small' startIcon={<SaveAltIcon />}
                                    onClick={() => { setExportTypes(new Set(HISTORY_TYPE_GROUPS.filter(g => costHistory.some(e => g.match(e.paymentMethod ?? '', e.isSubcontractor))).map(g => g.key))); setExportOpen(true); }}
                                    sx={{ borderRadius: '20px', borderColor: '#aaa', color: '#555', fontWeight: 600, '&:hover': { backgroundColor: '#f5f5f5', borderColor: '#888' } }}>
                                    {t('Export')}
                                </Button>
                            </Box>
                            <Table size='small' sx={{ minWidth: 700 }}>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#f0fbfc' }}>
                                        <TableCell sx={{ fontWeight: 700, color: '#222' }}>{t('Action Type')}</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#222' }}>{t('Description of Work')}</TableCell>
                                        <TableCell align='center' sx={{ fontWeight: 700, color: '#222' }}>{t('Unit')}</TableCell>
                                        <TableCell align='center' sx={{ fontWeight: 700, color: '#222' }}>{t('Quantity')}</TableCell>
                                        <TableCell align='center' sx={{ fontWeight: 700, color: '#222' }}>{t('Unit Price')}</TableCell>
                                        <TableCell align='center' sx={{ fontWeight: 700, color: '#222' }}>{t('Total')}</TableCell>
                                        <TableCell align='center' sx={{ fontWeight: 700, color: '#222' }}>{t('Date of Creation')}</TableCell>
                                        <TableCell sx={{ width: 40 }} />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {costHistory.map(entry => {
                                        const pm = entry.paymentMethod ?? '';
                                        const actionType = pm === 'salary_druqayin' ? t('Rate-based')
                                            : pm === 'salary_gorcarqayin' ? 'Աշխատավարձ «Գործարքային»'
                                            : pm === 'salary_miavorzham' ? 'Աշխատավարձ «Դրույքային»'
                                            : pm === 'pahest_main' || pm === 'pahest_ayl' ? 'Մուտք Պահեստ'
                                            : pm === 'nyuth_tsakhsagrum' ? 'Նյութի Ծախսագրում'
                                            : pm === 'subcontractor' ? 'Ենթակապալ'
                                            : pm === 'unforeseen' ? 'Չնախատեսված աշխատանքներ'
                                            : entry.isSubcontractor ? t('Subcontractor')
                                            : 'Ծավալի հաշվառում';
                                        return (
                                        <TableRow key={entry.id} hover>
                                            <TableCell sx={{ fontSize: '0.82rem', color: '#555' }}>{actionType}</TableCell>
                                            <TableCell>{entry.workName}</TableCell>
                                            <TableCell align='center'>{entry.unit}</TableCell>
                                            <TableCell align='center'>{entry.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                                            <TableCell align='center'>{formatCurrencyRounded(entry.unitPrice)}</TableCell>
                                            <TableCell align='center' sx={{ fontWeight: 600, color: mainPrimaryColor }}>{formatCurrencyRounded(entry.total)} AMD</TableCell>
                                            <TableCell align='center' sx={{ color: '#888', fontSize: '0.82rem' }}>{entry.addedAt.toLocaleDateString()}</TableCell>
                                            <TableCell padding='none'>
                                                <Tooltip title={t('Remove')}>
                                                    <IconButton size='small' onClick={() => setCostHistory(prev => prev.filter(e => e.id !== entry.id))} sx={{ color: '#ccc', '&:hover': { color: '#e53935' } }}>
                                                        <DeleteOutlineIcon fontSize='small' />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Box>
                    )}
                    </>
                )}

                {tab === 'pahest' && (
                    <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0, pb: 4 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: mainPrimaryColor, mb: 2 }}>Հիմնական նյութեր</Typography>
                        <PahestMainMaterials
                            estimateId={selected.estimateId}
                            unforeseenEstimateId={unforeseenEstimate ? String(unforeseenEstimate._id) : undefined}
                            entries={pahestEntries}
                            onChange={setPahestEntries}
                            onHistoryEntry={e => setCostHistory(prev => [{ id: String(Date.now() + Math.random()), workName: e.workName, unit: e.unit, quantity: e.quantity, unitPrice: e.unitPrice, total: e.total, addedAt: new Date(), paymentMethod: 'pahest_main' }, ...prev])}
                        />
                        <Box sx={{ mt: 4, borderTop: '1px solid #e0f5f7', pt: 3 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: mainPrimaryColor, mb: 2 }}>Այլ նյութեր</Typography>
                            <PahestAylMaterials entries={aylEntries} onChange={setAylEntries}
                                onHistoryEntry={e => setCostHistory(prev => [{ id: String(Date.now() + Math.random()), workName: e.workName, unit: e.unit, quantity: e.quantity, unitPrice: e.unitPrice, total: e.total, addedAt: new Date(), paymentMethod: 'pahest_ayl' }, ...prev])}
                            />
                        </Box>
                    </Box>
                )}

                 {tab === 'analysis' && (
                    <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                        <AnalysisTab estimate={selectedEstimate} estimateSnapshot={estimateSnapshot} unforeseenEstimate={unforeseenEstimate} unforeseenSnapshot={(unforeseenEstimate as any)?.isUnforeseenOnly ? null : unforeseenSnapshot} onDeleteUnforeseen={handleDeleteUnforeseen} actualData={actualData} costHistory={costHistory} />
                    </Box>
                )}
            </Box>


            {/* History export modal */}
            <Dialog open={exportOpen} onClose={() => setExportOpen(false)} maxWidth='xs' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, color: mainPrimaryColor, display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
                    <SaveAltIcon sx={{ fontSize: 22 }} />
                    {t('Export')}
                </DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    <Typography variant='caption' sx={{ color: '#999', display: 'block', mb: 1.5 }}>Select data types to include:</Typography>
                    {HISTORY_TYPE_GROUPS.filter(g => costHistory.some(e => g.match(e.paymentMethod ?? '', e.isSubcontractor))).map(g => (
                        <Box key={g.key}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={exportTypes.has(g.key)}
                                        onChange={ev => setExportTypes(prev => { const s = new Set(prev); ev.target.checked ? s.add(g.key) : s.delete(g.key); return s; })}
                                        size='small'
                                        sx={{ color: mainPrimaryColor, '&.Mui-checked': { color: mainPrimaryColor } }}
                                    />
                                }
                                label={<Typography sx={{ fontSize: '0.9rem' }}>{g.label}</Typography>}
                            />
                        </Box>
                    ))}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setExportOpen(false)} sx={{ borderRadius: '20px', color: '#888' }}>{t('Cancel')}</Button>
                    <Button variant='contained' disabled={exportTypes.size === 0} onClick={() => {
                        const filtered = costHistory.filter(e => exportTypes.has(getHistoryTypeKey(e.paymentMethod ?? '', e.isSubcontractor)));
                        const esc = (s: string | number | undefined) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        const hdr = (label: string) => `<th style="border:1px solid #ccc;padding:6px 8px;font-weight:bold;background:#e0f7fa;">${esc(label)}</th>`;
                        let html = `<table border="1" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;">`;
                        html += `<tr>${hdr(t('Action Type'))}${hdr(t('Description of Work'))}${hdr(t('Unit'))}${hdr(t('Quantity'))}${hdr(t('Unit Price'))}${hdr(t('Total'))}${hdr(t('Date of Creation'))}</tr>`;
                        for (const e of filtered) {
                            const g = HISTORY_TYPE_GROUPS.find(g => g.match(e.paymentMethod ?? '', e.isSubcontractor));
                            const label = g?.label ?? '';
                            html += `<tr>` +
                                `<td style="border:1px solid #ccc;padding:5px 8px;">${esc(label)}</td>` +
                                `<td style="border:1px solid #ccc;padding:5px 8px;">${esc(e.workName)}</td>` +
                                `<td style="border:1px solid #ccc;padding:5px 8px;text-align:center;">${esc(e.unit)}</td>` +
                                `<td style="border:1px solid #ccc;padding:5px 8px;text-align:right;">${Number(e.quantity).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>` +
                                `<td style="border:1px solid #ccc;padding:5px 8px;text-align:right;">${esc(e.unitPrice.toLocaleString(undefined, { maximumFractionDigits: 0 }))}</td>` +
                                `<td style="border:1px solid #ccc;padding:5px 8px;text-align:right;font-weight:bold;">${esc(e.total.toLocaleString(undefined, { maximumFractionDigits: 0 }))} AMD</td>` +
                                `<td style="border:1px solid #ccc;padding:5px 8px;text-align:center;">${esc(new Date(e.addedAt).toLocaleDateString())}</td>` +
                            `</tr>`;
                        }
                        html += '</table>';
                        const full = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/></head><body>${html}</body></html>`;
                        const blob = new Blob([full], { type: 'application/vnd.ms-excel;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a'); a.href = url; a.download = 'history.xls'; a.click();
                        URL.revokeObjectURL(url);
                        setExportOpen(false);
                    }} sx={{ borderRadius: '20px', backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: '#009aab' } }}>
                        {t('Export')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Cost details modal */}
            <Dialog
                open={!!editEntry}
                onClose={(_, reason) => { if (reason !== 'backdropClick') setEditEntry(null); }}
                maxWidth={false}
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, width: '100%', maxWidth: 680, backgroundColor: '#fafcfc', boxShadow: '0 24px 48px rgba(0,0,0,0.12), 0 8px 24px rgba(0,171,190,0.08)' } }}
            >
                <DialogTitle sx={{ fontWeight: 700, color: mainPrimaryColor, pb: 0.5 }}>{t('Cost Details')}</DialogTitle>
                <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                                sx={{ fontSize: '0.72rem', cursor: 'pointer', backgroundColor: editIsSubcontractor ? '#e65100' : '#f4f6f8', color: editIsSubcontractor ? '#fff' : '#666', border: `1px solid ${editIsSubcontractor ? '#e65100' : '#dde0e4'}`, fontWeight: editIsSubcontractor ? 700 : 400, '&:hover': { opacity: 0.85 } }}
                            />
                        </DetailRow>
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
                    <Box sx={{ border: '1px solid #eaedf0', borderRadius: 2, px: 2, backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <SectionBlock num={1} title={t('Labor / Wages')} rows={editLaborRows} onChange={setEditLaborRows} descLabel={t('Payment Method')} onPlusClick={editPaymentMethod ? () => setEditLaborRows(prev => [...prev, { id: String(Date.now() + Math.random()), description: t(editPaymentMethod), quantity: '', unitPrice: '' }]) : openPaymentModal} disabled={editIsSubcontractor} />
                        <SectionBlock num={2} title={t('Operation of Mechanisms')} rows={editMechanismRows} onChange={setEditMechanismRows} descLabel={t('Mechanism Name')} disabled={editIsSubcontractor} />
                        <SectionBlock num={3} title={t('Materials')} rows={editMaterialRows} onChange={setEditMaterialRows} descLabel={t('Material Name')} disabled={editIsSubcontractor} last />
                    </Box>
                    <TextField
                        label={t('Note')}
                        value={editNote}
                        onChange={e => setEditNote(e.target.value)}
                        size='small'
                        fullWidth
                        multiline
                        rows={2}
                        placeholder={t('Additional notes') + '...'}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.88rem', '& fieldset': { borderColor: '#e8f7f9' }, '&:hover fieldset': { borderColor: '#b2e8ed' }, '&.Mui-focused fieldset': { borderColor: mainPrimaryColor, borderWidth: 1 } }, '& .MuiInputLabel-root': { fontSize: '0.85rem', color: '#999' }, '& .MuiInputLabel-root.Mui-focused': { color: mainPrimaryColor } }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setEditEntry(null)} sx={{ borderRadius: '20px', color: '#888' }}>{t('Cancel')}</Button>
                    <Button variant='contained' onClick={handleEditSave} sx={{ borderRadius: '20px', backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: '#009aab' } }}>{t('Save')}</Button>
                </DialogActions>
            </Dialog>

            {/* Payment Method modal */}
            <Dialog open={paymentModalOpen} onClose={(_, reason) => { if (reason !== 'backdropClick') setPaymentModalOpen(false); }} maxWidth='xs' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, color: mainPrimaryColor, pb: 0.5 }}>{t('Payment Method')}</DialogTitle>
                <DialogContent sx={{ pt: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <RadioGroup value={tempPaymentMethod} onChange={e => setTempPaymentMethod(e.target.value)}>
                        {(['Hourly', 'Piece-rate', 'Rate-based'] as const).map(method => (
                            <FormControlLabel key={method} value={method} control={<Radio sx={{ color: mainPrimaryColor, '&.Mui-checked': { color: mainPrimaryColor } }} />} label={<Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{t(method)}</Typography>} />
                        ))}
                    </RadioGroup>
                    {tempPaymentMethod && (
                        <TextField label={t('Value')} value={tempPaymentValue} onChange={e => setTempPaymentValue(e.target.value)} size='small' fullWidth placeholder='0' type='number' inputProps={{ min: 0 }} />
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setPaymentModalOpen(false)} sx={{ borderRadius: '20px', color: '#888' }}>{t('Cancel')}</Button>
                    <Button variant='contained' onClick={handlePaymentSave} disabled={!tempPaymentMethod} sx={{ borderRadius: '20px', backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: '#009aab' } }}>{t('Save')}</Button>
                </DialogActions>
            </Dialog>

            {selected && (
                <>
                <VolumesDialog
                    open={volumesOpen}
                    onClose={() => setVolumesOpen(false)}
                    estimate={selectedEstimate}
                    estimateSnapshot={estimateSnapshot}
                    unforeseenEstimate={unforeseenEstimate}
                    unforeseenSnapshot={(unforeseenEstimate as any)?.isUnforeseenOnly ? null : unforeseenSnapshot}
                    onCostAdded={handleCostAdded}
                    actualData={actualData}
                    onActualUpdate={(rowId, qty, arzhek) => setActualData(prev => {
                        const prevQty = parseFloat(prev[rowId]?.quantity || '0') || 0;
                        const prevSpent = parseFloat(prev[rowId]?.spent || '0') || 0;
                        const newQty = prevQty + qty;
                        const newSpent = prevSpent + qty * arzhek;
                        const unitPrice = newQty > 0 && newSpent > 0 ? String(newSpent / newQty) : prev[rowId]?.unitPrice || '';
                        return { ...prev, [rowId]: { quantity: String(newQty), unitPrice, spent: String(newSpent) } };
                    })}
                />
                <MaterialsDialog
                    open={materialsOpen}
                    onClose={() => setMaterialsOpen(false)}
                    estimate={selectedEstimate}
                    estimateSnapshot={estimateSnapshot}
                    unforeseenEstimate={unforeseenEstimate}
                    unforeseenSnapshot={(unforeseenEstimate as any)?.isUnforeseenOnly ? null : unforeseenSnapshot}
                    pahestEntries={pahestEntries}
                    onPahestUpdate={handlePahestCostedUpdate}
                    onCostAdded={handleCostAdded}
                />
                <SalaryDialog
                    open={salaryOpen}
                    onClose={() => setSalaryOpen(false)}
                    estimate={selectedEstimate}
                    estimateSnapshot={estimateSnapshot}
                    unforeseenEstimate={unforeseenEstimate}
                    unforeseenSnapshot={(unforeseenEstimate as any)?.isUnforeseenOnly ? null : unforeseenSnapshot}
                    onEntrySaved={(entry, replaceId) => setCostHistory(prev =>
                        replaceId ? prev.map(e => e.id === replaceId ? entry : e) : [entry, ...prev]
                    )}
                    actualData={actualData}
                    costHistory={costHistory}
                />
                <SubcontractorDialog
                    open={subcontractorOpen}
                    onClose={() => setSubcontractorOpen(false)}
                    onCostAdded={handleCostAdded}
                />
                <UnforeseenDialog
                    open={unforeseenOpen}
                    onClose={() => setUnforeseenOpen(false)}
                    activeEstimateId={unforeseenEstimate ? String(unforeseenEstimate._id) : undefined}
                    onEstimateSelected={handleUnforeseenEstimateSelected}
                />
                </>
            )}
        </PageContents>
    );
}

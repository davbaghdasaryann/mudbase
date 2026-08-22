'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box, Button, Tab, Typography, Table, TableHead, TableBody, TableRow, TableCell,
    Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip,
    InputBase, Radio, RadioGroup, FormControlLabel, Checkbox, TextField, Chip, Paper, CircularProgress,
} from '@mui/material';
import { TabContext, TabList } from '@mui/lab';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddCardOutlinedIcon from '@mui/icons-material/AddCardOutlined';
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
import SmallScaleDialog from './SmallScaleDialog';
import EstimatePageDialog from '../estimates/EstimateDialog';
import OtherCostsDialog from './OtherCostsDialog';
import AnalysisTab from './AnalysisTab';
import { mainPrimaryColor } from '@/theme';
import * as EstimatesApi from '@/api/estimate';
import * as Api from '@/api';
import { formatCurrencyRounded, formatCurrencyRoundedSymbol } from '@/lib/format_currency';
import CostBreakdownChart from '@/app/analysis/structural/CostBreakdownChart';
import { estimateOtherExpensesItems } from '@/data/estimate_manual';
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
    workVolume?: number;
    materialItemId?: string;
    estimatedLaborId?: string;
    groupName?: string;
}

interface SnapshotLaborRow {
    _id: string;
    laborOfferItemName: string;
    catalogName: string;
    unitSymbol: string;
    quantity: number;
    changableAveragePrice: number;
    cost: number;
    materialTotalCost?: number;
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
    smallScaleEstimateSnapshot?: EstimateSnapshot;
    smallScaleEstimateId?: string;
    smallScaleCostingId?: string;
    localEstimateId?: string;
    vatDeduction?: number;
    climateImpact?: number;
    temporaryStructures?: number;
    transportationCosts?: number;
    commissioningCosts?: number;
    stateFees?: number;
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
    { key: 'salary_miavorzham', label: 'Աշխատավարձ «Ժամավճարային»', match: pm => pm === 'salary_miavorzham' },
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

type TabValue = 'general' | 'main' | 'history' | 'pahest' | 'analysis' | 'unforeseen';

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

    const materialsTotal = costHistory.filter(e => e.paymentMethod === 'nyuth_tsakhsagrum').reduce((s, e) => s + e.total, 0);

    const laborTotal = costHistory
        .filter(e => !e.paymentMethod?.startsWith('pahest_') && e.paymentMethod !== 'nyuth_tsakhsagrum')
        .reduce((s, e) => s + e.total, 0);

    const data = [
        { key: 'labor',     name: t('Labor'),         value: laborTotal },
        { key: 'materials', name: t('Materials'),      value: materialsTotal },
        { key: 'other',     name: t('Other Expenses'), value: 0 },
    ].filter(d => d.value > 0);

    const total = data.reduce((s, d) => s + d.value, 0);

    return (
        <Paper elevation={0} sx={{ flex: 1, border: '1px solid #d0f0f4', borderRadius: 3, p: 2.5, background: '#fff', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            <Typography variant='caption' sx={{ fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem', textAlign: 'center', mb: 0.5 }}>{t('Actual')}</Typography>
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

function CombinedCostWidget({ estimate, pahestEntries, costHistory, aylEntries, extraActualCosts = 0, height = 240 }: { estimate: EstimatesApi.ApiEstimate; pahestEntries: PahestEntry[]; costHistory: CostHistoryEntry[]; aylEntries?: AylEntry[]; extraActualCosts?: number; height?: number }) {
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
        const materialsTotal = costHistory.filter(e => e.paymentMethod === 'nyuth_tsakhsagrum').reduce((s, e) => s + e.total, 0);
        const laborTotal = costHistory.filter(e => !e.paymentMethod?.startsWith('pahest_') && e.paymentMethod !== 'nyuth_tsakhsagrum').reduce((s, e) => s + e.total, 0);
        const aylMatTotal = costHistory.filter(e => e.paymentMethod === 'pahest_ayl').reduce((s, e) => s + e.total, 0);
        const otherTotal = aylMatTotal + extraActualCosts;
        const total = materialsTotal + laborTotal + otherTotal;
        if (total === 0) return [];
        return [
            { key: 'labor',     name: t('Labor'),         value: laborTotal,     pct: ((laborTotal / total) * 100).toFixed(1) },
            { key: 'materials', name: t('Materials'),      value: materialsTotal, pct: ((materialsTotal / total) * 100).toFixed(1) },
            { key: 'other',     name: t('Other Expenses'), value: otherTotal,     pct: ((otherTotal / total) * 100).toFixed(1) },
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
                    <Pie data={data} cx='50%' cy='50%' innerRadius={38} outerRadius={62} paddingAngle={2} dataKey='value' strokeWidth={0} minAngle={6}>
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
            {data.map(d => {
                const seg = COST_SEGMENTS.find(s => s.key === d.key);
                return (
                    <Box key={d.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: seg?.dot ?? '#ccc', flexShrink: 0 }} />
                        <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>{d.name} {d.pct}%</Typography>
                        <Typography variant='caption' sx={{ color: '#aaa', fontSize: '0.65rem', ml: 'auto' }}>{Math.round(d.value).toLocaleString()}</Typography>
                    </Box>
                );
            })}
        </Box>
    );

    return (
        <Paper elevation={0} sx={{ height: '100%', border: '1px solid #d0f0f4', borderRadius: 3, p: 2, background: '#fff', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', gap: 1, flex: 1, minHeight: 0 }}>
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

const OE_BAR_GRADS = [
    { top: '#00CCDD', bottom: '#00899B', stroke: '#006e7e' },
    { top: '#4EE89A', bottom: '#1CA461', stroke: '#148048' },
    { top: '#A8DED9', bottom: '#5CB8B0', stroke: '#44908a' },
    { top: '#27C97A', bottom: '#00855A', stroke: '#006644' },
    { top: '#6FE0D8', bottom: '#2BADA6', stroke: '#1e8880' },
    { top: '#00B28F', bottom: '#007060', stroke: '#005548' },
    { top: '#C5E8C6', bottom: '#7DB87E', stroke: '#5e9660' },
    { top: '#3DC9BF', bottom: '#1A8A84', stroke: '#116b66' },
];
const OE_ACT_GRAD = { top: '#FF8A65', bottom: '#E64A19', stroke: '#bf360c' };
const oeFormatY = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${Math.round(v / 1_000)}K` : String(Math.round(v));

function OtherExpenseBarWidget({ expenseKey, label, estimatedValue, actualValue, gradIndex, height = 200 }: { expenseKey: string; label: string; estimatedValue: number; actualValue: number; gradIndex: number; height?: number }) {
    const chartH = Math.max(80, height - 72);
    const estGrad = OE_BAR_GRADS[gradIndex % OE_BAR_GRADS.length];
    const estId = `oe-est-${expenseKey}`;
    const actId = `oe-act-${expenseKey}`;

    if (estimatedValue === 0 && actualValue === 0) return null;

    const data = [
        { name: "Նախահաշիվ", value: estimatedValue, gradId: estId, dotColor: estGrad.top, stroke: estGrad.stroke },
        { name: "Փաստացի", value: actualValue, gradId: actId, dotColor: OE_ACT_GRAD.top, stroke: OE_ACT_GRAD.stroke },
    ];

    return (
        <Paper elevation={0} sx={{ border: '1px solid #d0f0f4', borderRadius: 3, p: 2, background: '#fff', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', minHeight: height }}>
            <Typography variant='caption' sx={{ fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem', textAlign: 'center', mb: 0.5, display: 'block' }}>{label}</Typography>
            <Box sx={{ flex: 1, minHeight: chartH }}>
                <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap='40%'>
                        <defs>
                            <linearGradient id={estId} x1='0' y1='0' x2='0' y2='1'>
                                <stop offset='0%' stopColor={estGrad.top} />
                                <stop offset='100%' stopColor={estGrad.bottom} />
                            </linearGradient>
                            <linearGradient id={actId} x1='0' y1='0' x2='0' y2='1'>
                                <stop offset='0%' stopColor={OE_ACT_GRAD.top} />
                                <stop offset='100%' stopColor={OE_ACT_GRAD.bottom} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray='3 3' stroke='#f0f0f0' />
                        <XAxis dataKey='name' tick={false} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={oeFormatY} tick={{ fontSize: 10, fill: '#9e9e9e' }} axisLine={false} tickLine={false} width={40} />
                        <RechartsTooltip content={({ active, payload, label: lbl }: any) => {
                            if (!active || !payload?.length) return null;
                            return (
                                <Paper elevation={3} sx={{ p: 1.5, borderRadius: 2, minWidth: 130 }}>
                                    <Typography variant='caption' sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>{lbl}</Typography>
                                    <Typography variant='body2' sx={{ color: '#00ABBE' }}>{Number(payload[0].value).toLocaleString()} AMD</Typography>
                                </Paper>
                            );
                        }} cursor={{ fill: 'rgba(0,171,190,0.06)' }} />
                        <Bar dataKey='value' radius={[4, 4, 0, 0]} maxBarSize={52}>
                            {data.map(d => <Cell key={d.name} fill={`url(#${d.gradId})`} stroke={d.stroke} strokeWidth={0.5} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', mt: 0.5 }}>
                {data.map(d => (
                    <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: d.dotColor, flexShrink: 0 }} />
                        <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>{d.name}</Typography>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
}


function ProjectCompletionWidget({ estimateSnapshot, actualData, height = 220 }: {
    estimateSnapshot?: EstimateSnapshot | null;
    actualData: Record<string, { quantity: string; unitPrice: string; spent?: string }>;
    height?: number;
}) {
    const { t } = useTranslation();
    const toRowId = (id: unknown): string =>
        typeof id === 'object' && id !== null && 'oid' in (id as any) ? (id as any).oid : String(id ?? '');

    const rows = (estimateSnapshot?.laborRows ?? []).filter(r => Number(r.quantity ?? 0) > 0);
    let totalEst = 0;
    let totalAct = 0;
    let completedRows = 0;

    for (const row of rows) {
        const estQty = Number(row.quantity ?? 0);
        const actQty = parseFloat((actualData[toRowId(row._id)]?.quantity ?? '').replace(',', '.')) || 0;
        totalEst += estQty;
        totalAct += Math.min(actQty, estQty);
        if (actQty >= estQty) completedRows++;
    }


    const pct = totalEst > 0 ? Math.min(100, (totalAct / totalEst) * 100) : null;
    const color = pct === null ? '#bbb' : pct >= 80 ? '#2e7d32' : pct >= 40 ? '#e65100' : '#c62828';
    const lightBg = pct === null ? '#f5f5f5' : pct >= 80 ? 'rgba(46,125,50,0.08)' : pct >= 40 ? 'rgba(230,81,0,0.08)' : 'rgba(198,40,40,0.08)';
    const filled = pct ?? 0;
    const gradOpacityStart = pct === null ? 0.2 : 0.35;
    const gradColor = pct === null ? '#bbb' : pct >= 80 ? '#2e7d32' : pct >= 40 ? '#e65100' : '#c62828';

    return (
        <Paper elevation={0} sx={{ flex: 1, border: '1px solid #d0f0f4', borderRadius: 3, background: '#fff', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 2, pt: 1.5, pb: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant='caption' sx={{ fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem', textAlign: 'center', mb: 1 }}>{t('Completion percentage')}</Typography>
                {pct === null ? (
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center' }}>{t('No data')}</Typography>
                    </Box>
                ) : (
                    <>
                        <Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
                            <ResponsiveContainer width='100%' height='100%'>
                                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                    <defs>
                                        <linearGradient id='comp-grad' x1='0' y1='0' x2='1' y2='1'>
                                            <stop offset='0%' stopColor={gradColor} stopOpacity={gradOpacityStart} />
                                            <stop offset='100%' stopColor={gradColor} stopOpacity={1} />
                                        </linearGradient>
                                    </defs>
                                    <Pie data={[{ v: filled }, { v: 100 - filled }]} startAngle={90} endAngle={-270} cx='50%' cy='50%' innerRadius='48%' outerRadius='68%' paddingAngle={0} dataKey='v' strokeWidth={0}>
                                        <Cell fill='url(#comp-grad)' />
                                        <Cell fill='#f0f0f0' />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography sx={{ fontSize: '1.55rem', fontWeight: 800, color, lineHeight: 1 }}>{pct.toFixed(0)}%</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'center', pb: 2 }}>
                            <Box sx={{ px: 2, py: 0.5, borderRadius: 5, bgcolor: lightBg, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography sx={{ fontSize: '0.73rem', fontWeight: 700, color }}>{completedRows} / {rows.length}</Typography>
                                <Typography sx={{ fontSize: '0.73rem', color: '#888' }}>{t('works completed')}</Typography>
                            </Box>
                        </Box>
                    </>
                )}
            </Box>
        </Paper>
    );
}

function LaborProfitabilityWidget({ estimateSnapshot, actualData, costHistory, height = 220 }: {
    estimateSnapshot?: EstimateSnapshot | null;
    actualData: Record<string, { quantity: string; unitPrice: string; spent?: string }>;
    costHistory: CostHistoryEntry[];
    height?: number;
}) {
    const { t } = useTranslation();
    const toRowId = (id: unknown): string =>
        typeof id === 'object' && id !== null && 'oid' in (id as any) ? (id as any).oid : String(id ?? '');

    const rows = estimateSnapshot?.laborRows ?? [];
    const profitValues: number[] = [];

    for (const row of rows) {
        const rowId = toRowId(row._id);
        const estUP = row.changableAveragePrice ?? 0;
        if (estUP <= 0) continue;
        const actQty = parseFloat((actualData[rowId]?.quantity ?? '').replace(',', '.')) || 0;
        if (actQty <= 0) continue;
        const actLaborTotal = costHistory
            .filter(e => e.laborItemId === rowId && !e.paymentMethod?.startsWith('pahest_'))
            .reduce((s, e) => s + e.total, 0);
        if (actLaborTotal <= 0) continue;
        const actUP = actLaborTotal / actQty;
        profitValues.push((estUP - actUP) / estUP * 100);
    }

    const avgProfit = profitValues.length > 0
        ? profitValues.reduce((s, v) => s + v, 0) / profitValues.length
        : null;

    const RANGE = 60;
    const clamped = avgProfit !== null ? Math.max(-RANGE, Math.min(RANGE, avgProfit)) : 0;
    const filled = 50 + (clamped / RANGE) * 50;
    const color = avgProfit === null ? '#bbb' : avgProfit >= 0 ? '#2e7d32' : '#c62828';
    const bgColor = avgProfit === null ? '#f0f0f0' : avgProfit >= 0 ? 'rgba(46,125,50,0.08)' : 'rgba(198,40,40,0.06)';

    return (
        <Paper elevation={0} sx={{ flex: 1, border: '1px solid #d0f0f4', borderRadius: 3, background: '#fff', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant='caption' sx={{ fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem', textAlign: 'center', mb: 1 }}>{t('Average profitability of works')}</Typography>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {avgProfit === null ? (
                        <Typography variant='body2' color='text.secondary' sx={{ py: 2, textAlign: 'center' }}>{t('No data')}</Typography>
                    ) : (
                        <>
                            <Typography sx={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1.1, mb: 1.5 }}>
                                {avgProfit >= 0 ? '+' : ''}{avgProfit.toFixed(1)}%
                            </Typography>
                            <Box sx={{ width: '100%', px: 1 }}>
                                <Box sx={{ position: 'relative', height: 8, bgcolor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                                    <Box sx={{
                                        position: 'absolute',
                                        height: '100%',
                                        borderRadius: 4,
                                        background: avgProfit >= 0
                                            ? 'linear-gradient(to right, #2e7d32, rgba(46,125,50,0.35))'
                                            : 'linear-gradient(to right, rgba(198,40,40,0.35), #c62828)',
                                        left: avgProfit >= 0 ? '50%' : `${50 + (clamped / 60) * 50}%`,
                                        width: `${Math.abs(clamped / 60) * 50}%`,
                                    }} />
                                    <Box sx={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, bgcolor: '#ccc', transform: 'translateX(-50%)' }} />
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.4 }}>
                                    <Typography sx={{ fontSize: '0.6rem', color: '#bbb' }}>-{60}%</Typography>
                                    <Typography sx={{ fontSize: '0.6rem', color: '#bbb' }}>0</Typography>
                                    <Typography sx={{ fontSize: '0.6rem', color: '#bbb' }}>+{60}%</Typography>
                                </Box>
                            </Box>
                        </>
                    )}
                </Box>
            </Box>
        </Paper>
    );
}

export default function CostingPage() {
    const { t } = useTranslation();
    const VALID_TABS: TabValue[] = ['general', 'main', 'history', 'pahest', 'analysis', 'unforeseen'];
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
    const [smallScaleOpen, setSmallScaleOpen] = useState(false);
    const [smallScaleEditOpen, setSmallScaleEditOpen] = useState(false);
    const [mainEstimateEditOpen, setMainEstimateEditOpen] = useState(false);
    const [otherCostsOpen, setOtherCostsOpen] = useState(false);
    const [vatDeduction, setVatDeduction] = useState(0);
    const [climateImpact, setClimateImpact] = useState(0);
    const [temporaryStructures, setTemporaryStructures] = useState(0);
    const [transportationCosts, setTransportationCosts] = useState(0);
    const [commissioningCosts, setCommissioningCosts] = useState(0);
    const [stateFees, setStateFees] = useState(0);
    const [isForkingEstimate, setIsForkingEstimate] = useState(false);
    const [localEstimateId, setLocalEstimateId] = useState<string>('');
    const [estimationOpen, setEstimationOpen] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);
    const [exportTypes, setExportTypes] = useState<Set<string>>(new Set());
    const [unforeseenEstimate, setUnforeseenEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);
    const [unforeseenCostingId, setUnforeseenCostingId] = useState<string>('');
    const [smallScaleEstimate, setSmallScaleEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);
    const [smallScaleCostingId, setSmallScaleCostingId] = useState<string>('');
    const [estimateSnapshot, setEstimateSnapshot] = useState<EstimateSnapshot | null>(null);
    const [unforeseenSnapshot, setUnforeseenSnapshot] = useState<EstimateSnapshot | null>(null);
    const [smallScaleSnapshot, setSmallScaleSnapshot] = useState<EstimateSnapshot | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const [records, setRecords] = useState<CostingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<CostingRecord | null>(null);
    const [fullEstimate, setFullEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);
    const didRestoreRef = useRef(false);
    const selectedRecordRef = useRef<CostingRecord | null>(null);

    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
    const toggleSection = (key: string) => setCollapsedSections(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });

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
    const smallScaleCostingIdRef = useRef<string>('');
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

    const fetchFullEstimate = useCallback(async (rec: CostingRecord) => {
        try {
            const est = await Api.requestSession<EstimatesApi.ApiEstimate>({ command: 'estimate/get', args: { estimateId: rec.localEstimateId ?? rec.estimateId } });
            if (rec.localEstimateId && rec.estimateId) {
                try {
                    const orig = await Api.requestSession<EstimatesApi.ApiEstimate>({ command: 'estimate/get', args: { estimateId: rec.estimateId } });
                    const existingKeys = new Set((est.otherExpenses ?? []).map((e: any) => Object.keys(e)[0]));
                    const extra = (orig.otherExpenses ?? []).filter((e: any) => !existingKeys.has(Object.keys(e)[0]));
                    setFullEstimate({ ...est, otherExpenses: [...(est.otherExpenses ?? []), ...extra] });
                } catch { setFullEstimate(est); }
            } else {
                setFullEstimate(est);
            }
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => {
        const onFocus = () => { if (selectedRecordRef.current) fetchFullEstimate(selectedRecordRef.current); };
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [fetchFullEstimate]);

    const openRecord = (rec: CostingRecord) => {
        selectedRecordRef.current = rec;
        isLoadingRef.current = true;
        setSelected(rec);
        setFullEstimate(null);
        const rawPahest = (rec.pahestEntries ?? []);
        const ch = (rec.costHistory ?? []).map(e => {
            // Self-heal: backfill laborItemId on old nyuth_tsakhsagrum entries that predate the field
            if (e.paymentMethod === 'nyuth_tsakhsagrum' && !e.laborItemId && e.materialItemId) {
                const pe = rawPahest.find(p => p.materialItemId === e.materialItemId);
                if (pe?.estimatedLaborId) return { ...e, addedAt: new Date(e.addedAt), laborItemId: pe.estimatedLaborId };
            }
            return { ...e, addedAt: new Date(e.addedAt) };
        });
        setCostHistory(ch);
        setPahestEntries((rec.pahestEntries ?? []).map(e => ({
            ...e,
            history: (e.history ?? []).map(r => ({ ...r, addedAt: new Date(r.addedAt) })),
            costedQuantity: ch.filter(c => c.paymentMethod === 'nyuth_tsakhsagrum' && c.materialItemId === e.materialItemId).reduce((s, c) => s + c.quantity, 0),
        })));
        setAylEntries((rec.aylEntries ?? []).map(e => ({
            ...e,
            history: (e.history ?? []).map(r => ({ ...r, addedAt: new Date(r.addedAt) })),
        })));
        const baseActual = rec.actualData ?? {};
        // Self-heal: restore actualData from cost history
        // Volume entries (no paymentMethod) accumulate; salary entries (salary_*) take precedence if present
        const laborEntries = ch.filter(c => c.laborItemId && !c.paymentMethod?.startsWith('pahest_') && c.paymentMethod !== 'nyuth_tsakhsagrum');
        const healedActual = { ...baseActual };
        const laborIds = [...new Set(laborEntries.map(c => c.laborItemId!))];
        const laborLidSet = new Set(laborIds);
        for (const lid of laborIds) {
            const entries = laborEntries.filter(c => c.laborItemId === lid);
            const salaryEntries = entries.filter(c => c.paymentMethod?.startsWith('salary_')).sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
            const volumeEntries = entries.filter(c => !c.paymentMethod);
            // Salary takes precedence; if none, take max(savedActual, historySum) for backward compat:
            // old records have correct actualData but history with only the last entry (replaced, not appended)
            const baseQty = parseFloat((healedActual[lid] ?? {}).quantity || '0') || 0;
            const qty = salaryEntries.length > 0
                ? salaryEntries[0].quantity
                : Math.max(baseQty, volumeEntries.reduce((s, c) => s + c.quantity, 0));
            if (qty > 0) {
                healedActual[lid] = { ...(healedActual[lid] ?? {}), quantity: String(qty) };
            }
        }
        // Remove stale actualData entries for rows whose labor history was deleted
        for (const lid of Object.keys(healedActual)) {
            if (!laborLidSet.has(lid)) delete healedActual[lid];
        }
        setActualData(healedActual);
        setUnforeseenEstimate(null);
        setSmallScaleEstimate(null);
        unforeseenCostingIdRef.current = rec.unforeseenCostingId ?? '';
        setUnforeseenCostingId(rec.unforeseenCostingId ?? '');
        smallScaleCostingIdRef.current = rec.smallScaleCostingId ?? '';
        setSmallScaleCostingId(rec.smallScaleCostingId ?? '');
        setEstimateSnapshot(rec.estimateSnapshot ?? null);
        setUnforeseenSnapshot(rec.unforeseenEstimateSnapshot ?? null);
        setSmallScaleSnapshot(rec.smallScaleEstimateSnapshot ?? null);
        setLocalEstimateId(rec.localEstimateId ?? '');
        setVatDeduction(rec.vatDeduction ?? 0);
        setClimateImpact(rec.climateImpact ?? 0);
        setTemporaryStructures(rec.temporaryStructures ?? 0);
        setTransportationCosts(rec.transportationCosts ?? 0);
        setCommissioningCosts(rec.commissioningCosts ?? 0);
        setStateFees(rec.stateFees ?? 0);
        fetchFullEstimate(rec);
        if (rec.unforeseenEstimateId) {
            Api.requestSession<EstimatesApi.ApiEstimate>({ command: 'estimate/get', args: { estimateId: rec.unforeseenEstimateId } })
                .then(est => setUnforeseenEstimate(est))
                .catch(() => {});
        }
        if (rec.smallScaleEstimateId) {
            Api.requestSession<EstimatesApi.ApiEstimate>({ command: 'estimate/get', args: { estimateId: rec.smallScaleEstimateId } })
                .then(est => setSmallScaleEstimate(est))
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
        setSmallScaleEstimate(null);
        smallScaleCostingIdRef.current = '';
        setSmallScaleCostingId('');
        setEstimateSnapshot(null);
        setUnforeseenSnapshot(null);
        setLocalEstimateId('');
        setSmallScaleSnapshot(null);
        setVatDeduction(0);
        setClimateImpact(0);
        setTemporaryStructures(0);
        setTransportationCosts(0);
        setCommissioningCosts(0);
        setStateFees(0);
        if (typeof window !== 'undefined') window.history.pushState({}, '', '/costing');
    };

    const saveToBackend = useCallback((
        id: string,
        ch: CostHistoryEntry[],
        pe: PahestEntry[],
        ae: AylEntry[],
        ad: Record<string, { quantity: string; unitPrice: string }>,
        unforeseenId?: string | null,
        smallScaleId?: string | null,
        vatDed?: number,
        climatImp?: number,
        tmpStructures?: number,
        transpCosts?: number,
        commCosts?: number,
        stFees?: number
    ) => {
        if (isLoadingRef.current) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            const json: Record<string, unknown> = { costHistory: ch, pahestEntries: pe, aylEntries: ae, actualData: ad };
            if (unforeseenId !== null) { json.unforeseenEstimateId = unforeseenId ?? ''; json.unforeseenCostingId = unforeseenCostingIdRef.current ?? ''; }
            if (smallScaleId !== null) { json.smallScaleEstimateId = smallScaleId ?? ''; json.smallScaleCostingId = smallScaleCostingIdRef.current ?? ''; }
            if (vatDed !== undefined) json.vatDeduction = vatDed;
            if (climatImp !== undefined) json.climateImpact = climatImp;
            if (tmpStructures !== undefined) json.temporaryStructures = tmpStructures;
            if (transpCosts !== undefined) json.transportationCosts = transpCosts;
            if (commCosts !== undefined) json.commissioningCosts = commCosts;
            if (stFees !== undefined) json.stateFees = stFees;
            Api.requestSession({ command: 'costing/save', args: { id }, json }).catch(console.error);
        }, 800);
    }, []);

    useEffect(() => {
        if (!selected) return;
        setRecords(prev => prev.map(r => r._id === selected._id
            ? { ...r, costHistory, pahestEntries, aylEntries, actualData }
            : r
        ));
        saveToBackend(selected._id, costHistory, pahestEntries, aylEntries, actualData, unforeseenEstimate ? String(unforeseenEstimate._id) : null, smallScaleEstimate ? String(smallScaleEstimate._id) : null, vatDeduction, climateImpact, temporaryStructures, transportationCosts, commissioningCosts, stateFees);
    }, [costHistory, pahestEntries, aylEntries, actualData, selected, unforeseenEstimate, smallScaleEstimate, vatDeduction, climateImpact, temporaryStructures, transportationCosts, commissioningCosts, stateFees, saveToBackend]); // eslint-disable-line

    useEffect(() => {
        if (smallScaleOpen || !smallScaleEstimate) return;
        Api.requestSession<EstimatesApi.ApiEstimate>({ command: 'estimate/get', args: { estimateId: String(smallScaleEstimate._id) } })
            .then(est => setSmallScaleEstimate(est)).catch(() => {});
    }, [smallScaleOpen]); // eslint-disable-line

    useEffect(() => {
        const refresh = () => {
            if (!smallScaleEstimate) return;
            Api.requestSession<EstimatesApi.ApiEstimate>({ command: 'estimate/get', args: { estimateId: String(smallScaleEstimate._id) } })
                .then(est => setSmallScaleEstimate(est)).catch(() => {});
        };
        window.addEventListener('focus', refresh);
        return () => window.removeEventListener('focus', refresh);
    }, [smallScaleEstimate]); // eslint-disable-line

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
        if (selected) saveToBackend(selected._id, costHistory, pahestEntries, aylEntries, actualData, '', smallScaleEstimate ? String(smallScaleEstimate._id) : null);
        if (childId) {
            Api.requestSession({ command: 'costing/delete', args: { id: childId } }).catch(console.error);
            setRecords(prev => prev.filter(r => r._id !== childId));
        }
    }, [selected, costHistory, pahestEntries, aylEntries, actualData, smallScaleEstimate, saveToBackend]); // eslint-disable-line

    const handleUnforeseenEstimateSelected = useCallback(async (est: EstimatesApi.ApiEstimate) => {
        setUnforeseenEstimate(est);
        setTab('unforeseen');
        localStorage.setItem('costingTab', 'unforeseen');
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
        saveToBackend(selected._id, costHistory, pahestEntries, aylEntries, actualData, String(est._id), smallScaleEstimate ? String(smallScaleEstimate._id) : null);
    }, [selected, costHistory, pahestEntries, aylEntries, actualData, smallScaleEstimate, saveToBackend]); // eslint-disable-line

    const handleSmallScaleEstimateSelected = useCallback(async (est: EstimatesApi.ApiEstimate) => {
        setSmallScaleEstimate(est);
        if (!selected) return;
        let newId = smallScaleCostingIdRef.current;
        if (!newId) {
            const created = await Api.requestSession<CostingRecord>({
                command: 'costing/create',
                args: { estimateId: String(est._id), estimateName: est.name, isUnforeseen: 'true', parentCostingId: selected._id },
            });
            setRecords(prev => [created, ...prev]);
            newId = created._id;
            smallScaleCostingIdRef.current = newId;
            setSmallScaleCostingId(newId);
            if (created.estimateSnapshot) setSmallScaleSnapshot(created.estimateSnapshot);
        }
        saveToBackend(selected._id, costHistory, pahestEntries, aylEntries, actualData, unforeseenEstimate ? String(unforeseenEstimate._id) : null, String(est._id));
    }, [selected, costHistory, pahestEntries, aylEntries, actualData, unforeseenEstimate, saveToBackend]); // eslint-disable-line

    const handleDeleteSmallScale = useCallback(() => {
        const childId = smallScaleCostingIdRef.current;
        setSmallScaleEstimate(null);
        smallScaleCostingIdRef.current = '';
        setSmallScaleCostingId('');
        if (selected) saveToBackend(selected._id, costHistory, pahestEntries, aylEntries, actualData, unforeseenEstimate ? String(unforeseenEstimate._id) : null, '');
        if (childId) {
            Api.requestSession({ command: 'costing/delete', args: { id: childId } }).catch(console.error);
            setRecords(prev => prev.filter(r => r._id !== childId));
        }
    }, [selected, costHistory, pahestEntries, aylEntries, actualData, unforeseenEstimate, saveToBackend]); // eslint-disable-line

    const handleEstimationOpen = async () => {
        if (!selected) return;
        if (localEstimateId) { setMainEstimateEditOpen(true); return; }
        setIsForkingEstimate(true);
        try {
            const result = await Api.requestSession<{ localEstimateId: string; snapshot: EstimateSnapshot; actualData: Record<string, { quantity: string; unitPrice: string }> }>({
                command: 'costing/fork_estimate', args: { id: selected._id },
            });
            setLocalEstimateId(result.localEstimateId);
            setEstimateSnapshot(result.snapshot);
            isLoadingRef.current = true;
            setActualData(result.actualData);
            setTimeout(() => { isLoadingRef.current = false; }, 100);
            setMainEstimateEditOpen(true);
        } catch (e) { console.error(e); }
        finally { setIsForkingEstimate(false); }
    };

    const handleCostAdded = (entry: CostHistoryEntry) => {
        setCostHistory(prev => [entry, ...prev]);
    };

    const handlePahestCostedUpdate = (materialItemId: string, qty: number, costPerUnit: number = 0, estimatedLaborId?: string) => {
        setPahestEntries(prev => prev.map(e => {
            if (e.materialItemId !== materialItemId) return e;
            const laborMatch = estimatedLaborId
                ? (e.estimatedLaborId === estimatedLaborId || !e.estimatedLaborId)
                : !e.estimatedLaborId;
            if (!laborMatch) return e;
            return {
                ...e,
                costedQuantity: (e.costedQuantity ?? 0) + qty,
                history: [...e.history, { quantity: qty, costPerUnit, addedAt: new Date(), attributedLaborId: estimatedLaborId || undefined }],
            };
        }));
    };

    const handleAylCostedUpdate = (id: string, qty: number) => {
        setAylEntries(prev => prev.map(e =>
            e.id === id
                ? { ...e, tsakh: String(Math.round((parseFloat(e.tsakh || '0') + qty) * 1000) / 1000) }
                : e
        ));
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
                                <Tab label={<Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><InsightsIcon sx={{ fontSize: 18 }} />{t('Analysis')}</Box>} value='analysis' />
                                <Tab label={<Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><ReportProblemOutlinedIcon sx={{ fontSize: 18 }} />Չնախատեսված</Box>} value='unforeseen' />
                                <Tab label={<Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><HistoryIcon sx={{ fontSize: 18 }} />{t('History')}</Box>} value='history' />
                            </TabList>
                        </Box>
                    </Box>
                </TabContext>

                {tab === 'general' && (
                    <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                        <Box onClick={() => toggleSection('quick')} sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mb: 1, userSelect: 'none' }}>
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('Quick actions')}</Typography>
                            <ExpandMoreIcon sx={{ fontSize: 16, color: '#9ca3af', transform: collapsedSections.has('quick') ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                        </Box>
                        {!collapsedSections.has('quick') && <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
                            {[
                                { icon: <RequestQuoteOutlinedIcon sx={{ fontSize: 30, color: '#7b1fa2', opacity: 0.55 }} />, label: 'Ընդհանուր նախահաշիվ', onClick: handleEstimationOpen, accent: '#7b1fa2', hoverBg: 'rgba(123,31,162,0.06)' },
                                { icon: <StraightenIcon sx={{ fontSize: 30, color: '#E65100', opacity: 0.55 }} />, label: t('Volume Registration'), onClick: () => setVolumesOpen(true), accent: '#E65100', hoverBg: 'rgba(230,81,0,0.06)' },
                                { icon: <CategoryOutlinedIcon sx={{ fontSize: 30, color: mainPrimaryColor, opacity: 0.55 }} />, label: t('Materials Cost Recording'), onClick: () => setMaterialsOpen(true), accent: mainPrimaryColor, hoverBg: 'rgba(0,171,190,0.06)' },
                                { icon: <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 30, color: '#1565c0', opacity: 0.55 }} />, label: t('Salary Cost Recording'), onClick: () => setSalaryOpen(true), accent: '#1565c0', hoverBg: 'rgba(21,101,192,0.06)' },
                                { icon: <BuildIcon sx={{ fontSize: 30, color: '#4caf50', opacity: 0.55 }} />, label: 'Փոքրածավալ', onClick: () => setSmallScaleOpen(true), accent: '#4caf50', hoverBg: 'rgba(76,175,80,0.06)' },
                                { icon: <AddCardOutlinedIcon sx={{ fontSize: 30, color: '#e53935', opacity: 0.55 }} />, label: 'Այլ ծախսեր', onClick: () => setOtherCostsOpen(true), accent: '#e53935', hoverBg: 'rgba(229,57,53,0.06)' },
                                { icon: <TuneOutlinedIcon sx={{ fontSize: 30, color: '#546e7a', opacity: 0.55 }} />, label: 'Վերադիր ծախսեր', onClick: () => {}, accent: '#546e7a', hoverBg: 'rgba(84,110,122,0.06)' },
                            ].map(({ icon, label, onClick, accent, hoverBg }) => (
                                <Box key={label} onClick={onClick} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.75, width: 140, height: 108, px: 1.5, py: 1.5, bgcolor: '#fff', borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.15s, background-color 0.15s', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.13)', transform: 'translateY(-2px)', bgcolor: hoverBg }, '&:hover svg': { opacity: '1 !important' } }}>
                                    {icon}
                                    <Typography sx={{ fontSize: '0.76rem', fontWeight: 600, color: '#1a1a1a', textAlign: 'center', lineHeight: 1.3 }}>{label}</Typography>
                                </Box>
                            ))}
                        </Box>}
                        <Box onClick={() => toggleSection('overview')} sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mb: 1, userSelect: 'none' }}>
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('Overview')}</Typography>
                            <ExpandMoreIcon sx={{ fontSize: 16, color: '#9ca3af', transform: collapsedSections.has('overview') ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                        </Box>
                        {!collapsedSections.has('overview') && <><Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'stretch', mb: 2 }}>
                            <Box sx={{ flex: 1.5, minHeight: 220 }}>
                                <CombinedCostWidget estimate={selectedEstimate} pahestEntries={pahestEntries} costHistory={costHistory} aylEntries={aylEntries} extraActualCosts={vatDeduction + climateImpact + temporaryStructures + transportationCosts + commissioningCosts + stateFees + Math.round(smallScaleEstimate?.totalCost ?? 0)} height={220} />
                            </Box>
                            <Box sx={{ flex: 1, minHeight: 220 }}>
                                <ProjectCompletionWidget estimateSnapshot={estimateSnapshot} actualData={actualData} height={220} />
                            </Box>
                            <Box sx={{ flex: 1, minHeight: 220 }}>
                                <LaborProfitabilityWidget estimateSnapshot={estimateSnapshot} actualData={actualData} costHistory={costHistory} height={220} />
                            </Box>
                        </Box>
                        {(() => {
                            const actualMaterials = costHistory.filter(e => e.paymentMethod === 'nyuth_tsakhsagrum').reduce((s, e) => s + e.total, 0);
                            const actualLabor = costHistory.filter(e => !e.paymentMethod?.startsWith('pahest_') && e.paymentMethod !== 'nyuth_tsakhsagrum').reduce((s, e) => s + e.total, 0);
                            const actualTotal = actualMaterials + actualLabor;
                            const toRowId = (id: unknown): string => typeof id === 'object' && id !== null && 'oid' in (id as any) ? (id as any).oid : String(id);
                            const completedRowIds = new Set(estimateSnapshot ? estimateSnapshot.laborRows.filter(row => {
                                const rid = toRowId(row._id);
                                const actQty = parseFloat(actualData[rid]?.quantity || '0') || 0;
                                const estQty = Number(row.quantity ?? 0);
                                return estQty > 0 && actQty >= estQty;
                            }).map(row => toRowId(row._id)) : []);
                            const laborCompleted = completedRowIds.size;
                            const laborCurrent = new Set(costHistory.filter(e => e.laborItemId && !e.paymentMethod?.startsWith('pahest_') && !completedRowIds.has(e.laborItemId)).map(e => e.laborItemId)).size;
                            const materialCompleted = pahestEntries.filter(e => e.estimateQuantity > 0 && (e.costedQuantity ?? 0) >= e.estimateQuantity).length;
                            const materialCurrent = pahestEntries.filter(e => e.quantity > 0 && (e.costedQuantity ?? 0) < e.estimateQuantity).length;
                            return (
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2, mb: 2 }}>
                                    <TripleParamCard label={t('Quantity of Labor')} icon={<EngineeringIcon sx={{ fontSize: 22 }} />} estimate={selectedEstimate.laborItemCount ?? 0} current={laborCurrent} completed={laborCompleted} subLabel='Նախահաշիվ / Ընթացիկ / Ավարտված' />
                                    <TripleParamCard label={t('Quantity of Materials')} icon={<BuildIcon sx={{ fontSize: 22 }} />} estimate={selectedEstimate.materialItemCount ?? 0} current={materialCurrent} completed={materialCompleted} subLabel='Նախահաշիվ / Ընթացիկ / Ավարտված' />
                                    <MetricCard label={t('Total Cost')} value={selectedEstimate.totalCostWithOtherExpenses ?? selectedEstimate.totalCost ?? 0} actualValue={actualTotal > 0 ? actualTotal : undefined} />
                                    <MetricCard label={t('Materials Cost')} value={selectedEstimate.materialTotalCost ?? 0} actualValue={actualMaterials > 0 ? actualMaterials : undefined} />
                                    <MetricCard label={t('Labor Cost')} value={selectedEstimate.laborTotalCost ?? 0} actualValue={actualLabor > 0 ? actualLabor : undefined} />
                                </Box>
                            );
                        })()}</>}
                        <Box onClick={() => toggleSection('other')} sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mb: 1, mt: 1, userSelect: 'none' }}>
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('Other Expenses')}</Typography>
                            <ExpandMoreIcon sx={{ fontSize: 16, color: '#9ca3af', transform: collapsedSections.has('other') ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                        </Box>
                        {!collapsedSections.has('other') && (() => {
                            const base = selectedEstimate.totalCost ?? 0;
                            const expenses = (selectedEstimate.otherExpenses ?? []).filter(exp => {
                                const key = Object.keys(exp)[0];
                                return key && key !== 'typeOfCost' && (exp[key] ?? 0) > 0;
                            });
                            const aylActual = Math.round(aylEntries.reduce((s, e) => s + (parseFloat(e.tsakh || '0') || 0) * (parseFloat(e.costPerUnit || '0') || 0), 0));
                            // smallScaleConstructionWork is the primary key; fall back to Materials if Work not in estimate
                            const SSW_KEY = 'smallScaleConstructionWork';
                            const SSM_KEY = 'smallScaleConstructionMaterials';
                            const UF_KEY = 'unforeseenWorks';
                            const _toRId = (id: unknown): string => typeof id === 'object' && id !== null && 'oid' in (id as any) ? (id as any).oid : String(id ?? '');
                            // Use actualData keys not in the main snapshot — robust to stale unforeseen snapshot
                            const mainRowIds = new Set((estimateSnapshot?.laborRows ?? []).map(r => _toRId(r._id)));
                            const ufActual = Math.round(
                                Object.entries(actualData)
                                    .filter(([id]) => id && !mainRowIds.has(id))
                                    .reduce((s, [id, data]) => {
                                        const spent = parseFloat(((data as any).spent ?? '').replace(',', '.')) || 0;
                                        const salary = costHistory.filter(e => _toRId(e.laborItemId) === id).reduce((ss, e) => ss + e.total, 0);
                                        return s + spent + salary;
                                    }, 0)
                            );
                            const ufEstimated = Math.round(
                                unforeseenEstimate?.totalCost ??
                                (unforeseenSnapshot?.laborRows ?? []).reduce((s, r) => s + Number(r.quantity ?? 0) * Number(r.changableAveragePrice ?? 0), 0)
                            );
                            const ssEstimated = Math.round(smallScaleEstimate?.totalCost ?? 0);
                            const VAT_KEY = 'valueAddedTax';
                            const CLIMATE_KEY = 'climaticImpactCosts';
                            const vatActual = vatDeduction;
                            const climateActual = climateImpact;
                            const hasSSwInExpenses = expenses.some(e => Object.keys(e)[0] === SSW_KEY);
                            const hasSSmInExpenses = expenses.some(e => Object.keys(e)[0] === SSM_KEY);
                            const hasUFInExpenses = expenses.some(e => Object.keys(e)[0] === UF_KEY);
                            const needsSSWExtra = !hasSSwInExpenses && (ssEstimated > 0 || smallScaleEstimate != null);
                            const needsSSMExtra = !hasSSmInExpenses && aylActual > 0;
                            const extraSSCount = (needsSSWExtra ? 1 : 0) + (needsSSMExtra ? 1 : 0);
                            const extraWidgets = [
                                ...(needsSSWExtra ? [{ key: SSW_KEY, estimatedValue: 0, actualValue: ssEstimated, gradIndex: expenses.length }] : []),
                                ...(needsSSMExtra ? [{ key: SSM_KEY, estimatedValue: 0, actualValue: aylActual, gradIndex: expenses.length + (needsSSWExtra ? 1 : 0) }] : []),
                                ...(!hasUFInExpenses && (ufEstimated > 0 || ufActual > 0) ? [{ key: UF_KEY, estimatedValue: ufEstimated, actualValue: ufActual, gradIndex: expenses.length + extraSSCount }] : []),
                            ];
                            if (expenses.length === 0 && extraWidgets.length === 0) return null;
                            return (
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
                                    {expenses.map((exp, i) => {
                                        const key = Object.keys(exp)[0];
                                        const estimatedValue = key === UF_KEY ? ufEstimated : Math.round(base * (exp[key] ?? 0) / 100);
                                        const actualValue = key === SSW_KEY ? ssEstimated : key === SSM_KEY ? aylActual : key === UF_KEY ? ufActual : key === VAT_KEY ? vatActual : key === CLIMATE_KEY ? climateActual : key === 'temporaryStructures' ? temporaryStructures : key === 'transportationCosts' ? transportationCosts : key === 'operationHandoverCosts' ? commissioningCosts : key === 'stateDutiesAndFees' ? stateFees : 0;
                                        const label = t(estimateOtherExpensesItems.find(it => it.id === key)?.label ?? key);
                                        return <OtherExpenseBarWidget key={key} expenseKey={key} label={label} estimatedValue={estimatedValue} actualValue={actualValue} gradIndex={i} height={200} />;
                                    })}
                                    {extraWidgets.map(w => (
                                        <OtherExpenseBarWidget key={w.key} expenseKey={w.key} label={t(estimateOtherExpensesItems.find(it => it.id === w.key)?.label ?? w.key)} estimatedValue={w.estimatedValue} actualValue={w.actualValue} gradIndex={w.gradIndex} height={200} />
                                    ))}
                                </Box>
                            );
                        })()}

                        <BreakdownTable estimate={selectedEstimate} />
                    </Box>
                )}

                {tab === 'main' && (
                    <Box ref={mainScrollContainerRef} sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                        <CostingTable estimate={selectedEstimate} estimateSnapshot={estimateSnapshot} onCostAdded={handleCostAdded} actualData={actualData} onActualDataChange={setActualData} costHistory={costHistory} pahestEntries={pahestEntries} />
                    </Box>
                )}

                {tab === 'unforeseen' && (
                    <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                        {!unforeseenEstimate ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2, pb: 8, pt: 8 }}>
                                <ReportProblemOutlinedIcon sx={{ fontSize: 80, color: '#e65100', opacity: 0.25 }} />
                                <Typography color='text.secondary' sx={{ fontWeight: 400 }}>Չնախատեսված նախահաշիվ չկա</Typography>
                                <Button variant='outlined' startIcon={<ReportProblemOutlinedIcon sx={{ fontSize: 18 }} />} onClick={() => setUnforeseenOpen(true)} sx={{ borderRadius: '20px', textTransform: 'none', borderColor: '#e65100', color: '#e65100', fontWeight: 600, px: 2.5, '&:hover': { bgcolor: 'rgba(230,81,0,0.06)', borderColor: '#e65100' } }}>Ընտրել նախահաշիվ</Button>
                            </Box>
                        ) : (
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <ReportProblemOutlinedIcon sx={{ fontSize: 20, color: '#e65100' }} />
                                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#e65100' }}>Չնախատեսված աշխատանքներ</Typography>
                                    <Typography sx={{ fontSize: '0.82rem', color: '#999', ml: 0.5 }}>({unforeseenEstimate.name})</Typography>
                                    <Button variant='outlined' size='small' onClick={() => setUnforeseenOpen(true)} sx={{ ml: 1, borderRadius: '20px', textTransform: 'none', borderColor: '#e65100', color: '#e65100', fontSize: '0.75rem', px: 1.5, '&:hover': { bgcolor: 'rgba(230,81,0,0.06)' } }}>Փոխել</Button>
                                    <IconButton size='small' onClick={handleDeleteUnforeseen} sx={{ ml: 'auto', color: '#bbb', '&:hover': { color: '#e53935' } }}>
                                        <DeleteOutlineIcon fontSize='small' />
                                    </IconButton>
                                </Box>
                                <CostingTable estimate={unforeseenEstimate} estimateSnapshot={(unforeseenEstimate as any)?.isUnforeseenOnly ? null : unforeseenSnapshot} onCostAdded={handleCostAdded} actualData={actualData} onActualDataChange={setActualData} costHistory={costHistory} pahestEntries={pahestEntries} accentColor='#e65100' />
                            </Box>
                        )}
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
                                            : pm === 'salary_miavorzham' ? 'Աշխատավարձ «Ժամավճարային»'
                                            : pm === 'pahest_main' || pm === 'pahest_ayl' ? 'Մուտք Պահեստ'
                                            : pm === 'nyuth_tsakhsagrum' ? 'Նյութի Ծախսագրում'
                                            : pm === 'subcontractor' ? 'Ենթակապալ'
                                            : pm === 'unforeseen' ? 'Չնախատեսված աշխատանքներ'
                                            : entry.isSubcontractor ? t('Subcontractor')
                                            : 'Ծավալի հաշվառում';
                                        return (
                                        <TableRow key={entry.id} hover>
                                            <TableCell sx={{ fontSize: '0.82rem', color: '#555' }}>{actionType}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                    <span>{entry.workName}</span>
                                                    {entry.groupName && (
                                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, bgcolor: '#d6f5e0', color: '#2e7d32', borderRadius: '999px', px: 1, py: 0.25, fontSize: '0.7rem', fontWeight: 600, flexShrink: 0 }}>
                                                            <AccountTreeOutlinedIcon sx={{ fontSize: 11 }} />
                                                            {entry.groupName}
                                                        </Box>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell align='center'>{entry.unit}</TableCell>
                                            <TableCell align='center'>{entry.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                                            <TableCell align='center'>{formatCurrencyRounded(entry.unitPrice)}</TableCell>
                                            <TableCell align='center' sx={{ fontWeight: 600, color: mainPrimaryColor }}>{formatCurrencyRounded(entry.total)} AMD</TableCell>
                                            <TableCell align='center' sx={{ color: '#888', fontSize: '0.82rem' }}>{entry.addedAt.toLocaleDateString()}</TableCell>
                                            <TableCell padding='none'>
                                                <Tooltip title={t('Remove')}>
                                                    <IconButton size='small' onClick={() => {
                                                        if (entry.paymentMethod === 'nyuth_tsakhsagrum' && entry.materialItemId) {
                                                            setPahestEntries(prev => prev.map(e =>
                                                                e.materialItemId === entry.materialItemId
                                                                    ? { ...e, costedQuantity: Math.max(0, (e.costedQuantity ?? 0) - entry.quantity) }
                                                                    : e
                                                            ));
                                                        } else if (entry.paymentMethod === 'pahest_main' && entry.materialItemId) {
                                                            setPahestEntries(prev => {
                                                                const idx = prev.findIndex(e => e.materialItemId === entry.materialItemId && (entry.estimatedLaborId == null || e.estimatedLaborId === entry.estimatedLaborId));
                                                                if (idx < 0) return prev;
                                                                const newQty = prev[idx].quantity - entry.quantity;
                                                                if (newQty <= 0) return prev.filter((_, i) => i !== idx);
                                                                const next = [...prev];
                                                                next[idx] = { ...next[idx], quantity: newQty };
                                                                return next;
                                                            });
                                                        } else if (entry.laborItemId && !entry.paymentMethod?.startsWith('pahest_')) {
                                                            const remaining = costHistory.filter(e => e.id !== entry.id && e.laborItemId === entry.laborItemId && !e.paymentMethod?.startsWith('pahest_') && e.paymentMethod !== 'nyuth_tsakhsagrum');
                                                            const salaryCandidates = remaining.filter(e => e.paymentMethod?.startsWith('salary_')).sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
                                                            const volumeCandidates = remaining.filter(e => !e.paymentMethod);
                                                            const qty = salaryCandidates.length > 0
                                                                ? salaryCandidates[0].quantity
                                                                : volumeCandidates.reduce((s, e) => s + e.quantity, 0);
                                                            setActualData(ad => {
                                                                if (qty > 0) return { ...ad, [entry.laborItemId!]: { ...(ad[entry.laborItemId!] ?? {}), quantity: String(qty) } };
                                                                const next = { ...ad };
                                                                delete next[entry.laborItemId!];
                                                                return next;
                                                            });
                                                        }
                                                        setCostHistory(prev => prev.filter(e => e.id !== entry.id));
                                                    }} sx={{ color: '#ccc', '&:hover': { color: '#e53935' } }}>
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
                            actualData={actualData}
                            onHistoryEntry={e => setCostHistory(prev => [{ id: String(Date.now() + Math.random()), workName: e.workName, unit: e.unit, quantity: e.quantity, unitPrice: e.unitPrice, total: e.total, addedAt: new Date(), paymentMethod: 'pahest_main', materialItemId: e.materialItemId, estimatedLaborId: e.estimatedLaborId }, ...prev])}
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
                        <AnalysisTab estimate={selectedEstimate} estimateSnapshot={estimateSnapshot} unforeseenEstimate={unforeseenEstimate} unforeseenSnapshot={(unforeseenEstimate as any)?.isUnforeseenOnly ? null : unforeseenSnapshot} onDeleteUnforeseen={handleDeleteUnforeseen} actualData={actualData} costHistory={costHistory} pahestEntries={pahestEntries} />
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
                        const includeSalary = [...exportTypes].some(k => k.startsWith('salary_'));
                        const esc = (s: string | number | undefined) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        const hdr = (label: string) => `<th style="border:1px solid #ccc;padding:6px 8px;font-weight:bold;background:#e0f7fa;">${esc(label)}</th>`;
                        let html = `<table border="1" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;">`;
                        html += `<tr>${hdr(t('Action Type'))}${hdr(t('Description of Work'))}${hdr(t('Unit'))}${hdr(t('Quantity'))}${hdr(t('Unit Price'))}${hdr(t('Total'))}${hdr(t('Date of Creation'))}${includeSalary ? hdr(t('Note')) : ''}</tr>`;
                        for (const e of filtered) {
                            const g = HISTORY_TYPE_GROUPS.find(g => g.match(e.paymentMethod ?? '', e.isSubcontractor));
                            const label = g?.label ?? '';
                            const isSalaryRow = g?.key.startsWith('salary_') ?? false;
                            html += `<tr>` +
                                `<td style="border:1px solid #ccc;padding:5px 8px;">${esc(label)}</td>` +
                                `<td style="border:1px solid #ccc;padding:5px 8px;">${esc(e.workName)}</td>` +
                                `<td style="border:1px solid #ccc;padding:5px 8px;text-align:center;">${esc(e.unit)}</td>` +
                                `<td style="border:1px solid #ccc;padding:5px 8px;text-align:right;">${Number(e.quantity).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>` +
                                `<td style="border:1px solid #ccc;padding:5px 8px;text-align:right;">${esc(e.unitPrice.toLocaleString(undefined, { maximumFractionDigits: 0 }))}</td>` +
                                `<td style="border:1px solid #ccc;padding:5px 8px;text-align:right;font-weight:bold;">${esc(e.total.toLocaleString(undefined, { maximumFractionDigits: 0 }))} AMD</td>` +
                                `<td style="border:1px solid #ccc;padding:5px 8px;text-align:center;">${esc(new Date(e.addedAt).toLocaleDateString())}</td>` +
                                (includeSalary ? `<td style="border:1px solid #ccc;padding:5px 8px;">${isSalaryRow ? esc(e.note && e.note !== 'Գործարքային' && e.note !== 'Միավոր/ժամ' ? e.note : '') : ''}</td>` : '') +
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
                    aylEntries={aylEntries}
                    onAylUpdate={handleAylCostedUpdate}
                    onCostAdded={handleCostAdded}
                    actualData={actualData}
                />
                <SalaryDialog
                    open={salaryOpen}
                    onClose={() => setSalaryOpen(false)}
                    estimate={selectedEstimate}
                    estimateSnapshot={estimateSnapshot}
                    unforeseenEstimate={unforeseenEstimate}
                    unforeseenSnapshot={(unforeseenEstimate as any)?.isUnforeseenOnly ? null : unforeseenSnapshot}
                    onEntrySaved={(entry, replaceId) => {
                        setCostHistory(prev =>
                            replaceId ? prev.map(e => e.id === replaceId ? entry : e) : [entry, ...prev]
                        );
                        if (entry.laborItemId && entry.paymentMethod?.startsWith('salary_')) {
                            const vol = entry.workVolume ?? entry.quantity;
                            if (vol > 0) {
                                setActualData(prev => ({
                                    ...prev,
                                    [entry.laborItemId!]: { ...(prev[entry.laborItemId!] ?? {}), quantity: String(vol) },
                                }));
                            }
                        }
                    }}
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
                <OtherCostsDialog
                    open={otherCostsOpen}
                    onClose={() => setOtherCostsOpen(false)}
                    activeExpenseKeys={fullEstimate ? (fullEstimate.otherExpenses ?? []).filter(exp => { const k = Object.keys(exp)[0]; return k && k !== 'typeOfCost'; }).map(exp => Object.keys(exp)[0]) : undefined}
                    vatActual={vatDeduction}
                    onVatActualChange={val => setVatDeduction(val)}
                    climateActual={climateImpact}
                    onClimateActualChange={val => setClimateImpact(val)}
                    temporaryStructuresActual={temporaryStructures}
                    onTemporaryStructuresActualChange={val => setTemporaryStructures(val)}
                    transportationCostsActual={transportationCosts}
                    onTransportationCostsActualChange={val => setTransportationCosts(val)}
                    commissioningCostsActual={commissioningCosts}
                    onCommissioningCostsActualChange={val => setCommissioningCosts(val)}
                    stateFeesActual={stateFees}
                    onStateFeesActualChange={val => setStateFees(val)}
                />
                <SmallScaleDialog
                    open={smallScaleOpen}
                    onClose={() => setSmallScaleOpen(false)}
                    activeEstimateId={smallScaleEstimate ? String(smallScaleEstimate._id) : undefined}
                    onEstimateSelected={handleSmallScaleEstimateSelected}
                />
                {smallScaleEditOpen && smallScaleEstimate && (
                    <EstimatePageDialog
                        estimateId={String(smallScaleEstimate._id)}
                        estimateTitle={smallScaleEstimate.name ?? ''}
                        onClose={() => {
                            setSmallScaleEditOpen(false);
                            Api.requestSession<EstimatesApi.ApiEstimate>({ command: 'estimate/get', args: { estimateId: String(smallScaleEstimate._id) } })
                                .then(est => setSmallScaleEstimate(est)).catch(() => {});
                        }}
                    />
                )}
                {mainEstimateEditOpen && selected && localEstimateId && (
                    <EstimatePageDialog
                        estimateId={localEstimateId}
                        estimateTitle={selected.estimateName ?? ''}
                        onClose={async () => {
                            setMainEstimateEditOpen(false);
                            try {
                                const result = await Api.requestSession<{ snapshot: EstimateSnapshot | null }>({
                                    command: 'costing/refresh_local_snapshot', args: { id: selected._id },
                                });
                                if (result.snapshot) setEstimateSnapshot(result.snapshot);
                            } catch (e) { console.error(e); }
                        }}
                    />
                )}
                <Dialog open={estimationOpen} onClose={() => setEstimationOpen(false)} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                        <Typography fontWeight={700} fontSize='1.05rem'>{t('Estimation')}</Typography>
                        <IconButton size='small' onClick={() => setEstimationOpen(false)}><CloseIcon fontSize='small' /></IconButton>
                    </DialogTitle>
                    <DialogContent dividers sx={{ p: 0 }}>
                        {(() => {
                            const toRId = (id: unknown): string => typeof id === 'object' && id !== null && 'oid' in (id as any) ? (id as any).oid : String(id ?? '');
                            const rows = (estimateSnapshot?.laborRows ?? []).filter(r => {
                                const qty = parseFloat((actualData[toRId(r._id)]?.quantity ?? '').replace(',', '.')) || 0;
                                return qty > 0;
                            });
                            if (rows.length === 0) return (
                                <Box sx={{ p: 4, textAlign: 'center' }}>
                                    <Typography color='text.secondary' fontSize='0.9rem'>{t('No recorded labors yet')}</Typography>
                                </Box>
                            );
                            const sections = Array.from(new Set(rows.map(r => r.sectionName)));
                            let idx = 0;
                            return (
                                <Table size='small' stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#6b7280', width: 40 }}>№</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#6b7280' }}>{t('Name')}</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#6b7280', width: 60 }}>{t('Unit')}</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#6b7280', width: 90 }} align='right'>{t('Qty')}</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#6b7280', width: 110 }} align='right'>{t('Unit Price')}</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#6b7280', width: 120 }} align='right'>{t('Total')}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {sections.map(sec => {
                                            const secRows = rows.filter(r => r.sectionName === sec);
                                            const secTotal = secRows.reduce((s, r) => s + Number(r.quantity ?? 0) * Number(r.changableAveragePrice ?? 0), 0);
                                            return [
                                                <TableRow key={`sec-${sec}`}>
                                                    <TableCell colSpan={6} sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#00A390', bgcolor: '#f0faf9', py: 0.75, borderTop: '1px solid #e0f0f4' }}>{sec}</TableCell>
                                                </TableRow>,
                                                ...secRows.map(r => {
                                                    idx++;
                                                    const total = Number(r.quantity ?? 0) * Number(r.changableAveragePrice ?? 0);
                                                    return (
                                                        <TableRow key={toRId(r._id)} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                                                            <TableCell sx={{ fontSize: '0.78rem', color: '#9e9e9e' }}>{idx}</TableCell>
                                                            <TableCell sx={{ fontSize: '0.82rem' }}>{r.laborOfferItemName}</TableCell>
                                                            <TableCell sx={{ fontSize: '0.78rem', color: '#6b7280' }}>{r.unitSymbol}</TableCell>
                                                            <TableCell sx={{ fontSize: '0.82rem' }} align='right'>{Number(r.quantity ?? 0).toLocaleString()}</TableCell>
                                                            <TableCell sx={{ fontSize: '0.82rem' }} align='right'>{formatCurrencyRounded(Number(r.changableAveragePrice ?? 0))}</TableCell>
                                                            <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }} align='right'>{formatCurrencyRounded(total)}</TableCell>
                                                        </TableRow>
                                                    );
                                                }),
                                                <TableRow key={`sec-total-${sec}`}>
                                                    <TableCell colSpan={5} sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#6b7280', textAlign: 'right', borderTop: '1px solid #e0f0f4', py: 0.5 }}>{t('Subtotal')}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#00A390', borderTop: '1px solid #e0f0f4', py: 0.5 }} align='right'>{formatCurrencyRounded(secTotal)}</TableCell>
                                                </TableRow>,
                                            ];
                                        })}
                                        <TableRow>
                                            <TableCell colSpan={5} sx={{ fontSize: '0.85rem', fontWeight: 700, textAlign: 'right', borderTop: '2px solid #00A390', color: '#374151' }}>{t('Total')}</TableCell>
                                            <TableCell sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#00A390', borderTop: '2px solid #00A390' }} align='right'>{formatCurrencyRounded(rows.reduce((s, r) => s + Number(r.quantity ?? 0) * Number(r.changableAveragePrice ?? 0), 0))}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            );
                        })()}
                    </DialogContent>
                </Dialog>
                </>
            )}
        </PageContents>
    );
}

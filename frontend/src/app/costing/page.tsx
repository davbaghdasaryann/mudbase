'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import ChangeCircleOutlinedIcon from '@mui/icons-material/ChangeCircleOutlined';
import PrecisionManufacturingOutlinedIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import SummarizeOutlinedIcon from '@mui/icons-material/SummarizeOutlined';
import ImgElement from '@/tsui/DomElements/ImgElement';
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
import OverheadCostsDialog, { type OverheadEntry } from './OverheadCostsDialog';
import MechanismCostsDialog from './MechanismCostsDialog';
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
    isGroupRow?: boolean;
    childIds?: string[];
    children?: SnapshotLaborRow[];
    fullCode?: string;
}
interface SnapshotSection { _id: string; name: string; displayIndex: number; totalCost?: number; }
interface SnapshotSubsection { _id: string; estimateSectionId: string; name: string; displayIndex: number; }
interface EstimateSnapshot {
    laborRows: SnapshotLaborRow[];
    sections: SnapshotSection[];
    subsections: SnapshotSubsection[];
    materialFullCodes?: Record<string, string>;
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
    { key: 'overhead',          label: 'Վերադիր ծախսեր', match: pm => pm === 'overhead' },
    { key: 'mechanism',         label: 'Մեխանիզմի ծախսագրում', match: pm => pm === 'mechanism' },
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

const ACTUAL_SEGMENTS = [
    { key: 'labor',     inner: '#FF7043', outer: '#BF360C', dot: '#E64A19' },
    { key: 'materials', inner: '#FFB300', outer: '#E65100', dot: '#F57C00' },
    { key: 'other',     inner: '#FFE57F', outer: '#FF8F00', dot: '#FFA000' },
];

function ActualCostsChart({ pahestEntries, costHistory, height = 260 }: { pahestEntries: PahestEntry[]; costHistory: CostHistoryEntry[]; height?: number }) {
    const { t } = useTranslation();
    const chartHeight = Math.max(100, height - 72);

    const materialsTotal = costHistory.filter(e => e.paymentMethod === 'nyuth_tsakhsagrum').reduce((s, e) => s + e.total, 0);

    const laborTotal = costHistory
        .filter(e => !e.paymentMethod?.startsWith('pahest_') && e.paymentMethod !== 'nyuth_tsakhsagrum' && e.paymentMethod !== 'overhead')
        .reduce((s, e) => s + e.total, 0);

    const aylTotal = costHistory.filter(e => e.paymentMethod === 'pahest_ayl_cost' || e.paymentMethod === 'overhead').reduce((s, e) => s + e.total, 0);

    const data = [
        { key: 'labor',     name: t('Labor'),         value: laborTotal },
        { key: 'materials', name: t('Materials'),      value: materialsTotal },
        { key: 'other',     name: t('Other Expenses'), value: aylTotal },
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

    const ALL_KEYS = ['labor', 'materials', 'other'] as const;
    const buildData = (labor: number, materials: number, other: number) => {
        const total = labor + materials + other;
        return ALL_KEYS.map(key => {
            const value = key === 'labor' ? labor : key === 'materials' ? materials : other;
            return { key, name: t(key === 'labor' ? 'Labor' : key === 'materials' ? 'Materials' : 'Other Expenses'), value, pct: total > 0 ? ((value / total) * 100).toFixed(1) : '0.0' };
        });
    };

    const estData = (() => {
        const labor = estimate.laborTotalCost ?? 0;
        const materials = estimate.materialTotalCost ?? 0;
        const base = estimate.totalCost ?? 0;
        const other = Math.max(0, (estimate.totalCostWithOtherExpenses ?? base) - base);
        return buildData(labor, materials, other);
    })();

    const actData = (() => {
        const materialsTotal = costHistory.filter(e => e.paymentMethod === 'nyuth_tsakhsagrum').reduce((s, e) => s + e.total, 0);
        const laborTotal = costHistory.filter(e => !e.paymentMethod?.startsWith('pahest_') && e.paymentMethod !== 'nyuth_tsakhsagrum' && e.paymentMethod !== 'overhead').reduce((s, e) => s + e.total, 0);
        const aylMatTotal = costHistory.filter(e => e.paymentMethod === 'pahest_ayl_cost' || e.paymentMethod === 'overhead').reduce((s, e) => s + e.total, 0);
        return buildData(laborTotal, materialsTotal, aylMatTotal + extraActualCosts);
    })();

    const donut = (data: ReturnType<typeof buildData>, gradPrefix: string, segments = COST_SEGMENTS) => {
        const hasAny = data.some(d => d.value > 0);
        return (
        <Box sx={{ flex: 1, minHeight: chartH }}>
            <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                    <defs>
                        {segments.map(s => (
                            <radialGradient key={s.key} id={`${gradPrefix}-${s.key}`} cx='50%' cy='50%' r='50%'>
                                <stop offset='0%' stopColor={s.inner} />
                                <stop offset='100%' stopColor={s.outer} />
                            </radialGradient>
                        ))}
                    </defs>
                    <Pie data={hasAny ? data : [{ key: 'empty', name: '', value: 1, pct: '0' }]} cx='50%' cy='50%' innerRadius={38} outerRadius={62} paddingAngle={hasAny ? 2 : 0} dataKey='value' strokeWidth={0} minAngle={hasAny ? 6 : 0}>
                        {hasAny ? data.map(entry => {
                            const seg = segments.find(s => s.key === entry.key);
                            return <Cell key={entry.key} fill={entry.value > 0 ? (seg ? `url(#${gradPrefix}-${seg.key})` : '#ccc') : 'transparent'} stroke={entry.value > 0 ? (seg?.outer ?? '#ccc') : 'none'} strokeWidth={entry.value > 0 ? 0.5 : 0} />;
                        }) : [<Cell key='empty' fill='#f0f0f0' stroke='none' />]}
                    </Pie>
                    {hasAny && <RechartsTooltip content={({ active, payload }: any) => {
                        if (!active || !payload?.length || !payload[0].value) return null;
                        const e = payload[0];
                        return (
                            <Paper elevation={3} sx={{ p: 1.5, borderRadius: 2, minWidth: 130 }}>
                                <Typography variant='caption' sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>{e.name}</Typography>
                                <Typography variant='body2' sx={{ color: '#00A390' }}>{Number(e.value).toLocaleString()} AMD</Typography>
                                <Typography variant='caption' sx={{ color: 'text.secondary' }}>{e.payload.pct}%</Typography>
                            </Paper>
                        );
                    }} />}
                </PieChart>
            </ResponsiveContainer>
        </Box>
        );
    };

    const legend = (data: ReturnType<typeof buildData>, segments = COST_SEGMENTS) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
            {data.map(d => {
                const seg = segments.find(s => s.key === d.key);
                return (
                    <Box key={d.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: d.value > 0 ? (seg?.dot ?? '#ccc') : '#e0e0e0', flexShrink: 0 }} />
                        <Typography variant='caption' sx={{ color: d.value > 0 ? 'text.secondary' : '#bdbdbd', fontSize: '0.68rem' }}>{d.name} {d.value > 0 ? `${d.pct}%` : '—'}</Typography>
                        <Typography variant='caption' sx={{ color: '#aaa', fontSize: '0.65rem', ml: 'auto' }}>{d.value > 0 ? Math.round(d.value).toLocaleString() : ''}</Typography>
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
                    {donut(estData, 'est')}
                    {legend(estData)}
                </Box>
                <Box sx={{ width: '1px', background: '#f0f0f0', mx: 0.5, alignSelf: 'stretch' }} />
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant='caption' sx={{ fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem', textAlign: 'center', mb: 0.5 }}>Փաստացի</Typography>
                    {donut(actData, 'act', ACTUAL_SEGMENTS)}
                    {legend(actData, ACTUAL_SEGMENTS)}
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

    const pctDiff = estimatedValue > 0 && actualValue > 0 ? ((actualValue - estimatedValue) / estimatedValue) * 100 : null;
    const pctOver = pctDiff !== null && pctDiff > 0;
    const pctUnder = pctDiff !== null && pctDiff < 0;

    return (
        <Paper elevation={0} sx={{ border: '1px solid #d0f0f4', borderRadius: 3, p: 2, background: '#fff', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', minHeight: height, position: 'relative' }}>
            {pctDiff !== null && (
                <Box sx={{ position: 'absolute', top: 8, right: 10, px: 0.9, py: 0.25, borderRadius: '10px', bgcolor: pctOver ? 'rgba(229,57,53,0.1)' : 'rgba(67,160,71,0.1)', display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: pctOver ? '#e53935' : '#43a047', lineHeight: 1 }}>
                        {pctOver ? '+' : ''}{pctDiff.toFixed(1)}%
                    </Typography>
                </Box>
            )}
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


    const rawPct = totalEst > 0 ? Math.min(100, (totalAct / totalEst) * 100) : null;
    // Only show 100% when every row is actually completed, prevent rounding misleading display
    const pct = rawPct !== null && completedRows < rows.length ? Math.min(rawPct, 99) : rawPct;
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

function LaborProfitabilityWidget({ estimateSnapshot, actualData, costHistory, pahestEntries, height = 220 }: {
    estimateSnapshot?: EstimateSnapshot | null;
    actualData: Record<string, { quantity: string; unitPrice: string; spent?: string }>;
    costHistory: CostHistoryEntry[];
    pahestEntries: PahestEntry[];
    height?: number;
}) {
    const { t } = useTranslation();
    const toRowId = (id: unknown): string =>
        typeof id === 'object' && id !== null && 'oid' in (id as any) ? (id as any).oid : String(id ?? '');

    const rows = estimateSnapshot?.laborRows ?? [];
    let pNumer = 0, pDenom = 0, pHasAny = false;

    for (const row of rows) {
        const rowId = toRowId(row._id);
        const estQty = Number(row.quantity ?? 0);
        if (estQty <= 0) continue;
        const estTotal = Math.round(estQty * row.changableAveragePrice) + Math.round(row.materialTotalCost ?? 0);
        const estUP = estTotal / estQty;
        if (estUP <= 0) continue;
        let actQty: number;
        let actTotal: number;
        if (row.isGroupRow && row.childIds && row.childIds.length > 0) {
            actQty = estQty;
            let childActTotal = 0;
            for (const childId of row.childIds) {
                const s = costHistory.filter(e => e.laborItemId === childId && !e.paymentMethod?.startsWith('pahest_') && e.paymentMethod !== 'nyuth_tsakhsagrum').reduce((acc, e) => acc + e.total, 0);
                const m = costHistory.filter(e => {
                    if (e.paymentMethod === 'nyuth_tsakhsagrum') {
                        if (e.laborItemId) return e.laborItemId === childId;
                        if (!e.materialItemId) return false;
                        return pahestEntries.some(p => p.materialItemId === e.materialItemId && p.estimatedLaborId === childId);
                    }
                    if (e.paymentMethod === 'pahest_ayl_cost') return !!e.laborItemId && e.laborItemId === childId;
                    return false;
                }).reduce((acc, e) => acc + e.total, 0);
                const v = parseFloat((actualData[childId]?.spent ?? '').replace(',', '.')) || 0;
                childActTotal += v + s + m;
            }
            actTotal = childActTotal;
        } else {
            actQty = parseFloat((actualData[rowId]?.quantity ?? '').replace(',', '.')) || 0;
            const salTotal = costHistory.filter(e => e.laborItemId === rowId && !e.paymentMethod?.startsWith('pahest_') && e.paymentMethod !== 'nyuth_tsakhsagrum').reduce((s, e) => s + e.total, 0);
            const matActTotal = costHistory.filter(e => {
                if (e.paymentMethod === 'nyuth_tsakhsagrum') {
                    if (e.laborItemId) return e.laborItemId === rowId;
                    if (!e.materialItemId) return false;
                    return pahestEntries.some(p => p.materialItemId === e.materialItemId && p.estimatedLaborId === rowId);
                }
                if (e.paymentMethod === 'pahest_ayl_cost') return !!e.laborItemId && e.laborItemId === rowId;
                return false;
            }).reduce((s, e) => s + e.total, 0);
            actTotal = salTotal + matActTotal;
        }
        if (actQty <= 0 || actTotal <= 0) continue;
        pNumer += estUP * actQty - actTotal;
        pDenom += estUP * actQty;
        pHasAny = true;
    }

    const avgProfit = pHasAny && pDenom > 0 ? (pNumer / pDenom) * 100 : null;

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
    const [summaryExportModalOpen, setSummaryExportModalOpen] = useState(false);
    const [summaryExporting, setSummaryExporting] = useState(false);
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
    const costedQuantityMap = useMemo(() => {
        const map = new Map<string, number>();
        for (const e of costHistory) {
            if (e.paymentMethod === 'nyuth_tsakhsagrum' && e.materialItemId) {
                map.set(e.materialItemId, (map.get(e.materialItemId) ?? 0) + e.quantity);
            }
        }
        return map;
    }, [costHistory]);
    const [pahestEntries, setPahestEntries] = useState<PahestEntry[]>([]);
    const [aylEntries, setAylEntries] = useState<AylEntry[]>([]);
    const [overheadEntries, setOverheadEntries] = useState<OverheadEntry[]>([]);
    const [mechanismEntries, setMechanismEntries] = useState<import('./MechanismCostsDialog').MechanismEntry[]>([]);
    const [overheadOpen, setOverheadOpen] = useState(false);
    const [mechanismOpen, setMechanismOpen] = useState(false);
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
    const pendingFlushRef = useRef<{ url: string; body: string } | null>(null);
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

    useEffect(() => {
        const handleBeforeUnload = () => {
            const pending = pendingFlushRef.current;
            if (!pending) return;
            try {
                const sent = typeof navigator.sendBeacon === 'function'
                    ? navigator.sendBeacon(pending.url, new Blob([pending.body], { type: 'application/json' }))
                    : false;
                if (!sent) {
                    fetch(pending.url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: pending.body,
                        credentials: 'include',
                        keepalive: true,
                    });
                }
            } catch {}
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

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
        const overheadMap = new Map<string, OverheadEntry>();
        for (const c of ch.filter(c => c.paymentMethod === 'overhead' && c.materialItemId)) {
            if (!overheadMap.has(c.materialItemId!)) overheadMap.set(c.materialItemId!, { id: c.materialItemId!, name: c.workName, total: 0, history: [] });
            const oe = overheadMap.get(c.materialItemId!)!;
            oe.total += c.total;
            oe.history.push({ id: c.id, amount: c.total, addedAt: c.addedAt });
        }
        setOverheadEntries([...overheadMap.values()]);
        const mechanismMap = new Map<string, import('./MechanismCostsDialog').MechanismEntry>();
        for (const c of ch.filter(c => c.paymentMethod === 'mechanism' && c.materialItemId)) {
            if (!mechanismMap.has(c.materialItemId!)) mechanismMap.set(c.materialItemId!, { id: c.materialItemId!, name: c.workName, laborItemId: c.laborItemId, laborName: c.groupName, total: 0, history: [] });
            const me = mechanismMap.get(c.materialItemId!)!;
            me.total += c.total;
            me.history.push({ id: c.id, amount: c.total, addedAt: c.addedAt });
        }
        setMechanismEntries([...mechanismMap.values()]);
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
            const volumeEntries = entries.filter(c => !c.paymentMethod).sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
            // Volume entries are absolute totals (not deltas) — use the latest one, not their sum.
            // Salary is only used as a fallback for salary-only rows (no volume entries).
            // If volume entries exist, always trust the saved actualData or latest volume entry.
            const baseQty = parseFloat((healedActual[lid] ?? {}).quantity || '0') || 0;
            const latestVolumeQty = volumeEntries.length > 0 ? volumeEntries[0].quantity : 0;
            const qty = volumeEntries.length === 0 && salaryEntries.length > 0
                ? Math.max(baseQty, salaryEntries[0].quantity)
                : Math.max(baseQty, latestVolumeQty);
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
        // Fetch fresh snapshot to populate fullCode; use localEstimateId for snapshot so labor IDs match actualData
        const snapshotArgs: Record<string, string> = { estimateId: String(rec.estimateId) };
        if (rec.localEstimateId) snapshotArgs.snapshotEstimateId = rec.localEstimateId;
        Api.requestSession<any>({ command: 'costing/fetch', args: snapshotArgs })
            .then(fresh => { if (fresh?.estimateSnapshot) setEstimateSnapshot(fresh.estimateSnapshot); })
            .catch(() => {});
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
        const json: Record<string, unknown> = { costHistory: ch, pahestEntries: pe, aylEntries: ae, actualData: ad };
        if (unforeseenId !== null) { json.unforeseenEstimateId = unforeseenId ?? ''; json.unforeseenCostingId = unforeseenCostingIdRef.current ?? ''; }
        if (smallScaleId !== null) { json.smallScaleEstimateId = smallScaleId ?? ''; json.smallScaleCostingId = smallScaleCostingIdRef.current ?? ''; }
        if (vatDed !== undefined) json.vatDeduction = vatDed;
        if (climatImp !== undefined) json.climateImpact = climatImp;
        if (tmpStructures !== undefined) json.temporaryStructures = tmpStructures;
        if (transpCosts !== undefined) json.transportationCosts = transpCosts;
        if (commCosts !== undefined) json.commissioningCosts = commCosts;
        if (stFees !== undefined) json.stateFees = stFees;
        const body = JSON.stringify(json);
        const saveUrl = `/api/v1/costing/save/?id=${encodeURIComponent(id)}`;
        pendingFlushRef.current = { url: saveUrl, body };
        saveTimerRef.current = setTimeout(() => {
            Api.requestSession({ command: 'costing/save', args: { id }, json })
                .then(() => { if (pendingFlushRef.current?.body === body) pendingFlushRef.current = null; })
                .catch(console.error);
        }, 300);
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
            const result = await Api.requestSession<{ localEstimateId: string; snapshot: EstimateSnapshot; actualData: Record<string, { quantity: string; unitPrice: string }>; costHistory?: CostHistoryEntry[]; pahestEntries?: PahestEntry[] }>({
                command: 'costing/fork_estimate', args: { id: selected._id },
            });
            setLocalEstimateId(result.localEstimateId);
            setEstimateSnapshot(result.snapshot);
            isLoadingRef.current = true;
            setActualData(result.actualData);
            if (result.costHistory) setCostHistory(result.costHistory.map(e => ({ ...e, addedAt: new Date(e.addedAt) })));
            if (result.pahestEntries) setPahestEntries(result.pahestEntries);
            setTimeout(() => { isLoadingRef.current = false; }, 100);
            setMainEstimateEditOpen(true);
        } catch (e) { console.error(e); }
        finally { setIsForkingEstimate(false); }
    };

    const buildSummaryHtml = async (): Promise<string> => {
        if (!estimateSnapshot || !selected) return '';
        // Always fetch a fresh snapshot so group rows have childIds populated
        let snap = estimateSnapshot;
        let companyLogoUrl: string | undefined;
        try {
            const snapshotArgs: Record<string, string> = { estimateId: String(selected.estimateId) };
            if (localEstimateId) snapshotArgs.snapshotEstimateId = localEstimateId;
            const [fresh, account] = await Promise.all([
                Api.requestSession<any>({ command: 'costing/fetch', args: snapshotArgs }),
                Api.requestSession<Api.ApiAccount>({ command: 'profile/get_account', args: {} }).catch(() => null),
            ]);
            if (fresh?.estimateSnapshot) { snap = fresh.estimateSnapshot; setEstimateSnapshot(fresh.estimateSnapshot); }
            companyLogoUrl = Api.makeCompanyLogoUrl(account ?? undefined);
        } catch {}
        const toId = (id: unknown): string => typeof id === 'object' && id !== null && 'oid' in (id as any) ? (id as any).oid : String(id ?? '');
        const fmtN = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
        const esc = (s: string | number) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const fmtDate = () => new Date().toLocaleDateString('hy-AM');
        const COLS = 15;

        const sections = [...snap.sections].sort((a, b) => a.displayIndex - b.displayIndex);
        const subsections = snap.subsections;
        let counter = 0;
        let grandActTotal = 0;
        let tableBodyHtml = '';

        for (let si = 0; si < sections.length; si++) {
            const section = sections[si];
            const secRows = snap.laborRows.filter(r => r.sectionName === section.name);
            if (secRows.length === 0) continue;
            const secSubs = subsections.filter(s => s.estimateSectionId === section._id).sort((a, b) => a.displayIndex - b.displayIndex);
            let secActTotal = 0;

            const renderLaborRow = (row: SnapshotLaborRow) => {
                const rowId = toId(row._id);
                let actQty: number;
                let salTotal: number;
                let matActTotal: number;
                let actTotal: number;
                if (row.isGroupRow && row.childIds && row.childIds.length > 0) {
                    actQty = Number(row.quantity ?? 0);
                    salTotal = 0;
                    matActTotal = 0;
                    for (const childId of row.childIds) {
                        const cs = costHistory.filter(e => e.laborItemId === childId && !e.paymentMethod?.startsWith('pahest_') && e.paymentMethod !== 'overhead' && e.paymentMethod !== 'nyuth_tsakhsagrum').reduce((s, e) => s + e.total, 0);
                        const cm = costHistory.filter(e => {
                            if (e.paymentMethod === 'nyuth_tsakhsagrum') {
                                if (e.laborItemId) return e.laborItemId === childId;
                                if (!e.materialItemId) return false;
                                return pahestEntries.some(p => p.materialItemId === e.materialItemId && p.estimatedLaborId === childId);
                            }
                            if (e.paymentMethod === 'pahest_ayl_cost') return !!e.laborItemId && e.laborItemId === childId;
                            return false;
                        }).reduce((s, e) => s + e.total, 0);
                        const cv = parseFloat((actualData[childId]?.spent ?? '').replace(',', '.')) || 0;
                        salTotal += cv + cs;
                        matActTotal += cm;
                    }
                    actTotal = salTotal + matActTotal;
                } else {
                    actQty = parseFloat((actualData[rowId]?.quantity ?? '').replace(',', '.')) || 0;
                    salTotal = costHistory.filter(e => e.laborItemId === rowId && !e.paymentMethod?.startsWith('pahest_') && e.paymentMethod !== 'overhead' && e.paymentMethod !== 'nyuth_tsakhsagrum').reduce((s, e) => s + e.total, 0);
                    matActTotal = costHistory.filter(e => {
                        if (e.paymentMethod === 'nyuth_tsakhsagrum') {
                            if (e.laborItemId) return e.laborItemId === rowId;
                            if (!e.materialItemId) return false;
                            return pahestEntries.some(p => p.materialItemId === e.materialItemId && p.estimatedLaborId === rowId);
                        }
                        if (e.paymentMethod === 'pahest_ayl_cost') return !!e.laborItemId && e.laborItemId === rowId;
                        return false;
                    }).reduce((s, e) => s + e.total, 0);
                    actTotal = salTotal + matActTotal;
                }
                // Use gorcarqayin qty sum for unit price (avg across multiple piecework payments); fall back to volume registration
                const gorcarqayanQtyTotal = row.isGroupRow ? 0 : costHistory.filter(e => e.laborItemId === rowId && e.paymentMethod === 'salary_gorcarqayin').reduce((s, e) => s + (e.quantity ?? 0), 0);
                const upDivisor = gorcarqayanQtyTotal > 0 ? gorcarqayanQtyTotal : actQty;
                const salUP  = upDivisor > 0 ? Math.round(salTotal / upDivisor) : 0;
                const actUP  = upDivisor > 0 ? Math.round(actTotal / upDivisor) : 0;

                // Skip rows with no costs (volume-only registration)
                if (actTotal === 0) return '';

                // Materials for this labor row (derived from cost history)
                const nyuthForRow = costHistory.filter(e => e.paymentMethod === 'nyuth_tsakhsagrum' && e.laborItemId === rowId && e.materialItemId);
                const matIds = [...new Set(nyuthForRow.map(e => e.materialItemId!))];
                const mats: { matId: string; name: string; unit: string; estimateQuantity: number; quantity: number; costPerUnit: number; total: number; isAyl?: boolean }[] = matIds.map(matId => {
                    // Match by both materialItemId + estimatedLaborId for accuracy; fall back to materialItemId only
                    const p = pahestEntries.find(pe => pe.materialItemId === matId && pe.estimatedLaborId === rowId)
                           ?? pahestEntries.find(pe => pe.materialItemId === matId);
                    const entries = nyuthForRow.filter(e => e.materialItemId === matId);
                    const qty = entries.reduce((s, e) => s + e.quantity, 0);
                    const total = entries.reduce((s, e) => s + e.total, 0);
                    const unitPrice = qty > 0 ? total / qty : (p?.costPerUnit ?? 0);
                    // actual norm = actual material qty / actual labor qty done
                    const norm = actQty > 0 ? qty / actQty : 0;
                    return { matId, name: p?.name ?? matId, unit: p?.unit ?? '', estimateQuantity: norm, quantity: qty, costPerUnit: Math.round(unitPrice), total: Math.round(total) };
                }).filter(m => m.quantity > 0);
                // Also include other materials (pahest_ayl_cost) for this row
                const aylForRow = costHistory.filter(e => e.paymentMethod === 'pahest_ayl_cost' && e.laborItemId === rowId && e.materialItemId);
                const aylMatIds = [...new Set(aylForRow.map(e => e.materialItemId!))];
                for (const aylMatId of aylMatIds) {
                    const entries = aylForRow.filter(e => e.materialItemId === aylMatId);
                    const qty = entries.reduce((s, e) => s + e.quantity, 0);
                    const total = entries.reduce((s, e) => s + e.total, 0);
                    const unitPrice = qty > 0 ? total / qty : 0;
                    const aylEntryForName = aylEntries.find(a => a.id === aylMatId);
                    const name = aylEntryForName?.name || entries[0]?.workName || aylMatId;
                    const unit = entries[0]?.unit ?? '';
                    const aylNorm = actQty > 0 ? qty / actQty : 0;
                    if (total > 0) mats.push({ matId: aylMatId, name, unit, estimateQuantity: aylNorm, quantity: qty, costPerUnit: Math.round(unitPrice), total: Math.round(total), isAyl: true });
                }
                const rowspan = mats.length || 1;

                secActTotal += actTotal;

                const matCodes = snap.materialFullCodes ?? {};
                const laborCode = row.isGroupRow ? 'Խումբ' : (row.fullCode || 'N/A');
                const groupRowStyle = row.isGroupRow ? ' style="background:#dff6f9;"' : '';
                const groupNameStyle = row.isGroupRow ? ' style="text-align:left;font-weight:700;color:#0277bd;"' : ' style="text-align:left;"';
                let html = `<tr${groupRowStyle}>
                    <td rowspan="${rowspan}">${counter}</td>
                    <td rowspan="${rowspan}">${laborCode}</td>
                    <td rowspan="${rowspan}"${groupNameStyle}>${esc(row.laborOfferItemName || row.catalogName)}</td>
                    <td rowspan="${rowspan}">${esc(row.unitSymbol)}</td>
                    <td rowspan="${rowspan}">${actQty > 0 ? actQty.toLocaleString(undefined, { maximumFractionDigits: 2 }) : ''}</td>
                    <td rowspan="${rowspan}">${salUP > 0 ? fmtN(salUP) : ''}</td>`;

                if (mats.length > 0) {
                    const mat0 = mats[0];
                    // mat0.total is pre-computed from cost history
                    html += `
                    <td>${mat0.isAyl ? 'ՓՇՆ' : (matCodes[mat0.matId] || 'N/A')}</td>
                    <td style="text-align:left;">${esc(mat0.name)}</td>
                    <td>${esc(mat0.unit)}</td>
                    <td>${mat0.estimateQuantity > 0 ? mat0.estimateQuantity.toLocaleString(undefined, { maximumFractionDigits: 3 }) : ''}</td>
                    <td>${mat0.quantity > 0 ? mat0.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 }) : ''}</td>
                    <td>${mat0.costPerUnit > 0 ? fmtN(mat0.costPerUnit) : ''}</td>
                    <td>${mat0.total > 0 ? fmtN(mat0.total) : ''}</td>
                    <td rowspan="${rowspan}">${actUP > 0 ? fmtN(actUP) : ''}</td>
                    <td rowspan="${rowspan}" class="bold">${actTotal > 0 ? fmtN(actTotal) : ''}</td>
                </tr>`;
                    for (let mi = 1; mi < mats.length; mi++) {
                        const mat = mats[mi];
                        // mat.total is pre-computed from cost history
                        html += `<tr>
                    <td>${mat.isAyl ? 'ՓՇՆ' : (matCodes[mat.matId] || 'N/A')}</td>
                    <td style="text-align:left;">${esc(mat.name)}</td>
                    <td>${esc(mat.unit)}</td>
                    <td>${mat.estimateQuantity > 0 ? mat.estimateQuantity.toLocaleString(undefined, { maximumFractionDigits: 3 }) : ''}</td>
                    <td>${mat.quantity > 0 ? mat.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 }) : ''}</td>
                    <td>${mat.costPerUnit > 0 ? fmtN(mat.costPerUnit) : ''}</td>
                    <td>${mat.total > 0 ? fmtN(mat.total) : ''}</td>
                </tr>`;
                    }
                } else {
                    html += `<td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                    <td>${actUP > 0 ? fmtN(actUP) : ''}</td>
                    <td class="bold">${actTotal > 0 ? fmtN(actTotal) : ''}</td>
                </tr>`;
                }
                return html;
            };

            let sectionBodyHtml = '';
            let sectionHasData = false;
            if (secSubs.length > 0) {
                for (let subI = 0; subI < secSubs.length; subI++) {
                    const sub = secSubs[subI];
                    const subRows = secRows.filter(r => r.subsectionName === sub.name);
                    if (subRows.length === 0) continue;
                    let subHtml = '';
                    const subStartTotal = secActTotal;
                    for (const row of subRows) { counter++; subHtml += renderLaborRow(row); }
                    if (subHtml) {
                        const subActTotal = secActTotal - subStartTotal;
                        sectionBodyHtml += `<tr><td class="lightBlue subsection" colspan="13">${esc(`${si + 1}.${subI + 1} ${sub.name}`)}</td><td class="lightBlue subsection" colspan="2">${fmtN(subActTotal)}</td></tr>`;
                        sectionBodyHtml += subHtml;
                        sectionHasData = true;
                    }
                }
            } else {
                for (const row of secRows) { counter++; sectionBodyHtml += renderLaborRow(row); }
                if (sectionBodyHtml) sectionHasData = true;
            }

            if (sectionHasData) {
                tableBodyHtml += `<tr>
                <td class="section" colspan="13">${esc(`${si + 1}. ${section.name}`)}</td>
                <td class="section" colspan="2">${fmtN(secActTotal)}</td>
            </tr>`;
                tableBodyHtml += sectionBodyHtml;
                grandActTotal += secActTotal;
            }
        }

        const overheadTotal = overheadEntries.reduce((s, e) => s + e.total, 0);
        const smallScaleActualTotal = Math.round(smallScaleEstimate?.totalCost ?? 0);
        const otherCostsList: [string, number][] = [
            [t('smallScaleConstructionWork'), smallScaleActualTotal],
            [t('valueAddedTax'), vatDeduction],
            [t('climaticImpactCosts'), climateImpact],
            [t('temporaryStructures'), temporaryStructures],
            [t('transportationCosts'), transportationCosts],
            [t('operationHandoverCosts'), commissioningCosts],
            [t('stateDutiesAndFees'), stateFees],
        ].filter(([, v]) => (v as number) > 0) as [string, number][];
        if (overheadTotal > 0 || otherCostsList.length > 0) {
            tableBodyHtml += `<tr><td class="lightBlue" colspan="${COLS}" style="text-align:left;font-weight:bold;padding:6px 8px;">ԱՅԼ ԾԱԽՍԵՐ</td></tr>`;
            if (overheadTotal > 0) {
                tableBodyHtml += `<tr><td class="importantInfo" colspan="13" style="text-align:left;font-weight:normal;">Վերադիր ծախսեր</td><td></td><td>${fmtN(overheadTotal)}</td></tr>`;
                grandActTotal += overheadTotal;
            }
            for (const [label, val] of otherCostsList) {
                tableBodyHtml += `<tr><td class="importantInfo" colspan="13" style="text-align:left;font-weight:normal;">${esc(label)}</td><td></td><td>${fmtN(val as number)}</td></tr>`;
                grandActTotal += val as number;
            }
        }

        const est = selectedEstimate as any;

        // Summary section data
        const estTotal = Math.round(est.totalCostWithOtherExpenses ?? est.totalCost ?? 0);
        const estMaterials = Math.round(est.materialTotalCost ?? 0);
        const estLabor = Math.round(est.laborTotalCost ?? 0);
        const actMaterials = Math.round(costHistory.filter(e => e.paymentMethod === 'nyuth_tsakhsagrum').reduce((s, e) => s + e.total, 0));
        const actLabor = Math.round(costHistory.filter(e => !e.paymentMethod || e.paymentMethod === '' || e.paymentMethod.startsWith('salary_')).reduce((s, e) => s + e.total, 0));
        const constructionSurface = parseFloat(est.constructionSurface ?? '0') || 0;
        const costPerSqm = constructionSurface > 0 ? Math.round(grandActTotal / constructionSurface) : 0;
        const snapRows = (snap.laborRows ?? []).filter((r: any) => Number(r.quantity ?? 0) > 0);
        let totalEstQ = 0; let totalActQ = 0;
        for (const row of snapRows) {
            const eQ = Number(row.quantity ?? 0);
            const aQ = parseFloat((actualData[toId(row._id)]?.quantity ?? '').replace(',', '.')) || 0;
            totalEstQ += eQ; totalActQ += Math.min(aQ, eQ);
        }
        const completionPct = totalEstQ > 0 ? Math.min(100, Math.round((totalActQ / totalEstQ) * 100)) : 0;

        // Summary rows (above grand total)
        const summaryRows: [string, string][] = [
            ['Ընդհ. արժեք (Նախ. / Փաստ.)', `${estTotal > 0 ? fmtN(estTotal) : '—'} / ${grandActTotal > 0 ? fmtN(grandActTotal) : '—'} AMD`],
            ['Նյութ. արժեք (Նախ. / Փաստ.)', `${estMaterials > 0 ? fmtN(estMaterials) : '—'} / ${actMaterials > 0 ? fmtN(actMaterials) : '—'} AMD`],
            ['Աշխ. ծախս (Նախ. / Փաստ.)', `${estLabor > 0 ? fmtN(estLabor) : '—'} / ${actLabor > 0 ? fmtN(actLabor) : '—'} AMD`],
            ...(constructionSurface > 0 ? [['Շինարա. մակերես', `${constructionSurface.toLocaleString()} մ²`] as [string, string]] : []),
            ...(completionPct > 0 ? [['Կատ. տոկոս', `${completionPct}%`] as [string, string]] : []),
            ...(constructionSurface > 0 && costPerSqm > 0 ? [['Ծախս 1 մ²-ի համար', `${fmtN(costPerSqm)} AMD`] as [string, string]] : []),
        ];
        const summaryHeaderHtml = summaryRows.map(([lbl, val]) =>
            `<tr><td class="headerTableName lightGreen">${esc(lbl)}</td><td class="headerTableValue bold">${esc(val)}</td></tr>`
        ).join('');
        tableBodyHtml += `<tr class="lightBlue"><td class="subsection" colspan="13">ԸՆԴԱՄԵՆԸ՝</td><td class="subsection" colspan="2">${fmtN(grandActTotal)}</td></tr>`;

        const full = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Ամփոփ հաշվարկ</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Armenian:wght@100..900&display=swap" rel="stylesheet">
<style>
body { font-family: 'Noto Sans Armenian', Arial, sans-serif; margin: 0; padding: 0; font-size: 12px; }
.container { padding-top: 10px; padding-left: 10px; padding-right: 10px; }
.stackContainer { display: flex; }
.columnHalf { flex: 1; box-sizing: border-box; }
.lightBlue { background-color: #b4ccd6; }
.lightGreen { background-color: #e2efd9; }
.lightGray { background-color: lightgray; }
.headerTable { border-collapse: collapse; width: 100%; }
.headerTableName { border: 1px solid black; font-style: italic; width: 200px; padding-left: 4px; padding-right: 4px; }
.headerTableValue { padding-left: 4px; padding-right: 4px; }
.center { text-align: center; }
.bold { font-weight: bolder; }
.estimateTable { border-collapse: collapse; width: 100%; }
.estimateTable td, .estimateTable th { border: 1px solid black; text-align: center; padding-left: 4px; padding-right: 4px; }
.section { font-weight: bold; text-align: center; padding-top: 8px; padding-bottom: 8px; }
.subsection { font-weight: bold; text-align: center; padding-top: 8px; padding-bottom: 8px; }
.importantInfo { font-weight: normal; text-align: left; }
</style>
</head>
<body>
<div class="container">
<div class="stackContainer">
<div style="flex: 1; box-sizing: border-box; padding-right: 16px;">
    <table class="headerTable">
        <tr><td class="headerTableName lightGreen">Օբյեկտի անվանումը</td><td class="headerTableValue bold">${esc(est?.name ?? '')}</td></tr>
        <tr><td class="headerTableName lightGreen">Հասցե</td><td class="headerTableValue">${esc(est?.address ?? '')}</td></tr>
        <tr><td class="headerTableName lightGreen">Գեներացման ամսաթիվ</td><td class="headerTableValue bold">${fmtDate()}</td></tr>
    </table>
</div>
<div style="flex: 1; box-sizing: border-box; padding-right: 16px;">
    <table class="headerTable">${summaryHeaderHtml}</table>
</div>
<div style="box-sizing: border-box">
    <img src="${companyLogoUrl ?? '/images/logo_wide.png'}" alt="Logo" style="height: 60px; width: auto; margin-right: 20px; margin-top: 5px; object-fit: contain;"/>
</div>
</div>
<div>&nbsp;</div>
<table class="estimateTable">
<colgroup>
    <col style="min-width:24px;max-width:24px;">
    <col style="min-width:50px;max-width:50px;">
    <col style="min-width:100px;">
    <col style="min-width:24px;max-width:24px;">
    <col style="min-width:60px;max-width:60px;">
    <col style="min-width:60px;max-width:60px;">
    <col style="min-width:50px;max-width:50px;">
    <col style="min-width:100px;">
    <col style="min-width:24px;max-width:24px;">
    <col style="min-width:60px;max-width:60px;">
    <col style="min-width:60px;max-width:60px;">
    <col style="min-width:60px;max-width:60px;">
    <col style="min-width:60px;max-width:60px;">
    <col style="min-width:60px;max-width:60px;">
    <col style="min-width:60px;max-width:60px;">
</colgroup>
<thead>
<tr class="table-header">
    <th class="lightBlue" rowspan="2">Հ/հ</th>
    <th class="lightBlue" rowspan="2">Կոդը</th>
    <th class="lightBlue" rowspan="2">Աշխատանքի անվանումը</th>
    <th class="lightBlue" rowspan="2">Չ․Մ․</th>
    <th class="lightBlue" rowspan="2">Քանակը</th>
    <th class="lightBlue" rowspan="2">Արժեքը</th>
    <th class="lightGreen" colspan="7">Հաշվարկային նյութածախս</th>
    <th class="lightGray" rowspan="2">Աշխատ․ միավոր արժեքը</th>
    <th class="lightGray" rowspan="2">Ընդհանուր միավոր արժեքը</th>
</tr>
<tr>
    <th class="lightGreen">Կոդ</th>
    <th class="lightGreen">Նյութի անվանումը</th>
    <th class="lightGreen">Չ․Մ․</th>
    <th class="lightGreen">Նորմա ծախս</th>
    <th class="lightGreen">Քանակ</th>
    <th class="lightGreen">Նյութի արժեքը</th>
    <th class="lightGreen">Նյութի ընդհանուր արժեքը</th>
</tr>
</thead>
<tbody>
${tableBodyHtml}
</tbody>
</table>
</div>
</body>
</html>`;
        return full;
    };

    const handleSummaryExportAs = async (format: 'html' | 'word' | 'excel' | 'pdf') => {
        setSummaryExporting(true);
        try {
            const html = await buildSummaryHtml();
            const filename = 'amphop_hashvark';
            if (format === 'html') {
                const win = window.open('', '_blank');
                if (win) { win.document.write(html); win.document.close(); }
            } else if (format === 'word') {
                const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
                const styleContent = styleMatch ? styleMatch[1] : '';
                const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
                const bodyContent = bodyMatch ? bodyMatch[1] : html;
                const wordHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><meta name="ProgId" content="Word.Document"><style>${styleContent}@page{size:A3 landscape;margin:1cm;}table{border-collapse:collapse;width:100%;}td,th{font-size:10pt;}</style></head><body>${bodyContent}</body></html>`;
                const blob = new Blob(['﻿' + wordHtml], { type: 'application/msword' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `${filename}.doc`; a.click();
                URL.revokeObjectURL(url);
            } else if (format === 'excel') {
                const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
                const styleContent = styleMatch ? styleMatch[1] : '';
                const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
                const bodyContent = bodyMatch ? bodyMatch[1] : html;
                const excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/><style>${styleContent}</style></head><body>${bodyContent}</body></html>`;
                const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `${filename}.xls`; a.click();
                URL.revokeObjectURL(url);
            } else if (format === 'pdf') {
                const win = window.open('', '_blank');
                if (win) {
                    win.document.write(html);
                    win.document.close();
                    win.addEventListener('load', () => { setTimeout(() => win.print(), 300); });
                }
            }
            setSummaryExportModalOpen(false);
        } finally {
            setSummaryExporting(false);
        }
    };

        const handleCostAdded = (entry: CostHistoryEntry) => {
        setCostHistory(prev => [entry, ...prev]);
    };

    const handlePahestCostedUpdate = (materialItemId: string, qty: number, _costPerUnit: number = 0, estimatedLaborId?: string) => {
        setPahestEntries(prev => prev.map(e => {
            if (e.materialItemId !== materialItemId) return e;
            const laborMatch = estimatedLaborId ? e.estimatedLaborId === estimatedLaborId : !e.estimatedLaborId;
            if (!laborMatch) return e;
            return { ...e, costedQuantity: (e.costedQuantity ?? 0) + qty };
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
                        {!collapsedSections.has('quick') && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 4 }}>
                            {[
                                { icon: <RequestQuoteOutlinedIcon sx={{ fontSize: 24, color: '#7b1fa2', opacity: 0.55 }} />, label: 'Ընդհանուր նախահաշիվ', onClick: handleEstimationOpen, accent: '#7b1fa2', hoverBg: 'rgba(123,31,162,0.06)' },
                                { icon: <StraightenIcon sx={{ fontSize: 24, color: '#E65100', opacity: 0.55 }} />, label: t('Volume Registration'), onClick: () => setVolumesOpen(true), accent: '#E65100', hoverBg: 'rgba(230,81,0,0.06)' },
                                { icon: <CategoryOutlinedIcon sx={{ fontSize: 24, color: mainPrimaryColor, opacity: 0.55 }} />, label: t('Materials Cost Recording'), onClick: () => setMaterialsOpen(true), accent: mainPrimaryColor, hoverBg: 'rgba(0,171,190,0.06)' },
                                { icon: <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 24, color: '#1565c0', opacity: 0.55 }} />, label: t('Salary Cost Recording'), onClick: () => setSalaryOpen(true), accent: '#1565c0', hoverBg: 'rgba(21,101,192,0.06)' },
                                { icon: <PrecisionManufacturingOutlinedIcon sx={{ fontSize: 24, color: '#795548', opacity: 0.55 }} />, label: 'Մեխանիզմի ծախսագրում', onClick: () => setMechanismOpen(true), accent: '#795548', hoverBg: 'rgba(121,85,72,0.06)' },
                                { icon: <BuildIcon sx={{ fontSize: 24, color: '#4caf50', opacity: 0.55 }} />, label: 'Փոքրածավալ շինաշխատանք', onClick: () => setSmallScaleOpen(true), accent: '#4caf50', hoverBg: 'rgba(76,175,80,0.06)' },
                                { icon: <TuneOutlinedIcon sx={{ fontSize: 24, color: '#546e7a', opacity: 0.55 }} />, label: 'Վերադիր ծախսեր', onClick: () => setOverheadOpen(true), accent: '#546e7a', hoverBg: 'rgba(84,110,122,0.06)' },
                                { icon: <AddCardOutlinedIcon sx={{ fontSize: 24, color: '#e53935', opacity: 0.55 }} />, label: 'Այլ ծախսեր', onClick: () => setOtherCostsOpen(true), accent: '#e53935', hoverBg: 'rgba(229,57,53,0.06)' },
                                { icon: <ChangeCircleOutlinedIcon sx={{ fontSize: 24, color: '#f57c00', opacity: 0.55 }} />, label: 'Աշխատանքի Փոփոխություն', onClick: () => {}, accent: '#f57c00', hoverBg: 'rgba(245,124,0,0.06)' },
                                { icon: <SummarizeOutlinedIcon sx={{ fontSize: 24, color: '#0288d1', opacity: 0.55 }} />, label: 'Ամփոփ հաշվարկ', onClick: () => setSummaryExportModalOpen(true), accent: '#0288d1', hoverBg: 'rgba(2,136,209,0.06)' },
                            ].map(({ icon, label, onClick, accent, hoverBg }) => (
                                <Box key={label} onClick={onClick} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5, width: 118, height: 96, px: 1, py: 1, bgcolor: '#fff', borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.15s, background-color 0.15s', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.13)', transform: 'translateY(-2px)', bgcolor: hoverBg }, '&:hover svg': { opacity: '1 !important' } }}>
                                    {icon}
                                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#1a1a1a', textAlign: 'center', lineHeight: 1.25 }}>{label}</Typography>
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
                                <LaborProfitabilityWidget estimateSnapshot={estimateSnapshot} actualData={actualData} costHistory={costHistory} pahestEntries={pahestEntries} height={220} />
                            </Box>
                        </Box>
                        {(() => {
                            const actualMaterials = costHistory.filter(e => e.paymentMethod === 'nyuth_tsakhsagrum').reduce((s, e) => s + e.total, 0);
                            const actualLabor = costHistory.filter(e => !e.paymentMethod || e.paymentMethod === '' || e.paymentMethod.startsWith('salary_')).reduce((s, e) => s + e.total, 0);
                            const actualTotal = costHistory.filter(e => !e.paymentMethod?.startsWith('pahest_')).reduce((s, e) => s + e.total, 0);
                            const toRowId = (id: unknown): string => typeof id === 'object' && id !== null && 'oid' in (id as any) ? (id as any).oid : String(id);
                            const completedRowIds = new Set(estimateSnapshot ? estimateSnapshot.laborRows.filter(row => {
                                const rid = toRowId(row._id);
                                const actQty = parseFloat(actualData[rid]?.quantity || '0') || 0;
                                const estQty = Number(row.quantity ?? 0);
                                return estQty > 0 && actQty >= estQty;
                            }).map(row => toRowId(row._id)) : []);
                            const laborCompleted = completedRowIds.size;
                            const laborCurrent = new Set(costHistory.filter(e => e.laborItemId && !e.paymentMethod?.startsWith('pahest_') && !completedRowIds.has(e.laborItemId)).map(e => e.laborItemId)).size;
                            const materialCompleted = pahestEntries.filter(e => e.quantity > 0 && (costedQuantityMap.get(e.materialItemId) ?? 0) >= e.quantity).length;
                            const materialCurrent = pahestEntries.filter(e => e.quantity > 0 && (costedQuantityMap.get(e.materialItemId) ?? 0) < e.quantity).length;
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
                                ...(!hasUFInExpenses && unforeseenEstimate != null && (ufEstimated > 0 || ufActual > 0) ? [{ key: UF_KEY, estimatedValue: ufEstimated, actualValue: ufActual, gradIndex: expenses.length + extraSSCount }] : []),
                            ];
                            if (expenses.length === 0 && extraWidgets.length === 0) return null;
                            return (
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
                                    {expenses.map((exp, i) => {
                                        const key = Object.keys(exp)[0];
                                        const estimatedValue = key === UF_KEY && ufEstimated > 0 ? ufEstimated : Math.round(base * (exp[key] ?? 0) / 100);
                                        const overheadActual = overheadEntries.reduce((s, e) => s + e.total, 0);
                                        const actualValue = key === SSW_KEY ? ssEstimated : key === SSM_KEY ? aylActual : key === UF_KEY ? ufActual : key === VAT_KEY ? vatActual : key === CLIMATE_KEY ? climateActual : key === 'temporaryStructures' ? temporaryStructures : key === 'transportationCosts' ? transportationCosts : key === 'operationHandoverCosts' ? commissioningCosts : key === 'stateDutiesAndFees' ? stateFees : key === 'overheadCosts' ? overheadActual : 0;
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
                                            : pm === 'nyuth_tsakhsagrum' || pm === 'pahest_ayl_cost' ? 'Նյութի Ծախսագրում'
                                            : pm === 'subcontractor' ? 'Ենթակապալ'
                                            : pm === 'unforeseen' ? 'Չնախատեսված աշխատանքներ'
                                            : pm === 'overhead' ? 'Վերադիր ծախսեր'
                                            : pm === 'mechanism' ? 'Մեխանիզմի ծախսագրում'
                                            : entry.isSubcontractor ? t('Subcontractor')
                                            : 'Ծավալի հաշվառում';
                                        return (
                                        <TableRow key={entry.id} hover>
                                            <TableCell sx={{ fontSize: '0.82rem', color: '#555' }}>{actionType}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                    <span>{(pm === 'pahest_ayl' || pm === 'pahest_ayl_cost') && entry.materialItemId ? (aylEntries.find(a => a.id === entry.materialItemId)?.name || entry.workName) : entry.workName}</span>
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
                                                        if ((entry.paymentMethod === 'pahest_ayl' || entry.paymentMethod === 'pahest_ayl_cost') && entry.materialItemId) {
                                                            setAylEntries(prev => {
                                                                const idx = prev.findIndex(e => e.id === entry.materialItemId);
                                                                if (idx < 0) return prev;
                                                                const newMutq = prev[idx].mutq - entry.quantity;
                                                                const newHistory = prev[idx].history.filter((_, i) => i !== prev[idx].history.findIndex(r => Math.abs(r.quantity - entry.quantity) < 0.001));
                                                                if (newMutq <= 0 || newHistory.length === 0) return prev.filter((_, i) => i !== idx);
                                                                const next = [...prev];
                                                                next[idx] = { ...next[idx], mutq: Math.max(0, newMutq), history: newHistory };
                                                                return next;
                                                            });
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
                                                        } else if (entry.paymentMethod === 'overhead' && entry.materialItemId) {
                                                            setOverheadEntries(prev => {
                                                                const idx = prev.findIndex(e => e.id === entry.materialItemId);
                                                                if (idx < 0) return prev;
                                                                const newTotal = prev[idx].total - entry.total;
                                                                const newHistory = prev[idx].history.filter(h => h.id !== entry.id);
                                                                if (newTotal <= 0 || newHistory.length === 0) return prev.filter((_, i) => i !== idx);
                                                                const next = [...prev];
                                                                next[idx] = { ...next[idx], total: Math.max(0, newTotal), history: newHistory };
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
                            estimateId={localEstimateId || selected.estimateId}
                            unforeseenEstimateId={unforeseenEstimate ? String(unforeseenEstimate._id) : undefined}
                            entries={pahestEntries}
                            onChange={setPahestEntries}
                            costedQuantityMap={costedQuantityMap}
                            actualData={actualData}
                            costedMainKeys={new Set(costHistory.filter(e => e.paymentMethod === 'nyuth_tsakhsagrum' && e.materialItemId).map(e => `${e.materialItemId}|${e.estimatedLaborId ?? ''}`))}
                            onRemoveEntry={(materialItemId, estimatedLaborId) => setCostHistory(prev => prev.filter(e => !(e.paymentMethod === 'pahest_main' && e.materialItemId === materialItemId && (estimatedLaborId == null || e.estimatedLaborId === estimatedLaborId))))}
                            onHistoryEntry={e => setCostHistory(prev => [{ id: String(Date.now() + Math.random()), workName: e.workName, unit: e.unit, quantity: e.quantity, unitPrice: e.unitPrice, total: e.total, addedAt: new Date(), paymentMethod: 'pahest_main', materialItemId: e.materialItemId, estimatedLaborId: e.estimatedLaborId }, ...prev])}
                        />
                        <Box sx={{ mt: 4, borderTop: '1px solid #e0f5f7', pt: 3 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: mainPrimaryColor, mb: 2 }}>Այլ նյութեր</Typography>
                            <PahestAylMaterials entries={aylEntries} onChange={newEntries => {
                                setCostHistory(prev => prev.map(e => {
                                    if ((e.paymentMethod === 'pahest_ayl' || e.paymentMethod === 'pahest_ayl_cost') && e.materialItemId) {
                                        const ae = newEntries.find(a => a.id === e.materialItemId);
                                        if (ae && ae.name && ae.name !== e.workName) return { ...e, workName: ae.name };
                                    }
                                    return e;
                                }));
                                setAylEntries(newEntries);
                            }}
                                costedAylIds={new Set(costHistory.filter(e => e.paymentMethod === 'pahest_ayl_cost' && e.materialItemId).map(e => e.materialItemId as string))}
                                onHistoryEntry={e => setCostHistory(prev => [{ id: String(Date.now() + Math.random()), workName: e.workName, unit: e.unit, quantity: e.quantity, unitPrice: e.unitPrice, total: e.total, addedAt: new Date(), paymentMethod: 'pahest_ayl', materialItemId: e.aylEntryId }, ...prev])}
                                onRemoveEntry={aylEntryId => setCostHistory(prev => prev.filter(e => !((e.paymentMethod === 'pahest_ayl' || e.paymentMethod === 'pahest_ayl_cost') && e.materialItemId === aylEntryId)))}
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
            <Dialog open={summaryExportModalOpen} onClose={() => setSummaryExportModalOpen(false)} maxWidth='sm' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Ամփոփ հաշվարկ</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, pt: 1, justifyContent: 'center' }}>
                        {([
                            { format: 'html',  label: 'HTML',  icon: '/images/icons/toolbar/html.svg' },
                            { format: 'word',  label: 'Word',  icon: '/images/icons/toolbar/word.svg' },
                            { format: 'excel', label: 'Excel', icon: '/images/icons/toolbar/excel.svg' },
                            { format: 'pdf',   label: 'PDF',   icon: '/images/icons/toolbar/pdf.svg' },
                        ] as const).map(({ format, label, icon }) => (
                            <Box key={format} onClick={() => !summaryExporting && handleSummaryExportAs(format)} sx={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                p: 1, backgroundColor: 'transparent', borderRadius: 2,
                                cursor: summaryExporting ? 'default' : 'pointer',
                                opacity: summaryExporting ? 0.5 : 1,
                                width: 100, minHeight: 85,
                                boxShadow: '0 4px 6px rgba(0,0,0,0.15), 2px 0 4px rgba(0,0,0,0.05), -2px 0 4px rgba(0,0,0,0.05)',
                                transition: 'all 0.2s',
                                '&:hover': summaryExporting ? {} : {
                                    boxShadow: '0 6px 10px rgba(0,0,0,0.2), 3px 0 6px rgba(0,0,0,0.08), -3px 0 6px rgba(0,0,0,0.08)',
                                    transform: 'translateY(-2px)',
                                },
                            }}>
                                <Box sx={{ mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ImgElement src={icon} sx={{ height: 36 }} />
                                </Box>
                                <Typography variant='caption' align='center' sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{label}</Typography>
                            </Box>
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSummaryExportModalOpen(false)} sx={{ borderRadius: '20px', color: '#888' }}>Cancel</Button>
                </DialogActions>
            </Dialog>

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
                    originalEstimateId={localEstimateId ? String(selected.estimateId) : undefined}
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
                                setActualData(prev => {
                                    const existing = prev[entry.laborItemId!];
                                    const existingQty = parseFloat(existing?.quantity ?? '0') || 0;
                                    // Only set volume if none is registered yet — never overwrite existing measurement
                                    if (existingQty > 0) return prev;
                                    return { ...prev, [entry.laborItemId!]: { ...(existing ?? {}), quantity: String(vol) } };
                                });
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
                <MechanismCostsDialog
                    open={mechanismOpen}
                    onClose={() => setMechanismOpen(false)}
                    laborRows={Array.from(new Map((estimateSnapshot?.laborRows ?? []).filter(r => !r.isGroupRow).map(r => [r._id, r])).values())}
                    entries={mechanismEntries}
                    onChange={setMechanismEntries}
                    onHistoryEntry={e => setCostHistory(prev => [{ id: e.id, workName: e.workName, unit: '—', quantity: 1, unitPrice: e.amount, total: e.amount, addedAt: new Date(), paymentMethod: 'mechanism', materialItemId: e.mechanismEntryId, laborItemId: e.laborItemId, groupName: e.laborName }, ...prev])}
                    onRemoveEntry={entryId => setCostHistory(prev => prev.filter(e => !(e.paymentMethod === 'mechanism' && e.materialItemId === entryId)))}
                    onRemoveHistoryRecord={histId => setCostHistory(prev => prev.filter(e => e.id !== histId))}
                />
                <OverheadCostsDialog
                    open={overheadOpen}
                    onClose={() => setOverheadOpen(false)}
                    entries={overheadEntries}
                    onChange={setOverheadEntries}
                    onHistoryEntry={e => setCostHistory(prev => [{ id: e.id, workName: e.workName, unit: '—', quantity: 1, unitPrice: e.amount, total: e.amount, addedAt: new Date(), paymentMethod: 'overhead', materialItemId: e.overheadEntryId }, ...prev])}
                    onRemoveEntry={entryId => setCostHistory(prev => prev.filter(e => !(e.paymentMethod === 'overhead' && e.materialItemId === entryId)))}
                    onRemoveHistoryRecord={histId => setCostHistory(prev => prev.filter(e => e.id !== histId))}
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
                                const result = await Api.requestSession<{ snapshot: EstimateSnapshot | null; costHistory?: CostHistoryEntry[]; pahestEntries?: PahestEntry[] }>({
                                    command: 'costing/refresh_local_snapshot', args: { id: selected._id },
                                });
                                if (result.snapshot) setEstimateSnapshot(result.snapshot);
                                if (result.costHistory) setCostHistory(result.costHistory.map(e => ({ ...e, addedAt: new Date(e.addedAt) })));
                                if (result.pahestEntries) setPahestEntries(result.pahestEntries);
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

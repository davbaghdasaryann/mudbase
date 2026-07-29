'use client';

import { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';
import { formatCurrencyRounded } from '@/lib/format_currency';
import { mainPrimaryColor } from '@/theme';
import type { CostHistoryEntry } from './page';

interface LaborRow {
    _id: string;
    catalogName: string;
    laborOfferItemName: string;
    unitSymbol: string;
    quantity: number;
    changableAveragePrice: number;
    cost: number;
    subsectionName: string;
    sectionName: string;
}

interface Section { _id: string; name: string; displayIndex: number; totalCost: number; }
interface Subsection { _id: string; estimateSectionId: string; name: string; displayIndex: number; }

function toId(v: unknown): string {
    if (!v) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'object' && 'oid' in (v as any)) return (v as any).oid;
    return String(v);
}

const BORDER = '#e8f7f9';
const SEC_BG = '#e6f7f9';
const SUB_BG = '#f7fdfe';

const th = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    border: `1px solid ${BORDER}`, padding: '7px 10px', whiteSpace: 'nowrap',
    fontWeight: 700, fontSize: '0.8rem', color: '#222',
    backgroundColor: '#f0fbfc', borderBottom: `2px solid ${mainPrimaryColor}`, ...extra,
});

const td = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    border: `1px solid ${BORDER}`, padding: '6px 10px',
    fontSize: '0.82rem', verticalAlign: 'middle', ...extra,
});

interface Props {
    estimate: EstimatesApi.ApiEstimate;
    actualData: Record<string, { quantity: string; unitPrice: string; spent?: string }>;
    costHistory: CostHistoryEntry[];
}

export default function AnalysisTab({ estimate, actualData, costHistory }: Props) {
    const [rows, setRows] = useState<LaborRow[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [subsections, setSubsections] = useState<Subsection[]>([]);
    const [loading, setLoading] = useState(true);

    const estimateId = toId(estimate._id);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            Api.requestSession<LaborRow[]>({ command: 'estimate/fetch_labor_for_analysis', args: { estimateId } }),
            Api.requestSession<Section[]>({ command: 'estimate/fetch_sections', args: { estimateId } }),
        ])
            .then(async ([laborData, sectData]) => {
                const sorted = (sectData ?? []).sort((a, b) => a.displayIndex - b.displayIndex);
                setSections(sorted);
                setRows(laborData ?? []);
                const arrays = await Promise.all(
                    sorted.map(s =>
                        Api.requestSession<Subsection[]>({ command: 'estimate/fetch_subsections', args: { estimateSectionId: toId(s._id) } })
                            .catch(() => [] as Subsection[])
                    )
                );
                setSubsections(arrays.flat());
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [estimateId]);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} sx={{ color: mainPrimaryColor }} />
        </Box>
    );

    if (rows.length === 0) return (
        <Typography variant='body2' color='text.secondary' sx={{ py: 4, textAlign: 'center' }}>
            Տվյալ չկա
        </Typography>
    );

    const subsMap = new Map<string, Subsection[]>();
    for (const sect of sections) {
        subsMap.set(toId(sect._id),
            subsections.filter(s => toId(s.estimateSectionId) === toId(sect._id)).sort((a, b) => a.displayIndex - b.displayIndex));
    }

    const getActuals = (row: LaborRow) => {
        const rowId = toId(row._id);
        const a = actualData[rowId];
        const volumeTotal = parseFloat((a?.spent ?? '').replace(',', '.')) || 0;
        const salaryTotal = costHistory.filter(e => e.laborItemId === rowId).reduce((s, e) => s + e.total, 0);
        const actualTotal = volumeTotal + salaryTotal;
        const hasData = !!(a || salaryTotal > 0);
        return { actualTotal, hasData };
    };

    let counter = 0;

    const renderRow = (row: LaborRow, idx: number, pl: number) => {
        const { actualTotal, hasData } = getActuals(row);
        const estimated = row.cost ?? 0;
        const diff = hasData ? estimated - actualTotal : null;
        const pct = diff !== null && estimated > 0 ? (diff / estimated) * 100 : null;
        const cheaper = diff !== null ? diff >= 0 : null;

        return (
            <tr key={toId(row._id)} style={{ backgroundColor: idx % 2 === 0 ? '#fafeff' : '#fff' }}
                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#f5fdfe'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = idx % 2 === 0 ? '#fafeff' : '#fff'; }}
            >
                <td style={td({ textAlign: 'center', color: '#888', fontSize: '0.78rem' })}>{idx}</td>
                <td style={td({ paddingLeft: pl, whiteSpace: 'normal' })}>{row.laborOfferItemName || row.catalogName}</td>
                <td style={td({ textAlign: 'right', fontWeight: 600, color: '#333' })}>{formatCurrencyRounded(estimated)} AMD</td>
                <td style={td({ textAlign: 'right', fontWeight: 600, color: hasData ? mainPrimaryColor : '#ccc' })}>
                    {hasData ? `${formatCurrencyRounded(actualTotal)} AMD` : '—'}
                </td>
                <td style={td({ textAlign: 'right' })}>
                    {diff !== null
                        ? <span style={{ fontWeight: 700, color: cheaper! ? '#2e7d32' : '#c62828' }}>
                            {diff >= 0 ? '+' : ''}{formatCurrencyRounded(diff)} AMD
                          </span>
                        : <span style={{ color: '#ccc' }}>{'—'}</span>
                    }
                </td>
                <td style={td({ textAlign: 'right' })}>
                    {pct !== null ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                            {cheaper
                                ? <TrendingDownIcon sx={{ fontSize: 14, color: '#2e7d32' }} />
                                : <TrendingUpIcon sx={{ fontSize: 14, color: '#c62828' }} />
                            }
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: cheaper ? '#2e7d32' : '#c62828' }}>
                                {Math.abs(pct).toFixed(1)}%
                            </Typography>
                        </Box>
                    ) : <span style={{ color: '#ccc' }}>{'—'}</span>}
                </td>
                <td style={td({ textAlign: 'right' })}>
                    {hasData && actualTotal > estimated
                        ? <span style={{ fontWeight: 700, color: '#c62828' }}>{formatCurrencyRounded(actualTotal - estimated)} AMD</span>
                        : <span style={{ color: '#ccc' }}>{'—'}</span>}
                </td>
            </tr>
        );
    };

    const grandExcess = rows.reduce((s, r) => {
        const { actualTotal, hasData } = getActuals(r);
        const est = r.cost ?? 0;
        return hasData && actualTotal > est ? s + (actualTotal - est) : s;
    }, 0);
    const grandHasExcess = rows.some(r => {
        const { actualTotal, hasData } = getActuals(r);
        return hasData && actualTotal > (r.cost ?? 0);
    });

    const grandEstimated = rows.reduce((s, r) => s + (r.cost ?? 0), 0);
    const grandActual = rows.reduce((s, r) => { const { actualTotal, hasData } = getActuals(r); return hasData ? s + actualTotal : s; }, 0);
    const grandHasActual = rows.some(r => getActuals(r).hasData);
    const grandDiff = grandHasActual ? grandEstimated - grandActual : null;
    const grandPct = grandDiff !== null && grandEstimated > 0 ? (grandDiff / grandEstimated) * 100 : null;

    return (
        <Box sx={{ overflow: 'auto', pb: 4, width: '100%' }}>
            <table style={{ tableLayout: 'fixed', borderCollapse: 'collapse', width: '100%', minWidth: 900 }}>
                <colgroup>
                    <col style={{ width: 44 }} />
                    <col />
                    <col style={{ width: 130 }} />
                    <col style={{ width: 130 }} />
                    <col style={{ width: 150 }} />
                    <col style={{ width: 135 }} />
                    <col style={{ width: 135 }} />
                </colgroup>
                <thead>
                    <tr>
                        <th style={th({ textAlign: 'center' })}>{'№'}</th>
                        <th style={th({ textAlign: 'left' })}>Աշխատանքի անվանումը</th>
                        <th style={th({ textAlign: 'right' })}>Նախահաշիվ</th>
                        <th style={th({ textAlign: 'right' })}>Փաստացի</th>
                        <th style={th({ textAlign: 'right' })}>Մնացորդային</th>
                        <th style={th({ textAlign: 'right' })}>Շահութաբերություն</th>
                        <th style={th({ textAlign: 'right' })}>Լրացուցիչ</th>
                    </tr>
                </thead>
                <tbody>
                    {sections.map((section, si) => {
                        const sectionItems = rows.filter(r => r.sectionName === section.name);
                        if (sectionItems.length === 0) return null;
                        const subs = subsMap.get(toId(section._id)) ?? [];

                        return (
                            <>
                                <tr key={`sec-${section._id}`} style={{ backgroundColor: SEC_BG }}>
                                    <td colSpan={8} style={td({ fontWeight: 700, fontSize: '0.85rem', color: '#00818f', paddingLeft: 16, borderTop: si > 0 ? '2px solid #b2e8ed' : undefined })}>
                                        {si + 1}. {section.name.toUpperCase()}
                                    </td>
                                </tr>
                                {subs.length > 0
                                    ? subs.map((sub, subI) => {
                                        const subItems = sectionItems.filter(r => r.subsectionName === sub.name);
                                        if (subItems.length === 0) return null;
                                        return (
                                            <>
                                                <tr key={`sub-${sub._id}`} style={{ backgroundColor: SUB_BG }}>
                                                    <td colSpan={8} style={td({ paddingLeft: 28, color: '#666', fontStyle: 'italic', fontSize: '0.8rem' })}>
                                                        {si + 1}.{subI + 1}. {sub.name}
                                                    </td>
                                                </tr>
                                                {subItems.map(row => renderRow(row, ++counter, 36))}
                                            </>
                                        );
                                    })
                                    : sectionItems.map(row => renderRow(row, ++counter, 20))
                                }
                            </>
                        );
                    })}
                    <tr style={{ backgroundColor: '#d6f4f7' }}>
                        <td colSpan={2} style={td({ fontWeight: 800, color: mainPrimaryColor, fontSize: '0.88rem', borderTop: `2px solid ${mainPrimaryColor}` })}>
                            Ընդամենը
                        </td>
                        <td style={td({ textAlign: 'right', fontWeight: 800, color: mainPrimaryColor, fontSize: '0.88rem', borderTop: `2px solid ${mainPrimaryColor}` })}>
                            {formatCurrencyRounded(grandEstimated)} AMD
                        </td>
                        <td style={td({ textAlign: 'right', fontWeight: 800, color: mainPrimaryColor, fontSize: '0.88rem', borderTop: `2px solid ${mainPrimaryColor}` })}>
                            {grandHasActual ? `${formatCurrencyRounded(grandActual)} AMD` : '—'}
                        </td>
                        <td style={td({ textAlign: 'right', borderTop: `2px solid ${mainPrimaryColor}` })}>
                            {grandDiff !== null
                                ? <span style={{ fontSize: '0.88rem', fontWeight: 800, color: grandDiff >= 0 ? '#2e7d32' : '#c62828' }}>{grandDiff >= 0 ? '+' : ''}{formatCurrencyRounded(grandDiff)} AMD</span>
                                : '—'}
                        </td>
                        <td style={td({ textAlign: 'right', borderTop: `2px solid ${mainPrimaryColor}` })}>
                            {grandPct !== null
                                ? <span style={{ fontSize: '0.88rem', fontWeight: 800, color: grandPct >= 0 ? '#2e7d32' : '#c62828' }}>{grandPct >= 0 ? '+' : ''}{grandPct.toFixed(1)}%</span>
                                : '—'}
                        </td>
                        <td style={td({ textAlign: 'right', borderTop: `2px solid ${mainPrimaryColor}` })}>
                            {grandHasExcess
                                ? <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#c62828' }}>{formatCurrencyRounded(grandExcess)} AMD</span>
                                : '—'}
                        </td>
                    </tr>
                </tbody>
            </table>
        </Box>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import * as Api from '@/api';
import { formatCurrencyRounded } from '@/lib/format_currency';
import { mainPrimaryColor } from '@/theme';

interface LaborRow {
    _id: string;
    laborItemId: string;
    fullCode: string;
    catalogName: string;
    laborOfferItemName: string;
    unitSymbol: string;
    quantity: number;
    changableAveragePrice: number;
    cost: number;
    subsectionName: string;
    sectionName: string;
}

interface Section {
    _id: string;
    name: string;
    displayIndex: number;
    totalCost: number;
}

interface Subsection {
    _id: string;
    estimateSectionId: string;
    name: string;
    displayIndex: number;
    totalCost: number;
}

interface ActValues { unitPrice: string; quantity: string; }
type ActData = Record<string, ActValues>;

interface StoredData {
    recordId: string;
    estimateId: string;
    estimateName: string;
    acts: number[];
    actsData: ActData[];
    actsDates: { from: string; to: string }[];
}

function parseNum(v: string): number {
    const n = parseFloat(v.replace(',', '.'));
    return isNaN(n) ? 0 : n;
}

const BORDER = '#cde8ec';

const cellStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    border: `1px solid ${BORDER}`,
    padding: '5px 8px',
    fontSize: '0.78rem',
    verticalAlign: 'middle',
    ...extra,
});

const hdrStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    border: `1px solid ${BORDER}`,
    padding: '7px 8px',
    fontSize: '0.78rem',
    fontWeight: 700,
    backgroundColor: '#e8f7f9',
    color: '#111',
    textAlign: 'center',
    verticalAlign: 'middle',
    ...extra,
});

export default function RemainingCalculationPage() {
    const [data, setData] = useState<StoredData | null>(null);
    const [rows, setRows] = useState<LaborRow[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [subsections, setSubsections] = useState<Subsection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const raw = sessionStorage.getItem('remainingCalcData');
        if (!raw) { setError('No data found. Please open this page from the Performance tab.'); setLoading(false); return; }
        const stored: StoredData = JSON.parse(raw);
        setData(stored);

        const { estimateId } = stored;
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
                        Api.requestSession<Subsection[]>({ command: 'estimate/fetch_subsections', args: { estimateSectionId: String(s._id) } })
                            .catch(() => [] as Subsection[])
                    )
                );
                setSubsections(arrays.flat());
            })
            .catch(e => setError(String(e)))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <CircularProgress sx={{ color: mainPrimaryColor }} />
        </Box>
    );

    if (error || !data) return (
        <Box sx={{ p: 4 }}>
            <Typography color='error'>{error ?? 'Unknown error'}</Typography>
        </Box>
    );

    const { estimateName, acts, actsData, actsDates } = data;

    const subsectionsBySection = new Map<string, Subsection[]>();
    for (const sect of sections) {
        subsectionsBySection.set(String(sect._id),
            subsections.filter(s => String(s.estimateSectionId) === String(sect._id))
                .sort((a, b) => a.displayIndex - b.displayIndex));
    }

    let counter = 0;

    const grandContractTotal = rows.reduce((s, r) => s + (r.cost ?? 0), 0);
    const grandActTotal = acts.length > 0
        ? rows.reduce((s, r) => {
            const actT = acts.reduce((as, _, ai) => {
                const v = actsData[ai]?.[String(r._id)];
                return as + parseNum(v?.unitPrice ?? '0') * parseNum(v?.quantity ?? '0');
            }, 0);
            return s + actT;
        }, 0)
        : 0;
    const grandRemainingTotal = grandContractTotal - grandActTotal;

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto', fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }} className='no-print'>
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.3rem', color: '#111' }}>
                        Remaining Calculation
                    </Typography>
                    <Typography sx={{ fontSize: '0.9rem', color: '#555', mt: 0.5 }}>
                        {estimateName}
                    </Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: '#888', mt: 0.25 }}>
                        Generated: {new Date().toLocaleDateString()}
                    </Typography>
                </Box>
                <Button
                    variant='contained'
                    startIcon={<DownloadIcon />}
                    onClick={() => window.print()}
                    sx={{ borderRadius: '20px', backgroundColor: mainPrimaryColor, fontWeight: 600, '&:hover': { backgroundColor: '#006f7a' } }}
                >
                    Download PDF
                </Button>
            </Box>

            {/* Print header (visible only on print) */}
            <Box className='print-only' sx={{ display: 'none', mb: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Remaining Calculation — {estimateName}</Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#555' }}>Generated: {new Date().toLocaleDateString()}</Typography>
            </Box>

            {/* Summary cards */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                {[
                    { label: 'Contract Total', value: `${formatCurrencyRounded(grandContractTotal)} AMD`, color: '#1565c0' },
                    { label: 'Completed Total', value: `${formatCurrencyRounded(grandActTotal)} AMD`, color: '#2e7d32' },
                    { label: 'Remaining Total', value: `${formatCurrencyRounded(grandRemainingTotal)} AMD`, color: grandRemainingTotal < 0 ? '#c62828' : '#e65100' },
                ].map(c => (
                    <Box key={c.label} sx={{ flex: '1 1 180px', border: `1px solid ${BORDER}`, borderRadius: 2, p: 2, backgroundColor: '#fafeff' }}>
                        <Typography sx={{ fontSize: '0.72rem', color: '#777', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</Typography>
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: c.color, mt: 0.5 }}>{c.value}</Typography>
                    </Box>
                ))}
            </Box>

            {/* Table */}
            <Box sx={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'auto' }}>
                    <thead>
                        <tr>
                            <th style={hdrStyle({ width: 40 })}>No.</th>
                            <th style={hdrStyle({ textAlign: 'left', minWidth: 240 })}>Description of Work</th>
                            <th style={hdrStyle({ width: 60 })}>Unit</th>
                            <th style={hdrStyle({ width: 90 })}>Contract Qty</th>
                            <th style={hdrStyle({ width: 90 })}>Completed Qty</th>
                            <th style={hdrStyle({ width: 90 })}>Remaining Qty</th>
                            <th style={hdrStyle({ width: 110 })}>Unit Price</th>
                            <th style={hdrStyle({ width: 120 })}>Contract Total</th>
                            <th style={hdrStyle({ width: 120 })}>Completed Total</th>
                            <th style={hdrStyle({ width: 120 })}>Remaining Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sections.map(sect => {
                            const subs = subsectionsBySection.get(String(sect._id)) ?? [];
                            const sectionItems = rows.filter(r => r.sectionName === sect.name);

                            if (sectionItems.length === 0 && subs.length === 0) return null;

                            const sectionContractTotal = sectionItems.reduce((s, r) => s + (r.cost ?? 0), 0);
                            const sectionActTotal = acts.length > 0
                                ? sectionItems.reduce((s, r) => {
                                    return s + acts.reduce((as, _, ai) => {
                                        const v = actsData[ai]?.[String(r._id)];
                                        return as + parseNum(v?.unitPrice ?? '0') * parseNum(v?.quantity ?? '0');
                                    }, 0);
                                }, 0)
                                : 0;

                            return (
                                <>
                                    {/* Section header */}
                                    <tr key={`sect-${sect._id}`} style={{ backgroundColor: '#e6f7f9' }}>
                                        <td colSpan={10} style={cellStyle({ fontWeight: 700, fontSize: '0.82rem', paddingLeft: 10, letterSpacing: '0.03em', color: '#111' })}>
                                            {sect.name}
                                        </td>
                                    </tr>

                                    {subs.length > 0 ? subs.map(sub => {
                                        const subItems = rows.filter(r => r.subsectionName === sub.name && r.sectionName === sect.name);
                                        if (subItems.length === 0) return null;

                                        return (
                                            <>
                                                <tr key={`sub-${sub._id}`} style={{ backgroundColor: '#f0fbfc' }}>
                                                    <td colSpan={10} style={cellStyle({ fontStyle: 'italic', paddingLeft: 20, color: '#444', fontSize: '0.77rem' })}>
                                                        {sub.name}
                                                    </td>
                                                </tr>
                                                {subItems.map(row => {
                                                    counter++;
                                                    const contractQty = row.quantity ?? 0;
                                                    const unitPrice = row.changableAveragePrice ?? 0;
                                                    const contractTotal = row.cost ?? 0;
                                                    const completedQty = acts.reduce((s, _, ai) =>
                                                        s + parseNum(actsData[ai]?.[String(row._id)]?.quantity ?? '0'), 0);
                                                    const completedTotal = acts.reduce((s, _, ai) => {
                                                        const v = actsData[ai]?.[String(row._id)];
                                                        return s + parseNum(v?.unitPrice ?? '0') * parseNum(v?.quantity ?? '0');
                                                    }, 0);
                                                    const remainingQty = contractQty - completedQty;
                                                    const remainingTotal = contractTotal - completedTotal;
                                                    const isFullyDone = remainingQty <= 0;

                                                    return (
                                                        <tr key={row._id} style={{ backgroundColor: isFullyDone ? '#f9fff9' : '#fff', opacity: isFullyDone ? 0.6 : 1 }}>
                                                            <td style={cellStyle({ textAlign: 'center', color: '#888' })}>{counter}</td>
                                                            <td style={cellStyle({ paddingLeft: 28 })}>{row.laborOfferItemName || row.catalogName}</td>
                                                            <td style={cellStyle({ textAlign: 'center' })}>{row.unitSymbol}</td>
                                                            <td style={cellStyle({ textAlign: 'right' })}>{contractQty.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                                            <td style={cellStyle({ textAlign: 'right', color: completedQty > 0 ? '#2e7d32' : '#aaa' })}>{completedQty > 0 ? completedQty.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</td>
                                                            <td style={cellStyle({ textAlign: 'right', fontWeight: remainingQty > 0 ? 600 : 400, color: remainingQty < 0 ? '#c62828' : remainingQty === 0 ? '#aaa' : '#111' })}>{remainingQty !== 0 ? remainingQty.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</td>
                                                            <td style={cellStyle({ textAlign: 'right' })}>{unitPrice > 0 ? formatCurrencyRounded(unitPrice) : '—'}</td>
                                                            <td style={cellStyle({ textAlign: 'right' })}>{contractTotal > 0 ? formatCurrencyRounded(contractTotal) : '—'}</td>
                                                            <td style={cellStyle({ textAlign: 'right', color: completedTotal > 0 ? '#2e7d32' : '#aaa' })}>{completedTotal > 0 ? formatCurrencyRounded(completedTotal) : '—'}</td>
                                                            <td style={cellStyle({ textAlign: 'right', fontWeight: remainingTotal > 0 ? 600 : 400, color: remainingTotal < 0 ? '#c62828' : remainingTotal === 0 ? '#aaa' : '#e65100' })}>{remainingTotal > 0 ? formatCurrencyRounded(remainingTotal) : '—'}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </>
                                        );
                                    }) : sectionItems.map(row => {
                                        counter++;
                                        const contractQty = row.quantity ?? 0;
                                        const unitPrice = row.changableAveragePrice ?? 0;
                                        const contractTotal = row.cost ?? 0;
                                        const completedQty = acts.reduce((s, _, ai) =>
                                            s + parseNum(actsData[ai]?.[String(row._id)]?.quantity ?? '0'), 0);
                                        const completedTotal = acts.reduce((s, _, ai) => {
                                            const v = actsData[ai]?.[String(row._id)];
                                            return s + parseNum(v?.unitPrice ?? '0') * parseNum(v?.quantity ?? '0');
                                        }, 0);
                                        const remainingQty = contractQty - completedQty;
                                        const remainingTotal = contractTotal - completedTotal;
                                        const isFullyDone = remainingQty <= 0;

                                        return (
                                            <tr key={row._id} style={{ backgroundColor: isFullyDone ? '#f9fff9' : '#fff', opacity: isFullyDone ? 0.6 : 1 }}>
                                                <td style={cellStyle({ textAlign: 'center', color: '#888' })}>{counter}</td>
                                                <td style={cellStyle({ paddingLeft: 18 })}>{row.laborOfferItemName || row.catalogName}</td>
                                                <td style={cellStyle({ textAlign: 'center' })}>{row.unitSymbol}</td>
                                                <td style={cellStyle({ textAlign: 'right' })}>{contractQty.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                                <td style={cellStyle({ textAlign: 'right', color: completedQty > 0 ? '#2e7d32' : '#aaa' })}>{completedQty > 0 ? completedQty.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</td>
                                                <td style={cellStyle({ textAlign: 'right', fontWeight: remainingQty > 0 ? 600 : 400, color: remainingQty < 0 ? '#c62828' : remainingQty === 0 ? '#aaa' : '#111' })}>{remainingQty !== 0 ? remainingQty.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</td>
                                                <td style={cellStyle({ textAlign: 'right' })}>{unitPrice > 0 ? formatCurrencyRounded(unitPrice) : '—'}</td>
                                                <td style={cellStyle({ textAlign: 'right' })}>{contractTotal > 0 ? formatCurrencyRounded(contractTotal) : '—'}</td>
                                                <td style={cellStyle({ textAlign: 'right', color: completedTotal > 0 ? '#2e7d32' : '#aaa' })}>{completedTotal > 0 ? formatCurrencyRounded(completedTotal) : '—'}</td>
                                                <td style={cellStyle({ textAlign: 'right', fontWeight: remainingTotal > 0 ? 600 : 400, color: remainingTotal < 0 ? '#c62828' : remainingTotal === 0 ? '#aaa' : '#e65100' })}>{remainingTotal > 0 ? formatCurrencyRounded(remainingTotal) : '—'}</td>
                                            </tr>
                                        );
                                    })}

                                    {/* Section subtotal */}
                                    <tr style={{ backgroundColor: '#eaf8fa' }}>
                                        <td colSpan={7} style={cellStyle({ fontWeight: 700, textAlign: 'right', fontSize: '0.78rem', paddingRight: 10 })}>Subtotal</td>
                                        <td style={cellStyle({ fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' })}>{formatCurrencyRounded(sectionContractTotal)} AMD</td>
                                        <td style={cellStyle({ fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', color: '#2e7d32' })}>{sectionActTotal > 0 ? `${formatCurrencyRounded(sectionActTotal)} AMD` : '—'}</td>
                                        <td style={cellStyle({ fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', color: '#e65100' })}>{sectionContractTotal - sectionActTotal > 0 ? `${formatCurrencyRounded(sectionContractTotal - sectionActTotal)} AMD` : '—'}</td>
                                    </tr>
                                </>
                            );
                        })}

                        {/* Grand total */}
                        <tr style={{ backgroundColor: '#d6f4f7' }}>
                            <td colSpan={7} style={cellStyle({ fontWeight: 800, textAlign: 'right', fontSize: '0.82rem', paddingRight: 10, borderTop: `2px solid ${mainPrimaryColor}` })}>Total</td>
                            <td style={cellStyle({ fontWeight: 800, textAlign: 'right', whiteSpace: 'nowrap', borderTop: `2px solid ${mainPrimaryColor}` })}>{formatCurrencyRounded(grandContractTotal)} AMD</td>
                            <td style={cellStyle({ fontWeight: 800, textAlign: 'right', whiteSpace: 'nowrap', color: '#2e7d32', borderTop: `2px solid ${mainPrimaryColor}` })}>{grandActTotal > 0 ? `${formatCurrencyRounded(grandActTotal)} AMD` : '—'}</td>
                            <td style={cellStyle({ fontWeight: 800, textAlign: 'right', whiteSpace: 'nowrap', color: '#e65100', borderTop: `2px solid ${mainPrimaryColor}` })}>{grandRemainingTotal > 0 ? `${formatCurrencyRounded(grandRemainingTotal)} AMD` : '—'}</td>
                        </tr>
                    </tbody>
                </table>
            </Box>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    body { margin: 0; }
                }
            `}</style>
        </Box>
    );
}

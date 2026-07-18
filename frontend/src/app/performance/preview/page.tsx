'use client';

import { useEffect, useState, useCallback } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import * as Api from '@/api';
import { formatCurrencyRounded } from '@/lib/format_currency';
import { mainPrimaryColor } from '@/theme';

interface LaborRow {
    _id: string;
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
interface Section { _id: string; name: string; displayIndex: number; }
interface Subsection { _id: string; estimateSectionId: string; name: string; displayIndex: number; }
interface ActValues { unitPrice: string; quantity: string; }
type ActData = Record<string, ActValues>;
interface StoredData {
    estimateId: string; estimateName: string;
    acts: number[]; actsData: ActData[]; actsDates: { from: string; to: string }[];
    selectedActIdx: number;
}

function parseNum(v: string): number {
    const n = parseFloat(v.replace(',', '.'));
    return isNaN(n) ? 0 : n;
}

function buildTableHtml(
    estimateName: string, rows: LaborRow[], sections: Section[],
    subsections: Subsection[], acts: number[], actsData: ActData[], selectedActIdx: number,
): string {
    const esc = (s: string | number) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const S = (css: string) => 'style="' + css + '"';
    const BC = 'border:1px solid #ccc;padding:5px 8px;font-size:12px;';
    const HC = 'border:1px solid #ccc;padding:6px 8px;font-weight:bold;font-size:12px;';
    const NC = 12;
    const G1 = '#F2F2F2', G2 = '#E6F0FA', G3 = '#E2EFDA', GD = '#FFFFFF';
    const actNum = acts.length > 0 ? acts[selectedActIdx] : 1;

    const getFactQty = (id: string): number => {
        let q = 0;
        for (let ai = 0; ai < selectedActIdx; ai++) q += parseNum(actsData[ai]?.[id]?.quantity ?? '0');
        return q;
    };
    const getCurQty = (id: string): number =>
        acts.length === 0 ? 0 : parseNum(actsData[selectedActIdx]?.[id]?.quantity ?? '0');

    const dg = (qty: number, up: number, bg: string) => {
        const tot = qty * up;
        return '<td ' + S(BC + 'text-align:right;background:' + bg + ';') + '>' + (qty > 0 ? qty.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '') + '</td>' +
            '<td ' + S(BC + 'text-align:right;background:' + bg + ';') + '>' + (up > 0 ? formatCurrencyRounded(up) : '') + '</td>' +
            '<td ' + S(BC + 'text-align:right;font-weight:bold;background:' + bg + ';') + '>' + (tot > 0 ? formatCurrencyRounded(tot) : '') + '</td>';
    };
    const sg = (qty: number, total: number, bg: string) =>
        '<td ' + S(BC + 'text-align:right;font-weight:bold;background:' + bg + ';') + '>' + (qty > 0 ? qty.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '') + '</td>' +
        '<td ' + S(BC + 'background:' + bg + ';') + '></td>' +
        '<td ' + S(BC + 'text-align:right;font-weight:bold;background:' + bg + ';') + '>' + (total > 0 ? formatCurrencyRounded(total) + ' AMD' : '') + '</td>';

    let html = '<table border="1" ' + S('border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;width:100%;') + '>';
    html += '<tr><td colspan="' + NC + '" ' + S(HC + 'text-align:center;font-size:14px;background:' + G1 + ';') + '>' + esc('Կատարողական Ակտ'.toUpperCase() + ' N' + actNum) + '</td></tr>';
    html += '<tr><td colspan="' + NC + '" ' + S(BC) + '>&nbsp;</td></tr>';
    html += '<tr>';
    html += '<th rowspan="2" ' + S(HC + 'text-align:center;vertical-align:middle;background:' + G1 + ';') + '>N</th>';
    html += '<th rowspan="2" ' + S(HC + 'vertical-align:middle;background:' + G1 + ';') + '>Աշխատանքի անվանումը</th>';
    html += '<th rowspan="2" ' + S(HC + 'text-align:center;vertical-align:middle;background:' + G1 + ';') + '>Չ/մ</th>';
    html += '<th colspan="3" ' + S(HC + 'text-align:center;background:' + G1 + ';') + '>Ըստ պայմանագրի</th>';
    html += '<th colspan="3" ' + S(HC + 'text-align:center;background:' + G2 + ';') + '>Փաստացի կատարված</th>';
    html += '<th colspan="3" ' + S(HC + 'text-align:center;background:' + G3 + ';') + '>Կատարողական-' + actNum + '</th>';
    html += '</tr><tr>';
    for (const bg of [G1, G2, G3]) {
        html += '<th ' + S(HC + 'text-align:right;background:' + bg + ';') + '>Քանակ</th>';
        html += '<th ' + S(HC + 'text-align:right;background:' + bg + ';') + '>Միավորի արժեքը</th>';
        html += '<th ' + S(HC + 'text-align:right;background:' + bg + ';') + '>Ընդհանուր</th>';
    }
    html += '</tr>';

    const subsMap = new Map<string, Subsection[]>();
    for (const sect of sections) {
        subsMap.set(String(sect._id),
            subsections.filter(s => String(s.estimateSectionId) === String(sect._id))
                .sort((a, b) => a.displayIndex - b.displayIndex));
    }

    let counter = 0;
    for (let si = 0; si < sections.length; si++) {
        const sect = sections[si];
        const allSectionItems = rows.filter(r => r.sectionName === sect.name);
        const sectionItems = allSectionItems.filter(r => getFactQty(String(r._id)) > 0 || getCurQty(String(r._id)) > 0);
        if (sectionItems.length === 0) continue;
        const subs = subsMap.get(String(sect._id)) ?? [];
        html += '<tr><td colspan="' + NC + '" ' + S(BC + 'font-weight:bold;font-size:13px;background:' + G1 + ';text-align:center;') + '>' + esc((si + 1) + '. ' + sect.name.toUpperCase()) + '</td></tr>';

        const renderRow = (row: LaborRow, idx: number) => {
            const up = row.changableAveragePrice ?? 0;
            const cQty = row.quantity ?? 0;
            const factQty = getFactQty(String(row._id));
            const curQty = getCurQty(String(row._id));
            return '<tr>' +
                '<td ' + S(BC + 'text-align:center;') + '>' + idx + '</td>' +
                '<td ' + S(BC) + '>' + esc(row.laborOfferItemName || row.catalogName) + '</td>' +
                '<td ' + S(BC + 'text-align:center;') + '>' + esc(row.unitSymbol) + '</td>' +
                dg(cQty, up, GD) + dg(factQty, up, GD) + dg(curQty, up, GD) +
                '</tr>';
        };

        if (subs.length > 0) {
            for (let subI = 0; subI < subs.length; subI++) {
                const sub = subs[subI];
                const subItems = sectionItems.filter(r => r.subsectionName === sub.name);
                if (subItems.length === 0) continue;
                html += '<tr><td colspan="' + NC + '" ' + S(BC + 'font-style:italic;padding-left:20px;font-size:11px;background:#f7fdfe;') + '>' + esc((si + 1) + '.' + (subI + 1) + '. ' + sub.name) + '</td></tr>';
                for (const row of subItems) html += renderRow(row, ++counter);
            }
        } else {
            for (const row of sectionItems) html += renderRow(row, ++counter);
        }

        const secCQty = sectionItems.reduce((s, r) => s + (r.quantity ?? 0), 0);
        const secCTot = sectionItems.reduce((s, r) => s + (r.cost ?? 0), 0);
        const secFQty = sectionItems.reduce((s, r) => s + getFactQty(String(r._id)), 0);
        const secFTot = sectionItems.reduce((s, r) => s + getFactQty(String(r._id)) * (r.changableAveragePrice ?? 0), 0);
        const secCurQty = sectionItems.reduce((s, r) => s + getCurQty(String(r._id)), 0);
        const secCurTot = sectionItems.reduce((s, r) => s + getCurQty(String(r._id)) * (r.changableAveragePrice ?? 0), 0);

        html += '<tr>' +
            '<td colspan="3" ' + S(BC + 'font-weight:bold;text-align:right;background:' + G1 + ';') + '>Ընդամենը</td>' +
            sg(secCQty, secCTot, G1) + sg(secFQty, secFTot, G2) + sg(secCurQty, secCurTot, G3) +
            '</tr>';
    }

    const filteredRows = rows.filter(r => getFactQty(String(r._id)) > 0 || getCurQty(String(r._id)) > 0);
    const gCTot = filteredRows.reduce((s, r) => s + (r.cost ?? 0), 0);
    const gFTot = filteredRows.reduce((s, r) => s + getFactQty(String(r._id)) * (r.changableAveragePrice ?? 0), 0);
    const gCurTot = filteredRows.reduce((s, r) => s + getCurQty(String(r._id)) * (r.changableAveragePrice ?? 0), 0);

    html += '<tr>' +
        '<td colspan="3" ' + S(BC + 'font-weight:bold;text-align:left;background:' + G1 + ';border-top:2px solid #999;') + '>Ընդհանուր</td>' +
        '<td colspan="3" ' + S(BC + 'font-weight:bold;text-align:right;background:' + G1 + ';border-top:2px solid #999;') + '>' + (gCTot > 0 ? formatCurrencyRounded(gCTot) + ' AMD' : '') + '</td>' +
        '<td colspan="3" ' + S(BC + 'font-weight:bold;text-align:right;background:' + G2 + ';border-top:2px solid #999;') + '>' + (gFTot > 0 ? formatCurrencyRounded(gFTot) + ' AMD' : '') + '</td>' +
        '<td colspan="3" ' + S(BC + 'font-weight:bold;text-align:right;background:' + G3 + ';border-top:2px solid #999;') + '>' + (gCurTot > 0 ? formatCurrencyRounded(gCurTot) + ' AMD' : '') + '</td>' +
        '</tr></table>';

    return html;
}

export default function PerformancePreviewPage() {
    const [data, setData] = useState<StoredData | null>(null);
    const [rows, setRows] = useState<LaborRow[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [subsections, setSubsections] = useState<Subsection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const raw = sessionStorage.getItem('perfPreviewData');
        if (!raw) { setError('No data. Open this page from the Performance tab.'); setLoading(false); return; }
        const stored: StoredData = JSON.parse(raw);
        setData(stored);
        Promise.all([
            Api.requestSession<LaborRow[]>({ command: 'estimate/fetch_labor_for_analysis', args: { estimateId: stored.estimateId } }),
            Api.requestSession<Section[]>({ command: 'estimate/fetch_sections', args: { estimateId: stored.estimateId } }),
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

    const handleDownload = useCallback(() => {
        if (!data) return;
        const html = buildTableHtml(data.estimateName, rows, sections, subsections, data.acts, data.actsData, data.selectedActIdx);
        const full = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/></head><body>' + html + '</body></html>';
        const blob = new Blob([full], { type: 'application/vnd.ms-excel;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const actNum = data.acts[data.selectedActIdx] ?? 1;
        a.href = url; a.download = 'performance-act-' + actNum + '.xls'; a.click();
        URL.revokeObjectURL(url);
    }, [data, rows, sections, subsections]);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <CircularProgress sx={{ color: mainPrimaryColor }} />
        </Box>
    );
    if (error || !data) return <Box sx={{ p: 4 }}><Typography color='error'>{error ?? 'Unknown error'}</Typography></Box>;

    const actNum = data.acts[data.selectedActIdx] ?? 1;
    const tableHtml = buildTableHtml(data.estimateName, rows, sections, subsections, data.acts, data.actsData, data.selectedActIdx);

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#111' }}>
                        Կատարողական հաշվարկ — ACT-{actNum}
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: '#555' }}>{data.estimateName}</Typography>
                </Box>
                <Button variant='contained' startIcon={<DownloadIcon />} onClick={handleDownload}
                    sx={{ borderRadius: '20px', backgroundColor: mainPrimaryColor, fontWeight: 600, '&:hover': { backgroundColor: '#006f7a' } }}>
                    Download XLS
                </Button>
            </Box>
            <Box sx={{ overflowX: 'auto' }} dangerouslySetInnerHTML={{ __html: tableHtml }} />
        </Box>
    );
}

'use client';

import { Box, Typography, Table, TableHead, TableBody, TableRow, TableCell, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { mainPrimaryColor } from '@/theme';

export interface BreakdownItem {
    id: string;
    name: string;
    code: string;
    type: 'labor' | 'material';
    qty: number;
    unit: string;
    monthlyPrices: Record<string, number>;
}

interface Props {
    months: string[];
    items: BreakdownItem[];
}

const TEAL_BG = 'rgba(0,171,190,0.10)';
const TEAL_BG2 = 'rgba(0,171,190,0.05)';
const HEADER_BG = '#f5f5f5';
const BORDER = 'rgba(0,0,0,0.08)';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatVal(v: number | undefined): string {
    if (!v) return '—';
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
    return v.toLocaleString();
}

/** Group months by year */
function groupByYear(months: string[]): { year: number; months: string[] }[] {
    const map = new Map<number, string[]>();
    for (const m of months) {
        const y = Number(m.split('-')[0]);
        if (!map.has(y)) map.set(y, []);
        map.get(y)!.push(m);
    }
    return Array.from(map.entries())
        .sort(([a], [b]) => a - b)
        .map(([year, months]) => ({ year, months }));
}

export default function ChronologicalBreakdownTable({ months, items }: Props) {
    const { t } = useTranslation();
    const yearGroups = groupByYear(months);
    const laborItems = items.filter((i) => i.type === 'labor');
    const materialItems = items.filter((i) => i.type === 'material');

    const cellSx = {
        fontSize: 12,
        py: 0.75,
        px: 1,
        borderRight: `1px solid ${BORDER}`,
        whiteSpace: 'nowrap' as const,
        textAlign: 'right' as const,
    };

    const renderRows = (rows: BreakdownItem[], rowBg: string) =>
        rows.map((item, i) => (
            <TableRow key={item.id} sx={{ backgroundColor: i % 2 === 0 ? rowBg : 'transparent' }}>
                {/* Sticky name column */}
                <TableCell
                    sx={{
                        position: 'sticky', left: 0, zIndex: 1,
                        backgroundColor: i % 2 === 0 ? rowBg : '#fff',
                        fontSize: 12, py: 0.75, px: 1.5,
                        borderRight: `1px solid ${BORDER}`,
                        maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        minWidth: 180,
                    }}
                    title={item.name}
                >
                    {item.name}
                </TableCell>
                <TableCell sx={{ ...cellSx, textAlign: 'left' }}>{item.code}</TableCell>
                <TableCell sx={{ ...cellSx, textAlign: 'right' }}>{item.qty}</TableCell>
                <TableCell sx={{ ...cellSx, textAlign: 'left', minWidth: 36 }}>{item.unit}</TableCell>
                {months.map((m) => (
                    <TableCell key={m} sx={{ ...cellSx, minWidth: 72 }}>
                        {formatVal(item.monthlyPrices[m])}
                    </TableCell>
                ))}
            </TableRow>
        ));

    const sectionLabel = (label: string, type: 'labor' | 'material') => (
        <TableRow>
            <TableCell
                colSpan={4 + months.length}
                sx={{
                    position: 'sticky', left: 0,
                    backgroundColor: type === 'labor' ? 'rgba(0,171,190,0.12)' : 'rgba(106,27,154,0.08)',
                    fontSize: 12, fontWeight: 700, py: 0.6, px: 1.5,
                    color: type === 'labor' ? mainPrimaryColor : '#6a1b9a',
                    borderTop: `1px solid ${BORDER}`,
                    letterSpacing: 0.5,
                }}
            >
                {label.toUpperCase()}
            </TableCell>
        </TableRow>
    );

    return (
        <Box
            sx={{
                mt: 3,
                borderRadius: 2,
                border: `1px solid ${BORDER}`,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
        >
            <Box sx={{ overflowX: 'auto' }}>
                <Table size='small' sx={{ tableLayout: 'auto', borderCollapse: 'collapse' }}>
                    <TableHead>
                        {/* Row 1: fixed columns + year groups */}
                        <TableRow sx={{ backgroundColor: HEADER_BG }}>
                            <TableCell
                                rowSpan={2}
                                sx={{
                                    position: 'sticky', left: 0, zIndex: 3,
                                    backgroundColor: HEADER_BG,
                                    fontWeight: 700, fontSize: 12, py: 1, px: 1.5,
                                    borderRight: `1px solid ${BORDER}`,
                                    minWidth: 180,
                                }}
                            >
                                {t('Name')}
                            </TableCell>
                            <TableCell rowSpan={2} sx={{ fontWeight: 700, fontSize: 12, py: 1, px: 1, borderRight: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>
                                {t('Code')}
                            </TableCell>
                            <TableCell rowSpan={2} sx={{ fontWeight: 700, fontSize: 12, py: 1, px: 1, borderRight: `1px solid ${BORDER}`, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                {t('Qty')}
                            </TableCell>
                            <TableCell rowSpan={2} sx={{ fontWeight: 700, fontSize: 12, py: 1, px: 1, borderRight: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>
                                {t('Unit')}
                            </TableCell>
                            {yearGroups.map(({ year, months: yMonths }) => (
                                <TableCell
                                    key={year}
                                    colSpan={yMonths.length}
                                    align='center'
                                    sx={{
                                        fontWeight: 700, fontSize: 13, py: 0.75,
                                        backgroundColor: TEAL_BG,
                                        color: mainPrimaryColor,
                                        borderLeft: `2px solid ${mainPrimaryColor}`,
                                        borderRight: `2px solid ${mainPrimaryColor}`,
                                    }}
                                >
                                    {year}
                                </TableCell>
                            ))}
                        </TableRow>

                        {/* Row 2: month labels */}
                        <TableRow sx={{ backgroundColor: HEADER_BG }}>
                            {months.map((m, idx) => {
                                const mo = Number(m.split('-')[1]) - 1;
                                const isFirstInYear = idx === 0 || m.split('-')[0] !== months[idx - 1]?.split('-')[0];
                                return (
                                    <TableCell
                                        key={m}
                                        align='center'
                                        sx={{
                                            fontSize: 11, py: 0.5, px: 0.5,
                                            color: '#555',
                                            minWidth: 72,
                                            borderRight: `1px solid ${BORDER}`,
                                            borderLeft: isFirstInYear ? `2px solid ${mainPrimaryColor}` : undefined,
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {MONTH_LABELS[mo]}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {laborItems.length > 0 && (
                            <>
                                {sectionLabel(t('Works'), 'labor')}
                                {renderRows(laborItems, TEAL_BG2)}
                            </>
                        )}
                        {materialItems.length > 0 && (
                            <>
                                {sectionLabel(t('Materials'), 'material')}
                                {renderRows(materialItems, 'rgba(106,27,154,0.03)')}
                            </>
                        )}
                    </TableBody>
                </Table>
            </Box>
        </Box>
    );
}

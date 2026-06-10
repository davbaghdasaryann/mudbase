'use client';

import React from 'react';
import { TextField, SxProps, Theme } from '@mui/material';

function evaluateFormula(raw: string): number | null {
    const trimmed = raw.trim();
    if (!trimmed.startsWith('=')) return null;
    const expr = trimmed.slice(1).replace(/\s+/g, '');
    if (!/^[\d+\-*/.()\s]+$/.test(expr)) return null;
    try {
        // eslint-disable-next-line no-new-func
        const result = Function('"use strict"; return (' + expr + ')')();
        if (typeof result === 'number' && isFinite(result)) return result;
    } catch {}
    return null;
}

interface FormulaTextFieldProps {
    value: number;
    onChange: (value: number) => void;
    sx?: SxProps<Theme>;
    width?: number | string;
}

export default function FormulaTextField({ value, onChange, sx, width = 120 }: FormulaTextFieldProps) {
    const [raw, setRaw] = React.useState(String(value));

    React.useEffect(() => {
        setRaw(String(value));
    }, [value]);

    const commit = () => {
        const trimmed = raw.trim();
        if (trimmed.startsWith('=')) {
            const result = evaluateFormula(trimmed);
            if (result !== null) {
                onChange(result);
                setRaw(String(result));
                return;
            }
        }
        const num = parseFloat(trimmed);
        if (!isNaN(num)) {
            onChange(num);
            setRaw(String(num));
        } else {
            setRaw(String(value));
        }
    };

    return (
        <TextField
            size="small"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    commit();
                    (e.target as HTMLElement).blur();
                }
            }}
            sx={{ width, ...sx }}
        />
    );
}

export { evaluateFormula };

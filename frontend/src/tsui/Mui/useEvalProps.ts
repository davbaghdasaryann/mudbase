import { Breakpoint, ResponsiveStyleValue, useMediaQuery, useTheme } from "@mui/system";
import { resolveBreakpointValues } from "@mui/system/breakpoints";

export function useEvalBoolProp(prop?: ResponsiveStyleValue<boolean>, defaultValue = false): boolean {
    // 1 Always call hooks unconditionally at the top level
    const theme = useTheme();

    // Always call all hooks before any conditional logic
    const xlMatch = useMediaQuery(theme.breakpoints.up('xl'));
    const lgMatch = useMediaQuery(theme.breakpoints.up('lg'));
    const mdMatch = useMediaQuery(theme.breakpoints.up('md'));
    const smMatch = useMediaQuery(theme.breakpoints.up('sm'));
    const xsMatch = useMediaQuery(theme.breakpoints.up('xs'));

    // Pass only the numeric breakpoints map:
    const valuesByBp = resolveBreakpointValues({
        values: prop,
        breakpoints: theme.breakpoints.values,
    });

    const matches: Record<Breakpoint, boolean> = {
        xl: xlMatch,
        lg: lgMatch,
        md: mdMatch,
        sm: smMatch,
        xs: xsMatch,
    };

    // ['xs','sm','md','lg','xl']
    const keys = theme.breakpoints.keys as Breakpoint[];

    // 2 Walk from largest to smallest:
    for (let i = keys.length - 1; i >= 0; i--) {
        const bp = keys[i];
        const v = valuesByBp[bp];
        // only return when its media-query actually matches
        if (v != null && matches[bp]) {
            return v;
        }
    }

    // 3 Fallback
    return defaultValue;
}

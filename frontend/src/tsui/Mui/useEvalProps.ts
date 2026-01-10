import { Breakpoint, ResponsiveStyleValue, useMediaQuery, useTheme } from "@mui/system";
import { resolveBreakpointValues } from "@mui/system/breakpoints";

export function useEvalBoolProp(prop?: ResponsiveStyleValue<boolean>, defaultValue = false): boolean {

    // 1 Now we know it's array or object → time to call hooks
    const theme = useTheme();
    // Pass only the numeric breakpoints map:
    const valuesByBp = resolveBreakpointValues({
        values: prop,
        breakpoints: theme.breakpoints.values,
    });

  const matches = {
    xl: useMediaQuery(theme.breakpoints.up('xl')),
    lg: useMediaQuery(theme.breakpoints.up('lg')),
    md: useMediaQuery(theme.breakpoints.up('md')),
    sm: useMediaQuery(theme.breakpoints.up('sm')),
    xs: useMediaQuery(theme.breakpoints.up('xs')),
  };

    // ['xs','sm','md','lg','xl']
    const keys = theme.breakpoints.keys as Breakpoint[];

    // const matches = keys.map(bp => useMediaQuery(theme.breakpoints.up(bp)));

    // 2 Walk from largest to smallest:
    for (let i = keys.length - 1; i >= 0; i--) {
        const bp = keys[i];
        const v = valuesByBp[bp];
        // only return when its media‐query actually matches
        if (v != null && matches[i]) {
            return v;
        }
    }

    // 3 Fallback
    return defaultValue;
}

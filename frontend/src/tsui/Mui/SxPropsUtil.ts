import {SxProps, Theme} from '@mui/material/styles';
import {SystemStyleObject} from '@mui/system';
import {deepmerge} from '@mui/utils';

export type SxPropsParam = SxProps<Theme>;
export type SxObject = SystemStyleObject<Theme>;

export function makeSxProps(sx?: SxPropsParam) {
    return sx ? (Array.isArray(sx) ? sx : [sx]) : [];
}

export function getSxObject(sx?: SxPropsParam): SxObject {
    if (!sx) return {};

    if (Array.isArray(sx)) {
        if (sx.length > 0) return sx[0] as SxObject;
        return {}; // TODO: work if there are many elements, or alwayr return array
    }

    return sx as SxObject;
}

export function combineSx(...sxItems: Array<SxProps<Theme> | null | undefined>): SxProps<Theme> {
    // 1. Remove null/undefined, 2. Flatten any nested arrays
    const flattened = sxItems.flatMap((item) => (!item ? [] : Array.isArray(item) ? item : [item])) as Array<
        SystemStyleObject<Theme> | ((theme: Theme) => SystemStyleObject<Theme>)
    >;

    if (flattened.length === 0) {
        // nothing to apply
        return {};
    }
    if (flattened.length === 1) {
        // single style object/function → return it directly
        return flattened[0];
    }
    // multiple → return as an array
    return flattened;
}


/**
 * Combine any number of SxProps (objects, functions, or arrays thereof)
 * into a single SxProps<Theme>. Later entries override earlier ones.
 */
export function combineSxFlat(...sxList: Array<SxProps<Theme> | null | undefined>): SxProps<Theme> {
    // 1. Remove null/undefined and flatten one level of arrays
    const entries = sxList.flatMap((sx) => (!sx ? [] : Array.isArray(sx) ? sx : [sx]));

    if (entries.length === 0) {
        // nothing to merge → empty object
        return {};
    }

    const hasFunction = entries.some((e) => typeof e === 'function');

    if (!hasFunction) {
        // all entries are plain objects → merge now
        return entries.reduce<SystemStyleObject<Theme>>(
            (acc, styleObj) => deepmerge(acc, styleObj as SystemStyleObject<Theme>),
            {}
        );
    }

    // at least one entry is a function → return a function that merges at render time
    return (theme: Theme) => {
        return entries.reduce<SystemStyleObject<Theme>>((acc, style) => {
            const obj =
                typeof style === 'function'
                    ? (style as (theme: Theme) => SystemStyleObject<Theme>)(theme)
                    : (style as SystemStyleObject<Theme>);
            return deepmerge(acc, obj);
        }, {});
    };
}

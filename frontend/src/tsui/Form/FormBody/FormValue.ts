export type FormValueFunc = (p: any) => string;
export type FormValue = string | boolean | Date | string[] | FormValueFunc;

export function computeFormValue(val: FormValue | undefined | null) {
    if (val === undefined || val === null) return '';

    if (Array.isArray(val)) return val.join(',');

    if (typeof val === 'string') return val;

    if (val instanceof Date) return val.toLocaleString();

    return val ? '1' : '0';
}

export function getFormBoolValue(val: FormValue | undefined | null): boolean {
    if (val === undefined || val === null) return false;

    if (typeof val === 'string') return val === '1' ? true : false;

    if (typeof val === 'boolean') return val;

    return false;
}

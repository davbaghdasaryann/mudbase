
export function formatCurrency(value: string | number | null | undefined): string | undefined | null {
    if (value === null) return null;
    if (value === undefined) return undefined;
    if (value === '') return '';
    if (typeof value === 'number' && isNaN(value)) return '0';

    let sval = typeof value === 'number' ? (Math.round(value * 100) / 100).toString() : value;

  return sval.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
}


export function formatCurrencyRounded(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') return '0';

    if (typeof value === 'string') return value.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');

    const number = typeof value === 'number' ? Math.round(value) : parseInt(value, 10);

    if (isNaN(number)) return '0';

    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
}

export function formatCurrencyRoundedSymbol(value: string | number | null | undefined): string {
    return formatCurrencyRounded(value) + ' AMD';
}

export function formatCurrencyThree(value: string | number | null | undefined): string | undefined | null {
    if (value === null) return null;
    if (value === undefined) return undefined;
    if (value === '') return '';
    if (typeof value === 'number' && isNaN(value)) return '0';
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(num)) return String(value);
    const rounded = Math.round(num * 1000) / 1000;
    if (Number.isInteger(rounded)) {
        return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
    const [intPart, decPart] = rounded.toFixed(3).split('.');
    return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + '.' + decPart;
}

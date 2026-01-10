
export function formatCurrency(value: string | number | null | undefined): string | undefined | null {
    if (value === null) return null;
    if (value === undefined) return undefined;
    if (value === '') return '';
    if (typeof value === 'number' && isNaN(value)) return '0';

    let sval = typeof value === 'number' ? value.toString() : value;

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

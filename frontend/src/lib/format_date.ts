import moment from 'moment';


export function formatDate(value: any) {
    return moment(value).format('DD.MM.YYYY')
}

export function makeMultilineTableCell(
    text: string,
    avgCharsPerLine = 25,
    lineHeightPx = 20,
    verticalPaddingPx = 16
): number | undefined {
    if (!text) return undefined;
    const lines = Math.ceil(text.length / avgCharsPerLine);
    if (lines > 1) {
        return lines * lineHeightPx + verticalPaddingPx;
    }
    return undefined;
}
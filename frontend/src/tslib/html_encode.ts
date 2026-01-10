export function escapeUnsafeHTML(rawStr: string): string {
    return rawStr
        .replace(/&/g, '&amp;')   // Must be first
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');  // Or &apos;, but &#39; is more widely supported
}

export function encodeHTMLEntities(rawStr: string) {
    return rawStr.replace(/[\u00A0-\u9999<>\&]/g, (i) => `&#${i.charCodeAt(0)};`);
}

export function decodeHTMLEntities(rawStr: string) {
    return rawStr.replace(/&#(\d+);/g, (match, dec) => `${String.fromCharCode(dec)}`);
}

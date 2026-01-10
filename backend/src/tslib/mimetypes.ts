export interface MimeType {
    ext?: string
    mime?: string
}

// Often used mime types
export const MimeTypeHtml = 'text/html'
export const MimeTypeYaml = 'text/yaml'
export const MimeTypeJson = 'application/json'
export const MimeTypePdf = 'application/pdf'


const mimeTypes = new Map([
    ['css',     'text/css'],
    ['csv',     'text/csv'],
    ['html',    'text/html'],
    ['txt',     'text/plain'],

    ['bmp',     'image/bmp'],
    ['gif',     'image/gif'],
    ['jpg',     'image/jpeg'],
    ['jpeg',    'image/jpeg'],
    ['png',     'image/png'],
    ['svg',     'image/svg+xml'],

    ['js',      'application/javascript'],
    ['json',    'application/json'],
    ['pdf',     'application/pdf'],
    ['xml',     'application/xml'],
    ['zip',     'application/zip'],

    ['mpg',     'audio/mpeg'],
    ['mpeg',    'audio/mpeg'],
    ['ogg',     'audio/ogg'],

    ['otf',     'font/otf'],
    ['sfnt',    'font/sfnt'],
    ['ttf',     'font/ttf'],
    ['woff',    'font/woff'],
    ['woff2',   'font/woff2'],
])

export const octetStreamMime = 'application/octet-stream'

export function deduceMimeType(ext: string) {
    return mimeTypes.get(ext)
}

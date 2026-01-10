import * as strtok3 from 'strtok3';
import {Readable} from 'stream';

import {deduceMimeType, octetStreamMime} from '../tslib/mimetypes';

export class FileTypeInfo {
    ext: string;
    mime: string;

    constructor(ext: string, mime?: string) {
        this.ext = ext;
        if (mime) this.mime = mime;
        else this.mime = deduceMimeType(ext) ?? octetStreamMime;
    }
}

export type FileTypeResult = FileTypeInfo | null;
export type FileTypeResultPromise = Promise<FileTypeResult>;

export async function fileTypeFromFile(filename: string) {
    const tokenizer = await strtok3.fromFile(filename);
    try {
        return await fileTypeFromTokenizer(tokenizer);
    } finally {
        await tokenizer.close();
    }
}

export async function fileTypeFromBuffer(input: Uint8Array | ArrayBuffer) {
    const buffer = input instanceof Uint8Array ? input : new Uint8Array(input);

    if (!buffer || buffer.length < 2) return null;

    return fileTypeFromTokenizer(strtok3.fromBuffer(buffer));
}

export async function fileTypeFromStream(stream: Readable) {
    const tokenizer = await strtok3.fromStream(stream);
    try {
        return await fileTypeFromTokenizer(tokenizer);
    } finally {
        await tokenizer.close();
    }
}

//export async function fileTypeFromTokenizer(tokenizer: ReadStreamTokenizer | BufferTokenizer | FileTokenizer): FileTypeResultPromise {
async function fileTypeFromTokenizer(tokenizer: strtok3.ITokenizer) {
    try {
        return await fileTypeParse(tokenizer);
    } catch (error) {
        if (!(error instanceof strtok3.EndOfStreamError)) throw error;
    }
    return null;
}

function fileTypeCheck(buffer: Buffer, header: number[]): boolean {
    let index = 0;

    for (let h of header) {
        if (buffer[index] != h) return false;
        ++index;
    }

    return true;
}

async function fileTypeParse(tokenizer: strtok3.ITokenizer) {
    const minimumBytes = 20; //4100; // A fair amount of file-types are detectable within this range.

    let buffer = Buffer.alloc(minimumBytes);

    // Keep reading until EOF if the file size is unknown.
    if (tokenizer.fileInfo.size === undefined) {
        tokenizer.fileInfo.size = Number.MAX_SAFE_INTEGER;
    }

    // Keep reading until EOF if the file size is unknown.
    if (tokenizer.fileInfo.size === undefined) {
        tokenizer.fileInfo.size = Number.MAX_SAFE_INTEGER;
    }

    await tokenizer.peekBuffer(buffer, {length: 12, mayBeLess: true});

    if (fileTypeCheck(buffer, [0x42, 0x4d])) return new FileTypeInfo('bmp');

    if (fileTypeCheck(buffer, [0x47, 0x49, 0x46])) return new FileTypeInfo('gif');

    if (fileTypeCheck(buffer, [0xff, 0xd8, 0xff])) return new FileTypeInfo('jpg');

    if (fileTypeCheck(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
        // APNG format (https://wiki.mozilla.org/APNG_Specification)
        // 1. Find the first IDAT (image data) chunk (49 44 41 54)
        // 2. Check if there is an "acTL" chunk before the IDAT one (61 63 54 4C)

        // Offset calculated as follows:
        // - 8 bytes: PNG signature
        // - 4 (length) + 4 (chunk type) + 13 (chunk data) + 4 (CRC): IHDR chunk

        // await tokenizer.ignore(8); // ignore PNG signature

        // async function readChunkHeader() {
        //     return {
        //         length: await tokenizer.readToken(Token.INT32_BE),
        //         type: await tokenizer.readToken(new Token.StringType(4, 'binary')),
        //     };
        // }

        // do {
        //     const chunk = await readChunkHeader();
        //     if (chunk.length < 0) {
        //         return; // Invalid chunk length
        //     }

        //     switch (chunk.type) {
        //         case 'IDAT':
        //             return {
        //                 ext: 'png',
        //                 mime: 'image/png',
        //             };
        //         case 'acTL':
        //             return {
        //                 ext: 'apng',
        //                 mime: 'image/apng',
        //             };
        //         default:
        //             await tokenizer.ignore(chunk.length + 4); // Ignore chunk-data + CRC
        //     }
        // } while (tokenizer.position + 8 < tokenizer.fileInfo.size);

        return new FileTypeInfo('png');
    }

    return null;
}

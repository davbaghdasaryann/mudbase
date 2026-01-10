

export function arrayBufferToBlob(buffer: ArrayBuffer, type: string): Blob {
    return new Blob([buffer], {type: type});
}

export function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer | string | null> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('loadend', (e) => resolve(reader.result));
        reader.addEventListener('error', reject);
        reader.readAsArrayBuffer(blob);
    });
}


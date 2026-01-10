import fs from 'fs';
import {Canvas} from 'canvas';

export function renderCanvasToFile(canvas: Canvas, outputFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const out = fs.createWriteStream(outputFile);
        const stream = canvas.createPNGStream();
        // const stream = canvas.createJPEGStream();
        stream.pipe(out);
        out.on('error', reject);
        out.on('finish', () => resolve());
    });
}


import {parseToRgba} from 'color2k';

export class Color {
    r: number = 0;
    g: number = 0;
    b: number = 0;
    a: number = 0;

    constructor(input?: string) {
        if (input) {
            this.parse(input);
        }
    }

    parse(text: string) {
        let rgba = parseToRgba(text);
        this.r = rgba[0] / 255;
        this.g = rgba[1] / 255;
        this.b = rgba[2] / 255;
        this.a = rgba[3];
    }
};


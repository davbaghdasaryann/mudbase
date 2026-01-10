
// mimicking C++ lerp
// t == 0 => a
// t == 1 => b
export function lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
}

// Checks if the given number is power of 2
export function isPower2(x: number): boolean {
    return (Math.log(x) / Math.LN2) % 1 === 0;
}

// Returns the next value which is power of two
export function nextPower2(x: number): number {
    if (x <= 1) 
        return 1;
    return Math.pow(2, Math.ceil(Math.log(x) / Math.LN2));
}

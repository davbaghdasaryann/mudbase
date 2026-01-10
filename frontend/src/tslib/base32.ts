
const encode32Chars = 'abcdefghijkmnpqrstuvwxyz23456789';

export function encodeBase32(input: number) {
    let encoded = '';

    while (input !== 0) {
        let quotient = Math.floor(input / 32);
        let remainder = input % 32;
        encoded += encode32Chars.substring(remainder, remainder + 1);
        input = quotient;
    }

    return encoded;
}

export function decodeBase32(word: string) {


    let wordArry = Array.from(word)

    const numberArray: number[] = [];

    let decoded = 0;
    for (let i = 0; i < wordArry.length; i++) {
        for (let j = 0; j < encode32Chars.length; j++) {
            if (wordArry[i] === encode32Chars[j]) {
                numberArray.push(j)

            }

        }
    }
    for (let k = 1; k < numberArray.length; k++) {

        if (k === 1) {
            decoded = 32 * (numberArray[numberArray.length - 1])
        }

        if (numberArray.length - (k + 1) !== 0) {
            decoded = 32 * (decoded + numberArray[numberArray.length - (k + 1)])
        }

        if (k === numberArray.length - 1) {
            decoded = decoded + numberArray[0]
            break;
        }

    }
    return decoded;

}


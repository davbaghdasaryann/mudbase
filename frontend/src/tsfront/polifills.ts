"use client";

//
// Fills in the missing stuff
//


function replaceAll (this: string, str: string | RegExp, newStr: string): string {
    // If a regex pattern
    if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
        return this.replace(str, newStr);
    }

    // If a string
    return this.replace(new RegExp(str, 'g'), newStr);
}

function replaceAllReplacer(this: string, str: string | RegExp, replacer: (substring: string, ...args: any[]) => string): string {
//function replaceAllCaller (this: string, str: string | RegExp, newStr: string): string {
    // If a regex pattern
    if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
        return this.replace(str, replacer);
    }

    // If a string
    return this.replace(new RegExp(str, 'g'), replacer);
}


function fixStringReplaceAll() {
    /**
     * String.prototype.replaceAll() polyfill
     * https://gomakethings.com/how-to-replace-a-section-of-a-string-with-another-one-with-vanilla-js/
     * @author Chris Ferdinandi
     * @license MIT
     */
    // if (!String.prototype.replaceAll) {
    //     // eslint-disable-next-line no-extend-native
    //     //String.prototype.replaceAll = { replaceAll, replaceAllReplacer};
    //     // eslint-disable-next-line no-extend-native
    //     String.prototype.replaceAll = function(str: string | RegExp, newStr: string): string {

    //         // If a regex pattern
    //         if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
    //             return this.replace(str, newStr);
    //         }

    //         // If a string
    //         return this.replace(new RegExp(str, 'g'), newStr);

    //     };
    // }

}



//
// createImageBitmap
//

function createImageBitmapPolyfill() 
{
    if ('createImageBitmap' in window)
        return;

    /*
    * Safari and Edge polyfill for createImageBitmap
    * https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap
    *
    * Support source image types Blob and ImageData.
    *
    * From: https://dev.to/nektro/createimagebitmap-polyfill-for-safari-and-edge-228
    * Updated by Yoan Tournade <yoan@ytotech.com>
    */

    if (typeof global.window === "undefined")
        return;

    global.window.createImageBitmap = async function (data) {
        return new Promise<ImageBitmap>((resolve, reject) => {
            let dataURL: string;
            if (data instanceof Blob) {
                dataURL = URL.createObjectURL(data);
            } else if (data instanceof ImageData) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx)
                    reject(new Error("Cannot create canvas context"));
                canvas.width = data.width;
                canvas.height = data.height;
                ctx!.putImageData(data, 0, 0);
                dataURL = canvas.toDataURL();
            } else {
                throw new Error('createImageBitmap does not handle the provided image source type');
            }

            const img = document.createElement('img');
            img.src = dataURL;

            img.addEventListener('load', function (this: HTMLImageElement) {
                URL.revokeObjectURL(dataURL);
                resolve(this as unknown as ImageBitmap);
            });
        });
    };
}

var fixed_ = false;
export function fix() {
    if (fixed_)
        return;


    createImageBitmapPolyfill();
    fixed_ = true;
}


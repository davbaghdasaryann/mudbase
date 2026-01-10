'use client';

//
// Check if the addListener method supports "passive" param
//
var listenerPassiveTested_ = false;
var listenerPassiveSupported_ = false;

export function isListenerPassiveSupported() {
    if (listenerPassiveTested_) return listenerPassiveSupported_;

    const fn = (ev: WheelEvent) => {};
    try {
        let opts = Object.defineProperty({}, 'passive', {
            get: function () {
                listenerPassiveSupported_ = true;
                return listenerPassiveSupported_;
            },
        });

        if (typeof window !== 'undefined') {
            window.addEventListener('wheel', fn, opts);
            window.removeEventListener('wheel', fn, opts);
        }
    } catch (e) {
        listenerPassiveSupported_ = false;
    }

    listenerPassiveTested_ = true;
    return listenerPassiveSupported_;
}

//
// Cache support for the browser
//
var cachesTested_ = false;
var cachesSupported_ = false;

export function cachesSupported() {
    if (cachesTested_) return cachesSupported_;

    cachesSupported_ = 'caches' in window;
    cachesTested_ = true;

    return cachesSupported_;
}

export function indexedDBSupported(): boolean {
    if (typeof window !== "undefined") {
        if (!window.indexedDB) return false;
    }
    return true;
}

"use client";

class DomSubItem {
    source: 'el' | 'window' | 'document';
    el: HTMLElement | null;
    listener: any;

    constructor(listener: any, src: 'el' | 'window' | 'document', el: HTMLElement | null = null) {
        this.source = src;
        this.el = el;
        this.listener = listener;
    }
} 

class ListenerKey {
    el: HTMLElement | null;
    event: string;
    constructor(event: string, el: HTMLElement | null = null) {
        this.event = event;
        this.el = el;
    }
};


export class DomSub {

    private listeners = new Map<ListenerKey, DomSubItem>();

    addElementListener(event: string, el: HTMLElement, listener: any, options?: any) {//boolean | AddEventListenerOptions) {
        el.addEventListener(event, listener, options);
        this.listeners.set(new ListenerKey(event, el), new DomSubItem(listener, 'el', el));
    }

    addWindowListener(event: string,  listener: any) {
        if (typeof window !== "undefined") {
            window.addEventListener(event, listener);
            this.listeners.set(new ListenerKey(event), new DomSubItem(listener, 'window'));
        }
    }

    addDocumentListener(event: string,  listener: any) {
        document.addEventListener(event, listener);
        this.listeners.set(new ListenerKey(event), new DomSubItem(listener, 'document'));
    }

    release() {
        // TODO: back
        // if (typeof window === "undefined") return;

        // this.listeners.forEach((itm, key) => {
        //     switch (itm.source) {
        //     case 'el': key.el!.removeEventListener(key.event, itm.listener); break;
        //     case 'window': window.removeEventListener(key.event, itm.listener); break;
        //     case 'document': document.removeEventListener(key.event, itm.listener); break;
        //     default: break;
        //     }
        // });
        // this.listeners.clear();
    }
}
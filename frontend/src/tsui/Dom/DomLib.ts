"use client";

import React from 'react'

//export namespace DomSub {
 // Subscriber to various DOM elements

class DomSubItem {
    source: 'el' | 'window' | 'document'
    el: HTMLElement | null
    listener: any

    constructor(listener: any, src: 'el' | 'window' | 'document', el: HTMLElement | null = null) {
        this.source = src
        this.el = el
        this.listener = listener
    }
}

class ListenerKey {
    el: HTMLElement | null
    event: string
    constructor(event: string, el: HTMLElement | null = null) {
        this.event = event
        this.el = el
    }
}

export class DomSub {

    private listeners = new Map<ListenerKey, DomSubItem>()

    addElementListener(event: string, targetEl: HTMLElement | React.RefObject<any> | undefined | null, listener: any, options?: any) {//boolean | AddEventListenerOptions) {
        if (!targetEl)
            return

        let el: HTMLElement

        if (targetEl instanceof HTMLElement) {
            el = targetEl;
        } else {
            if (!targetEl.current)
                return;
            el = targetEl.current
        }

        el.addEventListener(event, listener, options)
        this.listeners.set(new ListenerKey(event, el), new DomSubItem(listener, 'el', el))
    }

    addWindowListener(event: string,  listener: any) {
        if (typeof window !== "undefined") {
            window.addEventListener(event, listener)
        }
        this.listeners.set(new ListenerKey(event), new DomSubItem(listener, 'window'))
    }

    addDocumentListener(event: string,  listener: any) {
        document.addEventListener(event, listener)
        this.listeners.set(new ListenerKey(event), new DomSubItem(listener, 'document'))
    }

    release() {
        if (typeof window === "undefined")
            return;
        
        this.listeners.forEach((itm, key) => {
            switch (itm.source) {
            case 'el': key.el!.removeEventListener(key.event, itm.listener); break
            case 'window': window.removeEventListener(key.event, itm.listener); break
            case 'document': document.removeEventListener(key.event, itm.listener); break
            default: break
            }
        });
        this.listeners.clear()
    }
}

//}

//export namespace Dom {

type ElementRef = React.RefObject<HTMLElement>

export function setElementAtt(el: HTMLElement, att:string, val: string) {
    el.setAttribute(att, val)
}

export function setElementStyle(el: HTMLElement, prop:string, val: string) {
    el.setAttribute('style', `${prop}: ${val};`)
}


export function setElementRefAtt(ref: ElementRef, att:string, val: string) {
    ref.current?.setAttribute(att, val)
}


// export function setElementRefStyle(ref: ElementRef, prop: string, val: string) {
//     ref.current?.setAttribute('style', `${prop}: ${val};`);
//     //ref.current?.style.setProperty(prop, `${prop}: ${val};`);
// }



export function setElementVisible(ref: ElementRef, visible: boolean) {
    //setElementStyle(ref, 'visibility', (visible? 'visible': 'hidden'));
    if (ref.current)
        ref.current.style.visibility = (visible? 'visible': 'hidden')
    //ref.current?.setAttribute('style', 'visibility: ' + (visible? 'visible': 'hidden'));
}

export function setElementLeft(ref: ElementRef, pos: number) {
    if (ref.current)
        ref.current!.style.left = `${pos}px`
}


export function setElementTransform(ref: ElementRef, transform: string) {
    //setElementStyle(ref, 'transform', transform)
    if (ref.current)
        ref.current.style.transform = transform
}


export function animateElementTransform(ref: ElementRef, transform: string) {
    if (!ref.current)
        return

    let animation = ref.current.animate([
        {transform: transform},
    ], {
        duration: 300,
        easing: 'ease-in-out',
    })

    if (animation) {
        animation.onfinish = () => {
            setElementTransform(ref, transform)
        }
    } else {
        setElementTransform(ref, transform)
    }
}


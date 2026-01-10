//import * as KeyVal from "lib/keyval";

export type LsValType = 'string' | 'number' | 'boolean' | 'object';

export function lsSetValue(key: string, val: any) {
    if (typeof window === 'undefined') {
        return;
    }    

    switch (typeof val) {
    case 'string': localStorage.setItem(key, val); break;
    case 'boolean': localStorage.setItem(key, val ? '1' : '0'); break;
    case 'number': localStorage.setItem(key, val.toString()); break;
    default: 
        localStorage.setItem(key, JSON.stringify(val));
        break;
    }
}

export function lsGetString(key: string, defVal?: string | null) {

    if (typeof window === 'undefined') {
        return defVal;
    }    

    let val = localStorage.getItem(key);

    if (!val && defVal)
        return defVal;

    // if (val === undefined || val === null)
    //     return '';

    return val;
}

export function lsGetInt(key: string, defVal?: number | null) {
    if (typeof window === 'undefined') {
        return defVal;
    }    

    let val = localStorage.getItem(key);

    if (val === null ) {
        if (defVal)
            return defVal;
        return val;
    }

    return parseInt(val);
}


export function lsGetBool(key: string, defVal?: boolean | null): boolean | undefined {

    if (typeof window === 'undefined') {
        return defVal ?? undefined;
    }    

    let val = localStorage.getItem(key);

    if (val === null ) {
        if (defVal)
            return defVal;
        return undefined;
    }

    return parseInt(val) !== 0;
}

export function lsGetObject<T>(key: string, defVal?: T | null): T | undefined {
    if (typeof window === 'undefined') {
        return defVal ?? undefined;
    }    

    let val = localStorage.getItem(key);

    if (!val && defVal)
        return defVal;

    if (val === null)
        return undefined;

    //console.debug(key);

    return JSON.parse(val) as T;
}



export function lsGetGeneric<T>(type: LsValType, key: string, defVal?: T | null) {
    switch (type) {
    case 'string': return lsGetString(key, defVal as string | undefined | null);
    case 'number': return lsGetInt(key, defVal as number | undefined | null);
    case 'boolean': return lsGetBool(key, defVal as boolean | undefined | null);
    default: break;
    }

    return lsGetObject<T>(key, defVal);
}


export function lsRemove(key: string) {
    if (typeof window === 'undefined') {
        return;
    }    
    
    localStorage.removeItem(key);
}

const LsKeyPrefix = 'x-bpf-';

function create<T>(ctor: { new(): T }) {
    return new ctor();
  }

// class LsPreferenceValue<T> {
//     //getVal: () => T;
//     val = create(number);

//     // constructor() {
//     //     this.val = new T();
//     // }
// }

export class LsPreference<T> {
    private key: string;
    //type: 'string' | 'bool' | 'boolean' | 'int' | 'integer' | 'number' = 'string';
    private val?: T;  // Current value
    private defVal?: T;

    //private stored
    private isValid = false;
    //private dataType: LsValType | 'object';
    private tsType: LsValType | 'object';

    constructor(type: LsValType, key: string, defVal?: T) {
        this.key = LsKeyPrefix + key;
        this.defVal = defVal;

        //let temp: T;
        //let temp = new T();

        //console.debug(this.key, typeof temp);

        switch(type) {
        case 'string': this.tsType = 'string'; break;
        case 'boolean': this.tsType = 'boolean'; break;
        case 'number': this.tsType = 'number'; break;
        default: this.tsType = 'object'; break;
        }


        // if (defVal !== undefined) {
        //     this.defVal = defVal;
        // } else {
        //     this.defVal = defVal ? defVal as string : '';
        // }

    }

    getOpt(defVal?: T): T | undefined {
        //console.debug(this);

        if (this.isValid) {
            return this.val;
        }

        let val = lsGetGeneric<T>(this.tsType, this.key, this.defVal);

        if (val === undefined || val === null) {
            if (defVal !== undefined)
                this.val = defVal;
            else if (this.defVal !== undefined)
                this.val = this.defVal;
            else {
                this.val = undefined;
            }
        } else {
            this.val = val as T;
        }

        this.isValid = true;
        return this.val!;
    }

    get(defVal?: T): T {
        let val = this.getOpt(defVal);
        if (val !== undefined)
            return val;

        // Set default default value
        //let retval = 
        switch(typeof this.val) {
        case 'string': return '' as unknown as T;
        case 'boolean': return false as unknown as T;
        case 'number': return 0 as unknown as T;
        default: return {} as T
        }
    }

    set(val: T | undefined | null) {
        if (val === undefined || val === null) {
            return this.remove();
        }

        lsSetValue(this.key, val);

        this.val = val;
        this.isValid = true;
    }

    remove() {
        lsRemove(this.key);
    }

    //private handleDefault(
}

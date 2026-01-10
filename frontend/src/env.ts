"use client";

// import device from 'current-device';
import {makeFilePathRoot, makeFilePathRootArr} from './tslib/filename';
import {verify} from './tslib/verify';

export default class Env {
    // static readonly isMobile = device.mobile();
    // static readonly isDesktop = device.desktop();
    // static readonly isTablet = device.tablet();

    // static isMobile() { return device.mobile(); }
    static isMobile() { return false; }

    // static readonly isLandscape = device.landscape();
    // static readonly isPortrait = device.portrait();

    //
    // Convenience functions
    //
    static getOption(name: string, def: string): string {
        let val = process.env[name];
        return val ?? def;
    }

    static requireOption(optName: string): string {
        let val = process.env[optName];
        verify(val, `.env missing: ${optName}`);
        return val!;
    }

    static getAppOption(name: string, def: string): string {
        return Env.getOption('REACT_APP_' + name, def);
    }

    static requireAppOption(optName: string): string {
        return Env.requireOption('REACT_APP_' + optName);
    }

    //
    // Assets Locations
    //
    static readonly publicUrl = Env.getOption('PUBLIC_URL', '/');
    static readonly publicUrlImages = makeFilePathRoot(Env.publicUrl, 'images');
    static makePublicImageUrl(...comps: string[]): string {
        return makeFilePathRootArr(Env.publicUrlImages, comps);
    }

    //
    // Server API locations and setup
    //
    static readonly apiRoot = Env.getAppOption('API_ROOT', '/api/v1');

    static readonly tokenUrl = false;

    static readonly isDev = process.env['ENV'] === 'development';
    static readonly isProd = !this.isDev;
}

// console.log(Env.getOption('REACT_APP_ENV', 'production'));
// console.log(process.env['ENV']);


'use client';

import {isMobile} from 'react-device-detect';

import * as FT from '../FormTypes';

export interface FormComputedAtts {
    gridWidth: number | string;
    formHeight: number | string | undefined;
}

export function computeFormAtts(props: FT.FormProps): FormComputedAtts {
    //let props = compProps.formProps;

    // TODO: move to theme
    let gridWidth: string | number = 300;
    //let formHeight: string | number | undefined = !Env.isMobile ? '100%' : undefined;
    let formHeight: string | number | undefined = '100%';

    switch (props.size) {
        case 'sm':
            gridWidth = 300;
            formHeight = isMobile ? '90%' : '80%';
            // if (!Env.isMobile) {
            //formHeight = '90%'
            // }
            break;
        case 'md':
            gridWidth = 500;
            formHeight = '90%';
            break;
        case 'lg':
            gridWidth = 800;
            break;

        case 'xl':
            gridWidth = 1600;
            break;
        default:
            break;
    }

    if (isMobile) {
        gridWidth = '90%';
    }

    return {
        gridWidth: gridWidth,
        formHeight: formHeight,
    };
}

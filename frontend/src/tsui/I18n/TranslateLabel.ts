'use client';

import { i18nt } from '@/tsui/I18n/SafeTranslation';
import React from 'react';


export interface LabelProps {
    title?: string;
    label?: string;
    tlabel?: string;
}

export function translateLabel(props: LabelProps, defLabel?: string): string {
    // let i18n = getI18n();
    if (props.label)
        return i18nt(props.label) as string;
        
    if (props.title)
        return i18nt(props.title) as string;

    if (props.tlabel)
        return props.tlabel;

    if (defLabel)
        return i18nt(defLabel) as string;

    return '';
}


export function useTranslateLabel(props: LabelProps, defLabel?: string) {
    const [label] = React.useState(translateLabel(props, defLabel));
    return {label};
}


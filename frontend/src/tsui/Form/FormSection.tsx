'use client';

import React from 'react';
import {Typography, Grid} from '@mui/material';

import * as FT from './FormTypes';

import {FormHookInstance} from './FormContext/FormHookInstance';
import { i18nt } from '@/tsui/I18n/SafeTranslation';

interface FormSectionProps extends FT.FormInputGridProps, FT.InputSxProps {
    form?: FormHookInstance;
    label: string;
    type?: 'text' | 'required' | 'optional';
    required?: boolean;
    optional?: boolean;
}

export function Section(props: FormSectionProps) {
    const gridAtts = FT.getFormGridAtts(props, {xs: 12});
    const gridSx = FT.getFormSxParams(props, {mt: 1});

    let text = i18nt(props.label);

    if (props.type === 'required' || props.required) {
        text += ' (' + i18nt('required') + ')';
    } else if (props.type === 'optional' || props.optional) {
        text += ' (' + i18nt('optional') + ')';
    }

    text += ':';
    const label = text;

    return (
        <Grid {...gridAtts} sx={gridSx}>
            <Typography>{label}</Typography>
        </Grid>
    );
}

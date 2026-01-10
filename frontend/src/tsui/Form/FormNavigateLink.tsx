'use client';

import React from 'react';
import {Box, Typography, Link, Grid} from '@mui/material';

import * as FT from './FormTypes';

import {FormHookInstance} from '@/tsui/Form/FormContext/FormHookInstance';
import { useSafeTranslation } from '@/tsui/I18n/SafeTranslation';

interface FormNavigateLinkProps extends FT.FormInputGridProps, FT.InputSxProps {
    /**
     * @deprecated `form` prop is ignored.
     */
    form?: FormHookInstance;

    href: string;
    prefix?: string;
    label: string;
    postfix?: string;
    align?: FT.FormAlignType;

    id?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function NavigateLink(props: FormNavigateLinkProps) {
    const {t} = useSafeTranslation();

    const gridAtts = FT.getFormGridAtts(props);
    const gridSx = FT.getFormSxParams(props, {height: 20});

    const fontSize = props.size === 'sm' ? 'small' : undefined;
    const float = props.align === 'right' ? 'right' : undefined;

    return (
        <Grid {...gridAtts} sx={gridSx}>
            <Box sx={{display: 'flex', float: float}}>
                {props.prefix && <Typography sx={{fontSize: fontSize}}>{t(props.prefix)}&nbsp;</Typography>}
                <Link href={props.href} sx={{fontSize: fontSize}}>
                    {t(props.label)}
                </Link>
                {props.postfix && <Typography sx={{fontSize: fontSize}}>&nbsp;{t(props.postfix)}</Typography>}
            </Box>
        </Grid>
    );
}

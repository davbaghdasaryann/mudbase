'use client';

import React from 'react';
import {Box, Typography, Grid} from '@mui/material';

import * as FT from './FormTypes';
import { useSafeTranslation } from '@/tsui/I18n/SafeTranslation';

// interface FormNoteProps extends FT.FormPropsBase, FT.FormInputGridProps, FT.InputSxProps {
//     text: string;
//     type?: 'text' | 'required';
// }
interface FormNoteProps extends FT.FormInputGridProps, FT.InputSxProps {
    text: string;
    type?: 'text' | 'required';
    align?: FT.FormAlignType;
   
}

export function FormNote(props: FormNoteProps) {
    const {t} = useSafeTranslation();
    const gridAtts = FT.getFormGridAtts(props);
    const gridSx = FT.getFormSxParams(props);

    const fontSize = undefined;

    return (
        <Grid {...gridAtts} sx={gridSx}>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: props.align,
                    height: '100%',
                    alignItems: 'center',
                }}
            >
                <Typography sx={{fontSize: fontSize}}>{t(props.text)}</Typography>
            </Box>
        </Grid>
    );
}

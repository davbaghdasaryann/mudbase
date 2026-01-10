import { useMemo } from 'react';

import { Typography } from '@mui/material';
import Grid from '@mui/material/Grid';

import * as FT from './FormTypes';

import { FormHookInstance } from './FormContext/FormHookInstance';
import { i18nt } from '@/tsui/I18n/SafeTranslation';

interface Props extends FT.FormInputGridProps, FT.InputSxProps {
    label: string;
    type?: 'text' | 'required' | 'optional';
    required?: boolean;
    optional?: boolean;

    form?: FormHookInstance;
    size?: FT.FormSizeType;
    align?: FT.FormAlignType;

    withColon?: boolean;
}

function translateInputLabel(props: Props) {
    let text = i18nt(props.label) ?? '';

    if (props.type === 'required' || props.required) {
        text += ' (' + i18nt('required') + ')';
    } else if (props.type === 'optional' || props.optional) {
        text += ' (' + i18nt('optional') + ')';
    }

    if (props.withColon)
        text += ':';

    return text;
}

export function InputGroup(props: Props) {
    const label = useMemo(() => translateInputLabel(props), []);

    return (
        <Grid {...FT.getFormGridAtts(props, { xs: 12 })} sx={FT.getFormSxParams(props)}>
            <Typography>{label}</Typography>
        </Grid>
    );
}

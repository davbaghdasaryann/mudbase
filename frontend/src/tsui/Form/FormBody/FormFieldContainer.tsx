'use client';

import React from 'react';
import {Box, Skeleton, Grid} from '@mui/material';

import * as FT from '../FormTypes';
import { FormHookInstance } from '../FormContext/FormHookInstance';
import { combineSx } from '@/tsui/Mui/SxPropsUtil';

interface FieldContainerProps {
    form: FormHookInstance;
    formProps: FT.FormProps;
    fieldProps: FT.FieldProps;
    children: React.ReactNode;

    needLoading?: boolean;
    needBox?: boolean;
}

export default function FormFieldContainer(props: FieldContainerProps) {
    return <FormFieldLayout {...props}>{props.children}</FormFieldLayout>;
}

function FormFieldLayout(props: FieldContainerProps) {
    if (props.formProps.layoutContainerType === 'none') {
        return <>{props.children}</>;
    }

    const gridAtts = FT.getFormGridAtts(props.fieldProps);
    const gridSx = combineSx(FT.getFormSxParams(props.fieldProps), props.formProps.slotProps?.gridItem?.sx);

    // console.log(gridAtts);

    return (
        <Grid {...gridAtts} sx={gridSx}>
            <FormFieldState {...props}>{props.children}</FormFieldState>
        </Grid>
    );
}

function FormFieldState(props: FieldContainerProps) {
    const isSkeleton = (props.needLoading === undefined || props.needLoading === true) && props.form.isLoading;

    if (isSkeleton) {
        return (
            <Skeleton animation='wave'>
                <FormFieldBox {...props}>{props.children}</FormFieldBox>
            </Skeleton>
        );
    }

    return <FormFieldBox {...props}>{props.children}</FormFieldBox>;
}

function FormFieldBox(props: FieldContainerProps) {
    if (props.needBox) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: props.fieldProps.align,
                    height: '100%',
                    alignItems: 'center',
                }}
            >
                {props.children}
            </Box>
        );
    }

    return <>{props.children}</>;
}

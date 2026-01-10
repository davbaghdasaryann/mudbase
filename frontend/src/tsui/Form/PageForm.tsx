import React, {FormEvent} from 'react';
import {Box, Paper, SxProps, Theme, Typography, useTheme} from '@mui/material';

import * as FT from './FormTypes';

import {DialogTitleText} from '../DialogCaption';
import {computeFormAtts} from './FormBody/FormImpl';
import {combineSx} from '@/tsui/Mui/SxPropsUtil';
import {FormBodyProps} from '@/tsui/Form/FormBody/FormBodyContents';
import {processFormSubmit} from '@/tsui/Form/FormBody/FormProcessSubmit';
import {FormBodyContentsProvider} from '@/tsui/Form/FormContext/FormContextProvider';

export function PageForm(props: FT.FormProps) {
    const theme = useTheme();
    const atts = computeFormAtts(props);
    const paperSx = computeFormPaperSx(theme, props);

    if (props.formContainer === 'none') {
        return (
            <FormBody formAtts={atts} formProps={props}>
                {props.children}
            </FormBody>
        );
    }

    return (
        <Box
            display='flex'
            alignItems='center'
            justifyContent='center'
            sx={combineSx(
                {
                    // height: atts.formHeight,
                    height: '100%',
                },
                props.slotProps?.rootBox?.sx
            )}
        >
            <Paper sx={paperSx}>
                <PageFormTitle {...props} />
                <FormBody formAtts={atts} formProps={props}>
                    {props.children}
                </FormBody>
            </Paper>
        </Box>
    );
}

function computeFormPaperSx(theme: Theme, props: FT.FormProps): SxProps<Theme> {
    let formSx: SxProps<Theme> = props.formSx ?? {};

    // let dialogSx: SxProps<Theme> = makeDialogThemeSx(theme.tsui?.dialog) ?? {};
    let dialogSx: SxProps<Theme> = theme.tsui?.dialog ?? {};

    let addSx: SxProps<Theme> = {
        // m: 0,
        p: {xs: 1, md: 3},
        width: {xs: '90%', md: props.size ? theme.breakpoints.values[props.size] : undefined},
    };

    let combinedSx = combineSx(dialogSx, addSx, formSx, props.slotProps?.paper?.sx);
    return combinedSx;
}

function PageFormTitle(props: FT.FormProps) {
    if (!props.title && !props.ttitle) return null;

    const typographyProps = props.slotProps?.title;

    return (
        <Typography
            align='center'
            width='100%'
            fontSize='xx-large'
            {...typographyProps}
            sx={combineSx(
                {
                    mb: 2,
                },
                props.titleSx,
                props.slotProps?.title?.sx
            )}
        >
            <DialogTitleText title={props.title} ttitle={props.ttitle} />
        </Typography>
    );
}

function FormBody(props: FormBodyProps) {
    const form = props.formProps.form;
    const formProps = props.formProps;

    const prevErrorsCountRef = React.useRef(0);

    const [updateTick, setUpdateTick] = React.useState(0);
    const forceUpdate = React.useCallback(() => setUpdateTick((t) => t + 1), []);

    let useFormComponent = true;
    if (formProps.formElement === 'none' || form?.formType === 'update-fields' || form?.formType === 'displayonly') {
        useFormComponent = false;
    }

    React.useEffect(() => {
        if (form) form.onFieldUpdate = formProps.onFieldUpdate;

        return () => {
            if (form) form.onFieldUpdate = undefined;
        };
    }, []);

    const handleSubmit = React.useCallback((evt: FormEvent) => {
        evt.preventDefault();
        
        if (props.onSubmit) {
            props.onSubmit();
        } else {
            // console.log('handle submit');
            processFormSubmit(formProps).then((result) => {
                if (result.errorsCount !== prevErrorsCountRef.current) {
                    prevErrorsCountRef.current = result.errorsCount;
                    forceUpdate();
                // if (result.errorsCount !== 0) forceUpdate();
                }
            });
        }
    }, []);

    if (!useFormComponent) {
        return <FormBodyContentsProvider {...props}>{props.children}</FormBodyContentsProvider>;
    }

    return (
        <Box display='block' component='form' id={form?.formId} onSubmit={handleSubmit}>
            <FormBodyContentsProvider {...props}>{props.children}</FormBodyContentsProvider>
        </Box>
    );
}

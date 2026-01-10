'use client';

import { useCallback } from 'react';

import {Button, SxProps, Theme} from '@mui/material';
import {isMobile} from 'react-device-detect';


import * as FT from './FormTypes';
import {combineSx, SxObject} from '../Mui/SxPropsUtil';
import { FormHookInstance } from '@/tsui/Form/FormContext/FormHookInstance';


import { useFormContext } from './FormContext/FormContextProvider';
import FormFieldContainer from './FormBody/FormFieldContainer';
import { useSafeTranslation } from '@/tsui/I18n/SafeTranslation';

export interface FormButtonProps extends FT.FormInputGridProps, FT.InputSxProps {
// export interface FormButtonProps extends ButtonProps, FT.FormInputGridProps {


    /**
     * @deprecated `form` prop is ignored.
     */
    form?: FormHookInstance;
    
    label: string;
    type?: string;
    busyLabel?: string;
    size?: FT.FormSizeType;
    align?: FT.FormAlignType;
    fullWidth?: boolean;
    
    id?: string;
    disabled?: boolean;
    onClick?: () => void;
    onClickTrue?: (state: boolean) => void;
    variant?: 'text' | 'outlined' | 'contained';
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;

    buttonSx?: SxProps<Theme>;
}

export function FormButton(props: FormButtonProps) {
    return FormButtonComponent(props);
}

export function SubmitButton(props: FormButtonProps) {
    let p = {...props};

    if (p.mt === undefined) p.mt = 1;

    p.type = 'submit';

    if (!p.size) {
        p.size = isMobile ? 'xl' : 'lg';
    }

    return FormButtonComponent(p);
}


function FormButtonComponent(props: FormButtonProps) {
    const form = useFormContext();

    return (
        <FormFieldContainer form={form.formInstance} formProps={form.formProps} fieldProps={props} needBox={true}>
            <ButtonElement item={props} />
        </FormFieldContainer>
    );
}


interface ButtonElementProps {
    item: FormButtonProps;
}

function ButtonElement(itemProps: ButtonElementProps) {
    const formContext = useFormContext();
    const form = formContext.formInstance;

    const props = itemProps.item;
    const {t} = useSafeTranslation();

    const onClick = useCallback(() => {
        props.onClick?.();
        props.onClickTrue?.(true);
    }, []);

    const buttonType = props.type === 'submit' ? 'submit' : undefined;

    return (
        <Button
            id={props.id}
            type={buttonType}
            onClick={onClick}
            variant={props.variant}
            disabled={form.isBusy === true || form.isDisable === true || props.disabled === true}
            startIcon={props.startIcon}
            endIcon={props.endIcon}
            fullWidth={props.fullWidth}
            sx={combineSx({width: 'md'}, props.buttonSx)}
        >
            {t(props.label)}
        </Button>
    );
}


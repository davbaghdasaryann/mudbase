import React from 'react';

import {Button, ButtonProps, SxProps, Theme} from '@mui/material';

import * as UE from '../UiElements';
import {translateLabel} from '../I18n/TranslateLabel';
import {combineSx} from '../Mui/SxPropsUtil';

interface ClickObject<T = any> {
    param: any;
    cb: (obj: any) => void;
}

export interface ButtonSlotProps {
    show?: boolean;
    label?: string;
    sx?: SxProps<Theme>;
}

export interface TextFieldSlotProps {
    show?: boolean;
    label?: string;
    sx?: SxProps<Theme>;
}


export interface PageButtonProps extends ButtonProps {
    // extends LabelProps {
    show?: boolean;

    layout?: UE.UiLayout;
    label?: string;
    tlabel?: string; // Translated label

    // href?: string;
    target?: string;

    default?: boolean;

    // size?: 'small' | 'medium' | 'large';
    // variant?: 'text' | 'outlined' | 'contained';

    // startIcon?: React.ReactNode;
    // endIcon?: React.ReactNode;

    onClick?: () => void;
    onClickTrue?: (p: boolean) => void;

    // disabled?: boolean;

    onClickParam?: ClickObject;
    // sx?: SxProps<Theme>;

    // fullWidth?: boolean;
}

export function PageButton(props: PageButtonProps) {
    if (props.show === false) return null;

    return <PageButtonBody {...props} />;
}

function PageButtonBody(props: PageButtonProps) {
    const [buttonProps, setButtonProps] = React.useState<ButtonProps>({});
    const label = React.useMemo(() => translateLabel(props), []);

    React.useEffect(() => {
        const {show, onClickTrue, ...bp} = props;
        bp.sx = combineSx(props.sx, props.layout ? props.layout.sx() : {});
        if (!props.variant) bp.variant = props.default === true ? 'contained' : 'outlined';
        setButtonProps(bp);
    }, []);

    const handleClick = React.useCallback(() => {
        props.onClick && props.onClick();
        props.onClickTrue && props.onClickTrue(true);
        props.onClickParam && props.onClickParam.cb(props.onClickParam.param);
    }, []);

    if (props.href) {
        return <Button {...buttonProps}>{label}</Button>;
    }

    return (
        <Button {...buttonProps} onClick={handleClick}>
            {label}
        </Button>
    );
}

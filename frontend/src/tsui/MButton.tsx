import React from 'react';

import {Button, ButtonProps, SxProps, Theme} from '@mui/material';

import {translateLabel} from './I18n/TranslateLabel';
import {combineSx} from './Mui/SxPropsUtil';

interface ClickObject<T = any> {
    param: any;
    cb: (obj: any) => void;
}

export interface MButtonProps extends ButtonProps {
    show?: boolean;

    label?: string;
    tlabel?: string; // Translated label

    // href?: string;
    target?: string;

    default?: boolean;

    onClick?: () => void;
    onClickTrue?: (p: boolean) => void;

    onClickParam?: ClickObject;
}

export default function MButton(props: MButtonProps) {
    if (props.show === false) return null;

    return <MButtonBody {...props} />;
}

function MButtonBody(props: MButtonProps) {
    const label = React.useMemo(() => translateLabel(props), []);

    const {show, onClick, onClickTrue, onClickParam, ...bp} = props;
    bp.variant = bp.variant ?? 'outlined';

    const handleClick = React.useCallback(() => {
        props.onClick && props.onClick();
        props.onClickTrue && props.onClickTrue(true);
        props.onClickParam && props.onClickParam.cb(props.onClickParam.param);
    }, []);

    return (
        <Button {...bp} onClick={handleClick}>
            {label}
        </Button>
    );
}

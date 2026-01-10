import React from 'react';

import {Button} from '@mui/material';

import {PageButtonProps} from './PageButton';
import {combineSx} from '../Mui/SxPropsUtil';
import {translateLabel} from '../I18n/TranslateLabel';

export function DialogButton(props: PageButtonProps) {
    if (props.show === false) return null;
    return <DialogButtonBody {...props}/>

}

function DialogButtonBody(props: PageButtonProps) {
    const label = React.useMemo(() => translateLabel(props), [props.label]);

    const {show, ...bp} = props;
    bp.sx = combineSx(props.sx, props.layout ? props.layout.sx() : {});
    if (!props.variant) bp.variant = props.default === true ? 'contained' : 'outlined';
    const buttonProps = bp;

    const handleClick = React.useCallback(() => {
        props.onClick && props.onClick();
        props.onClickTrue && props.onClickTrue(true);
        props.onClickParam && props.onClickParam.cb(props.onClickParam.param);
    }, []);

    // if (props.href) {
    //     return <Button {...buttonProps}>{label}</Button>;
    // }

    return (
        <Button {...buttonProps} onClick={handleClick}>
            {label}
        </Button>
    );
}

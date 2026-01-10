'use client';

import React from 'react';
import {Typography, TypographyOwnProps, TypographyPropsVariantOverrides, TypographyVariant} from '@mui/material';
import {OverridableStringUnion} from '@mui/types';
import {ResponsiveStyleValue} from '@mui/system';
import {useEvalBoolProp} from '@/tsui/Mui/useEvalProps';
import {useSafeTranslation} from '@/tsui/I18n/SafeTranslation';

interface MTextProps extends TypographyOwnProps {
    mount?: ResponsiveStyleValue<boolean>;
    show?: ResponsiveStyleValue<boolean>;

    text?: string | null;
    ttext?: string | null;

    h1?: boolean;
    h2?: boolean;
    h3?: boolean;
    h4?: boolean;
    h5?: boolean;
    h6?: boolean;
    body?: boolean;
}

export default function MText(props: MTextProps) {
    if (props.mount === false) return null;

    if (props.show === false) return null;

    if (!props.text === undefined && !props.ttext) return null;

    if (props.mount === true || props.show === true || (props.mount === undefined && props.show === undefined)) return <MTextBody {...props} />;

    return <MTextMountBody {...props} />;
}

function MTextMountBody(props: MTextProps) {
    const mount = useEvalBoolProp(props.mount, true);

    if (!mount) return null;

    return <MTextBody {...props} />;
}

// console.log(props.show);

type OnlyTypographyProps = Pick<MTextProps, keyof TypographyOwnProps>;

function MTextBody(props: MTextProps) {
    const {t} = useSafeTranslation();

    const {mount: render, show, text, h1, h2, h3, h4, h5, h6, body, ...typographyProps} = props;

    return (
        <Typography {...typographyProps} variant={genTypographyVariant(props)}>
            {props.text && t(props.text)}
            {props.ttext && props.ttext}
        </Typography>
    );
}

function genTypographyVariant(props: MTextProps): OverridableStringUnion<TypographyVariant | 'inherit', TypographyPropsVariantOverrides> {
    if (props.variant) return props.variant;

    if (props.h1) return 'h1';
    if (props.h2) return 'h2';
    if (props.h3) return 'h3';
    if (props.h4) return 'h4';
    if (props.h5) return 'h5';
    if (props.h6) return 'h6';
    if (props.body) return 'body1';

    return 'body2';
}

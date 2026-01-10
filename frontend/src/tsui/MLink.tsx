import React, { HTMLAttributeAnchorTarget } from 'react';
import Link, {LinkProps} from 'next/link';
import {Typography, TypographyProps} from '@mui/material';
import { useSafeTranslation } from '@/tsui/I18n/SafeTranslation';

interface MLinkSlotProps {
    typography?: TypographyProps;
}

interface MLinkProps extends LinkProps {
    text: string;
    target?: HTMLAttributeAnchorTarget;
    children?: React.ReactNode;
    slotPorps?: MLinkSlotProps;
}

export default function MLink(props: MLinkProps) {
    const {t} = useSafeTranslation();

    const {text, slotPorps, children, ...linkProps} = props;

    return (
        <Link {...linkProps}>
            <Typography {...props.slotPorps?.typography} component='span' display='inline'>
                {t(props.text)}
                {props.children}
            </Typography>
        </Link>
    );
}

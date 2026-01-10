import {SxProps, Theme, Typography, TypographyPropsVariantOverrides, TypographyVariant} from '@mui/material';
import {OverridableStringUnion} from '@mui/types';
import {useTranslation} from 'react-i18next';

interface PageTextProps {
    text: string;
    h1?: boolean;
    h2?: boolean;
    h3?: boolean;
    h4?: boolean;
    h5?: boolean;
    h6?: boolean;
    body?: boolean;

    variant?: OverridableStringUnion<TypographyVariant | 'inherit', TypographyPropsVariantOverrides>;

    align?: 'inherit' | 'left' | 'center' | 'right' | 'justify';
    sx?: SxProps<Theme>;
}

export default function PageText(props: PageTextProps) {
    const [t] = useTranslation();
    return (
        <>
            <Typography
                variant={
                    props.variant ??
                    (props.h1 ? 'h1' : props.h2 ? 'h2' : props.h3 ? 'h3' : props.h4 ? 'h4' : props.h5 ? 'h5' : props.h6 ? 'h6' : props.body ? 'body1' : 'body2')
                }
                align={props.align}
                sx={props.sx}
            >
                {t(props.text)}
            </Typography>
        </>
    );
}

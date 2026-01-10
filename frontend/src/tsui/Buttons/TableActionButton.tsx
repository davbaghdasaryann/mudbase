import React from 'react';

import {SvgIconProps, useTheme} from '@mui/material';

import {Button, IconButton} from '@mui/material';

import ViewIcon from '@mui/icons-material/PageviewOutlined';
import DetailsIcon from '@mui/icons-material/EditOutlined';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import {makeSxProps} from '../Mui/SxPropsUtil';

export type ActionButtonType = 'details' | 'view' | 'edit' | 'delete';

export interface ActionButtonProps {
    icon?: React.JSXElementConstructor<SvgIconProps>;
    type?: ActionButtonType;
    label?: string;
    tlabel?: string; // Translated label
    href?: string; // Link style button
    target?: string;
    onClick?: () => void;
}

export default function TableActionButton(props: ActionButtonProps) {
    if (props.icon) {
        return <TableActionButtonElement {...props} icon={props.icon} />;
    }

    switch (props.type) {
        case 'view':
            return <TableActionButtonElement {...props} icon={ViewIcon} />;
        case 'details':
            return <TableActionButtonElement {...props} icon={DetailsIcon} />;
        case 'edit':
            return <TableActionButtonElement {...props} icon={EditIcon} />;
        case 'delete':
            return <TableActionButtonElement {...props} icon={DeleteForeverIcon} />;
        default:
            break;
    }

    return <TableActionButtonElement {...props} />;
}

interface ElementProps {
    icon?: React.JSXElementConstructor<SvgIconProps>;
    tlabel?: string;

    onClick?: () => void;
    href?: string;
    target?: string;
}

function TableActionButtonElement(props: ElementProps) {
    const theme = useTheme();

    if (props.icon) {
        return <TableIconElement {...props} />;
    }

    if (props.href) {
        return (
            <Button
                variant='outlined'
                href={props.href}
                target={props.target}
                sx={{
                    width: theme.tsui?.table?.actionButtonWidth,
                }}
            >
                {props.tlabel}
            </Button>
        );
    } else {
        return (
            <Button
                variant='outlined'
                onClick={props.onClick}
                sx={{
                    width: theme.tsui?.table?.actionButtonWidth,
                }}
            >
                {props.tlabel}
            </Button>
        );
    }
}

function TableIconElement(props: ElementProps) {
    const theme = useTheme();

    const [sxProps, setSxProps] = React.useState(makeSxProps({m: 0, p: 0}));

    React.useEffect(() => {
        if (theme.tsui?.table?.actionButtonWidth) {
            const sdg = theme.tsui?.table;
            const sxp = makeSxProps({
                width: sdg.actionButtonWidth,
                height: sdg.actionButtonHeight,
                m: 0,
                p: 0,
            });

            if (sdg.actionButtonHeight) {
                sxp['& svg'] = {
                    fontSize: sdg.actionButtonHeight - 20,
                };
            }

            setSxProps(sxp);
        }
    }, []);

    const Icon = props.icon!;
    const color = 'primary';

    if (props.href) {
        return (
            <IconButton
                href={props.href}
                target={props.target}
                color={color}
                disableFocusRipple={true}
                sx={sxProps}
            >
                <Icon />
            </IconButton>
        );
    } else {
        return (
            <IconButton
                onClick={props.onClick}
                color={color}
                disableFocusRipple={true}
                sx={sxProps}
            >
                <Icon />
            </IconButton>
        );
    }
}

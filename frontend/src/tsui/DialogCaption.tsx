"use client";

import React from 'react';

import { styled } from '@mui/material/styles';

import { DialogTitle } from '@mui/material';
import { Typography, Stack, Box } from '@mui/material';

import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';


import { handleModalClose, ModalCloseProps } from './Types/ModalCloseParams';
import { PageDialogProps, PageDialogTitle } from './PageDialogProps';
import { useSafeTranslation } from '@/tsui/I18n/SafeTranslation';


export default function DialogCaption(props: PageDialogProps) {
    return (
        <DialogTitle>
            <DialogTitleText {...props} />

            {props.type !== 'confirm' && (
                <IconButton
                    onClick={() => {
                        if (props.onCancel) props.onCancel();
                        handleModalClose(props);
                    }}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                    }}
                >
                    <CloseIcon />
                </IconButton>
            )}
        </DialogTitle>
    );
}

export function DialogTitleText(props: PageDialogProps) {
    const { t } = useSafeTranslation();

    if (props.title === undefined && props.ttitle === undefined) return null;

    if (props.ttitle) return <>{props.ttitle}</>;

    if (typeof props.title === 'string') {
        return <>{t(props.title)}</>;
    }

    let title = props.title!;

    return (
        // <Stack direction='row' spacing={1} alignItems='center'>
        <Stack direction='row' spacing={1} alignItems='baseline'>
            {title.text && <TitleText>{t(title.text)}</TitleText>}
            {title.ttext && <TitleText>{title.ttext}</TitleText>}
            <DialogTitleField {...props} />
        </Stack>
    );
}

function DialogTitleField(props: PageDialogProps) {
    const { t } = useSafeTranslation();

    let title = props.title! as PageDialogTitle;
    let haveName = title.name || title.tname;
    let haveValue = title.value || title.tvalue;

    const suffix = haveValue ? ':' : '';

    const name = haveName ? (title.name ? t(title.name) : title.tname) + suffix : undefined;
    const value = haveValue ? (title.value ? t(title.value) : title.tvalue) : undefined;

    return (
        <>
            {name && <TitleNameText>{name}</TitleNameText>}
            {/* {value && <TitleValueText>{value}</TitleValueText>} */}
            {value && <TitleValueText sx={title.valueSx}>{value}</TitleValueText>}

        </>
    );
}

const TitleText = styled(Box)(({ theme }) => ({
    color: theme.palette.text.primary,
}));

const TitleNameText = styled(Box)(({ theme }) => ({
    color: theme.palette.text.secondary,
}));


const TitleValueText = styled(Box)(({ theme }) => ({
    color: theme.palette.text.primary,
}));

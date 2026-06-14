import React from 'react';
import { Dialog, IconButton, Typography } from '@mui/material';

import { useTranslation, getI18n } from 'react-i18next';

import withReactContent from 'sweetalert2-react-content';

import Swal from 'sweetalert2';

import PageDialog from '../tsui/PageDialog';

import { mainPrimaryColor, theme } from '@/theme';

// interface ConfirmationDialogProps {
//     title: string;
//     message: string;
//     onClose: () => void;
//     onConfirm: () => void;
// }

// export function ConfirmationDialog(props: ConfirmationDialogProps) {
//     const {t} = useTranslation();

//     return (
//         <PageDialog type='yes-no' title={props.title} size='sm' onConfirm={props.onConfirm} onClose={props.onClose}>
//             <Typography sx={{textAlign: 'center'}}>{t(props.message)}</Typography>
//         </PageDialog>
//     );
// }

const ReactSwal = withReactContent(Swal);

interface ConfirmDialogOptions {
    confirmText?: string;
    cancelText?: string;
    confirmColor?: string;
    noTitle?: boolean;
}

export function confirmDialog(message: string, title?: string, options?: ConfirmDialogOptions) {
    const noTitle = options?.noTitle ?? false;
    let promise = ReactSwal.fire({
        theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
        title: noTitle ? undefined : (title ? getI18n().t(title) : getI18n().t(message)),
        text: noTitle ? getI18n().t(message) : (title ? getI18n().t(message) : undefined),
        icon: 'warning',
        iconColor: '#DC3741',
        confirmButtonColor: options?.confirmColor ?? mainPrimaryColor,
        target: document.body,
        allowOutsideClick: false,
        showDenyButton: true,
        denyButtonText: options?.cancelText ?? getI18n().t('No'),
        confirmButtonText: options?.confirmText ?? getI18n().t('Yes'),
        reverseButtons: true,
        backdrop: true,

        // focusConfirm: false,               // Don’t auto-focus the confirm button if you want the user to read first
        // customClass: {
        //     popup: 'mui-like-swal-popup',
        //     title: 'mui-like-swal-title',
        //     closeButton: 'mui-like-swal-close-button',
        //     htmlContainer: 'mui-like-swal-html',
        //     actions: 'mui-like-swal-actions',
        //     confirmButton: 'mui-like-swal-confirm',
        //     cancelButton: 'mui-like-swal-cancel',
        //   },
          
    });

    // const highestZ = [...document.querySelectorAll('body *')]
    //       .map(elt => parseInt(getComputedStyle(elt).zIndex))
    //       .filter(z => !isNaN(z))
    //       .reduce((highest, z) => highest == null ? z : z > highest ? z : highest, null);
    // if (highestZ != null) {
    //     document.getElementsByClassName('swal2-container')[0].style.zIndex = highestZ+1;
    // }

    return promise;
}

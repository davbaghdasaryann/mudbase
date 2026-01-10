"use client";

import * as React from 'react';
import { useState } from 'react';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Box, Stack } from '@mui/material';
// import { _currencyLabeledObj, _unitLabeledObj, _workLabeledObj } from 'types/dataClasses';
import * as F from 'tsui/Form';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';


interface CategoryButtonPopupProps {
    onClose: () => void;
    estimateSectionId: string;
    onConfirm: () => void;

}


export default function EstimateSubsectionButtonDialog(props: CategoryButtonPopupProps) {
    const [t]= useTranslation()
    const form = F.useForm({
        type: 'input',
    });

    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        if (form.error)
            return;
        if (!evt.data || Object.keys(evt.data).length === 0) { //TODO everywhere by this way
            props.onClose()
            return;
        }
        if (!evt.data.subsection)
            return;

        Api.requestSession<any>({ //TODO change any to interface
            command: 'estimate/add_subsection',
            args: {
                estimateSectionId: props.estimateSectionId, //TODO remove this
                estimateSubsectionName: evt.data.subsection,
            } //TODO: remove this _id hardCode
        })
            .then(myEstimatesList => {
                console.log(myEstimatesList)

                props.onConfirm()
                // props.onClose()
            })

    }, [])

    return (
        <F.PageFormDialog title='Add Subsection' form={form} size='sm' onSubmit={onSubmit} onClose={props.onClose}>
            <F.InputText form={form} xsMax id='subsection' label={t('Enter subsection name')} placeholder={t('Subsection Name')} />
        </F.PageFormDialog>
    );
}

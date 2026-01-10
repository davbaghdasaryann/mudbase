"use client";

import * as React from 'react';
import { useState } from 'react';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Box, Stack } from '@mui/material';
// import { _currencyLabeledObj, _unitLabeledObj, _workLabeledObj } from 'types/dataClasses';
import * as F from 'tsui/Form';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';


interface CategoryButtonPopupProps {
    estimateId: string;
    onClose: () => void;
    onConfirm: () => void;

}


export default function EstimateSectionButtonDialog(props: CategoryButtonPopupProps) {
    const form = F.useForm({
        type: 'input',
    });
    const [t]= useTranslation()

    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        if (form.error)
            return;
        if (!evt.data || Object.keys(evt.data).length === 0) { //TODO everywhere by this way
            props.onClose()
            return;
        }
        if (evt.data.section) {
            Api.requestSession<any>({ //TODO change any to interface
                command: 'estimate/add_section',
                args: {
                    estimateId: props.estimateId, //TODO remove this
                    estimateSectionName: evt.data.section,
                } //TODO: remove this _id hardCode
            })
                .then(myEstimatesList => {
                    console.log(myEstimatesList)

                    props.onConfirm();
                    // props.onClose();
                })
        }
    }, [])

    return (
        <F.PageFormDialog title='Add Section' form={form} size='sm' onSubmit={onSubmit} onClose={props.onClose}>
            <F.InputText xsMax id='section' label={t('Enter section name')} placeholder={t('Section Name')} />
            {/* <Dialog open={open} onClose={handleClose}>
                        <DialogTitle>Add Section</DialogTitle>

                        <DialogContent >

                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleClose}>Cancel</Button>
                            <Button onClick={handleSubmit}>Submit</Button>
                        </DialogActions>
                    </Dialog> */}
        </F.PageFormDialog>
    );
}

'use client';
import React from 'react';

import {Dialog, DialogContent, DialogTitle, IconButton} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';

import * as F from 'tsui/Form';
import EstimateInfoOnlyForViewAccardionContent from '../../components/estimate/EstimateInfoOnlyForViewAccardionContent';
import EstimateOnlyForViewThreeLevelAccordion from '../../components/estimate/EstimateOnlyForViewThreeLevelAccordion';
import {usePermissions} from '../../api/auth';
import EstimateOtherExpensesAccordion from '../../components/estimate/EstimateOtherExpensesAccordion';
import { runPrintEstimate } from '@/lib/print_estimate';

interface Props {
    estimateId: string;
    estimateTitle: string;
    onClose: () => void;
    onConfirm?: () => void;

    viewOnly?: boolean;
}

export default function EstimateOnlyForViewDialog(props: Props) {
    const {session, permissionsSet} = usePermissions();

    const handleDataUpdated = (updated: boolean) => {
        if (updated) {
            props.onConfirm?.();
        }
    };

    return (
        <Dialog
            fullScreen
            open={true}
            onClose={(event, reason) => {
                if (reason !== 'backdropClick') {
                    props.onClose();
                }
            }}
            // TransitionComponent={Transition}
            slotProps={{
                paper: {
                    style: {
                        padding: 5,
                    },
                },
            }}
            sx={{
                '& .MuiDialog-container': {
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 5,
                },
            }}
        >
            <DialogTitle sx={{m: 0, p: 2}} id='customized-dialog-title'>
                {props.estimateTitle}
            </DialogTitle>

            <IconButton
                aria-label='print'
                onClick={() => runPrintEstimate(props.estimateId)}
                sx={(theme) => ({
                    position: 'absolute',
                    right: 48,
                    top: 8,
                    color: theme.palette.grey[500],
                })}
            >
                <PrintIcon />
            </IconButton>


            <IconButton
                aria-label='close'
                onClick={props.onClose}
                sx={(theme) => ({
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: theme.palette.grey[500],
                })}
            >
                <CloseIcon />
            </IconButton>


            <DialogContent>
                <EstimateInfoOnlyForViewAccardionContent estimateId={props.estimateId} />

                <EstimateOnlyForViewThreeLevelAccordion estimateId={props.estimateId} onDataUpdated={handleDataUpdated} viewOnly={props.viewOnly} />

                {session?.user && permissionsSet?.has?.('EST_VW_OTHR_XPNS') && (
                    <EstimateOtherExpensesAccordion estimateId={props.estimateId} viewOnly={props.viewOnly} />
                )}
            </DialogContent>
        </Dialog>
    );
}

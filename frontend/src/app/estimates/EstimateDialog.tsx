'use client';

import React, {useRef, useState} from 'react';

import {Dialog, DialogContent, DialogTitle, IconButton} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';

import EstimateInfoAccordionContent from '@/components/estimate/EstimateInfoAccordionContent';
import EstimateThreeLevelNestedAccordion from '@/components/estimate/EstimateThreeLevelAccordion';

import ProgressIndicator from '@/tsui/ProgressIndicator';
import EstimateOtherExpensesAccordion from '@/components/estimate/EstimateOtherExpensesAccordion';

import {runPrintEstimate} from '@/lib/print_estimate';
import {usePermissions} from '@/api/auth';

interface EstimatePageDialogProps {
    estimateId: string;
    estimateTitle: string;
    onClose: () => void;
    onConfirm?: () => void;

    isOnlyEstInfo?: boolean;
}

export default function EstimatePageDialog(props: EstimatePageDialogProps) {
    const {session, permissionsSet} = usePermissions();
    const dataUpdatedRef = useRef(false);

    // const [progIndic, setProgIndic] = useState(false);

    const handleClose = () => {
        console.log(dataUpdatedRef.current);

        if (dataUpdatedRef.current) props.onConfirm?.();

        props.onClose();
    };

    // Callback for data updates coming from NestedAccordion
    const handleDataUpdated = (updated: boolean) => {
        dataUpdatedRef.current = true;
        // if (updated) {
        //     props.onConfirm?.();
        //     // setTimeout(() => {
        //     //     setRefreshKey(prevKey => prevKey + 1);
        //     //     setProgIndic(false);
        //     // }, 3000);
        // }
    };

    return (
        <Dialog
            fullScreen
            open={true}
            onClose={(event, reason) => {
                if (reason !== 'backdropClick') {
                    handleClose();
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
            <DialogTitle sx={{m: 0, pt: 1, pb: 0}} id='customized-dialog-title'>
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
                onClick={handleClose}
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
                {/* <ProgressIndicator show={progIndic} background='backdrop' /> */}

                <EstimateInfoAccordionContent estimateId={props.estimateId} onDataUpdated={handleDataUpdated} />

                <EstimateThreeLevelNestedAccordion isOnlyEstInfo={props.isOnlyEstInfo} estimateId={props.estimateId} onDataUpdated={handleDataUpdated} />

                {session?.user && !permissionsSet?.has?.('EST_CRT_BY_BNK') && <EstimateOtherExpensesAccordion estimateId={props.estimateId} />}
            </DialogContent>
        </Dialog>
    );
}

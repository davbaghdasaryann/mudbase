import * as F from 'tsui/Form';
import React from 'react';
import * as Api from 'api';
import { Box, Dialog, IconButton, Typography } from '@mui/material';
import * as OffersApi from 'api/offer'


interface Props {
    offerMongoId: string;
    title: string;
    message: string;
    offerArchiveType: 'labor' | 'material';
    onClose: () => void;
    onConfirm: () => void;

    isUnarchive?: boolean;
}


//TODO: remove this is not used

export function OfferItemArchiveUnarchiveDialog(props: Props) {
    const form = F.useUpdateForm();
    const [progIndic, setProgIndic] = React.useState(false)


    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        let cmd = props.isUnarchive ? 'unarchive_offer': 'archive_offer';

        if (props.offerArchiveType === 'labor') {
            Api.requestSession<OffersApi.ApiLaborOffer>({
                command: `labor/${cmd}`,
                args: {
                    laborOfferId: props.offerMongoId,
                }
            })
                .then(response => {

                    props.onConfirm();
                    props.onClose();

                })
        } else if (props.offerArchiveType === 'material') {
            Api.requestSession<OffersApi.ApiMaterialOffer>({
                command: `material/${cmd}`,
                args: {
                    materialOfferId: props.offerMongoId,
                }
            })
                .then(response => {
                    props.onConfirm();
                    props.onClose();

                })
        }
    }, [])




    return <F.PageFormDialog form={form} type='yes-no' title={props.title} size='sm' onSubmit={onSubmit} onClose={props.onClose} >
        <Box sx={{ width: 1 }}>
            <Typography sx={{ textAlign: 'center', fontSize: 'large', m: 2 }}>{props.message}</Typography>
        </Box>
    </F.PageFormDialog>

}


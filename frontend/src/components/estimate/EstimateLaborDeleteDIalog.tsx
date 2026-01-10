import * as F from 'tsui/Form';
import React from 'react';
import { ApiAccount, ApiLaborOffer, ApiMaterialOffer } from '../../api';
import { FormDataProvider } from '../FormDataProvider';
// import { ApiAccount } from '../../api';
// import { FormDataProvider } from '../../components/FormDataProvider';
import * as Api from 'api';
import { Box, Dialog, IconButton, Typography } from '@mui/material';
import ProgressIndicator from '../../tsui/ProgressIndicator';
import { EstimateMaterialItemDisplayData } from '../../data/estimate_items_data';
import moment from 'moment';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import PageDialog from '../../tsui/PageDialog';


interface Props {
    laborItemMongoId: string;
    title: string;
    message: string;
    onClose: () => void;
    onConfirm: () => void;
}

//TODO: remove this is not used.
export function EstimateLaborDeleteDialog(props: Props) {
    const form = F.useUpdateForm();

    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        console.log('I am here')
        await Api.requestSession<any>({
            //TODO change any to interface
            command: 'estimate/remove_labor_item',
            args: {
                estimateLaborItemId: props.laborItemMongoId,
            },
        })
        props.onConfirm();
    }, []);


    return <F.PageFormDialog title={props.title} type='yes-no' form={form} size='md' onSubmit={onSubmit} onClose={props.onClose}>
        <Box sx={{width: 1}}>
            <Typography sx={{ textAlign: 'center', fontSize: 'large', my: 2 }}>{props.message}</Typography>
        </Box>
    </F.PageFormDialog>

}


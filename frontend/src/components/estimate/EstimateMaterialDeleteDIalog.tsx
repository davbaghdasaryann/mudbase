import * as F from 'tsui/Form';
import React from 'react';
import { ApiAccount, ApiLaborOffer, ApiMaterialOffer } from '../../api';
import { FormDataProvider } from '../FormDataProvider';
// import { ApiAccount } from '../../api';
// import { FormDataProvider } from '../../components/FormDataProvider';
import * as Api from 'api';
import { Dialog, IconButton, Typography } from '@mui/material';
import ProgressIndicator from '../../tsui/ProgressIndicator';
import { EstimateMaterialItemDisplayData } from '../../data/estimate_items_data';
import moment from 'moment';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import PageDialog from '../../tsui/PageDialog';


interface Props {
    title: string;
    message: string;
    onClose: () => void;
    onConfirm: () => void;
}

export function EstimateMaterialDeleteDialog(props: Props) {


    return <PageDialog type='yes-no' title={props.title} size='sm' onConfirm={props.onConfirm} onClose={props.onClose} >
            <Typography sx={{textAlign: 'center'}}>{props.message}</Typography>
    </PageDialog>

}


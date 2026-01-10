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
    label: string;
    dialogRenameType: 'section' | 'subsection' | null;
    labelId: string;
    onClose: () => void;
    onConfirm: () => void;
}

export function EstimateRenameDialog(props: Props) {
    const form = F.useInputForm();
    const mounted = React.useRef(false);
    const [dataRequested, setDataRequested] = React.useState(false);
    const [progIndic, setProgIndic] = React.useState(false)

    const [estimatedMaterialsData, setEstimatedMaterialsData] = React.useState<EstimateMaterialItemDisplayData[] | null>(null);
    let [estimatedMaterialId, setEstimatedMaterialId] = React.useState<string | null>(null);

    const [progIndicator, setProgIndicator] = React.useState(false);

    // console.log('props.offerItemName', props.offerItemName)
    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        if (form.error)
            return
        if (!evt.data || Object.keys(evt.data).length === 0) { //TODO everywhere by this way
            props.onClose()
            return;
        }
        
        
        if(props.dialogRenameType === 'section'){
            setProgIndic(true);
            Api.requestSession<any>({ //TODO change any to interface
                command: 'estimate/rename_section',
                args: {
                    estimateSectionNewName: evt.data.renamedLabel, 
                    estimateSectionId: props.labelId
                } 
            })
                .then(res => {
                   
                    
                    props.onConfirm();
                    setProgIndicator(false);
                })
        } else if(props.dialogRenameType === 'subsection'){
            setProgIndic(true);
            Api.requestSession<any>({ //TODO change any to interface
                command: 'estimate/rename_subsection',
                args: {
                    estimateSubsectionNewName: evt.data.renamedLabel, 
                    estimateSubsectionId: props.labelId
                } 
            })
                .then(res => {
                   
                    
                    props.onConfirm();
                    setProgIndicator(false);
                })
        }
         
        

    }, [])

    console.log(props.label)

    // return <F.PageFormDialog title={`Edit Material(s): ${props.estimatedLaborName}`} form={form} size='xl' onSubmit={onSubmit} onClose={props.onClose}>

    // </F.PageFormDialog>

    

    return <F.PageFormDialog title={`${props.title} ${props.dialogRenameType}`} form={form} size='sm' onSubmit={onSubmit} onClose={props.onClose}>

        <ProgressIndicator show={progIndicator} background='backdrop' />

        <F.InputText label={props.dialogRenameType ?? 'rename'} id='renamedLabel' value={props?.label} validate='off' autocomplete='given-name' form={form} xsMax />


    </F.PageFormDialog>

}


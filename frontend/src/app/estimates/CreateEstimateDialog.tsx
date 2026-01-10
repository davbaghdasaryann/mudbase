'use client';

import React from 'react';
import * as Api from 'api';

import * as F from 'tsui/Form';
import { useTranslation } from 'react-i18next';

// const [t] = useTranslation()

const constrData=  [  //ConstructionType, BuildingType
    {
        id: 'currentRenovation',
        label: 'Current Renovation',
    },
    {
        id: 'renovation',
        label: 'Renovation',
    },
    {
        id: 'majorRepairs',
        label: 'Major repairs',
    },
    {
        id: 'reconstruction',
        label: 'Reconstruction',
    },
    {
        id: 'reinforcement',
        label: 'Reinforcement',
    },
    {
        id: 'restorationWork',
        label: 'Restoration Work',
    },
    {
        id: 'construction',
        label: 'Construction',
    },
];

interface Props {
    onClose: () => void;
    onConfirm: () => void;
}

export default function CreateEstimateDialog(props: Props) {
    const form = F.useInputForm();
    const [t] = useTranslation();

    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        console.log('evt', evt)
        if (form.error)
            return

        if (!evt.data || Object.keys(evt.data).length === 0) { //TODO everywhere by this way
            props.onClose();
            return;
        }


        await Api.requestSession<Api.ApiEstimate>({
            command: 'estimate/create',
            json: evt.data
        })
        
        props.onConfirm();
        props.onClose();

    }, []);


    return <F.PageFormDialog title={t('Create Estimate')} form={form} size='md' onSubmit={onSubmit} onClose={props.onClose}>

        <F.InputText xsHalf id='name' label={t('Title')} placeholder='Title' required />
        <F.InputText xsHalf id='address' label={t('Address')} placeholder='Address' />

        <F.SelectField xsHalf id="constructionType" items={constrData} label={'Type of construction'} />
        {/* <F.InputText xsHalf id="buildingType" label={'Type of building'} placeholder={'Type of building'} /> */}
        <F.InputText xsHalf id="constructionSurface" label={'Construction surface'} placeholder={'Construction surface'} />
        {/* <F.SelectField xsHalf id="constructionSurface" items={constrData} label={'Construction surface'} /> */}

    </F.PageFormDialog>


}



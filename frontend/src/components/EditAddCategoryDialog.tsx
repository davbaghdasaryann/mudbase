"use client";

import * as React from 'react';
import { useState } from 'react';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Box, Stack } from '@mui/material';
import * as F from 'tsui/Form';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';
import { useApiFetchMany, useApiFetchOne } from './ApiDataFetch';
import ProgressIndicator from '../tsui/ProgressIndicator';
import { confirmDialog } from './ConfirmationDialog';

interface EntityButtonPopupProps {
    catalogType: 'labor' | 'material' | 'aggregated';
    actionType: 'add' | 'update' | 'archive';
    entityType: 'category' | 'subcategory' | 'item';

    entityName: string | null;
    entityCode: string | null;
    entityMongoId: string | null

    onClose: () => void;
    onConfirm: () => void;

}


export default function AddOrEditEntityDialog(props: EntityButtonPopupProps) {
    const form = F.useForm({
        type: 'input',
    });
    const [t] = useTranslation()
    const [progIndic, setProgIndic] = React.useState(false);

    const apiData = useApiFetchOne<Api.ApiMeasurementUnit[]>({});
    const apiEntityData = useApiFetchOne<any>({});
console.log('props.entityType', props.entityType)
    React.useEffect(() => {
        // if (props.entityType === 'item' && props.actionType === 'add') {
        if (props.entityType === 'item') {
            apiData.setApi({
                command: 'measurement_unit/fetch',
            });
        }
    }, [props.entityType])

    React.useEffect(() => {
        if (props.actionType === 'update') {
            switch (props.catalogType) {
                case 'labor':
                    switch (props.entityType) {
                        case 'item':
                            apiEntityData.setApi({
                                command: 'labor/get_item',
                                args: { laborItemMongoId: props.entityMongoId }
                            });
                            break;
                        // case 'category':
                        //     apiEntityData.setApi({
                        //         command: 'labor/get_category',
                        //         args: { laborCategoryMongoId: props.entityMongoId }
                        //     });
                        //     break;
                        // case 'subcategory':
                        //     apiEntityData.setApi({
                        //         command: 'labor/get_subcategory',
                        //         args: { laborSubcategoryMongoId: props.entityMongoId }
                        //     });
                        //     break;
                        default:
                            break;
                    }
                    break;
                case 'material':
                    switch (props.entityType) {
                        case 'item':
                            apiEntityData.setApi({
                                command: 'material/get_item',
                                args: { materialItemMongoId: props.entityMongoId }
                            });
                            break;
                        // case 'category':
                        //     apiEntityData.setApi({
                        //         command: 'material/get_category',
                        //         args: { materialCategoryMongoId: props.entityMongoId }
                        //     });
                        //     break;
                        // case 'subcategory':
                        //     apiEntityData.setApi({
                        //         command: 'material/get_subcategory',
                        //         args: { materialSubcategoryMongoId: props.entityMongoId }
                        //     });
                        //     break;
                        default:
                            break;
                    }
                    break;
                default:
                    break;
            }
        }
    }, [])

    console.log('apiEntityData', apiEntityData)

    React.useEffect(() => {
        if (
            props.entityType === 'item' &&
            props.actionType === 'update' &&
            apiEntityData.data?.measurementUnitData?.length
        ) {
            const savedId = apiEntityData.data.measurementUnitData[0].measurementUnitId;
            const field = form.getField('measurementUnitId');
            if (field) {
                form.processValueEdit(field, savedId);
            }
        }
    }, [
        props.entityType,
        props.actionType,
        apiEntityData.data,
        form
    ]);


    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        if (form.error)
            return;
        if (!evt.isData() || Object.keys(evt.data).length === 0) { //TODO everywhere by this way
            props.onClose()
            return;
        }

        if (!evt.data.entityName)
            return



        setProgIndic(true)

        const apiPrefix = props.catalogType === 'aggregated' ? 'eci' : props.catalogType;
        const apiEntityType = props.catalogType === 'aggregated' && props.entityType === 'item' ? 'estimate' : props.entityType;

        Api.requestSession<any>({
            command: `${apiPrefix}/${props.actionType}_${apiEntityType}`,
            args: {
                entityName: evt.data.entityName,
                entityCode: evt.data.entityCode ?? undefined,
                entityMongoId: props.entityMongoId,
                measurementUnitId: evt.data.measurementUnitId ?? undefined
            }
        })
            .then(d => {
                props.onConfirm();
            })
            .catch()
            .finally(() => {
                setProgIndic(false)
            });
    }, [])


    if (props.entityType === 'item' && props.actionType === 'add' && apiData.loading) {
        return <ProgressIndicator show={apiData.loading} background='backdrop' />
    }
    if (progIndic) {
        return <ProgressIndicator show={progIndic} background='backdrop' />
    }

    return (
        <F.PageFormDialog title={`${t(props.actionType) === 'update' ? t('Edit') : t('add')} ${t(props.entityType)}`} form={form} size='sm' onSubmit={onSubmit} onClose={props.onClose}>
            {props.actionType === 'add' && <F.InputText required form={form} xs={3} id='entityCode' label={t('Code')} placeholder={t('Code')} />}
            {props.actionType === 'update' && <F.InputText required form={form} value={props.entityCode} xs={3} id='entityCode' label={t('Code')} placeholder={t('Code')} />}

            {props.entityType === 'item' && (
                props.actionType === 'add' ? (
                    <F.SelectField
                        form={form}
                        xs={9}
                        id="measurementUnitId"
                        required
                        items={apiData.data?.map(unit => ({
                            id: unit.measurementUnitId,
                            name: unit.name,
                            label: unit.name,
                        })) ?? []}
                        value={t(apiData.data?.[0]?.name ?? 'Choose Measurement Unit')}
                        label={t('Measurement Unit')}
                    />
                ) : /* props.actionType === 'update' */ (
                    <F.SelectField
                        form={form}
                        xs={9}
                        id="measurementUnitId"
                        // required
                        items={apiData.data?.map(unit => ({
                            id: unit.measurementUnitId,
                            name: unit.name,
                            label: unit.name,
                        })) ?? []}
                        value={apiEntityData.data?.measurementUnitData[0]?.measurementUnitId ?? ''}
                        label={t('Measurement Unit')}
                    />
                )
            )}

            {props.actionType === 'add'
                ?
                <F.InputText required form={form} xs={props.entityType === 'item' ? 12 : 9} id='entityName' label={t(`Title of ${props.entityType}`)} placeholder={t(`Title of ${props.entityType}`)} />
                :
                <F.InputText required form={form} xsMax id='entityName' value={props.entityName} label={t(`Title of ${props.entityType}`)} placeholder={t(`Title of ${props.entityType}`)} />
            }




        </F.PageFormDialog>
    );
}

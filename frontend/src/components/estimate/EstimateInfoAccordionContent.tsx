'use client';

import React, { useEffect, useRef, useState } from 'react';

import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';


import * as F from '@/tsui/Form';
import { InputFormField } from '@/tsui/Form/FormElements/FormFieldContext';
import * as Api from '@/api';
import * as GD from '@/data/global_dispatch';
import { usePermissions } from '@/api/auth';
import ProgressIndicator from '@/tsui/ProgressIndicator';
import { fixedNumber } from '@/tslib/parse';

interface Props {
    estimateId: string;
    onDataUpdated?: (updated: boolean) => void;

}

// const [t]= useTranslation()

export default function EstimateInfoAccordionContent(props: Props) {
    const { session, status, permissionsSet } = usePermissions();
    const { t } = useTranslation();

    const constrData = [
        //ConstructionType, BuildingType
        {
            id: 'currentRenovation',
            label: t('Current Renovation'),
        },
        {
            id: 'renovation',
            label: t('Renovation'),
        },
        {
            id: 'majorRepairs',
            label: t('Major repairs'),
        },
        {
            id: 'reconstruction',
            label: t('Reconstruction'),
        },
        {
            id: 'reinforcement',
            label: t('Reinforcement'),
        },
        {
            id: 'restorationWork',
            label: t('Restoration Work'),
        },
        {
            id: 'construction',
            label: t('Construction'),
        },
    ];

    let form = F.useForm({
        // type: 'input',
        type: session?.user && permissionsSet?.has?.('EST_EDT_INFO') ? 'update-fields' : 'readonly',
    });

    const mounted = useRef(false);
    const [dataRequested, setDataRequested] = useState(false);
    const [progIndic, setProgIndic] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any | null>(null); //TODO change any to interface

    useEffect(() => {
        const updateData = () => {
            setDataRequested(false);
        };

        GD.pubsub_.addListener(GD.estimateMaterialDataChangedId, updateData);
        GD.pubsub_.addListener(GD.estimateCostChangedId, updateData);

        return () => {
            GD.pubsub_.removeListener(GD.estimateMaterialDataChangedId, updateData);
            GD.pubsub_.removeListener(GD.estimateCostChangedId, updateData);
        };
    }, []);

    useEffect(() => {
        setProgIndic(true);

        mounted.current = true;
        if (!dataRequested) {
            Api.requestSession<any>({
                //TODO change any to interface
                command: 'estimate/get',
                args: { estimateId: props.estimateId },
            }).then((myEstimatesList) => {
                if (mounted.current) {
                    // console.log(myEstimatesList);
                    setData(myEstimatesList);
                }
                setProgIndic(false);
            });

            setDataRequested(true);
            return;
        }
        return () => {
            mounted.current = false;
        };
    }, [dataRequested]);


    const handleChange = async (e: InputFormField) => {
        const getFieldKey = e.id;
        const getFieldValue = e.value;
        if (getFieldKey && getFieldValue) {
            let myEstimatesList = await Api.requestSession<any>({
                //TODO change any to interface
                command: 'estimate/rename',
                args: {
                    estimateId: props.estimateId,
                    fieldKey: getFieldKey,
                    fieldValue: getFieldValue,
                }, //TODO: remove this _id hardCode
            });

            // console.log(myEstimatesList);
            setData(myEstimatesList);
            setDataRequested(false);
            setProgIndic(false);

            props.onDataUpdated?.(true);
        }
    };

    if (loading) {
        return <ProgressIndicator show={loading} background='backdrop' />;
    }

    return (
        <Box sx={{
            backgroundColor: 'transparent !important',
            '& *': {
                backgroundColor: 'transparent !important',
            },
            '& .MuiPaper-root, & .MuiPaper-elevation, & .MuiPaper-rounded, & .MuiPaper-elevation1': {
                backgroundColor: 'transparent !important',
                boxShadow: 'none !important',
                background: 'none !important',
            },
            '& .MuiBox-root': {
                backgroundColor: 'transparent !important',
                background: 'none !important',
            },
            '& > *': {
                backgroundColor: 'transparent !important',
                background: 'none !important',
            }
        }}>
            <F.PageForm
                form={form}
                size='xl'
                onFieldUpdate={handleChange}
                formSx={{
                    marginTop: '-9px !important',
                    backgroundColor: 'transparent !important',
                    background: 'none !important',
                    '& *': {
                        backgroundColor: 'transparent !important',
                    },
                    '& .MuiPaper-root, & .MuiPaper-elevation, & .MuiPaper-rounded': {
                        backgroundColor: 'transparent !important',
                        background: 'none !important',
                        boxShadow: 'none !important',
                    },
                    '& .MuiTextField-root': {
                        marginBottom: '8px !important',
                        '& .MuiInputBase-root': {
                            backgroundColor: 'transparent !important',
                            height: '40px',
                            minHeight: '40px',
                        },
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: 'transparent !important',
                        },
                        '& .MuiInputLabel-root': {
                            fontSize: '0.875rem',
                        },
                        '& .MuiInputBase-input': {
                            padding: '8px 14px',
                        }
                    },
                    '& .MuiFormControl-root': {
                        marginBottom: '8px !important',
                        '& .MuiInputBase-root': {
                            backgroundColor: 'transparent !important',
                            height: '40px',
                            minHeight: '40px',
                        },
                        '& .MuiInputBase-input': {
                            padding: '8px 14px',
                        },
                        '& .MuiInputLabel-root': {
                            fontSize: '0.875rem',
                        }
                    }
                }}
            >
                {/* Row 1 */}
                <F.InputText xs={2.4} id='name' value={data?.name} label={t('Title')} placeholder={t('Title')} />
                <F.InputText xs={2.4} id='address' value={data?.address} label={t('Address')} placeholder={t('Address')} />
                <F.SelectField
                    xs={2.4}
                    id='constructionType'
                    items={constrData}
                    value={data?.constructionType}
                    label={t('Type of construction')}
                />
                <F.InputText
                    id='builtUpArea'
                    value={data?.builtUpArea}
                    label={t('Built-up Area')}
                    placeholder={t('Built-up Area')}
                    xs={2.4}
                />
                <F.InputText
                    id='constructionSurface'
                    value={data?.constructionSurface}
                    label={t('Construction area')}
                    placeholder={t('Construction area')}
                    xs={2.4}
                />

                {/* Row 2 */}
                <F.InputText
                    isThousandsSeparator={true}
                    readonly
                    xs={2.4}
                    id='totalCost'
                    value={fixedNumber(data?.totalCost) ?? '0'}
                    label={t('Direct costs')}
                    placeholder={t('Direct costs')}
                />
                <F.InputText
                    isThousandsSeparator={true}
                    readonly
                    xs={2.4}
                    id='otherCosts'
                    value={fixedNumber((data?.totalCostWithOtherExpenses ?? 0) - (data?.totalCost ?? 0)) ?? '0'}
                    label={t('Other costs')}
                    placeholder={t('Other costs')}
                />
                <F.InputText
                    isThousandsSeparator={true}
                    readonly
                    xs={2.4}
                    id='totalCostWithOtherExpenses'
                    value={fixedNumber(data?.totalCostWithOtherExpenses) ?? '0'}
                    label={t('Total Cost AMD')}
                    placeholder={t('Total Cost AMD')}
                />
                <F.InputText
                    isThousandsSeparator={true}
                    readonly
                    xs={2.4}
                    id='builtUpCostPerSqM'
                    value={
                        data?.builtUpArea && parseFloat(data.builtUpArea) > 0
                            ? fixedNumber((data?.totalCost ?? 0) / parseFloat(data.builtUpArea))
                            : '0'
                    }
                    label={t('Built-up Cost per sq. m')}
                    placeholder={t('Built-up Cost per sq. m')}
                />
                <F.InputText
                    isThousandsSeparator={true}
                    readonly
                    xs={2.4}
                    id='constructionCostPerSqM'
                    value={
                        data?.constructionSurface && parseFloat(data.constructionSurface) > 0
                            ? fixedNumber((data?.totalCost ?? 0) / parseFloat(data.constructionSurface))
                            : '0'
                    }
                    label={t('Construction Cost per sq. m')}
                    placeholder={t('Construction Cost per sq. m')}
                />
            </F.PageForm>
        </Box>
    );
}

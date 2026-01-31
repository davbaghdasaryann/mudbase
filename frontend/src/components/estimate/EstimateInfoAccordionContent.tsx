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

const constrData = [
    //ConstructionType, BuildingType
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

export default function EstimateInfoAccordionContent(props: Props) {
    const { session, status, permissionsSet } = usePermissions();
    const [t] = useTranslation();

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
                sx={{
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
                        '& .MuiInputBase-root': {
                            backgroundColor: 'transparent !important',
                        },
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: 'transparent !important',
                        }
                    },
                    '& .MuiFormControl-root': {
                        '& .MuiInputBase-root': {
                            backgroundColor: 'transparent !important',
                        }
                    }
                }}
            >
                <F.InputText xsHalf id='name' value={data?.name} label='Title' placeholder='Title' />
                <F.InputText xsHalf id='address' value={data?.address} label='Address' placeholder='Address' />

                <F.InputText
                    isThousandsSeparator={true}
                    readonly
                    xsQuarter
                    id='totalCost'
                    value={fixedNumber(data?.totalCost) ?? '0'}
                    label='Total Cost AMD'
                    placeholder='Total Cost AMD'
                />

                <F.InputText
                    isThousandsSeparator={true}
                    readonly
                    xsQuarter
                    id='totalCostWithOtherExpenses'
                    value={fixedNumber(data?.totalCostWithOtherExpenses) ?? '0'}
                    label='Total Cost With Other Expenses AMD'
                    placeholder='Total Cost With Other Expenses AMD'
                />
                <F.SelectField
                    xsQuarter
                    id='constructionType'
                    items={constrData}
                    value={data?.constructionType}
                    label={data?.constructionType ?? 'Type of construction'}
                />
                {/* <F.InputText
                    xsQuarter
                    id='buildingType'
                    value={data?.buildingType}
                    label={data?.buildingType ?? 'Type of building'}
                    placeholder={data?.buildingType ?? 'Type of building'}
                /> */}
                <F.InputText
                    id='constructionSurface'
                    value={data?.constructionSurface}
                    label={data?.constructionSurface ?? 'Construction surface'}
                    placeholder={data?.constructionSurface ?? 'Construction surface'}
                    xsQuarter
                />
            </F.PageForm>
        </Box>
    );
}

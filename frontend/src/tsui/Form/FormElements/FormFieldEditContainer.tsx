'use client';

import React from 'react';
import {Stack, IconButton} from '@mui/material';

import {SvgIcon} from '@mui/material';

import {keyframes} from '@emotion/react';

import EditIcon from '@mui/icons-material/EditOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';

import LoopRoundedIcon from '@mui/icons-material/LoopRounded';

import {InputFormField} from './FormFieldContext';
import FormFieldEditDialog from './FormFieldEditDialog';
import {FormHookInstance} from '../FormContext/FormHookInstance';

interface FormFieldEditContainerProps {
    field: InputFormField;
    form: FormHookInstance;
    value?: string;
    children?: React.ReactNode;
    onValueChange: (value: string) => void;
}

export default function FormFieldEditContainer(props: FormFieldEditContainerProps) {
    const [editActive, setEditActive] = React.useState(false);
    // const [busy, setBusy] = React.useState(false);

    const handleEdit = React.useCallback(() => {
        setEditActive(true);
    }, []);

    const handleEditResponse = React.useCallback(async (changed: boolean, value: string | null) => {
        if (changed && value !== null) {
            // setBusy(true);
            let accepted = await props.form.processValueEdit(props.field, value);
            if (accepted) {
                props.onValueChange(value);
                setEditActive(false);
                // setBusy(false);
            }
        } else {
            setEditActive(false);
        }
    }, []);

    return (
        <>
            <Stack direction='row' alignItems='center' spacing={1}>
                {props.children}

                {props.form.isBusy ? (
                    <SvgIcon
                        component={LoopRoundedIcon}
                        inheritViewBox={true}
                        sx={{
                            '& path': {
                                fill: "inherit",
                            },
                            animation: `${busyKeyframes} 2s linear infinite`,
                        }}
                    />
                ) : (
                    <IconButton onClick={handleEdit} color='inherit'>
                        {props.field.fieldType === 'time' ? <ScheduleIcon /> : <EditIcon />}
                    </IconButton>
                )}
            </Stack>

            {editActive && <FormFieldEditDialog field={props.field} value={props.value} onResponse={handleEditResponse} />}
        </>
    );
}

const busyKeyframes = keyframes({
    from: {transform: 'rotate(0deg)'},
    to: {transform: 'rotate(360deg)'},
});

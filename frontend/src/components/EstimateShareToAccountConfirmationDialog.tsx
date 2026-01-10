import React from 'react';
import { Radio, Dialog, FormControlLabel, IconButton, RadioGroup, Typography, Box, Stack } from '@mui/material';
import PageDialog from '../tsui/PageDialog';
import * as F from 'tsui/Form';
import { useTranslation } from 'react-i18next';


type SelectedValueType = 'totalEstimate' | 'onlyEstimateInfo';

interface Props {
    title: string;
    message: string;
    onClose: () => void;
    onConfirm: (value: SelectedValueType) => void;
}

export function EstimateShareToAccountConfirmationDialog(props: Props) {
    const [t] = useTranslation();

    const form = F.useForm({
        type: 'input',
    });

    const [selectedValue, setSelectedValue] = React.useState<SelectedValueType>('totalEstimate');
    const selectedValueRef = React.useRef<SelectedValueType>('totalEstimate');

    const handleRadioChange = (event) => {
        setSelectedValue(event.target.value);
        selectedValueRef.current = event.target.value;
    };
    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        if (form.error)
            return;

        props.onConfirm(selectedValueRef.current)

    }, [])

    return (
        <F.PageFormDialog
            ignoreDataChecking
            title={props.title}
            form={form}
            size="md"
            onSubmit={onSubmit}
            onClose={props.onClose}
        >
            <Stack
                spacing={2}
                // make the Stack fill its parent horizontally
                sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',       // center children horizontally
                    justifyContent: 'center',   // center children vertically if parent is tall
                    p: 2,
                }}
            >
                <RadioGroup
                    value={selectedValue}
                    onChange={handleRadioChange}
                    row
                    sx={{ gap: 4 }}
                >
                    <FormControlLabel
                        value="totalEstimate"
                        control={<Radio />}
                        label={t('Total Estimate')}
                    />
                    <FormControlLabel
                        value="onlyEstimateInfo"
                        control={<Radio />}
                        label={t('Only Estimate Information')}
                    />
                </RadioGroup>

                <Typography>{t(props.message)}</Typography>
            </Stack>
        </F.PageFormDialog>
    );
}


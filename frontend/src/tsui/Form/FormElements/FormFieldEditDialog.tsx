import React from 'react';

import { Stack, TextField, Typography } from '@mui/material';


import { TextChangeEvent } from '../../React/ReactUtil';
import PageDialog from '../../PageDialog';
import {InputFormField} from './FormFieldContext';
import { i18nt } from '@/tsui/I18n/SafeTranslation';

interface FormFieldEditDialogProps {
    field: InputFormField;
    value?: string;

    onResponse: (changed: boolean, value: string | null) => void;
}

export default function FormFieldEditDialog(props: FormFieldEditDialogProps) {
    const [prompt, setPrompt] = React.useState('');
    const [value, setValue] = React.useState(props.value);
    const valueRef = React.useRef(props.field.value);

    React.useEffect(() => {
        if (!props.field.passValidation(props.value))
            setValue('');
        setPrompt(i18nt('Enter') + ' ' + props.field.tlabel + '...');
    }, []);

    const onValueChange = React.useCallback((e: TextChangeEvent | null) => {
        if (e === null) return;
        let v = e.target.value;

        if (!props.field.passValidation(v))
            return;

        //This transforms Armenian . this to this .
        if (props.field.validate === 'positive-double-number' || props.field.validate === 'double-number') {
            v = v.split('')
                .map(ch => (ch.charCodeAt(0) === 8228 ? String.fromCharCode(46) : ch))
                .join('');

            // // Log each character's Unicode code for debugging
            // for (let i = 0; i < v.length; i++) {
            //     console.log(`Character: '${v[i]}', Code: ${v.charCodeAt(i)}`);
            // }
        }

        if (!props.field.passValidation(v)) return;

        setValue(v);
        valueRef.current = v;
        props.field.valueChanged = true;
    }, []);

    const onKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent unintended form submission
            props.onResponse(props.field.valueChanged, valueRef.current);
        }
    }, []);

    // if (props.field.fieldType === 'time') {
    //     return (
    //         <TimePicker value={value} onChange={onValueChange}/>
    //     );
    // }

    return (
        <PageDialog
            type='cancel-confirm'
            size='sm'
            ttitle={props.field.tlabel}
            onCloseNull={() => props.onResponse(false, null)}
            onConfirm={() => props.onResponse(props.field.valueChanged, valueRef.current)}
        >
            {/* <DialogContent dividers> */}
            <Stack direction='column' spacing={2}>
                <Typography>{prompt}</Typography>

                <TextField autoFocus={true} value={value} onChange={onValueChange} onKeyDown={onKeyDown} />
            </Stack>
        </PageDialog>
    );
}

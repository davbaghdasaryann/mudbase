import React from 'react';

import {Checkbox, FormControlLabel, FormGroup} from '@mui/material';

interface MCheckboxProps {
    mount?: boolean;
    show?: boolean;

    checked?: boolean;

    label?: string;
    required?: boolean;
    disabled?: boolean;

    onChange?: (checked: boolean) => void;
}

export default function MCheckbox(props: MCheckboxProps) {
    if (props.show === false || props.mount === false) return null;

    return <MCheckboxBody {...props} />;
}

export function MCheckboxBody(props: MCheckboxProps) {
    const onChange = React.useCallback((checked: boolean) => {
        props.onChange && props.onChange(checked);
    }, []);

    if (props.label) {
        return (
            <FormGroup>
                <FormControlLabel checked={props.checked} control={<Checkbox />} label={props.label} onChange={(event, checked) => onChange(checked)} />
            </FormGroup>
        );
    }

    return <Checkbox checked={props.checked} required={props.required} disabled={props.disabled} onChange={(event, checked) => onChange(checked)} />;
}

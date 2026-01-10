import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

interface SelectTextFieldsProps {
    data: {value: string; label: string}[];
    label: string;
    id: string;
    defaultVal?: string;
    onChange?: (id, val)=> void
}

export default function SelectTextFields(props: SelectTextFieldsProps) {
    const [defaultVal, setDefaultVal] = React.useState(props.defaultVal ? props.defaultVal : '');
    return (
        <Box  component='form' sx={{width:1}} noValidate autoComplete='off'>
            <div>
                <TextField
                    id={props.id} 
                    select
                    label={props.label}
                    defaultValue= {defaultVal}
                    sx={{width:1}}
                    onChange={(e)=>{ props.onChange && props.onChange(props.id, e.target.value) }}
                >
                    {props.data.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </TextField>
            </div>
        </Box>
    );
}

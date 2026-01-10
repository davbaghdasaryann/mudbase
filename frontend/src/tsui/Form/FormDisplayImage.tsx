import {Box} from '@mui/material';

import * as FT from './FormTypes';

import FormFieldContainer from './FormBody/FormFieldContainer';
import PageImage from '../PageImage';
import {useFormContext} from './FormContext/FormContextProvider';

interface DisplayImageProps extends FT.FieldProps {
    src: string;
    width?: number;
    height?: number;
    alt?: string;
}

export function DisplayImage(props: DisplayImageProps) {
    const formContext = useFormContext();
    const form = formContext.formInstance;

    return (
        <FormFieldContainer form={form} formProps={formContext.formProps} fieldProps={props}>
            {form.isLoading ? (
                <Box
                    sx={{
                        width: props.width ?? props.height,
                        height: props.height ?? props.width,
                    }}
                >
                    &nbsp;
                </Box>
            ) : (
                <PageImage src={props.src} width={props.width} height={props.height} />
            )}
        </FormFieldContainer>
    );
}

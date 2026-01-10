import React from 'react';

import {FormBodyContents, FormBodyProps} from '../FormBody/FormBodyContents';
import {FormContextValue} from './FormContextData';

export const FormContext = React.createContext<FormContextValue | undefined>(undefined);

export function FormBodyContentsProvider(props: FormBodyProps) {
    const contextValue: FormContextValue = {
        formInstance: props.formProps.form,
        formProps: props.formProps,
    };

    return (
        <FormContext.Provider value={contextValue}>
            <FormBodyContents {...props}>{props.children}</FormBodyContents>
        </FormContext.Provider>
    );
}

export function useFormContext() {
    const context = React.useContext(FormContext);

    if (!context) {
        throw new Error('useForm must be used within a FormProvider');
    }

    return context;
}

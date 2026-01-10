import { FormHookInstance } from "./FormHookInstance";
import { FormProps } from "../FormTypes";

export interface FormContextValue {
    formInstance: FormHookInstance;
    formProps: FormProps;

    // registerField: (id: string, field: InputFormField) => void;
    // unregisterField: (id: string) => void;
    // registeredFields: Map<string, InputFormField>;
}


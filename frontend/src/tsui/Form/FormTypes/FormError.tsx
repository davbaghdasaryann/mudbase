
export interface FormError {
    fieldId?: string;
    message?: string;
}

export type ErrorPropType = Error | string | undefined | null | FormError;


import {BoxProps, SxProps, Theme} from '@mui/system';
import {GridProps, PaperProps, TypographyOwnProps} from '@mui/material';

import {PageDialogTitle, PageDialogType} from '../../PageDialogProps';
import {ModalCloseProps} from '../../Types/ModalCloseParams';
import {FormHookInstance} from '../FormContext/FormHookInstance';
import {InputFormField} from '../FormElements/FormFieldContext';
import {FormContainerType, FormElementType, FormLayoutType, FormSizeType, InputFormEvent} from './FormBasicTypes';
import {ErrorPropType, FormError} from './FormError';
import {ButtonSlotProps, TextFieldSlotProps} from '@/tsui/Buttons/PageButton';

export interface FormSlotsParams {
    grid?: React.ElementType | null;
}

export interface FormSlotPropsParams {
    rootBox?: BoxProps;
    paper?: PaperProps;
    grid?: GridProps;
    gridItem?: GridProps;
    textField?: TextFieldSlotProps;
    title?: TypographyOwnProps; //SxProps<Theme>;
    cancelButton?: ButtonSlotProps;
    submitButton?: ButtonSlotProps;
}

export interface FormProps extends ModalCloseProps {
    //
    // Form instance
    //
    form: FormHookInstance;
    children?: React.ReactNode;

    //
    // Form state
    //
    render?: boolean;
    show?: boolean;
    loading?: boolean;
    error?: ErrorPropType;

    //
    // Form actions
    //
    onSubmit?: (evt: InputFormEvent) => Promise<void>;
    onFieldUpdate?: (field: InputFormField) => Promise<void>;

    //
    // Form behavour
    //
    ignoreDataChecking?: boolean;

    //
    // Form visuals
    //
    size?: FormSizeType;
    title?: string | PageDialogTitle;
    ttitle?: string;

    fromComp?: boolean;

    // Options
    formContainer?: FormContainerType;
    formElement?: FormElementType;

    formSx?: SxProps<Theme>;

    /**
     * @deprecated `titleSx` prop is deprecated. use slots.title.
     */

    titleSx?: SxProps<Theme>;

    layoutContainerType?: FormLayoutType;
    layoutItemType?: FormLayoutType;

    type?: PageDialogType;

    slots?: FormSlotsParams;
    slotProps?: FormSlotPropsParams;
}

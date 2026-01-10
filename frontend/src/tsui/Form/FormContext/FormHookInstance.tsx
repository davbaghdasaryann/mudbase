'use client';

import {AlertColor} from '@mui/material';

import {makeError} from '../../../tslib/error';

import * as FT from '../FormTypes';
import {InputFormField} from '../FormElements/FormFieldContext';
import { FormHookProps } from './FormHookProps';


export interface FormMessage {
    text: string;
    severity: AlertColor;
}

export interface FormFieldError {
    message: string;
}

export class FormHookInstance {
    // Form setup
    formId: string;
    formType: FT.FormTypeT;

    formMargin = 0;
    gridMargin = 1;

    // Loading state
    dataPending = false;
    dataRequested = false;

    // Error handling
    error?: Error;

    // General user message
    message?: FormMessage;

    // Changes and updates
    // forceUpdate: React.DispatchWithoutAction;

    // formElement?: FT.FormElementType;
    // formContainer?: FT.FormContainerType;
    // layoutElement?: FT.FormLayoutType;

    // Initialization
    //constructor(formId: number, props: FormContextProps) {
    constructor(props: FormHookProps, formId: string) {
        // console.log('constructor');

        this.formType = props.type;
        this.formId = formId;

    //     // this.forceUpdate = params.forceUpdate;

    //     this.formIndex = currentFormIndex++;
    //     this.formType = props.type;
    //     // this.rerenderListenerId = `formContextRenderListenerId_${this.formIndex}`;
    //     this.formId = `form_${this.formIndex}`;

    //     // console.log(props.data);

    //     // if (this.formType === 'update' && !props.data) {
    //     //     this.isLoading = true;
    //     //     this.isBusy = true;
    //     // }
    }

    release() {
        this.reset();
        // this.pubsub.release();
    }

    clearError() {
        this.error = undefined;
        for (let [key, field] of this.registeredFields) {
            field.error = undefined;
        }
           
        // this.forceUpdate();
    }

    // setError(err: Error | string) {
    setError(err: Error | string, inputFieldId?: Array<string>) {

        this.isLoading = false;
        this.isBusy = false;
        this.error = makeError(err);

        // console.log('form.setError: ', this.error?.name, this.error?.message, inputFieldId);
    }

    // setFieldError(fieldId: string, message: string) {
    //     this.fieldErrors.set(fieldId, {message: message});
    // }

    //
    // Message
    //
    clearMessage() {
        this.message = undefined;
        // this.forceUpdate();
    }

    setMessageUpdateSuccess() {
        this.message = {
            text: 'Updated.',
            severity: 'success',
        };
        this.isBusy = false;
        // this.forceUpdate();
    }

    //
    // Loading/Busy state
    //
    isLoading = false;
    isBusy = false;
    isDisable = false;

    setBusy() {
        this.isBusy = true;
        this.error = undefined;
        this.message = undefined;
        // console.log('this.isBusy', this.isBusy)

        // this.forceUpdate();
    }

    setDisable() {
        this.isDisable = true;
        // this.forceUpdate();
    }

    clearDisable() {
        this.isDisable = false;
        // this.forceUpdate();
    }

    clearBusy() {
        this.isBusy = false;
        // this.forceUpdate();
    }

    setFieldBusy(field: InputFormField) {
        field.isBusy = true;
        // this.forceUpdate();
    }

    clearFieldBusy(field: InputFormField) {
        field.isBusy = false;
        // this.forceUpdate();
    }

    reloadData() {
        this.dataPending = true;
        this.dataRequested = false;
    }

    setLoading() {
        this.isLoading = true;
        this.setBusy();
    }
    clearLoading() {
        this.isLoading = false;
        this.isBusy = false;
        this.error = undefined;

        // this.triggerRerender();
    }

    //
    // Registerd input fields
    //
    registeredFields = new Map<string, InputFormField>();



    registerField(field: InputFormField) {
        // // console.log(props);
        // if (field.id) {
        //     let field = this.registeredFields.get(props.id);
        //     if (field) {
        //         field.updateParams(params);
        //         return field;
        //     }
        // }

        // let field = new InputFormField(props, params);

        // if (props.id) {
        if (field.id) {
            this.registeredFields.set(field.id, field);
        }
        // }

        // return field;
    }

    unregisterField(field: InputFormField) {
        if (field.id) {
            this.registeredFields.delete(field.id);
        }
    }

    // registerField(props: FT.FieldProps, params: FT.FieldParams): InputFormField {
    //     // console.log(props);
    //     if (props.id) {
    //         let field = this.registeredFields.get(props.id);
    //         if (field) {
    //             field.updateParams(params);
    //             return field;
    //         }
    //     }

    //     let field = new InputFormField(props, params);

    //     if (props.id) {
    //         this.registeredFields.set(props.id, field);
    //     }

    //     return field;
    // }

    getField(id: string) {
        return this.registeredFields.get(id);
    }

    async processValueEdit(field: InputFormField, value: string) {
        field.value = value;
        if (this.onFieldUpdate) {
            try {
                await this.onFieldUpdate(field);
            } catch (error) {
                return false;
            }
        }
        return true;
    }

    onFieldUpdate?: (field: InputFormField) => Promise<void>;

    reset() {
        this.registeredFields.clear();
    }

    //
    // Dealing with React hooks
    //
    // rerenderListenerId: string;
    // pubsub = new PubSub();

    // private triggerRerender() {
    //     //this.pubsub.dispatch(this.rerenderListenerId)
    // }
}

// let currentFormIndex = 1;

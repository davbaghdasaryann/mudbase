"use client";

import * as FT from '../FormTypes/FormBasicTypes';

import { FormValue, computeFormValue } from '../FormBody/FormValue';
import { validateDoubleInteger, validateInteger, validatePositiveDoubleInteger, validatePositiveInteger } from '../../../tslib/validate';
import { i18nt } from '@/tsui/I18n/SafeTranslation';


export class InputFormField {
    id?: string;
    name?: string;
    fieldType: FT.InputFieldType;
    isData = true; // if false the item won't be submitted in the form data
    required: boolean;
    validate: FT.InputValidateType;

    origValue: string; // | number | boolean;
    value: string; // | number | boolean;
    valueChanged = false;
    suffix?: string;

    // Runtime data
    error?: Error; // field is in error
    isBusy = false;
    tlabel?: string; // translated label

    constructor(props: FT.FieldProps, params: FT.FieldParams) {

        this.id = props.id; //  ?? ''
        this.fieldType = params.fieldType;
        this.suffix = props.suffix;

        if (params.value !== undefined) {
            this.value = computeFormValue(params.value);
        } else {
            this.value = computeFormValue(props.value);
        }

        this.origValue = this.value;
        this.required = props.required === true;

        this.updateLabel(props);

        this.validate = props.validate ?? 'off';
        this.isData = props.data === false ? false : true;
    }

    updateLabel(props: FT.FieldProps) {
        if (props.label) {
            this.name = props.label;
            this.tlabel = i18nt(props.label);
        } else if (props.tlabel) {
            this.name = props.tlabel;
            this.tlabel = props.tlabel;
        }
    }

    updateParams(params: FT.FieldParams) {
        if (params.value !== undefined) {
            this.value = computeFormValue(params.value);
        }
    }

    setValue(val: FormValue | undefined | null) {
        this.value = computeFormValue(val);
    }

    passValidation(v: string | undefined | null): boolean {
        if (v === undefined || v === null || v === '') return true;
        if (!this.validate && this.validate === 'off') return true;
        switch (this.validate) {
            case 'integer': if (!validateInteger(v)) return false;
                break;
            case 'positive-integer': if (!validatePositiveInteger(v)) return false;
                break;
            case 'positive-number': if (!validatePositiveDoubleInteger(v)) return false;
                break;
            case 'positive-double-number': if (!validatePositiveDoubleInteger(v)) return false;
                break;
            case 'double-number': if (!validateDoubleInteger(v)) return false;
                break;
            default:
                break;
        }

        return true;
    }
}

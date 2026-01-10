'use client';
import React, { useCallback, useEffect, useState } from 'react';

import {TextField, InputAdornment, IconButton, TextFieldPropsSizeOverrides, TextFieldProps} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import SendIcon from '@mui/icons-material/Send';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import {OverridableStringUnion} from '@mui/types';
import {Property} from 'csstype';

// interface MSearchSlotProps {
//     textField?: TextFieldProps;
// };

interface MSearchProps {
    live?: boolean;

    onSearch: (query: string | undefined) => void;

    minLength?: number;
    delay?: number;

    label?: string;
    placeholder?: string;

    size?: OverridableStringUnion<'small' | 'medium', TextFieldPropsSizeOverrides>;
    width?: Property.Width<number> | undefined;

    // slotProps?: MSearchSlotProps;
}

// const defaultMinLength = 3;

export default function MSearch(props: MSearchProps) {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = React.useState(query);
    const live = !(props.live === false);

    // console.log(live);

    const onChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(event.target.value);
    }, []);

    const onSearchEnter = useCallback(() => {

        let text = query.trim();

        // console.log(props, query);

        //if (text.length === 0 || (props.minLength && text.length >= props.minLength)) {
        if (text.length >= (props.minLength ?? 0)) {
        // console.log(text);
            props.onSearch(text.length > 0 ? text : undefined); // setQuery(event.target.value);
        }
    }, [query]);

    const handleClear = useCallback(() => {
        setQuery('');
        // if (live)
        props.onSearch(undefined);
    }, []);

    useEffect(() => {
        if (!live) return;

        // console.log(query);
        const debounceDelay = props.delay ?? 500;

        if (debounceDelay === 0) {
            setDebouncedQuery(query);
            return;
        }

        // const isTimeout = false;
        const handler = window.setTimeout(() => {
            setDebouncedQuery(query);
        }, debounceDelay); // 500ms debounce delay

        return () => {
            clearTimeout(handler);
        };
    }, [query]);

    useEffect(() => {
        let text = debouncedQuery.trim();
        // console.log(text);
        if (text.length === 0) {
            props.onSearch(undefined);
            return;
        }

        const minLength = props.minLength ?? 0;


        if (text.length >= minLength) {
            props.onSearch(text);
        }
    }, [debouncedQuery, props.onSearch]);

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (live) return;

        if (e.key === 'Enter') {
            e.preventDefault();
            onSearchEnter();
        }
    };

    return (
        <TextField
            // {...props.slotProps?.textField}
            value={query}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder={props.placeholder ?? 'Search...'}
            variant='outlined'
            size={props.size}
            label={props.label}
            slotProps={{
                input: {
                    startAdornment: live && (
                        <InputAdornment position='start'>
                            <SearchIcon />
                        </InputAdornment>
                    ),

                    endAdornment: (
                        <InputAdornment position='end'>
                            <IconButton
                                onClick={handleClear}
                                size='small'
                                sx={{
                                    visibility: query.length > 0 ? 'visible' : 'hidden',
                                }}
                            >
                                <ClearIcon />
                            </IconButton>

                            {!live && (
                                <IconButton size='small' onClick={onSearchEnter}>
                                    <KeyboardReturnIcon />
                                </IconButton>
                            )}
                        </InputAdornment>
                    ),
                },
            }}
            sx={{
                width: props.width,
            }}
        />
    );
}

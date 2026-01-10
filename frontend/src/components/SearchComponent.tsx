import React from 'react';

import {TextField, InputAdornment, IconButton} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import {useTranslation} from 'react-i18next';

interface SeachComponentProps {
    onSearch: (query: string) => void;
}

export default function SearchComponent(props: SeachComponentProps) {
    const [query, setQuery] = React.useState('');
    const {t} = useTranslation();
    const [debouncedQuery, setDebouncedQuery] = React.useState(query);

    const handleChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        // const value = event.target.value.trim();
        // setQuery(value);
        setQuery(event.target.value);
        // props.onSearch(value);
    }, []);

    const handleClear = React.useCallback(() => {
        setQuery('');
        props.onSearch('');
    }, []);

    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 500); // 500ms debounce delay

        return () => {
            clearTimeout(handler);
        };
    }, [query]);

    React.useEffect(() => {
        // if (debouncedQuery.trim()) {
        props.onSearch(debouncedQuery.trim());
        // }
    }, [debouncedQuery, props.onSearch]);

    return (
        <TextField
            value={query}
            onChange={handleChange}
            placeholder={t('Search') + ' ...'}
            variant='outlined'
            slotProps={{
                input: {
                    startAdornment: (
                        <InputAdornment position='start'>
                            <SearchIcon />
                        </InputAdornment>
                    ),

                    endAdornment: query && (
                        <InputAdornment position='end'>
                            <IconButton onClick={handleClear} size='small'>
                                <ClearIcon />
                            </IconButton>
                        </InputAdornment>
                    ),
                },
            }}

            sx={{
                minWidth: 160,
            }}

            // InputProps={{
            //     startAdornment: (
            //         <InputAdornment position='start'>
            //             <SearchIcon />
            //         </InputAdornment>
            //     ),

            //     endAdornment: query && (
            //         <InputAdornment position='end'>
            //             <IconButton onClick={handleClear} size='small'>
            //                 <ClearIcon />
            //             </IconButton>
            //         </InputAdornment>
            //     ),
            // }}
        />
    );
}

'use client';

import {Typography} from '@mui/material';

import PageContents from '@/components/PageContents';
import {getErrorString} from '@/tslib/error';

export default function GlobalError({error, reset}: {error: Error; reset: () => void}) {
    return (
        <PageContents type='public'>
            <Typography variant='h5'>Oops! Something went wrong.</Typography>
            <Typography variant='h6'>{getErrorString(error)}</Typography>
        </PageContents>
        // <div style={{ textAlign: "center", padding: "50px" }}>
        //   <h1>Oops! Something went wrong.</h1>
        //   <p>{error.message}</p>
        //   <button onClick={() => reset()}>Try Again</button>
        // </div>
    );
}

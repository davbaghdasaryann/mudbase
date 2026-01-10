import React from 'react'

import {Dialog, DialogActions, DialogContent, DialogTitle} from '@mui/material'
import {Button, TextField, Typography} from '@mui/material'

interface QuestionProps {
    message: string
    title?: string

    confirmLabel?: string
    rejectLabel?: string

    onResponse: (answer: number) => void
    // onClose: () => void
    // onYes?: () => void

}

export default function QuestionDialog(props: QuestionProps) {

    return (
        <Dialog
            maxWidth='sm'
            fullWidth={true}
            onClose={() => props.onResponse(0)}
            open={true}
            PaperProps={{
                sx: {
                    minHeight: '30vh',
                },
            }}
        >
            <DialogTitle> {props.title} </DialogTitle>

            <DialogContent dividers>
                <Typography> {props.message} </Typography>
            </DialogContent>

            <DialogActions>
           
            <Button variant='contained' autoFocus onClick={() => props.onResponse(1)}>Yes</Button>
            <Button variant='contained' onClick={() => props.onResponse(0)}>No</Button>

            {/* {props.cancelLabel ? <>
                <Button variant='contained' onClick={props.onYes}>Yes</Button>
                <Button variant='contained' autoFocus onClick={props.onClose}>No</Button>
            </> : <>
                <Button variant='contained' autoFocus onClick={props.onClose}>Cencel</Button>
            </> } */}
            </DialogActions>
        </Dialog>
    )
}

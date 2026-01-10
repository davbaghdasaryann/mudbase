import {IconButton} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

interface Props {
    onClose?: () => void
}

export default function DialogCloseButton(props: Props) {
    return (
        <IconButton
            aria-label='close'
            onClick={props.onClose}
            sx={{
                position: 'absolute',
                right: 8,
                top: 8,
            }}
        >
            <CloseIcon />
        </IconButton>
    )
}
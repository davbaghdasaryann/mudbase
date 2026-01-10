import {IconButton, IconButtonProps} from '@mui/material';


interface IconActionButtonProps extends Omit<IconButtonProps, 'children'> {
    icon: React.ElementType;
}

export default function ToolbarActionIcon({ icon: Icon, ...buttonProps }: IconActionButtonProps) {
    return <IconButton size='large' edge='end' color='inherit' {...buttonProps}>
        <Icon />
    </IconButton>
}

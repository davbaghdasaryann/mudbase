import {makeSxProps, SxPropsParam} from './Mui/SxPropsUtil'
import ImgElement from './DomElements/ImgElement'



interface Props {
    //show?: boolean
    src?: string
    alt?: string
    
    width?: number
    height?: number
    draggable?: boolean
    sx?: SxPropsParam
}

export default function PageImage(props: Props) {
    //if (props.show === false) return <></>

    let width = props.width
    let height = props.height
    let sxWidth: number | undefined = undefined
    let sxHeight: number | undefined = undefined

    let sxProps = makeSxProps(props.sx)

    for (let sx of sxProps) {
        if (!sx) continue

        sxWidth = sx['width'] ?? sxWidth
        sxHeight = sx['height'] ?? sxHeight
    }

    // Remove from passing these parameters if they were already given in sx prop
    sxWidth = sxWidth ? undefined : width
    sxHeight = sxHeight ? undefined : height

    return (
        <ImgElement
            src={props.src}
            alt={props.alt ?? props.src}
            draggable={props.draggable === true ? 'true' : 'false'}
            // width={props.width}
            // height={props.height}
            sx={[
                ...sxProps,
                {
                    width: sxWidth,
                    height: sxHeight,
                },
            ]}
        />
    )
}

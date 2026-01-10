
interface CloseObject<T = any> {
    cb: (obj: any) => void  // Callback
    p: any  // Parameters
}

export type CloseVoidFunc = () => void
export type CloseBoolFunc = (b: boolean) => void
export type CloseNullFunc = (b: null) => void

// interface ClosePropsObject<T = any> {
//     param: any
//     cb: (param: T) => void
// }


export interface ModalCloseProps<T = any> {
    onClose?: () => void
    onCloseFalse?: (p: boolean) => void
    onCloseNull?: (p: null) => void

    onCloseObj?: CloseObject<T>
}



export function handleModalClose<T = any>(props: ModalCloseProps<T> | undefined) {
    if (props === undefined) return

    props.onClose && props.onClose()
    props.onCloseFalse && props.onCloseFalse(false)
    props.onCloseNull && props.onCloseNull(null)
    props.onCloseObj && props.onCloseObj.cb(props.onCloseObj.p)
}

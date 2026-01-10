
export function uiGetPixelValue(val: number | undefined | null) {
    if (val === undefined || val === null)
        return undefined
    return `${val}px`
}

export function uiGetWidthValue(val: number | undefined | null) {
    if (val === undefined || val === null)
        return undefined

    if (val <= 1)
        return `${val * 100}%`
        
    return `${val}px`
}

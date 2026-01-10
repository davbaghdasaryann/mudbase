
export interface ComponentViewActionNav<El> {
    href?: string
    getHref?: (el: El) => string | undefined | null
    target?: string
    getTarget?: (el: El) => string | undefined | null
}

export type ComponentActionCallback<El> = (el: El) => void

export type ComponentViewAction<El = any> = ComponentViewActionNav<El> | ComponentActionCallback<El> | undefined | null



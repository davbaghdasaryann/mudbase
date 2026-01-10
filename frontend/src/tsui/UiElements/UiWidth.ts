import * as CSS from 'csstype'

export class UiWidth {
    val?: number

    px() {
        return this.val === undefined ? '' : `${this.val}px`
    }

    get() {
        return this.val
    }

    css() {
        return this.get() as CSS.Property.Width
    }
}

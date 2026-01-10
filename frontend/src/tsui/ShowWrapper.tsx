import React from 'react'


interface Props<CompProps> {
    show?: any

    impl: React.JSXElementConstructor<any>
    props: CompProps
}

export default function ShowWrapper<CompProps>(props: Props<CompProps>) {
    if (props.show === undefined || props.show === null || props.show === false) {
        return <></>
    }

    const Element = props.impl
    return <Element {...props.props}></Element>
}

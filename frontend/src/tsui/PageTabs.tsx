import React from 'react'

import {Box, Stack, Tab, Tabs} from '@mui/material'


interface TabsProps<Value = string> {
    tabs: PageTabElement<Value>[]

    start?: Value
    defaultComponent?: React.ReactNode
}

interface PageTabElement<Value = string> {
    value: Value
    label?: string
    tlabel?: string
    component: React.ReactNode
    initial?: boolean
}



export default function PageTabs<Value = string>(props: TabsProps<Value>) {
    const [state] = React.useState(prepareTabsState<Value>(props))
    const [currTab, setCurrTab] = React.useState(state.initial)

    const onTabChange = React.useCallback((evt, value) => {
        // console.log(value)
        setCurrTab(value)
    }, [])

    return (
        <Stack direction='column' spacing={1} sx={{width: 1}}>
            <Tabs
                value={currTab}
                onChange={onTabChange}
                orientation='horizontal'
                centered={true}
                sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                }}
            >
                {state.tabs.map((tab, index) => (
                    <Tab key={index} value={tab.value} label={tab.tlabel}/>
                ))}
            </Tabs>

            <PageTabSwitch currTab={currTab} state={state}/>
        </Stack>
    )

}


interface PropsSwitch<Tag> {
    currTab: Tag
    state: TabsState<Tag>
}

function PageTabSwitch<Tag>(props: PropsSwitch<Tag>) {
    let tab = props.state.tabsMap.get(props.currTab)

    return tab ? <>{tab.component}</> : <></>
}


interface TabsState<Tag> {
    tabs: PageTabElement<Tag>[]
    initial: Tag
    tabsMap: Map<Tag, PageTabElement<Tag>>
}

export function prepareTabsState<Tag>(props: TabsProps<Tag>): TabsState<Tag> {

    let els: PageTabElement<Tag>[] = []
    let map = new Map<Tag, PageTabElement<Tag>>()
    let initial: Tag | undefined = undefined

    for (let tab of props.tabs) {
        let el: PageTabElement<Tag> = {
            value: tab.value,
            tlabel: tab.tlabel ?? tab.label,
            component: tab.component,
        }

        els.push(el)
        map.set(el.value, el)

        if (tab.initial === true) initial = tab.value
    }

    if (props.start) initial = props.start
    if (!initial) initial = els[0].value

    return {
        tabs: els,
        tabsMap: map,
        initial: initial,
    }
}

"use client";

import React from 'react'

export type HookDeps = ReadonlyArray<unknown>

export const makeHookDepsParm = (deps?: HookDeps) => (deps ? deps : [])

export type TextChangeEvent = React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
export type FormEvent = React.FormEvent<HTMLFormElement>


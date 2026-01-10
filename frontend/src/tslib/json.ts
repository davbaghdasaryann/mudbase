import fs from 'fs'

export interface WriteJsonOptions {
    indent?: number
}

export function writeJson<T>(filename: string, obj: T, options?: WriteJsonOptions) {
    let indent = options?.indent ?? 0
    let data = JSON.stringify(obj, null, indent)
    fs.writeFileSync(filename, data)
}

export interface LoadJsonOptions {
    ignoreNotExist?: boolean
    ignoreError?: boolean
}

export function readJson<T>(filename: string, options?: LoadJsonOptions): T | null {
    let ignoreError = options?.ignoreError === true
    let ignoreNotExist = ignoreError || options?.ignoreNotExist === true
    let obj: T | null = null

    if (!fs.existsSync(filename)) {
        if (ignoreNotExist) return obj
        throw new Error('File not exist: ' + filename)
    }

    try {
        let json = fs.readFileSync(filename, 'utf-8')
        obj = JSON.parse(json) as T
    } catch (err) {
        if (ignoreError) return null
        throw err
    }

    return obj
}

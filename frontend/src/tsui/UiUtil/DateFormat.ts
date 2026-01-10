interface FormatParams {
    type?: string
}

export function formatDate(date: Date | undefined | null, params?: FormatParams) {
    if (!date) return '01/01/1975'


    let locales = 'en'

    let dateOpts:  Intl.DateTimeFormatOptions = {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit',
    }

    let timeOpts:  Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
    }

    // let options:  Intl.DateTimeFormatOptions = {

    //     //year: '2-digit',
    // }

    switch (params?.type) {
    case 'date': return date.toLocaleDateString(locales, dateOpts)
    case 'time': return date.toLocaleTimeString(locales, timeOpts)
    //case 'datetime': return date.toLocaleString(locales, {...dateOpts, ...timeOpts})
    default:
        break
    }

    return date.toLocaleString(locales, {...dateOpts, ...timeOpts})    

    //return date.toLocaleString()
}

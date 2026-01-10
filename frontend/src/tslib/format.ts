import moment from 'moment';

var dateFormat = 'YYYY-MM-DD';

export function formatDate(date: Date) {
    return moment(date).format(dateFormat);
}


export function formatDateYYYYMMDD(date: Date | undefined) {
    if (date === undefined) return undefined;
    // return date.toISOString().split('T')[0]; 
    return moment(date).format('YYYY-MM-DD');
}


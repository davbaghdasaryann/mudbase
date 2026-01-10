
export function sleepMSec(millis: number) {
    return new Promise((resolve) => setTimeout(resolve, millis))
}

export function sleepSec(sec: number) {
    return sleepMSec(sec * 1000);
}

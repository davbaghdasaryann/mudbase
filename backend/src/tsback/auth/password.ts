import bcrypt from 'bcrypt'

export function encodePassword(password: string) {
    return bcrypt.hashSync(password, 10)
}

// export function encodeUserPassword(user: Db.EntityUser) {
//     // user.passwordPlain = user.password;
//     // user.password = encodePassword(user.passwordPlain!);
// }

export function verifyPassword(password: string, encrypted: string) {
    return bcrypt.compareSync(password, encrypted);
}

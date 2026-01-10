import { Request, NextFunction, Response } from 'express';
import bcrypt from 'bcrypt';

import * as Db from '../db';
import { DbInsertParams } from '@tsback/mongodb/mongodb_params';
import { verify } from '@tslib/verify';
import { validateEmail } from '@tslib/validate';
import { requireQueryParam } from '@tsback/req/req_params';
import { hashPassword } from './authjs_lib';


// export interface CreateUserParams {
//     email: string;
//     password?: string;
// }

export async function authjsSignUp(req: Request, res: Response) {

    try {
        // log_.info(req.body);

        let email = requireQueryParam(req, 'email');
        let password = requireQueryParam(req, 'password');


        verify(validateEmail(email), req.t('auth.invalid_email'));

        let parm = new DbInsertParams<Db.EntityUser>(req, {
            query: ['firstName', 'lastName', 'email', 'phoneNumber', 'access'],
        });

        let user = parm.getObject();
        user.email = email;
        user.password = password;
        user.firstName = req.body.firstName;
        user.lastName = req.body.lastName;
        user.accountId = req.body.accountId;
        user.isActive = false;

        // req.body.roles = "ARCHITECT"
        // let rolesList = req.body.roles.split(',');
        let permissions = new Set<string>();
        // let permissions:string[] = [];

        user.permissions = Array.from(permissions).join(','); //req.body.permissions;

        await authjsCreateUser(user);

        res.status(201).json({
            message: 'User created successfully',
            // userId: newUser.id,
        });

    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: "Server Error" });
        }
    }
}



export async function authjsCreateUser(user: Db.EntityUser, alreadyHashed: boolean = false) {
    let users = Db.getUsersCollection();

    let existingUser = (await users.findOne({ email: user.email })) as Db.EntityUser;

    verify(!existingUser, "User already exists");

    if (!alreadyHashed && user.password) {
        user.password = await hashPassword(user.password!);
    }
    
    await users.insertOne(user);
}



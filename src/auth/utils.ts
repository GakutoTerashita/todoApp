import { IVerifyOptions } from "passport-local";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

declare global {
    namespace Express {
        interface User {
            id: string;
            hashed_password: string;
            created_at: string;
            is_admin: boolean;
        }
    }
}

export class AuthenticateUtil {
    private _prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this._prisma = prisma;
    }

    authenticateUser = async (
        username: string,
        password: string,
        cb: ((error: any, user?: Express.User | false, options?: IVerifyOptions) => void)
    ): Promise<((error: any, user?: Express.User | false, options?: IVerifyOptions) => void) | void> => {
        console.log('Authenticating attempt for user:', username);

        try {
            // Find user by username
            const user = await this._prisma.users.findUnique({
                where: { id: username },
            });
            // Tbh I want to resolve error handling more earlier. Possible failure is only database connection or query issues.
            // Are there any ways to reduce the length of this try-catch block?

            // If user not found, return an error
            if (!user) {
                console.warn('No user found with the provided username:', username);
                return cb(null, false, { message: 'Incorrect username.' });
            }

            // Compare provided password with stored hashed password
            bcrypt.compare(
                password,
                user.hashed_password,
                (err: any, isMatch: boolean) => {
                    if (err) {
                        console.error('Error comparing passwords:', err);
                        return cb(err);
                    } else if (!isMatch) {
                        console.warn('Incorrect password for user:', username);
                        return cb(null, false, { message: 'Incorrect password.' });
                    } else {
                        return cb(null, {
                            id: user.id,
                            hashed_password: user.hashed_password,
                            created_at: user.created_at ? user.created_at.toISOString() : '',
                            is_admin: user.is_admin || false,
                        });
                    }
                });
        } catch (error) {
            console.error('Error during user authentication:', error);
            return cb(error);
        }
        console.log('User authenticated successfully:', username);
    };

    userSerializer = (user: Express.User, cb: (error: any, id?: string) => void): void => {
        console.log('Serializing user:', user.id);
        cb(null, user.id);
    };

    userDeserializer = async (
        id: string,
        cb: (error: any, user?: Express.User | null) => void
    ): Promise<void> => {
        console.log('Deserializing user with ID:', id);
        try {
            const user = await this._prisma.users.findUnique({
                where: { id },
            });

            if (!user) {
                console.warn('User not found during deserialization:', id);
                return cb(null, null);
            }

            cb(null, {
                id: user.id,
                hashed_password: user.hashed_password,
                created_at: user.created_at ? user.created_at.toISOString() : '',
                is_admin: user.is_admin || false,
            });
        } catch (error) {
            console.error('Error during user deserialization:', error);
            cb(error);
        }
    };

    createUser = async (
        username: string,
        password: string,
        is_admin: boolean,
    ): Promise<Express.User | Error> => {
        console.log('Creating user:', username, 'is_admin:', is_admin);
        // Test returing Error
        // if (username === 'test' && password === 'test') {
        //     return new Error('Test user creation error');
        // }

        if (!username || !password) {
            console.error('Username and password are required for user creation.');
            return new Error('Username and password are required.');
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await this._prisma.users.create({
                data: {
                    id: username,
                    hashed_password: hashedPassword,
                    is_admin: is_admin || false,
                },
            });
            console.log('User created successfully:', user.id);
            return {
                id: user.id,
                hashed_password: user.hashed_password,
                created_at: user.created_at ? user.created_at.toISOString() : '',
                is_admin: user.is_admin || false,
            };
        } catch (error) {
            console.error('Error creating user:', error);
            return new Error('An error occurred during user creation.');
        }
    }
}

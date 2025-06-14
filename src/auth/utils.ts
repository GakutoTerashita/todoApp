import { IVerifyOptions, VerifyFunction } from "passport-local";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { prisma } from "../prisma-client";
import { fetchUserByUsername } from "../db/control";

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

class AuthenticateUtil {
    private _prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this._prisma = prisma;
    }

    authenticateUser = async (
        username: string,
        password: string,
        cb: Parameters<VerifyFunction>[2]
    ): Promise<void> => {
        console.log('Authenticating attempt for user:', username);

        let user: Express.User | null = null;

        user = await fetchUserByUsername(username);
        if (!user) {
            console.warn('No user found with the provided username:', username);
            return cb(null, false, { message: 'Incorrect username.' });
        }

        const isMatch = await this._comparePasswordAsync(password, user.hashed_password);
        if (!isMatch) {
            console.warn('Incorrect password for user:', username);
            return cb(null, false, { message: 'Incorrect password.' });
        }

        console.log('User authenticated successfully:', username);
        cb(null, {
            id: user.id,
            hashed_password: user.hashed_password,
            created_at: user.created_at || '',
            is_admin: user.is_admin || false,
        });
    };

    // Helper method to promisify bcrypt.compare
    private _comparePasswordAsync(password: string, hash: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, hash, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    userSerializer = (user: Express.User, cb: (error: any, id?: string) => void): void => {
        console.log('Serializing user:', user.id);
        cb(null, user.id);
    };

    userDeserializer = async (
        id: string,
        cb: (error: any, user?: Express.User | null) => void
    ): Promise<void> => {
        console.log('Deserializing user with ID:', id);
        const user = await this._prisma.users.findUnique({
            where: { id },
        }).catch((error) => {
            console.error
            cb(error);
        })

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
    };

    createUser = async (
        username: string,
        password: string,
        is_admin: boolean,
    ): Promise<Express.User> => {
        console.log('Creating user:', username, 'is_admin:', is_admin);
        // Test returing Error
        // if (username === 'test' && password === 'test') {
        //     return new Error('Test user creation error');
        // }

        if (!username || !password) {
            console.error('Username and password are required for user creation.');
            throw new Error('Username and password are required.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await this._prisma.users.create({
            data: {
                id: username,
                hashed_password: hashedPassword,
                is_admin: is_admin || false,
            },
        }).catch((error) => {
            console.error('Error creating user in database:', error);
            throw new Error('Database error during user creation.');
        });

        console.log('User created successfully:', user.id);
        return {
            id: user.id,
            hashed_password: user.hashed_password,
            created_at: user.created_at ? user.created_at.toISOString() : '',
            is_admin: user.is_admin || false,
        };
    }
}

export const authUtils = new AuthenticateUtil(prisma);
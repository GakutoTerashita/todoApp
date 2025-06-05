import express, { Router } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

declare global {
    namespace Express {
        interface User {
            id: string;
            hashed_password: string;
            created_at: string;
            is_admin?: boolean;
        }
    }
}

export const authRoutes = (prisma: PrismaClient): Router => {
    const router = express.Router();

    const strategy = new LocalStrategy(async (username, password, cb) => {
        console.log('Authenticating attempt for user:', username);
        try {
            const user = await prisma.users.findUnique({
                where: { id: username },
            });

            if (!user) {
                console.warn('No user found with the provided username:', username);
                return cb(null, false, { message: 'Incorrect username.' });
            }

            bcrypt.compare(password, user.hashed_password, (err, isMatch) => {
                if (err) {
                    console.error('Error comparing passwords for user:', username);
                    console.error('Error comparing passwords:', err);
                    return cb(err);
                }
                if (!isMatch) {
                    console.warn('Incorrect password for user:', username);
                    return cb(null, false, { message: 'Incorrect password.' });
                }
                return cb(null, {
                    id: user.id,
                    hashed_password: user.hashed_password,
                    created_at: user.created_at ? user.created_at.toISOString() : '',
                });
            });
        } catch (error) {
            console.error('Error during user authentication:', error);
            return cb(error);
        }
        console.log('User authenticated successfully:', username);
    });

    passport.use(strategy);

    passport.serializeUser<string>((user, cb) => {
        cb(null, user.id);
    });

    passport.deserializeUser<string>(async (id, cb) => {
        try {
            const user = await prisma.users.findUnique({
                where: { id },
            });

            if (!user) {
                return cb(new Error('User not found'));
            }
            cb(null, {
                id: user.id,
                hashed_password: user.hashed_password,
                created_at: user.created_at ? user.created_at.toISOString() : '',
            });
        } catch (error) {
            console.error('Error during user deserialization:', error);
            cb(error);
        }
    });

    router.post("/login",
        passport.authenticate(
            strategy,
            {
                successRedirect: '/todo',
                failureRedirect: '/auth',
                failureFlash: true,
                successFlash: 'You have successfully logged in.',
            },
        ),
        (req, res, next) => {
            console.log('Login attempt for user:', req.body.id);
            next();
        }
    );

    router.post("/logout", (req, res) => {
        req.logout((err) => {
            if (err) {
                console.error('Error during logout:', err);
                return res.redirect('/auth');
            }
            req.flash('success', 'You have been logged out successfully.');
            res.redirect('/auth');
        });
    });

    router.post("/register", async (req, res) => {
        const {
            username,
            password,
            is_admin
        }: {
            username: string;
            password: string;
            is_admin?: boolean;
        } = req.body;

        if (!username || !password) {
            req.flash('error', 'Username and password are required.');
            return res.redirect('/auth');
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await prisma.users.create({
                data: {
                    id: username,
                    hashed_password: hashedPassword,
                    is_admin: is_admin || false,
                },
            });

            if (user) {
                req.flash('success', 'Registration successful. You can now log in.');
                return res.redirect('/auth');
            } else {
                req.flash('error', 'Registration failed. Please try again.');
                return res.redirect('/auth');
            }
        } catch (error) {
            console.error('Error during registration:', error);
            req.flash('error', 'An error occurred during registration. Please try again.');
            return res.redirect('/auth');
        }
    });

    router.get("/", async (req, res) => {
        res.render('auth.ejs', {
            success: req.flash('success'),
            error: req.flash('error'),
        });
    });

    return router;
};
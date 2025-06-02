import express, { Router } from "express";
import { DbController } from "../db/control";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import bcrypt from "bcrypt";

declare global {
    namespace Express {
        interface User extends RowDataPacket {
            id: string;
            hashed_password: string;
            created_at: string;
        }
    }
}

export const authRoutes = (dbController: DbController): Router => {
    const router = express.Router();

    const strategy = new LocalStrategy(async (username, password, cb) => {
        console.log('Authenticating attempt for user:', username);
        try {
            const [row, _] = await dbController.dbConnection.query<Express.User[]>('SELECT * FROM users WHERE id = ?', [username]);
            if (!Array.isArray(row) || row.length === 0) {
                console.warn('No user found with the provided username:', username);
                return cb(null, false, { message: 'Incorrect username.' });
            }

            bcrypt.compare(password, row[0].hashed_password, (err, isMatch) => {
                if (err) {
                    console.error('Error comparing passwords for user:', username);
                    console.error('Error comparing passwords:', err);
                    return cb(err);
                }
                if (!isMatch) {
                    console.warn('Incorrect password for user:', username);
                    return cb(null, false, { message: 'Incorrect password.' });
                }
                return cb(null, row[0]);
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
            const [row, _] = await dbController.dbConnection.query<Express.User[]>('SELECT * FROM users WHERE id = ?', [id]);
            const user = row[0];
            if (!user) {
                return cb(new Error('User not found'));
            }
            cb(null, user);
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
        const { username, password } = req.body;
        if (!username || !password) {
            req.flash('error', 'Username and password are required.');
            return res.redirect('/auth');
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const [result, _] = await dbController.dbConnection.query<ResultSetHeader>(
                'INSERT INTO users (id, hashed_password) VALUES (?, ?)',
                [username, hashedPassword]
            );
            if (result.affectedRows > 0) {
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
        })
    });

    return router;
}
import express, { Router } from "express";
import { DbController } from "../db/control";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import flash from "connect-flash";
import { RowDataPacket } from "mysql2";
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

export const authRoutes = (dbController: DbController, sessionOption: session.SessionOptions): Router => {
    const router = express.Router();

    router.use(session(sessionOption));
    router.use(passport.initialize());
    router.use(passport.session());
    router.use(flash());

    router.post("/login", passport.authenticate('local', {
        successRedirect: '/todo',
        failureRedirect: '/auth',
        failureFlash: true,
    }));

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

    passport.use(new LocalStrategy(async function verify(id, password, cb) {
        try {
            const [row, _] = await dbController.dbConnection.query<Express.User[]>('SELECT * FROM users WHERE id = ?', [id]);
            if (!Array.isArray(row) || row.length === 0) {
                return cb(null, false, { message: 'Incorrect username.' });
            }

            bcrypt.compare(password, row[0].hashed_password, (err, isMatch) => {
                if (err) {
                    console.error('Error comparing passwords:', err);
                    return cb(err);
                }
                if (!isMatch) {
                    return cb(null, false, { message: 'Incorrect password.' });
                }
                return cb(null, row[0]);
            });
        } catch (error) {
            console.error('Error during user authentication:', error);
            return cb(error);
        }
    }));
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

    router.get("/", async (req, res) => {
        res.render('auth.ejs', {
            success: req.flash('success'),
            error: req.flash('error'),
        })
    });

    return router;
}
import express, { Router } from "express";
import { DbController } from "../db/control";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import flash from "connect-flash";

export const authRoutes = (dbController: DbController, sessionOption: session.SessionOptions): Router => {
    const router = express.Router();

    router.use(session(sessionOption));
    router.use(passport.initialize());
    router.use(passport.session());
    router.use(flash());

    router.post("/login", passport.authenticate('local', {
        successRedirect: '/todo',
        failureRedirect: '/auth',
    }));

    passport.use(new LocalStrategy({
        usernameField: 'id',
        passwordField: 'password',
        session: true,
        passReqToCallback: false,

    }, async (input_id, input_password, done) => {
        try {
            const result = await dbController.dbConnection.query('SELECT * FROM users WHERE id = ?', [input_id]);
            const login_data = result[0];
            if (!login_data) {
                return done(null, false, { message: 'User not found' });
            }
            if ((login_data as any).password !== input_password) {
                return done(null, false, { message: 'Incorrect password' });
            }
            return done(null, login_data);
        } catch (error) {
            console.error('Error during user authentication:', error);
            return done(null, false, { message: 'Database error' });
        }
    }));
    passport.serializeUser((user: any, done) => {
        done(null, user.id);
    });
    passport.deserializeUser(async (id, done) => {
        try {
            const result = await dbController.dbConnection.query('SELECT * FROM users WHERE id = ?', [id]);
            const user = result[0];
            if (!user) {
                return done(new Error('User not found'));
            }
            done(null, user);
        } catch (error) {
            console.error('Error during user deserialization:', error);
            done(error);
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
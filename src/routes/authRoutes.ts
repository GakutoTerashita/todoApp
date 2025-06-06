import express, { Router } from "express";
import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { AuthenticateUtil } from "../auth/utils";

export const authRoutes = (prisma: PrismaClient): Router => {
    const router = express.Router();

    const authUtils = new AuthenticateUtil(prisma);
    const strategy = new LocalStrategy(authUtils.authenticateUser);

    passport.use(strategy);
    passport.serializeUser<string>(authUtils.userSerializer);
    passport.deserializeUser<string>(authUtils.userDeserializer);

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
            is_admin_raw,
        }: {
            username: string;
            password: string;
            is_admin_raw: string;
        } = req.body;
        const is_admin = is_admin_raw === 'true';

        // Try to create a new user
        const userMaybe = await authUtils.createUser(username, password, is_admin).catch((err) => {
            console.error('Error creating user:', err);
        });

        if (!userMaybe) {
            req.flash('error', 'An error occurred while creating the user. Please try again.');
            return res.redirect('/auth');
        }

        // If user creation was successful, redirect to the auth page with a success message
        req.flash('success', 'Registration successful. You can now log in.');
        return res.redirect('/auth');
    });

    router.get("/", async (req, res) => {
        res.render('auth.ejs', {
            success: req.flash('success'),
            error: req.flash('error'),
        });
    });

    return router;
};
import express, { Router } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { authUtils } from "../../auth/utils";
import { logoutHandler, registerHandler } from "./authRouteHandlers";

export const authRoutes = (): Router => {
    const router = express.Router();

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
    router.post("/logout", logoutHandler);
    router.post("/register", registerHandler);
    router.get("/", async (req, res) => {
        res.render('auth.ejs', {
            success: req.flash('success'),
            error: req.flash('error'),
        });
    });

    return router;
};
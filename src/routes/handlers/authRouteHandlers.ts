import { Request, Response } from "express";

export const logoutHandler = (
    req: Request,
    res: Response,
) => {
    req.logout((err) => {
        if (err) {
            console.error('Error during logout:', err);
            return res.redirect('/auth');
        }
        req.flash('success', 'You have been logged out successfully.');
        res.redirect('/auth');
    });
}
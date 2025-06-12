import { Request, Response } from "express";
import { authUtils } from "../../auth/utils";

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

export const registerHandler = async (
    req: Request,
    res: Response,
) => {
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

    try {
        await authUtils.createUser(username, password, is_admin);
    } catch (err) {
        console.error('Error creating user:', err);
        req.flash('error', 'An error occurred while creating the user. Please try again.');
        return res.redirect('/auth');
    } finally {
        req.flash('success', 'Registration successful. You can now log in.');
        res.redirect('/auth');
    }
}
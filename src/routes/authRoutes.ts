import express, { Router } from "express";
import { DbController } from "../db/control";

export const authRoutes = (dbController: DbController): Router => {
    const router = express.Router();

    router.get("/", async (req, res) => {
        res.render('auth.ejs')
    });

    return router;
}
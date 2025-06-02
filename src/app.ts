import express from 'express';
import path from 'path';
import session from 'express-session';
import flash from 'connect-flash';
import dotenv from 'dotenv';
import { todoRoutes } from './routes/todoRoutes';
import { DbController } from './db/control';
import { authRoutes } from './routes/authRoutes';
import passport from 'passport';
import cookieParser from 'cookie-parser';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const app = express();

async function main() {
    const PORT = process.env.PORT || 3000;
    const dbController = await DbController.connect();
    dbController.installTables();

    const sessionOption: session.SessionOptions = {
        secret: process.env.SESSION_SECRET || 'defaultShouldNotBeUsedInProduction',
        saveUninitialized: true,
        resave: false,
        cookie: {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24, // 1 day
        },
    };
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(path.join(__dirname, '../public')));
    app.use(cookieParser());
    app.use(session(sessionOption));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));

    app.get('/', (req, res) => {
        res.redirect('/todo');
    });
    app.use('/todo', todoRoutes(dbController));
    app.use('/auth', authRoutes(dbController));

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

main().catch((error) => {
    console.error('Error in main function:', error);
    process.exit(1);
});

export default app;
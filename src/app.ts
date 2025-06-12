import express from 'express';
import path from 'path';
import flash from 'connect-flash';
import dotenv from 'dotenv';
import expressSession from 'express-session';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { prisma } from './prisma-client'; // Adjust the import path as necessary
import { todoRoutes } from './routes/todo/todoRoutes';
import { authRoutes } from './routes/auth/authRoutes';
import errorHandler from './middlewares/errorHandler';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const app = express();

async function main() {
    const PORT = process.env.PORT || 3000;

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(path.join(__dirname, '../public')));
    app.use(cookieParser());
    app.use(
        expressSession({
            cookie: {
                httpOnly: true,
                maxAge: 1000 * 60 * 60 * 24, // 1 day
            },
            secret: process.env.SESSION_SECRET || 'defaultShouldNotBeUsedInProduction',
            saveUninitialized: true,
            resave: false,
            store: new PrismaSessionStore(
                prisma,
                {
                    checkPeriod: 2 * 60 * 1000, // 2 minutes
                    dbRecordIdIsSessionId: true,
                    dbRecordIdFunction: undefined, // Use default function
                }
            ),
        })
    );
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));

    app.get('/', (req, res) => {
        res.redirect('/todo');
    });
    app.use('/todo', todoRoutes());
    app.use('/auth', authRoutes());

    app.use(errorHandler);

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

main().catch((error) => {
    console.error('Error in main function:', error);
    process.exit(1);
});

export default app;
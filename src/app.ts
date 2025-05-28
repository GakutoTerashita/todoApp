import express from 'express';
import path from 'path';
import { v4 } from 'uuid';
import session from 'express-session';
import flash from 'connect-flash';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const connectDb = async (): Promise<mysql.Connection> => {
    try {
        return await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'todoApp',
            port: parseInt(process.env.DB_PORT || '3306', 10),
        });
    } catch (error) {
        console.error('Database connection failed:', error);
        throw error;
    }
};

const createTables = async (dbConnection: mysql.Connection) => {
    try {
        await dbConnection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) PRIMARY KEY,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await dbConnection.query(`
            CREATE TABLE IF NOT EXISTS todo_items (
                id VARCHAR(36) PRIMARY KEY,
                name TEXT NOT NULL,
                done BOOLEAN DEFAULT FALSE
            );
        `);
        return dbConnection;
    } catch (error) {
        console.error('Failed to create tables:', error);
        throw error;
    }
};

const fetchTodoItems = async (dbConnection: mysql.Connection): Promise<TodoListItem[]> => {
    try {
        const [rows] = await dbConnection.query('SELECT * FROM todo_items');

        if (!Array.isArray(rows) || rows.length === 0) {
            return [];
        }

        return rows.map((row: any) => {
            const listItem = row as TodoListItem;
            return listItem;
        });
    } catch (error) {
        console.error('Failed to fetch todo items:', error);
        throw error; // TODO: Handle this error appropriately in your application
    }
};

class TodoListItem {
    id: string;
    name: string;
    done: boolean = false;

    constructor(name: string, id: string) {
        this.id = id;
        this.name = name;
    }
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'defaultShouldNotBeUsedInProduction',
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24, // 1 day
    }
}));
app.use(flash());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


connectDb().then(createTables).then((dbConnection) => {
    app.get('/', (req, res) => {
        const items = (async () => {
            try {
                return await fetchTodoItems(dbConnection)
            } catch (error) {
                req.flash('error', 'Failed to fetch items from the database');
                console.error('Error fetching items:', error);
                return [];
            }
        })();
        res.render('home', { 
            title: 'Home',
            items,
            success: req.flash('success'),
            error: req.flash('error'),
        });
    });

    app.post('/items/delete/:id', (req, res) => {
        const itemId = req.params.id;
        items = items.filter(item => item.id !== itemId);
        req.flash('success', 'Removed item successfully');
        res.redirect('/'); 
    });

    app.post('/items/complete/:id', (req, res) => {
        const itemId = req.params.id;
        items = items.map(item => item.id === itemId ? { ...item, done: !item.done } : item);
        req.flash('success', 'Changed item status successfully');
        res.redirect('/'); 
    });

    app.post('/items/register', (req, res) => {
        const { name } = req.body;

        if (!name) {
            req.flash('error', 'Item name is required');
            res.redirect('/');
            return;
        }

        const uuid = v4();
        items.push(new TodoListItem(name, uuid));
        req.flash('success', 'Item added successfully');
        res.redirect('/');
    });

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}).catch((error) => {
    console.error('Failed to start the server:', error);
    process.exit(1);
});

export default app;
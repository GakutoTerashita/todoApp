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

class TodoListItem {
    id: string;
    name: string;
    done: boolean;

    constructor(name: string, id: string, done: boolean) {
        this.id = id;
        this.name = name;
        this.done = done;
    }
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

const createTables = async (dbConnection: mysql.Connection): Promise<mysql.Connection> => {
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

        return rows.map((row: any) => new TodoListItem(row.name, row.id, row.done)); // TODO: any
    } catch (error) {
        console.error('Failed to fetch todo items:', error);
        throw error;
    }
};

const removeTodoItem = async (dbConnection: mysql.Connection, itemId: string): Promise<void> => {
    try {
        await dbConnection.query('DELETE FROM todo_items WHERE id = ?', [itemId]);
        return;
    }
    catch (error) {
        console.error('Failed to remove todo item:', error);
        throw error;
    }
}

const completeTodoItem = async (dbConnection: mysql.Connection, itemId: string): Promise<void> => {
    try {
        await dbConnection.query('UPDATE todo_items SET done = NOT done WHERE id = ?', [itemId]);
        return;
    } catch (error) {
        console.error('Failed to change complete state of todo item:', error);
        throw error;
    }
};

const registerTodoItem = async (dbConnection: mysql.Connection, item: TodoListItem): Promise<void> => {
    try {
        await dbConnection.query(
            'INSERT INTO todo_items (id, name, done) VALUES (?, ?, ?)',
            [item.id, item.name, item.done]
        );
        return;
    }
    catch (error) {
        console.error('Failed to register todo item:', error);
        throw error;
    }
};

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'defaultShouldNotBeUsedInProduction',
    saveUninitialized: true,
    resave: false,
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
        fetchTodoItems(dbConnection)
            .then((items) => {
                res.render('home', { 
                    title: 'Home',
                    items,
                    success: req.flash('success'),
                    error: req.flash('error'),
                });
            })
            .catch((error) => {
                console.error('Error fetching todo items:', error);
                // req.flash('error', 'Failed to fetch todo items');
                res.redirect('/error'); // TODO: Create an database fetch error page
            });
    });

    app.get('/error', (req, res) => {
        res.send('error'); // TODO: Create an error page
    });

    app.post('/items/delete/:id', (req, res) => {
        const itemId = req.params.id;
        if (!itemId) {
            req.flash('error', 'Item ID is required');
            res.redirect('/');
            return;
        }
        removeTodoItem(dbConnection, itemId)
            .then(() => {
                req.flash('success', 'Removed item successfully');
                res.redirect('/'); 
            })
            .catch((error) => {
                req.flash('error', 'Failed to remove item');
                console.error('Error removing item:', error);
                res.redirect('/');
            });
    });

    app.post('/items/complete/:id', (req, res) => {
        const itemId = req.params.id;
        if (!itemId) {
            req.flash('error', 'Item ID is required');
            res.redirect('/');
            return;
        }
        completeTodoItem(dbConnection, itemId)
            .then(() => {
                req.flash('success', 'Changed item status successfully');
                res.redirect('/'); 
            })
            .catch((error) => {
                req.flash('error', 'Failed to change item status');
                console.error('Error changing item status:', error);
                res.redirect('/');
            });
    });

    app.post('/items/register', (req, res) => {
        const { name } = req.body;

        if (!name) {
            req.flash('error', 'Item name is required');
            res.redirect('/');
            return;
        }

        const uuid = v4();
        registerTodoItem(dbConnection, new TodoListItem(name, uuid, false))
            .then(() => {
                req.flash('success', 'Item added successfully');
                res.redirect('/');
            })
            .catch((error) => {
                req.flash('error', 'Failed to add item');
                console.error('Error adding item:', error);
                res.redirect('/');
            });
    });

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}).catch((error) => {
    console.error('Failed to start the server:', error);
    process.exit(1);
});

export default app;
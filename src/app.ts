import express from 'express';
import path from 'path';
import { v4 } from 'uuid';
import session from 'express-session';
import flash from 'connect-flash';
import mysql from 'mysql2';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const dbConnection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'todoApp',
    port: parseInt(process.env.DB_PORT || '3306', 10),
});

class TodoListItem {
    name: string;
    id: string;
    done: boolean = false;

    constructor(name: string, id: string) {
        this.name = name;
        this.id = id;
    }
}

// 仮置きのデータ あとでデータベースに置き換える
let items: TodoListItem[] = [
    new TodoListItem('Buy groceries. Milk, Bread, Eggs', '1'),
    new TodoListItem('Walk the dog. Take the dog for a walk in the park', '2'),
    new TodoListItem('Read a book. Finish reading "The Great Gatsby"', '3'),
    new TodoListItem('Prepare dinner. Cook pasta and salad for dinner', '4'),
    new TodoListItem('Call mom. Check in with mom and see how she is doing', '5'),   
];

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

app.get('/', (req, res) => {
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

export default app;
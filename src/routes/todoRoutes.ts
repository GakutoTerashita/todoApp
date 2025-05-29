import express from 'express';
import { fetchTodoItems, removeTodoItem, completeTodoItem, registerTodoItem, TodoListItem } from '../db/todoItems';
import { v4 } from 'uuid';
import mysql from 'mysql2/promise';

export const todoRoutes = (dbConnection: mysql.Connection) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        try {
            const items = await fetchTodoItems(dbConnection)
            res.render('home', { 
                title: 'Home',
                items,
                success: req.flash('success'),
                error: req.flash('error'),
            });
        } catch (error) {
            console.error('Error fetching todo items:', error);
            // req.flash('error', 'Failed to fetch todo items');
            res.redirect('/error'); // TODO: Create an database fetch error page
        }
    });

    router.get('/error', (req, res) => {
        res.send('error'); // TODO: Create an error page
    });

    router.post('/items/delete/:id', async (req, res) => {
        const itemId = req.params.id;
        if (!itemId) {
            req.flash('error', 'Item ID is required');
            res.redirect('/');
            return;
        }

        try {
            await removeTodoItem(dbConnection, itemId)
            req.flash('success', 'Removed item successfully');
            res.redirect('/'); 
        } catch (error) {
            req.flash('error', 'Failed to remove item');
            console.error('Error removing item:', error);
            res.redirect('/');
        }
    });

    router.post('/items/complete/:id', async (req, res) => {
        const itemId = req.params.id;
        if (!itemId) {
            req.flash('error', 'Item ID is required');
            res.redirect('/');
            return;
        }

        try {
            await completeTodoItem(dbConnection, itemId)
            req.flash('success', 'Changed item status successfully');
            res.redirect('/'); 
        } catch (error) {
            req.flash('error', 'Failed to change item status');
            console.error('Error changing item status:', error);
            res.redirect('/');
        }
    });

    router.post('/items/register', async (req, res) => {
        const { name } = req.body;
        if (!name) {
            req.flash('error', 'Item name is required');
            res.redirect('/');
            return;
        }

        const uuid = v4();

        try {
            await registerTodoItem(dbConnection, new TodoListItem(name, uuid, false))
            req.flash('success', 'Item added successfully');
            res.redirect('/');
        } catch (error) {
            req.flash('error', 'Failed to add item');
            console.error('Error adding item:', error);
            res.redirect('/');
        }
    });

    return router;
}
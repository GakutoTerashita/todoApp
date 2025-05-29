import express from 'express';
import { removeTodoItem, completeTodoItem, registerTodoItem, TodoListItem, fetchTodoItemById, updateTodoItemNameById, fetchTodoItemsDoneNot, fetchTodoItemsDone } from '../db/todoItems';
import { v4 } from 'uuid';
import mysql from 'mysql2/promise';

export const todoRoutes = (dbConnection: mysql.Connection) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        try {
            const items = await fetchTodoItemsDoneNot(dbConnection)
            const itemsDone = await fetchTodoItemsDone(dbConnection);
            res.render('home', { 
                items,
                itemsDone,
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

    router.get('/items/modify/:id', async (req, res) => {
        const itemId = req.params.id;
        if (!itemId) {
            req.flash('error', 'Item ID is required');
            res.redirect('/');
            return;
        }

        try {
            const item = await fetchTodoItemById(dbConnection, itemId);
            if (!item) {
                req.flash('error', 'Item not found');
                res.redirect('/');
                return;
            }
            res.render('modifyItems', { item });
        } catch (error) {
            req.flash('error', 'Failed to fetch item for modification');
            console.error('Error fetching item for modification:', error);
            res.redirect('/');
        }
    });

    router.post('/items/modify/:id', async (req, res) => {
        const itemId = req.params.id;
        const { name } = req.body;
        
        if (!itemId || !name) {
            req.flash('error', 'Item ID and name are required');
            res.redirect('/');
            return;
        }

        try {
            const item = await fetchTodoItemById(dbConnection, itemId);
            if (!item) {
                req.flash('error', 'Item not found');
                res.redirect('/');
                return;
            }

            await updateTodoItemNameById(dbConnection, itemId, name);

            req.flash('success', 'Item modified successfully');
            res.redirect('/');
        } catch (error) {
            req.flash('error', 'Failed to modify item');
            console.error('Error modifying item:', error);
            res.redirect('/');
        }
    });

    return router;
}
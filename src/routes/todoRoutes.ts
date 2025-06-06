import express, { Router } from 'express';
import { TodoListItem } from '../db/todoListItem';
import { v4 as uuidV4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { completeTodoItem, fetchTodoItemById, fetchTodoItemsDone, fetchTodoItemsDoneNot, registerTodoItem, removeTodoItem, updateTodoItemNameById } from '../db/control';

export const todoRoutes = (prisma: PrismaClient): Router => {
    const router = express.Router();

    const is_login = (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (!req.user) {
            res.redirect('/auth');
        }
        return next();
    };

    router.get('/', is_login, async (req, res) => {
        try {
            const items = await fetchTodoItemsDoneNot(prisma, req.user!)
            const itemsDone = await fetchTodoItemsDone(prisma, req.user!);
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

    router.post('/items/delete/:itemId', is_login, async (req, res) => {
        try {
            const itemId = req.params.itemId;
            if (!itemId) {
                req.flash('error', 'Item ID is required');
                res.redirect('/');
                return;
            }

            await removeTodoItem(prisma, itemId)
            req.flash('success', 'Removed item successfully');
            res.redirect('/');
        } catch (error) {
            req.flash('error', 'Failed to remove item');
            console.error('Error removing item:', error);
            res.redirect('/');
        }
    });

    router.post('/items/complete/:itemId', is_login, async (req, res) => {
        const itemId = req.params.itemId;
        if (!itemId) {
            req.flash('error', 'Item ID is required');
            res.redirect('/');
            return;
        }

        try {
            await completeTodoItem(prisma, itemId);
            console.log('Item status changed successfully for item ID:', itemId);
            req.flash('success', 'Changed item status successfully');
            res.redirect('/');
        } catch (error) {
            console.error('Error changing item status:', error);
            req.flash('error', 'Failed to change item status');
            res.redirect('/');
        }

    });

    router.post('/items/register', is_login, async (req, res) => {
        try {
            const { name, dueDate } = req.body;
            if (!name) {
                req.flash('error', 'Item name is required');
                res.redirect('/');
                return;
            }

            const newItem: TodoListItem = {
                id: uuidV4(),
                name,
                done: false,
                due_date: dueDate || undefined,
                created_by: req.user!.id,
            }
            await registerTodoItem(prisma, newItem);
            req.flash('success', 'Item added successfully');
            res.redirect('/');
        } catch (error) {
            req.flash('error', 'Failed to add item');
            console.error('Error adding item:', error);
            res.redirect('/');
        }
    });

    router.get('/items/modify/:itemId', is_login, async (req, res) => {
        try {
            const itemId = req.params.itemId;
            if (!itemId) {
                req.flash('error', 'Item ID is required');
                res.redirect('/');
                return;
            }

            const item = await fetchTodoItemById(prisma, itemId);
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

    router.post('/items/modify/:itemId', is_login, async (req, res) => {
        try {
            const itemId = req.params.itemId;
            const { name } = req.body;

            if (!itemId || !name) {
                req.flash('error', 'Item ID and name are required');
                res.redirect('/');
                return;
            }

            const item = await fetchTodoItemById(prisma, itemId);
            if (!item) {
                req.flash('error', 'Item not found');
                res.redirect('/');
                return;
            }

            await updateTodoItemNameById(prisma, itemId, name);

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
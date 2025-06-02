import express, { Router } from 'express';
import { TodoListItem } from '../db/todoListItem';
import { DbController } from '../db/control';
import { v4 as uuidV4 } from 'uuid';

export const todoRoutes = (dbController: DbController): Router => {
    const router = express.Router();

    const is_login = (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (req.user) {
            return next();
        }
        res.redirect('/auth');
    };

    router.get('/', is_login, async (req, res) => {
        try {
            const items = await dbController.fetchTodoItemsDoneNot(req.user!.id)
            const itemsDone = await dbController.fetchTodoItemsDone(req.user!.id);
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

    router.post('/items/delete/:id', is_login, async (req, res) => {
        try {
            const itemId = req.params.id;
            if (!itemId) {
                req.flash('error', 'Item ID is required');
                res.redirect('/');
                return;
            }

            await dbController.removeTodoItem(itemId)
            req.flash('success', 'Removed item successfully');
            res.redirect('/');
        } catch (error) {
            req.flash('error', 'Failed to remove item');
            console.error('Error removing item:', error);
            res.redirect('/');
        }
    });

    router.post('/items/complete/:id', is_login, async (req, res) => {
        const itemId = req.params.id;
        if (!itemId) {
            req.flash('error', 'Item ID is required');
            res.redirect('/');
            return;
        }

        try {
            await dbController.completeTodoItem(itemId)
            req.flash('success', 'Changed item status successfully');
            res.redirect('/');
        } catch (error) {
            req.flash('error', 'Failed to change item status');
            console.error('Error changing item status:', error);
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
                dueDate: dueDate || undefined // Optional field for due date
            }
            await dbController.registerTodoItem(newItem, req.user!.id);
            req.flash('success', 'Item added successfully');
            res.redirect('/');
        } catch (error) {
            req.flash('error', 'Failed to add item');
            console.error('Error adding item:', error);
            res.redirect('/');
        }
    });

    router.get('/items/modify/:id', is_login, async (req, res) => {
        try {
            const itemId = req.params.id;
            if (!itemId) {
                req.flash('error', 'Item ID is required');
                res.redirect('/');
                return;
            }

            const item = await dbController.fetchTodoItemById(itemId);
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

    router.post('/items/modify/:id', is_login, async (req, res) => {
        try {
            const itemId = req.params.id;
            const { name } = req.body;

            if (!itemId || !name) {
                req.flash('error', 'Item ID and name are required');
                res.redirect('/');
                return;
            }

            const item = await dbController.fetchTodoItemById(itemId);
            if (!item) {
                req.flash('error', 'Item not found');
                res.redirect('/');
                return;
            }

            await dbController.updateTodoItemNameById(itemId, name);

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
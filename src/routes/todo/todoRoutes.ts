import express, { Router } from 'express';
import {
    get_todo_root,
    get_error,
    post_delete_itemid,
    post_complete_itemid,
    post_register_itemid,
    get_modify_itemid,
    post_modify_itemid
} from './todoRouteHandlers';

export const todoRoutes = (): Router => {
    const router = express.Router();

    const is_login = (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (!req.user) {
            res.redirect('/auth');
        }
        return next();
    };

    router.get('/', is_login, get_todo_root);
    router.get('/error', get_error);
    router.post('/items/delete/:itemId', is_login, post_delete_itemid);
    router.post('/items/complete/:itemId', is_login, post_complete_itemid);
    router.post('/items/register', is_login, post_register_itemid);
    router.get('/items/modify/:itemId', is_login, get_modify_itemid);
    router.post('/items/modify/:itemId', is_login, post_modify_itemid);

    return router;
}
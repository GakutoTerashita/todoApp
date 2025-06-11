import express, { Router } from 'express';
import { handler_get_root, handler_get_error, handler_post_delete_itemid, handler_post_complete_itemid, handler_post_register_itemid, handler_get_modify_itemid, handler_post_modify_itemid } from './handlers/todoRouteHandlers';

export const todoRoutes = (): Router => {
    const router = express.Router();

    const is_login = (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (!req.user) {
            res.redirect('/auth');
        }
        return next();
    };

    router.get('/', is_login, handler_get_root);
    router.get('/error', handler_get_error);
    router.post('/items/delete/:itemId', is_login, handler_post_delete_itemid);
    router.post('/items/complete/:itemId', is_login, handler_post_complete_itemid);
    router.post('/items/register', is_login, handler_post_register_itemid);
    router.get('/items/modify/:itemId', is_login, handler_get_modify_itemid);
    router.post('/items/modify/:itemId', is_login, handler_post_modify_itemid);

    return router;
}
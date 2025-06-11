import { handler_get_root } from './handlers/todoRouteHandlers';

describe('todoRouteHandlers', () => {
    describe('handler_get_root', () => {
        describe('failure cases', () => {
            afterEach(() => {
                jest.restoreAllMocks();
            })

            it('should redirect to /error when finding done todo_items fails', async () => {
                const req = {
                    user: { id: 'user1' },
                    flash: jest.fn(),
                } as any;
                const res = {
                    redirect: jest.fn(),
                    render: jest.fn(),
                } as any;

                jest.spyOn(
                    require('../services/todo-items.service'),
                    'findTodoItemsDone'
                ).mockRejectedValue(new Error('Database error'));

                await handler_get_root(req, res);

                expect(res.redirect).toHaveBeenCalledWith('/error');
            });

            it('should redirect to /error when fetching not done todo_items fails', async () => {
                const req = {
                    user: { id: 'user1' },
                    flash: jest.fn(),
                } as any;
                const res = {
                    redirect: jest.fn(),
                    render: jest.fn(),
                } as any;

                jest.spyOn(
                    require('../services/todo-items.service'),
                    'findTodoItemsDone'
                )
                    .mockResolvedValue([])
                jest.spyOn(
                    require('../services/todo-items.service'),
                    'findTodoItemsNotDone'
                )
                    .mockRejectedValue(new Error('Database error'));

                await handler_get_root(req, res);

                expect(res.redirect).toHaveBeenCalledWith('/error');
            });
        })
    });
});

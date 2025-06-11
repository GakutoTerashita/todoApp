import { prismaMock } from '../../singleton';
import { handler_get_root } from './handlers/todoRouteHandlers';

describe('todoRouteHandlers', () => {
    describe('handler_get_root', () => {
        describe('failure cases', () => {
            it('should redirect to /error when fetching todo items fails', async () => {
                const req = {
                    user: { id: 'user1' },
                    flash: jest.fn(),
                } as any;
                const res = {
                    redirect: jest.fn(),
                    render: jest.fn(),
                } as any;

                prismaMock.todo_items.findMany.mockRejectedValue(new Error('Database error'));

                await handler_get_root(req, res);

                expect(res.redirect).toHaveBeenCalledWith('/error');
            });

            it('should redirect to /error when fetching done todo items fails', async () => {
                const req = {
                    user: { id: 'user1' },
                    flash: jest.fn(),
                } as any;
                const res = {
                    redirect: jest.fn(),
                    render: jest.fn(),
                } as any;

                prismaMock.todo_items.findMany.mockResolvedValue([]);
                prismaMock.todo_items.findMany.mockRejectedValue(new Error('Database error'));

                await handler_get_root(req, res);

                expect(res.redirect).toHaveBeenCalledWith('/error');
            });
        })
    });
});

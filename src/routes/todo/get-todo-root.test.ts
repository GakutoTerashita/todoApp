import { TodoListItem } from '../../db/todoListItem';
import { get_todo_root } from './todoRouteHandlers';
import * as todoItemService from '../../services/todo-items.service';

describe('get_todo_root', () => {
    describe('failure cases', () => {
        let consoleErrorSpy: jest.SpyInstance;
        let consoleLogSpy: jest.SpyInstance;
        beforeEach(() => {
            consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
        })

        afterEach(() => {
            jest.restoreAllMocks();
            consoleErrorSpy.mockRestore();
            consoleLogSpy.mockRestore();
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
                todoItemService,
                'findTodoItemsDone'
            ).mockRejectedValue(new Error('Database error 0'));

            await get_todo_root(req, res);

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
                todoItemService,
                'findTodoItemsDone'
            )
                .mockResolvedValue([])
            jest.spyOn(
                todoItemService,
                'findTodoItemsNotDone'
            )
                .mockRejectedValue(new Error('Database error 1'));

            await get_todo_root(req, res);

            expect(res.redirect).toHaveBeenCalledWith('/error');
        });
    })

    describe('success cases', () => {
        let consoleErrorSpy: jest.SpyInstance;
        let consoleLogSpy: jest.SpyInstance;
        beforeEach(() => {
            consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
        })

        afterEach(() => {
            jest.restoreAllMocks();
            consoleErrorSpy.mockRestore();
            consoleLogSpy.mockRestore();
        })

        it('should render home with todo items', async () => {
            const req = {
                user: { id: 'user1' },
                flash: jest.fn(),
            } as any;
            const res = {
                redirect: jest.fn(),
                render: jest.fn(),
            } as any;

            const mockItemsDone: TodoListItem[] = [{
                id: '1',
                name: 'Test Item 1',
                done: true,
                created_by: 'user1',
                due_date: new Date(),
            }];
            const mockItemsNotDone: TodoListItem[] = [{
                id: '2',
                name: 'Test Item 2',
                done: false,
                created_by: 'user2',
                due_date: new Date(),
            }];

            jest.spyOn(
                todoItemService,
                'findTodoItemsDone'
            ).mockResolvedValue(mockItemsDone);
            jest.spyOn(
                todoItemService,
                'findTodoItemsNotDone'
            ).mockResolvedValue(mockItemsNotDone);

            await get_todo_root(req, res);

            expect(res.render).toHaveBeenCalledWith('home', {
                items: mockItemsNotDone,
                itemsDone: mockItemsDone,
                success: req.flash('success'),
                error: req.flash('error'),
            });
        });
    });
});

import { OperationFailure, OperationSuccess } from './control';
import { TodoControl } from './control';
import { prismaMock } from '../../singleton';
import { TodoListItem } from './todoListItem';
import '../auth/utils';

describe('class OperationFailure', () => {
    it('constructor with error', () => {
        const error = new Error('Test error');
        const failure = new OperationFailure('Test failure', error);

        expect(failure.message).toBe('Test failure');
        expect(failure.error).toBe(error);
    });
    it('constructor without error', () => {
        const failure = new OperationFailure('Test failure');

        expect(failure.message).toBe('Test failure');
        expect(failure.error).toBeUndefined();
    });
    it('logError', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        const error = new Error('Test error');
        const failure = new OperationFailure('Test failure', error);

        failure.logError('Prefix: ');

        expect(consoleSpy).toHaveBeenCalledWith('Prefix: Test failure', error);
        consoleSpy.mockRestore();
    });
});

describe('class OperationSuccess', () => {
    it('constructor with data', () => {
        const data = { id: 1, name: 'Test' };
        const success = new OperationSuccess('Test success', data);

        expect(success.message).toBe('Test success');
        expect(success.data).toEqual(data);
    });
    it('constructor without data', () => {
        const success = new OperationSuccess('Test success');

        expect(success.message).toBe('Test success');
        expect(success.data).toBeUndefined();
    });
});

// Because class OperationResult<T> is un-exported alias of OperationSuccess<T> | OperationFailure,
// you need to manually assert the type in tests to tell TypeScript that the result is a success or failure.

/** 
* @param result The operation result to assert.
* Asserts that the result is a success.  
* Throws an error if the result is not a success.
*/
function assertSuccess<T>(result: OperationSuccess<T> | OperationFailure): asserts result is OperationSuccess<T> {
    if (!(result instanceof OperationSuccess)) {
        throw new Error(`Expected success but got ${result.constructor.name}: ${result.message}`);
    }
}

/**
 * @param result The operation result to assert.
 * Asserts that the result is a failure.
 * Throws an error if the result is not a failure.
 */
function assertFailure(result: OperationSuccess<any> | OperationFailure): asserts result is OperationFailure {
    if (!(result instanceof OperationFailure)) {
        throw new Error(`Expected failure but got ${result.constructor.name}: ${result.message}`);
    }
}

describe('class TodoControl', () => {
    let todoControl: TodoControl;

    beforeEach(() => {
        todoControl = new TodoControl(prismaMock);
    });

    describe('fetchTodoItemsDoneNot', () => {

        describe('success case', () => {

            it('single item', async () => {
                const fetchedBy: Express.User = {
                    id: 'Test User',
                    hashed_password: 'hashed',
                    created_at: new Date().toISOString(),
                    is_admin: false
                };
                const findManyReturns: TodoListItem[] = [{
                    id: '1',
                    name: 'Test Item',
                    done: false,
                    due_date: new Date(),
                    created_by: 'hoge',
                }];
                prismaMock.todo_items.findMany.mockResolvedValue(findManyReturns);

                const result = await todoControl.fetchTodoItemsDoneNot(fetchedBy);

                expect(result).toBeInstanceOf(OperationSuccess);
                // Because class OperationResult<T> is un-exported alias of OperationSuccess<T> | OperationFailure,
                // you need to manually assert the type in tests to tell TypeScript that the result is a success or failure.
                assertSuccess(result);
                expect(result.message).toBe('Fetched todo items not done for user: Test User');
                expect(result.data).toEqual(findManyReturns);
            });
            it('multiple items', async () => {
                const fetchedBy: Express.User = {
                    id: 'Test User',
                    hashed_password: 'hashed',
                    created_at: new Date().toISOString(),
                    is_admin: false
                };
                const findManyReturns: TodoListItem[] = [
                    { id: '1', name: 'Test Item 1', done: false, due_date: new Date(), created_by: 'hoge' },
                    { id: '2', name: 'Test Item 2', done: false, due_date: new Date(), created_by: 'hoge' }
                ];
                prismaMock.todo_items.findMany.mockResolvedValue(findManyReturns);

                const result = await todoControl.fetchTodoItemsDoneNot(fetchedBy);

                expect(result).toBeInstanceOf(OperationSuccess);
                assertSuccess(result);
                expect(result.message).toBe('Fetched todo items not done for user: Test User');
                expect(result.data).toEqual(findManyReturns);
            });
            it('no items', async () => {
                const fetchedBy: Express.User = {
                    id: 'Test User',
                    hashed_password: 'hashed',
                    created_at: new Date().toISOString(),
                    is_admin: false
                };
                prismaMock.todo_items.findMany.mockResolvedValue([]);

                const result = await todoControl.fetchTodoItemsDoneNot(fetchedBy);

                expect(result).toBeInstanceOf(OperationSuccess);
                assertSuccess(result);
                expect(result.message).toBe('No todo items not done found for user: Test User');
                expect(result.data).toEqual([]);
            });
        });

        it('failure case', async () => {
            const fetchedBy: Express.User = {
                id: 'Test User',
                hashed_password: 'hashed',
                created_at: new Date().toISOString(),
                is_admin: false
            };
            const error = new Error('Database error');
            prismaMock.todo_items.findMany.mockRejectedValue(error);

            const result = await todoControl.fetchTodoItemsDoneNot(fetchedBy);

            expect(result).toBeInstanceOf(OperationFailure);
            assertFailure(result);
            expect(result.message).toBe('Failed to fetch todo items not done for user: Test User');
            expect(result.error).toBe(error);
        });

    });

    describe('fetchTodoItemsDone', () => {
        it('failure case', async () => {
            const fetchedBy: Express.User = {
                id: 'Test User',
                hashed_password: 'hashed',
                created_at: new Date().toISOString(),
                is_admin: false
            };
            const error = new Error('Database error');
            prismaMock.todo_items.findMany.mockRejectedValue(error);
            const result = await todoControl.fetchTodoItemsDone(fetchedBy);
            expect(result).toBeInstanceOf(OperationFailure);
            assertFailure(result);
            expect(result.message).toBe('Failed to fetch done todo items for user: Test User');
            expect(result.error).toBe(error);
        });

        describe('success case', () => {

            it('single item', async () => {
                const fetchedBy: Express.User = {
                    id: 'Test User',
                    hashed_password: 'hashed',
                    created_at: new Date().toISOString(),
                    is_admin: false
                };
                const findManyReturns: TodoListItem[] = [{
                    id: '1',
                    name: 'Test Item',
                    done: true,
                    due_date: new Date(),
                    created_by: 'hoge',
                }];
                prismaMock.todo_items.findMany.mockResolvedValue(findManyReturns);

                const result = await todoControl.fetchTodoItemsDone(fetchedBy);

                expect(result).toBeInstanceOf(OperationSuccess);
                assertSuccess(result);
                expect(result.message).toBe('Fetched done todo items for user: Test User');
                expect(result.data).toEqual(findManyReturns);
            });
            it('multiple items', async () => {
                const fetchedBy: Express.User = {
                    id: 'Test User',
                    hashed_password: 'hashed',
                    created_at: new Date().toISOString(),
                    is_admin: false
                };
                const findManyReturns: TodoListItem[] = [
                    { id: '1', name: 'Test Item 1', done: true, due_date: new Date(), created_by: 'hoge' },
                    { id: '2', name: 'Test Item 2', done: true, due_date: new Date(), created_by: 'hoge' }
                ];
                prismaMock.todo_items.findMany.mockResolvedValue(findManyReturns);

                const result = await todoControl.fetchTodoItemsDone(fetchedBy);

                expect(result).toBeInstanceOf(OperationSuccess);
                assertSuccess(result);
                expect(result.message).toBe('Fetched done todo items for user: Test User');
                expect(result.data).toEqual(findManyReturns);
            });
            it('no items', async () => {
                const fetchedBy: Express.User = {
                    id: 'Test User',
                    hashed_password: 'hashed',
                    created_at: new Date().toISOString(),
                    is_admin: false
                };
                prismaMock.todo_items.findMany.mockResolvedValue([]);

                const result = await todoControl.fetchTodoItemsDone(fetchedBy);

                expect(result).toBeInstanceOf(OperationSuccess);
                assertSuccess(result);
                expect(result.message).toBe('No done todo items found for user: Test User');
                expect(result.data).toEqual([]);
            });
        });
    });
});
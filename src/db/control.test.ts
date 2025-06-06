import { OperationFailure, OperationSuccess } from './control';

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
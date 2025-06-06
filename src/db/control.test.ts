import { OperationFailure } from './control';

describe('class OperationFailure', () => {
    it('constructor', () => {
        const error = new Error('Test error');
        const failure = new OperationFailure('Test failure', error);

        expect(failure.message).toBe('Test failure');
        expect(failure.error).toBe(error);
    });
    it('logError', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        const error = new Error('Test error');
        const failure = new OperationFailure('Test failure', error);

        failure.logError('Prefix: ');

        expect(consoleSpy).toHaveBeenCalledWith('Prefix: Test failure', error);
        consoleSpy.mockRestore();
    });
})
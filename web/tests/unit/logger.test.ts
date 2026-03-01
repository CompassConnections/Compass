import {logApiError, logger} from 'common/lib/logger'

describe('logger', () => {
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  it('logs info messages in development', () => {
    process.env.NODE_ENV = 'development'
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation(() => {})

    logger.info('Test message', {key: 'value'})

    expect(consoleSpy).toHaveBeenCalled()
    const loggedArg = consoleSpy.mock.calls[0][0]
    expect(loggedArg).toContain('Test message')
    expect(loggedArg).toContain('value')

    consoleSpy.mockRestore()
  })

  it('logs error messages with error context', () => {
    process.env.NODE_ENV = 'production'
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const testError = new Error('Test error')

    logger.error('Error occurred', testError, {endpoint: '/api/test'})

    expect(consoleSpy).toHaveBeenCalled()
    const loggedArg = consoleSpy.mock.calls[0][0]
    expect(loggedArg).toContain('Error occurred')
    expect(loggedArg).toContain('/api/test')

    consoleSpy.mockRestore()
  })

  it('logs warn messages', () => {
    process.env.NODE_ENV = 'development'
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

    logger.warn('Warning message', {context: 'test'})

    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('logs debug messages only in development', () => {
    process.env.NODE_ENV = 'production'
    const consoleSpy = jest.spyOn(console, 'debug').mockImplementation(() => {})

    logger.debug('Debug message')

    expect(consoleSpy).not.toHaveBeenCalled()
    consoleSpy.mockRestore()

    process.env.NODE_ENV = 'development'
    const consoleSpy2 = jest.spyOn(console, 'debug').mockImplementation(() => {})

    logger.debug('Debug message')

    expect(consoleSpy2).toHaveBeenCalled()
    consoleSpy2.mockRestore()
  })
})

describe('logApiError', () => {
  it('formats API errors correctly', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const testError = new Error('API failed')

    logApiError('/api/users', testError)

    expect(consoleSpy).toHaveBeenCalled()
    const loggedArg = consoleSpy.mock.calls[0][0]
    expect(loggedArg).toContain('API Error in /api/users')
    expect(loggedArg).toContain('API failed')

    consoleSpy.mockRestore()
  })
})

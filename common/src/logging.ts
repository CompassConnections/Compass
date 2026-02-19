import {IS_LOCAL} from 'common/hosting/constants'

class Logger {
  private readonly isLocal: boolean

  constructor(isLocal = false) {
    this.isLocal = isLocal
  }

  trace(...args: any[]) {
    // Does not seem to really work. Was trying to show the real file where the log was called from.
    if (!this.isLocal) return

    const caller = this.getCallerFrame(3) // skip Logger frames
    if (caller) {
      console.log('Trace:', ...args, '\nCalled from:', caller)
    } else {
      console.trace(...args)
    }
  }

  log(...args: any[]) {
    if (this.isLocal) console.log(...args)
  }

  info(...args: any[]) {
    if (this.isLocal) console.info(...args)
  }

  warn(...args: any[]) {
    if (this.isLocal) console.warn(...args)
  }

  error(...args: any[]) {
    if (this.isLocal) console.error(...args)
  }

  debug(...args: any[]) {
    if (this.isLocal) console.debug(...args)
  }

  table(...args: any[]) {
    if (this.isLocal) console.table(...args)
  }

  group(...args: any[]) {
    if (this.isLocal) console.group(...args)
  }

  private getCallerFrame(skip = 2): string | undefined {
    // Create an Error to get stack trace
    const err = new Error()
    if (!err.stack) return undefined

    const lines = err.stack.split('\n')

    // skip frames (0: Error, 1: Logger method, 2+: caller)
    return lines[skip]?.trim()
  }
}

export const logger = new Logger(IS_LOCAL)

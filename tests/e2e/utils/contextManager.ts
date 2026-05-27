import {Browser, BrowserContext} from '@playwright/test'
import {App} from '../web/pages/app'

export class ContextManager {
  private contexts: Map<string, App> = new Map()

  constructor(private browser: Browser) {}

  async createContext(name: string): Promise<App> {
    const context = await this.browser.newContext()
    const page = await context.newPage()
    const app = new App(page)
    this.contexts.set(name, app)
    return app
  }

  getContext(name: string): App | undefined {
    return this.contexts.get(name)
  }

  async closeAll(): Promise<void> {
    for (const app of this.contexts.values()) {
      await app.page.context().close()
    }
    this.contexts.clear()
  }
}

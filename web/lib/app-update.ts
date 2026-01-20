import {registerPlugin} from '@capacitor/core'

interface AppUpdatePlugin {
  checkForUpdate(): Promise<{
    updateAvailable: boolean
    immediateAllowed: boolean
    flexibleAllowed: boolean
    availableVersionCode: number
  }>

  startUpdate(options: { type: 'immediate' | 'flexible' }): Promise<void>
}

const AppUpdate = registerPlugin<AppUpdatePlugin>('AppUpdate')

export default AppUpdate
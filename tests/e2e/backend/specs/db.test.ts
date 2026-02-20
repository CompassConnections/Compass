import {test} from '../fixtures/base'
import {databaseUtils} from '../utils/database'

test('View database', async ({backendPage}) => {
  const userAccount = await databaseUtils.findUserByName(backendPage, 'Franklin Buckridge')
  // const userProfile = await databaseUtils.findProfileById(backendPage, userAccount.id)
  console.log(userAccount)
})

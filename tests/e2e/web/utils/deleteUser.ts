import { login, deleteAccount } from "../../utils/firebaseUtils";
import { deleteFromDb } from "../../utils/databaseUtils";
import axios from 'axios'

import {config} from '../SPEC_CONFIG'

export async function deleteUser(email: string, password: string) {
  try {
    const loginInfo = await login(email, password);
    await deleteFromDb(loginInfo.data.localId);
    await deleteAccount(loginInfo);
  } catch (err: any) {
    // Skip deletion if user doesn't exist or other auth errors occur
    if (
      err.response?.status === 400 ||
      err.response?.data?.error?.message?.includes('EMAIL_NOT_FOUND')
    ) {
      console.log(`Email not found, skipping user deletion for ${email}`)
      return
    }
    console.log(err)
  }
};

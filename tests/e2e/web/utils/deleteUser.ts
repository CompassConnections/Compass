import { login, deleteAccount } from "../../utils/firebaseUtils";
import { deleteFromDb } from "../../utils/databaseUtils";

export async function deleteUser(email: string, password: string) {
  try {
    const loginInfo = await login(email, password);
    await deleteFromDb(loginInfo.data.localId);
    await deleteAccount(loginInfo);
  } catch (err: any) {
    console.log(err)
  }
};

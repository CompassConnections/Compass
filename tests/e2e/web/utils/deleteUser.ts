import axios from 'axios';
import { createSupabaseDirectClient } from "../../../../backend/shared/src/supabase/init";
import { config } from '../SPEC_CONFIG';

export async function deleteUser(email: string, password: string) {
  
  try {
    const login = await axios.post(
      `${config.FIREBASE_URL.BASE}${config.FIREBASE_URL.SIGN_IN_PASSWORD}`,
      {
        email,
        password,
        returnSecureToken: true
      }
    );
    
    await deleteFromDb(login.data.localId);
    
    await axios.post(
      `${config.FIREBASE_URL.BASE}${config.FIREBASE_URL.DELETE}`,
      { idToken: login.data.idToken }
    );

    
  } catch (err: any) {
    console.log(err);
  }
};

async function deleteFromDb(user_id: string) {
  const db = createSupabaseDirectClient();
  try {
    const deleteEntryById = `DELETE FROM users WHERE id = $1 RETURNING *`;
    const result = await db.query(deleteEntryById, [user_id]);
    console.log("Deleted data: ",{
      "id": result[0].id,
      "name": result[0].name,
      "username": result[0].username
    });
  } catch (error) {
    console.error("Failed to delete user data, all changes rolled back: ", error);
    throw error;
  };
};
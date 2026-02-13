import {useContext} from "react";
import {AuthContext} from "web/components/auth-context";

export function useFirebaseUser() {
  const ctx = useContext(AuthContext)
  return ctx?.firebaseUser
}

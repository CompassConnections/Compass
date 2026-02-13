import {useEffect, useState} from 'react'
import {onAuthStateChanged, onIdTokenChanged, User} from 'firebase/auth'
import {auth} from 'web/lib/firebase/users'

/**
 * Subscribe to Firebase Auth user updates.
 * Reactively returns the current Firebase `User` and updates when:
 * - auth state changes (sign in/out)
 * - ID token changes (after `getIdToken(true)` or `user.reload()`),
 *   which is important for reflecting `emailVerified` changes without a hard refresh.
 */
export function useFirebaseUser() {
  const [, forceRender] = useState(0);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const update = (u: User | null) => {
      setFirebaseUser(u);      // keep the real User instance
      forceRender(v => v + 1); // force React to re-render
    };

    const unsubAuth = onAuthStateChanged(auth, update);
    const unsubToken = onIdTokenChanged(auth, update);

    return () => {
      unsubAuth();
      unsubToken();
    };
  }, []);

  return firebaseUser;
}

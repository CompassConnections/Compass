import axios from "axios";
import { config } from "../web/SPEC_CONFIG";

export async function login(email: string, password: string) {
    const login = await axios.post(
      `${config.FIREBASE_URL.BASE}${config.FIREBASE_URL.SIGN_IN_PASSWORD}`,
      {
        email,
        password,
        returnSecureToken: true,
      },
    );
    return login
};

export async function deleteAccount(login: any) {
    await axios.post(`${config.FIREBASE_URL.BASE}${config.FIREBASE_URL.DELETE}`, {
        idToken: login.data.idToken,
    });
};
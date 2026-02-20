export const config = {
  BASE_URL: 'http://localhost:3000',
  FIREBASE_URL: {
    BASE: 'http://localhost:9099/identitytoolkit.googleapis.com/v1',
    SIGNUP: '/accounts:signUp?key=fake-api-key',
    SIGN_IN_PASSWORD: '/accounts:signInWithPassword?key=fake-api-key',
    DELETE: '/accounts:delete?key=fake-api-key',
  },
  USERS: {
    DEV_1: {
      EMAIL: 'dev_1@compass.com',
      PASSWORD: 'dev_1Password',
    },
    DEV_2: {
      EMAIL: 'dev_2@compass.com',
      PASSWORD: 'dev_2Password',
    },
    ONBOARDING: {
      EMAIL: 'onboarding@compass.com',
      PASSWORD: 'compassConnections1!',
    },
    SPEC: {
      EMAIL: 'spec@compass.com',
      PASSWORD: 'compassConnections1!',
    },
    SPEC_GOOGLE: {
      EMAIL: 'compass.connections.test@gmail.com',
      //unsure if gmail password should be public
      PASSWORD: '',
    }
  },
};

import { Gender } from "../pages/signUpPage";

export type OnboardingUser = {
    email: string;
    password: string;
    display_name: string;
    username: string;
    bio: string;
    gender: Gender;
    age: string;
};

type OnboardingConfig = {
    account_one: OnboardingUser;
};

export const onboarding: OnboardingConfig = {
    "account_one": {
        "email": "onboardingOne@compass.com",
        "password": "CompassTest",
        "display_name": "Compass Onboarding",
        "username": "The great Onboarding",
        "bio": "Born beneath twin moons, this wanderer maps forgotten roads, trades riddles for shelter, and keeps stories in glass bottles. Drawn to ancient libraries and glowing forests, they seek lost spells, quiet taverns, and adventures that rewrite fate. Their compass points to wonder. Ever onward. Always. Go",
        "gender": "Woman",
        "age": "25"
    }
};
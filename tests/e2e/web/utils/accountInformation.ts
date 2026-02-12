import {
    ConnectionType,
    Ethnicity,
    Gender,
    RelationshipStatus,
    RelationshipStyle,
    ChildrenExpectation,
    Interests,
    Causes,
    Education,
    PoliticalBeliefs,
    Religion,
    Personality,
    Diet,
    Language,
    Platforms,
} from "../pages/signUpPage";

export type OnboardingUser = {
    email: string;
    password: string;
    display_name: string;
    username: string;
    bio?: string;
    gender?: Gender;
    age?: string;
    height?: Height;
    ethnicity_origin?: Ethnicity;
    interested_in?: Gender;
    Interested_in_ages?: InterestedInAges;
    connection_type?: ConnectionType;
    relationship_status?: RelationshipStatus;
    relationship_style?: RelationshipStyle;
    number_of_kids?: string;
    children_expectation?: ChildrenExpectation;
    interests?: (Interests | string)[],
    causes?: (Causes | string)[],
    education_level?: Education,
    university?: string,
    job_title?: string,
    company?: string,
    work_area?: string[],
    beliefs?: BeliefDetails,
    personality_type?: Personality,
    diet?: Diet,
    is_smoker?: boolean,
    alcohol_consumed_per_month?: string,
    languages?: Language[],
    social_media?: Socials[],
};

type Height = {
    feet: string;
    inches: string;
    centimeters: string;
};

type InterestedInAges = {
    min: string;
    max?: string;
};

type BeliefDetails = {
    political?: {
        belief?: PoliticalBeliefs;
        details?: string;
    },
    religious?: {
        belief?: Religion;
        details?: string;
    },
};

type Socials = {
    platform: Platforms;
    urlOrUsername: string;
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
        "age": "25",
        "height": {
            "feet": "6",
            "inches": "0",
            "centimeters": "182.88"
        },
        "ethnicity_origin": "South/Southeast Asian",
        "interested_in": "Man",
        "Interested_in_ages": {
            "min": "20",
            "max": "30"
        },
        "connection_type": "Relationship",
        "relationship_status": "In open relationship",
        "relationship_style": "Open Relationship",
        "number_of_kids": "2",
        "children_expectation": "Neutral",
        "interests": [ "Chess", "Eating" ],
        "causes": [ "Animal Rights", "Free Spotify"],
        "education_level": "Bachelors",
        "university": "Open-Source University",
        "job_title": "Unemployed",
        "company": "Home",
        "work_area": ["Living Room", "University"],
        "beliefs": {
            "political": {
                "belief": "Green / Eco-Socialist"
            },
            "religious": {
                "belief": "Shinto"
            },
        },
        "personality_type": "ENFJ",
        "diet": "Omnivore",
        "is_smoker": false,
        "alcohol_consumed_per_month": "4",
        "languages": ["Akan", "Cebuano"],
        "social_media": [
            {
                "platform": "Bluesky",
                "urlOrUsername": "TheGreatConnection"
            },
        ],
    }
};
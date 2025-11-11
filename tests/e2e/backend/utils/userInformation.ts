import { faker } from "@faker-js/faker";

class UserAccountInformation {

    name = faker.person.fullName();
    email = faker.internet.email();
    user_id = faker.string.alpha(28)
    password = faker.internet.password();
    ip = faker.internet.ip()
    age = faker.number.int({min: 18, max:100});
    bio = faker.lorem.words({min: 200, max:350});
    born_in_location = faker.location.country();
    gender = [
        'Female',
        'Male',
        'Other'
    ];

    pref_gender = [
        'Female',
        'Male',
        'Other'
    ];

    pref_age = {
        min: faker.number.int({min: 18, max:27}),
        max: faker.number.int({min: 36, max:68})
    };

    pref_relation_styles = [
        'Collaboration',
        'Friendship',
        'Relationship'
    ];

    political_beliefs = [
        'Progressive',
        'Liberal',
        'Moderate / Centrist',
        'Conservative',
        'Socialist',
        'Nationalist',
        'Populist',
        'Green / Eco-Socialist',
        'Technocratic',
        'Libertarian',
        'Effective Accelerationism',
        'Pause AI / Tech Skeptic',
        'Independent / Other',
    ];

    religion = [
        'Atheist',
        'Agnostic',
        'Spiritual',
        'Christian',
        'Muslim',
        'Jewish',
        'Hindu',
        'Buddhist',
        'Sikh',
        'Taoist',
        'Jain',
        'Shinto',
        'Animist',
        'Zoroastrian',
        'Unitarian Universalist',
        'Other',
    ];

    diet = [
        'Omnivore',
        'Vegetarian',
        'Vegan',
        'Keto',
        'Paleo',
        'Pescetarian',
        'Other',
    ];

    drinks_per_month = faker.number.int({min: 4, max:40});
    height_in_inches = faker.number.float({min: 56, max: 78, fractionDigits:2});
    ethnicity = [
        'Black/African origin',
        'East Asian',
        'South/Southeast Asian',
        'White/Caucasian',
        'Hispanic/Latino',
        'Middle Eastern',
        'Native American/Indigenous',
        'Other',
    ];

    education_level = [
        'High school',
        'College',
        'Bachelors',
        'Masters',
        'PhD',
    ];
    company = faker.company.name();
    occupation_title = faker.person.jobTitle();
    university = faker.company.name();

    randomElement (array: Array<string>) {
        return array[Math.floor(Math.random() * array.length)].toLowerCase()
    }
}


export default UserAccountInformation;
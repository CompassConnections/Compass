import axios from 'axios';

const base = 'http://localhost:9099/identitytoolkit.googleapis.com/v1';

async function setup() {
    const results = await axios.post(`${base}/accounts:signUp?key=fake-api-key`, {
        email: "trial_test@email.com",
        password: "trialTestPassword",
        returnSecureToken: true
    });
    
    console.log('Auth created: ', "trial_test@email.com");
    console.log(results);
}

setup()
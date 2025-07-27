const fs = require('fs');
const path = require('path');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

// Check if .env.local exists, if not create it
const envPath = path.join(__dirname, '../.env.local');

const questions = [
  {
    name: 'NEXTAUTH_SECRET',
    message: 'Enter a secure random string for NEXTAUTH_SECRET (you can generate one with `openssl rand -base64 32`): ',
    validate: input => input.length >= 32 || 'Secret must be at least 32 characters long'
  },
  {
    name: 'NEXTAUTH_URL',
    message: 'Enter your NEXTAUTH_URL (e.g., http://localhost:3000): ',
    default: 'http://localhost:3000',
    validate: input => input.startsWith('http') || 'Must be a valid URL starting with http:// or https://'
  },
  {
    name: 'GOOGLE_CLIENT_ID',
    message: 'Enter your Google OAuth Client ID: ',
    validate: input => !!input || 'Google Client ID is required'
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    message: 'Enter your Google OAuth Client Secret: ',
    validate: input => !!input || 'Google Client Secret is required'
  }
];

async function setupEnv() {
  console.log('Setting up your environment variables...\n');
  
  let envVars = [];
  
  for (const q of questions) {
    const answer = await new Promise((resolve) => {
      const ask = () => {
        readline.question(q.message, (input) => {
          const value = input.trim() || q.default || '';
          if (q.validate) {
            const validation = q.validate(value);
            if (validation !== true) {
              console.log(validation);
              return ask();
            }
          }
          resolve(value);
        });
      };
      ask();
    });
    
    envVars.push(`${q.name}=${answer}`);
  }
  
  // Add any additional environment variables
  envVars.push('DATABASE_URL=file:./dev.db');
  
  // Write to .env.local
  fs.writeFileSync(envPath, envVars.join('\n') + '\n');
  
  console.log('\n✅ Environment variables have been saved to .env.local');
  console.log('\nNext steps:');
  console.log('1. Run `npx prisma db push` to update your database schema');
  console.log('2. Restart your development server with `npm run dev`\n');
  
  readline.close();
}

// Create .env.local if it doesn't exist
if (!fs.existsSync(envPath)) {
  setupEnv();
} else {
  console.log('.env.local already exists. Please update it with the following variables:');
  console.log(questions.map(q => `${q.name}=`).join('\n'));
  console.log('\nYou can also delete .env.local and run this script again to create it interactively.');
  readline.close();
}

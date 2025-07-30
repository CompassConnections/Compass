import {PrismaClient} from "@prisma/client";

// Cannot import from prisma.ts as we are outside the server
const prisma = new PrismaClient({log: ['query']})


async function main() {


  type ProfileBio = {
    name: string;
    age: number;
    occupation: string;
    location: string;
    bio: string;
    interests: string[];
  };

  const profiles: ProfileBio[] = [
    {
      name: "Elena",
      age: 29,
      occupation: "Cognitive Science Researcher",
      location: "Berlin, Germany",
      bio: "I’m passionate about understanding the limits and mechanics of human reasoning. I spend weekends dissecting papers on decision theory and evenings debating moral uncertainty. If you know your way around LessWrong and thought experiments, we’ll get along.",
      interests: ["Bayesian epistemology", "AI alignment", "Effective Altruism", "Meditation", "Game Theory"]
    },
    {
      name: "Marcus",
      age: 34,
      occupation: "Software Engineer",
      location: "San Francisco, USA",
      bio: "Practicing instrumental rationality one well-calibrated belief at a time. Stoicism and startup life have taught me a lot about tradeoffs. Looking for someone who can argue in good faith and loves truth-seeking as much as I do.",
      interests: ["Stoicism", "Predictive processing", "Rational fiction", "Startups", "Causal inference"]
    },
    {
      name: "Aya",
      age: 26,
      occupation: "Philosophy PhD Candidate",
      location: "Oxford, UK",
      bio: "My research focuses on metaethics and formal logic, but my heart belongs to moral philosophy. I think a lot about personhood, consciousness, and the ethics of future civilizations. Let's talk about Rawls or Parfit over tea.",
      interests: ["Metaethics", "Consciousness", "Transhumanism", "Moral realism", "Formal logic"]
    },
    {
      name: "David",
      age: 41,
      occupation: "Data Scientist",
      location: "Toronto, Canada",
      bio: "Former humanities major turned quant. Still fascinated by existential risk, the philosophy of science, and how to stay sane in an uncertain world. I'm here to meet people who think weird is a compliment.",
      interests: ["Probability theory", "Longtermism", "Epistemic humility", "Futurology", "Meditation"]
    },
    {
      name: "Mei",
      age: 31,
      occupation: "Independent Writer",
      location: "Singapore",
      bio: "Writing essays on intellectual humility, the philosophy of language, and how thinking styles shape our lives. I appreciate calm reasoning, rigorous curiosity, and the beauty of well-defined concepts. Let's try to model each other's minds.",
      interests: ["Philosophy of language", "Bayesian reasoning", "Writing", "Dialectics", "Systems thinking"]
    }
  ];

  const interests = new Set<string>();

  profiles.forEach(profile => {
    profile.interests.forEach(interest => {
      interests.add(interest);
    });
  });

  console.log([...interests]);

  // Create some interests and cause areas
  await prisma.interest.createMany({
    data: [...interests].map(interest => ({name: interest})),
    skipDuplicates: true,
  });

  await prisma.causeArea.createMany({
    data: [
      {name: 'Climate Change'},
      {name: 'AI Alignment'},
      {name: 'Animal Welfare'},
    ],
    skipDuplicates: true,
  });

  await prisma.connection.createMany({
    data: [
      {name: 'Debate Partner'},
      {name: 'Friendship'},
      {name: 'Relationship'},
    ],
    skipDuplicates: true,
  });


  // Get actual Interest & CauseArea objects
  const allInterests = await prisma.interest.findMany();
  const allCauseAreas = await prisma.causeArea.findMany();
  const allConnections = await prisma.connection.findMany();

  // Create mock users
  for (let i = 0; i < 5; i++) {
    const profile = profiles[i];
    const user = await prisma.user.create({
      data: {
        email: `user${i + 1}@bayesbond.com`,
        name: profile.name,
        image: null,
        profile: {
          create: {
            location: profile.location,
            description: `[Dummy profile for demo purposes] ${profile.bio}`,
            gender: i % 2 === 0 ? 'Male' : 'Female',
            personalityType: i % 3 === 0 ? 'Extrovert' : 'Introvert',
            conflictStyle: 'Avoidant',
            contactInfo: `Email: user${i}@bayesbond.com\nPhone: +1 (123) 456-7890`,
            occupation: profile.occupation,
            desiredConnections: {
              create: [
                {connectionId: allConnections[i % allConnections.length].id},
              ],
            },
            intellectualInterests: {
              // create: [...allInterests].map(interest => ({interestId: interest.id}) && Set(profile.interests))
              create: allInterests
                .filter(e => (new Set(profile.interests)).has(e.name)) // keep only elements in the set
                .map(e => ({interestId: e.id})) // map to object with `a` key
            },
            causeAreas: {
              create: [
                {causeAreaId: allCauseAreas[i % allCauseAreas.length].id},
              ],
            },
            promptAnswers: {
              create: [
                {prompt: 'What motivates you?', answer: 'Curiosity and truth.'},
                {prompt: 'How do you relate to your closest friends?', answer: 'By sharing our passions.'},
              ],
            },
          },
        },
      },
    });

    console.log(`Created user ${user.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

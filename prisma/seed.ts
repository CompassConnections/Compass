import {PrismaClient} from "@prisma/client";

// Cannot import from prisma.ts as we are outside the server
const prisma = new PrismaClient({log: ['query']})


async function main() {


  type ProfileBio = {
    name: string;
    age: number;
    introversion: number;
    occupation: string;
    location: string;
    bio: string;
    interests: string[];
    values: string[];
    books: string[];
  };

  const profiles: ProfileBio[] = [
    {
      name: "Elena",
      age: 29,
      introversion: 75,
      occupation: "Cognitive Science Researcher",
      location: "Berlin, Germany",
      bio: "I’m passionate about understanding the limits and mechanics of human reasoning. I spend weekends dissecting papers on decision theory and evenings debating moral uncertainty. If you know your way around LessWrong and thought experiments, we’ll get along.",
      interests: ["Bayesian epistemology", "AI alignment", "Effective Altruism", "Meditation", "Game Theory"],
      values: ["Intellectualism", "Rationality", "Autonomy"],
      books: ["Daniel Kahneman - Thinking, Fast and Slow"]
    },
    {
      name: "Marcus",
      age: 34,
      introversion: 34,
      occupation: "Software Engineer",
      location: "San Francisco, USA",
      bio: "Practicing instrumental rationality one well-calibrated belief at a time. Stoicism and startup life have taught me a lot about tradeoffs. Looking for someone who can argue in good faith and loves truth-seeking as much as I do.",
      interests: ["Stoicism", "Predictive processing", "Rational fiction", "Startups", "Causal inference"],
      values: ["Diplomacy", "Rationality", "Community"],
      books: ["Daniel Kahneman - Thinking, Fast and Slow"]
    },
    {
      name: "Aya",
      age: 26,
      introversion: 56,
      occupation: "Philosophy PhD Candidate",
      location: "Oxford, UK",
      bio: "My research focuses on metaethics and formal logic, but my heart belongs to moral philosophy. I think a lot about personhood, consciousness, and the ethics of future civilizations. Let's talk about Rawls or Parfit over tea.",
      interests: ["Metaethics", "Consciousness", "Transhumanism", "Moral realism", "Formal logic"],
      values: ["Radical Honesty", "Structure", "Sufficiency"],
      books: ["Daniel Kahneman - Thinking, Fast and Slow"]
    },
    {
      name: "David",
      age: 41,
      introversion: 71,
      occupation: "Data Scientist",
      location: "Toronto, Canada",
      bio: "Former humanities major turned quant. Still fascinated by existential risk, the philosophy of science, and how to stay sane in an uncertain world. I'm here to meet people who think weird is a compliment.",
      interests: ["Probability theory", "Longtermism", "Epistemic humility", "Futurology", "Meditation"],
      values: ["Conservatism", "Ambition", "Idealism"],
      books: ["Daniel Kahneman - Thinking, Fast and Slow"]
    },
    {
      name: "Mei",
      age: 31,
      introversion: 12,
      occupation: "Independent Writer",
      location: "Singapore",
      bio: "Writing essays on intellectual humility, the philosophy of language, and how thinking styles shape our lives. I appreciate calm reasoning, rigorous curiosity, and the beauty of well-defined concepts. Let's try to model each other's minds.",
      interests: ["Philosophy of language", "Bayesian reasoning", "Writing", "Dialectics", "Systems thinking"],
      values: ["Emotional Merging", "Sufficiency", "Pragmatism"],
      books: ["Daniel Kahneman - Thinking, Fast and Slow"]
    }
  ];

  const interests = new Set<string>();
  const values = new Set<string>();
  const books = new Set<string>();

  profiles.forEach(profile => {
    profile.interests.forEach(v => interests.add(v));
  });

  profiles.forEach(profile => {
    profile.values.forEach(v => values.add(v));
  });

  profiles.forEach(profile => {
    profile.books.forEach(v => books.add(v));
  });

  console.log('Interests:', [...interests]);
  console.log('Values:', [...values]);
  console.log('Books:', [...books]);

  await prisma.interest.createMany({
    data: [...interests].map(v => ({name: v})),
    skipDuplicates: true,
  });

  await prisma.value.createMany({
    data: [...values].map(v => ({name: v})),
    skipDuplicates: true,
  });

  await prisma.book.createMany({
    data: [...books].map(v => ({name: v})),
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
      // {name: 'Debate Partner'},
      {name: 'Friendship'},
      {name: 'Short-term relationship'},
      {name: 'Long-term relationship'},
    ],
    skipDuplicates: true,
  });


  // Get actual Interest & CauseArea objects
  const allInterests = await prisma.interest.findMany();
  const allValues = await prisma.value.findMany();
  const allBooks = await prisma.book.findMany();
  const allCauseAreas = await prisma.causeArea.findMany();
  const allConnections = await prisma.connection.findMany();

  // Create mock users
  for (let i = 0; i < 5; i++) {
    const profile = profiles[i % profiles.length];
    const user = await prisma.user.create({
      data: {
        email: `user${i + 1}@bayesbond.com`,
        name: profile.name,
        image: 'profile-pictures/57a821c0-cda0-4797-8654-f54f26fed414.jpg',
        profile: {
          create: {
            location: profile.location,
            birthYear: 2025 - profile.age,
            introversion: profile.introversion,
            description: `[Dummy profile for demo purposes]\n${profile.bio}`,
            gender: i % 2 === 0 ? 'Man' : 'Woman',
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
              create: allInterests
                .filter(e => (new Set(profile.interests)).has(e.name))
                .map(e => ({interestId: e.id}))
            },
            coreValues: {
              create: allValues
                .filter(e => (new Set(profile.values)).has(e.name))
                .map(e => ({valueId: e.id}))
            },
            books: {
              create: allBooks
                .filter(e => (new Set(profile.books)).has(e.name))
                .map(e => ({valueId: e.id}))
            },
            causeAreas: {
              create: [
                {causeAreaId: allCauseAreas[i % allCauseAreas.length].id},
              ],
            },
            promptAnswers: {
              create: [
                {prompt: 'What’s a belief you’ve changed your mind about after encountering strong evidence?', answer: 'I used to think willpower was the key to habit change. But research on environment design and cue-based behavior shifted my perspective. Now I optimize context, not just grit.'},
                {prompt: 'What does thinking rationally mean to you in practice?', answer: 'It means being more committed to updating my beliefs than defending them — even if it’s uncomfortable. Especially when I’m wrong.'},
                {prompt: 'What’s a concept or topic that recently captivated you?', answer: 'Emergent complexity in ant colonies — how simple rules lead to intelligent systems. It made me rethink centralized control.'},
                {prompt: 'If you could master any discipline outside your current field, what would it be and why?', answer: 'Philosophy of science. I love questioning the assumptions behind how we know what we know.'},
                {prompt: 'What do you most value in a deep connection with someone?', answer: 'Shared intellectual honesty — the ability to explore truth collaboratively, without ego or defensiveness.'},
                {prompt: 'When have you felt most deeply understood by someone?', answer: 'During a multi-hour conversation where we dissected a disagreement, not to ‘win’ but to understand each other’s frameworks'},
                {prompt: 'How do rationality and emotional closeness coexist for you?', answer: 'They reinforce each other. Being clear-headed helps me show up honestly and empathetically. I want to be close to people who care about truth — including emotional truth.'},
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

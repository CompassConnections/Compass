import {prisma} from "@/lib/server/prisma";


async function main() {
  // Create some interests & cause areas
  await prisma.interest.createMany({
    data: [
      {name: 'Philosophy'},
      {name: 'AI Safety'},
      {name: 'Economics'},
      {name: 'Mathematics'},
    ],
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
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.create({
      data: {
        email: `user${i}@bayesbond.com`,
        name: `User ${i}`,
        image: null,
        profile: {
          create: {
            location: i % 2 === 0 ? 'New York' : 'San Francisco',
            description: 'I’m a data scientist with a deep interest in decision theory, AI alignment, and effective altruism. When I’m not analyzing models or debating Bayesian reasoning, I enjoy exploring behavioral economics and reading philosophy (Kant and Parfit are favorites). Looking to connect with others who value curiosity, intellectual honesty, and constructive debate. Open to collaborating on research, causal impact projects, or just good conversations over coffee.',
            gender: i % 2 === 0 ? 'Male' : 'Female',
            personalityType: i % 3 === 0 ? 'Extrovert' : 'Introvert',
            conflictStyle: 'Avoidant',
            contactInfo: `Email: user${i}@bayesbond.com\nPhone: +1 (123) 456-7890`,
            desiredConnections: {
              create: [
                {connectionId: allConnections[i % allConnections.length].id},
              ],
            },
            intellectualInterests: {
              create: [
                {interestId: allInterests[i % allInterests.length].id},
                {interestId: allInterests[(i + 1) % allInterests.length].id},
              ],
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

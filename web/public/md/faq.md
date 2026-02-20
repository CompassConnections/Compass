# FAQ – Compass

Compass is a **gift from the community** — built by its members like you who care about deep, meaningful connections. Your participation, feedback, and contributions help keep it free, transparent, and ad-free for everyone.

## What’s new?

Stay up to date with the latest releases, features, and improvements [here](/news).

### Is Compass mentioned in the press?

Yes. You can find media coverage, our media kit, brand assets, and press contact details on the [Press page](/press).

### What is Compass?

Compass is a **free, open-source platform to help people form deep, meaningful, and lasting connections** — whether platonic, romantic, or collaborative. It’s made possible by contributions from the community, including code, ideas, feedback, and donations. Unlike typical apps, Compass prioritizes **values, interests, and personality over swipes and ads**, giving you full control over who you discover and how you connect.

### Why is the platform called Compass?

We chose the name Compass because our goal is to help people orient themselves toward the connections that matter most — not just romantically, but intellectually, socially, and collaboratively. Just as a compass points you toward true north, this platform is designed to guide you toward people who align with your values, interests, and deeper goals, helping you navigate the complexity of human relationships with more clarity and intention. It’s not about endless swiping or superficial matches; it’s about finding direction and meaning in the connections you build.

### Who is Compass for?

Anyone who wants more than small talk or casual networking. If you value **depth over quantity** and want relationships grounded in **shared values, trust, and understanding**, Compass is for you.

### Why is Compass different from other meeting apps?

- **Keyword Search**: Find people who share your niche interests (e.g., “Minimalism”, “Thinking, Fast and Slow”, “Indie
  film”).
- **Transparent Database**: See all profiles, apply filters, and search freely — no hidden algorithms.
- **Notification System**: Get alerts when new people match your searches — no endless scrolling required.
- **Personality-Centered**: Values and ideas first. Photos stay secondary.
- **Democratic & Open Source**: Built by the community, for the community — no ads, no hidden monetization.
- **Events**: Create and join real-world or virtual gatherings to form deeper connections.

### Is Compass for dating or friendship?

Both, and others things. You can specify whether you’re looking for **platonic, romantic, or collaborative connections**.

### Who started Compass?

Compass was founded by [Martin Braquet](https://www.martinbraquet.com), an engineer and researcher passionate about tackling humanity’s most pressing challenges — from climate change and AI safety to animal welfare.

Martin has lived across Europe, the U.S., India, and Indonesia, immersing himself in diverse practices ranging from meditation retreats to sustainability-focused forest co-ops. These experiences shaped his conviction that deep one-to-one human connections are among the most meaningful drivers of well-being and positive change.

Compass grew out of that conviction. While Martin has long been driven to reduce global risks and suffering, he also recognized that his own life — and the lives of many others — would be greatly enriched by more profound, close, and supportive relationships. Although he initiated the project, the platform is a gift from the community — shaped by contributors, donors, and supporters who help it thrive. Compass is many people's attempt to build an open, transparent, and community-driven platform where people can connect around shared values, curiosity, and care, without the distractions of swipes, ads, or superficiality.

Martin continues to serve as an initiator and steward of Compass, but its direction is intentionally placed in the hands of the community through the Compass Constitution (as detailed in the next section).

### How does governance work?

Compass is run democratically under a [constitution](/constitution) that prevents central control and ensures long-term alignment with its mission.

- Major decisions (scope, funding, rules) are [voted](/vote) on by **active contributors**.
- The full constitution is **public and transparent**.
- No corporate capture — Compass will always remain a community-owned project.

### Is Compass really free?

Yes. Compass will always be:

- **Ad-free**
- **Subscription-free**
- **Open-source**

Supported entirely by **donations**, not by selling your data or attention.

### How do you sustain Compass without ads or subscriptions?

Through **[donations](/support) and contributions from the community**. Options include:

- Open Collective
- Liberapay
- Ko-fi
- GitHub Sponsors
- Patreon
- PayPal
- Sharing ideas, feedback, or code

Every contribution, no matter the size — from a small code tweak to helping refine the interface, or simply spreading the word — is part of the gift that keeps Compass free, ad-free, and community-owned. All funding and expenses are **publicly documented** [here](/financials).

### Is my data safe?

Yes.

- Your data will **never be sold**.
- You can **control what is visible publicly**.
- Chat messages are stored in the database with AES-256 encryption (it may move toward **end-to-end encryption** in
  future versions).
- Stored in secure Supabase and Firebase databases.

### How is the compatibility score calculated?

The **compatibility score** comes from answers to **compatibility prompts**. Each user provides:

- **Their answer**
- **Answers they would accept from others**
- **A degree of importance** for each question

Matches are scored based on how well two people’s responses and accepted answers align, weighted by importance. See this [video](https://www.youtube.com/watch?v=m9PiPlRuy6E) for the math behind it.

The [full implementation](https://github.com/CompassConnections/Compass/blob/main/common/src/profiles/compatibility-score.ts) is **open source** and open to review, feedback, and improvement by the community.

### What are Events and why do they matter?

**Events** are at the core of Compass's mission to foster deep, meaningful connections. While profiles and compatibility
scores help you discover kindred spirits, events create the space where genuine relationships actually form.

**Why events matter for our mission:**

- **Depth through shared experience**: Meeting in person (or virtually) allows for the nuanced conversations, laughter,
  and spontaneous moments that build real trust and understanding.
- **Community building**: Events transform individual connections into a thriving ecosystem of people supporting each
  other's growth and goals.
- **Purposeful gathering**: Unlike generic social platforms, Compass events are organized around shared values,
  interests, and intentions — creating natural alignment from the start.
- **Accessibility**: Both online and in-person events ensure everyone can participate, regardless of geography or
  mobility.

Examples of events you might find or create:

- **Book clubs** — Discuss ideas that shape our worldview
- **Walking groups** — Explore nature while exploring ideas
- **Coffee chats** — One-on-one or small group deep conversations
- **Creative workshops** — Learn and create together
- **Philosophy discussions** — Explore life's big questions
- **Sustainability meetups** — Collaborate on positive impact
- **Game nights** — Bond over shared play
- **Hobby exchanges** — Teach and learn skills from each other

Anyone can [create an event](/events) — whether you're looking to find a hiking buddy, start a writers' circle, or host
a discussion about effective altruism. Events are how we turn shared values into shared lives.

### What platforms does Compass run on?

Compass is mostly both as [website](https://www.compassmeet.com/)
and [android](https://play.google.com/store/apps/details?id=com.compassconnections.app) application.

On iPhone, you can install Compass as a Progressive Web App (PWA). Open Compass in Safari (not Chrome), tap the Share
icon, then choose “Add to Home Screen.” After installing, open the app from your home screen and accept the notification
permission. iOS only supports notifications for Safari PWAs added to the home screen, so if you install via Chrome, push
notifications will not work.

A dedicated, native iOS app is planned for the coming months. It’ll be built as soon as one of our contributors (or the
core team) tackles it. If you’re interested in helping speed that up, check out the GitHub or reach out in the Discord
community.

### What is open source?

Compass is fully **open source**, which means anyone can view the code, suggest improvements, or contribute directly. This ensures transparency, prevents hidden agendas, and allows the community to shape the platform together.

Whether it’s fixing a small bug, adding a new feature, improving design, or writing tests, contributions of all sizes are welcome. You can explore the code and instructions on our [GitHub repository](https://github.com/CompassConnections/Compass).

### Does Compass have an API?

Yes. Compass exposes a **public API** for developers who want to build tools, integrations, or visualizations around the platform. The API is fully **documented via Swagger/OpenAPI**, and follows the same transparency principles as the rest of the project:

- **Open access** to non-sensitive public endpoints
- **Authenticated endpoints** for user-specific or administrative actions
- **Rate-limiting** to protect server stability
- **Versioned** to ensure backward compatibility

You can explore or test the API at [api.compassmeet.com](https://api.compassmeet.com). Developers can contribute new endpoints or suggest improvements.

### How fast is Compass growing?

Compass has officially **launched** in October 2025 and is growing fast. You can explore real-time stats and transparent community data on our [**Growth & Stats page**](/stats). It includes information such as:

- Community growth over time
- Number of active users
- Messages sent
- Discussions started
- Search bookmarks created
- Endorsements given
- Compatibility prompts
- Prompts answered
- Number of proposals and votes

[//]: # '* Contributions and donations'

Because Compass is fully transparent and community-owned, you can see how the ecosystem evolves — not just in numbers, but in how people connect, collaborate, and help shape the platform together.

### What’s the long-term vision?

Our goal is for Compass to become what Linux is for software, Wikipedia is for knowledge, or Firefox is for browsing — a public, open-source infrastructure that anyone can use, contribute to, and trust. We believe meaningful human connection deserves the same treatment: free, transparent, community-owned, and protected from corporate capture.

### What’s next?

Our focus is now toward **gathering feedback**, **growing the community** and **securing donations** to sustain and expand the platform.

Every action, whether sharing, donating, or contributing, directly helps Compass remain ad-free, subscription-free, and community-owned.

### How can I help?

- **Give Feedback**: [Fill out the suggestion form](https://forms.gle/tKnXUMAbEreMK6FC6)
- **Join the Discussion**: [Discord Community](https://discord.gg/8Vd7jzqjun)
- **Make and vote on proposals**: [vote here](/vote)
- **Contribute to Development**: [View the code on GitHub](https://github.com/CompassConnections/Compass)
- **Donate**: [Support the infrastructure](/support)
- **Spread the Word**: Tell friends and family who value depth and real connection. Post about it on forums, social
  media, etc. Share the URL or this [QR code](/referrals).

### How can I contact the community?

You can reach us through the [contact form](/contact), the [feedback form](https://forms.gle/tKnXUMAbEreMK6FC6), or any of our [socials](/social).

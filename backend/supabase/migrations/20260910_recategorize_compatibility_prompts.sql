-- Backfill compatibility_prompts.category for the 130 prompts in the 2026-09-10 export.
--
-- Supersedes the assignments in 20260909_categorize_compatibility_prompts.sql for these rows. That
-- migration was written against the previous taxonomy and uses six keys that no longer exist —
-- politics_religion, money_work, health_rhythm, conflict_communication, growth_emotions and
-- care_obligation were split or merged when COMPATIBILITY_CATEGORIES was reshaped. Applying it now
-- would write 101 rows that match nothing the filter offers.
--
-- Every value below is one key from COMPATIBILITY_CATEGORIES
-- (common/src/profiles/compatibility-categories.ts), assigned by reading the question and its
-- options. The split keys are resolved per row rather than mechanically: religion and politics part
-- ways on whether the item is a group-affiliation position or a private practice, money and work on
-- whether it is about having or about doing, health and daily_rhythm on whether it screens
-- (substances, exercise, diet) or predicts daily friction (sleep, routine, tidiness).
--
-- Two prompts already carried a valid key ('politics') and are left alone.
update compatibility_prompts as cp
set category = v.category
from (values
  (2, 'values_worldview'),            -- What is the meaning of life?
  (4, 'values_worldview'),            -- How important is it that your partner be willing and able to par
  (14, 'kids_family'),                -- If it comes to having children, would you prefer to adopt or to 
  (17, 'politics'),                   -- How much do you like to discuss politics with your close ones?
  (18, 'interests_leisure'),          -- How much do you engage in a creative hobby?
  (19, 'daily_rhythm'),               -- How clean do you keep your home?
  (20, 'money'),                      -- How careful are you with your money?
  (21, 'daily_rhythm'),               -- How much do you go out partying on weeknights?
  (22, 'values_worldview'),           -- If you had to name your greatest motivation in life thus far, wh
  (23, 'interests_leisure'),          -- How active are you at reading?
  (24, 'health'),                     -- How much do you value plant-based eating?
  (25, 'politics'),                   -- How much do you value gender roles?
  (26, 'relationship_style'),         -- I am a confident person.
  (27, 'work'),                       -- How much time do you prefer to dedicate to your work, roughly?
  (28, 'health'),                     -- How often do you exercise?
  (29, 'interests_leisure'),          -- I like to exchange memes
  (30, 'interests_leisure'),          -- Are you a cat person or a dog person?
  (31, 'health'),                     -- Smoking disgusts me.
  (32, 'money'),                      -- I value financial wealth more than social status.
  (34, 'values_worldview'),           -- I would want to be immortal if I could.
  (35, 'interests_leisure'),          -- I would enjoy a night playing video games.
  (37, 'values_worldview'),           -- Which of the following types of intelligence do you value most?
  (38, 'location_mobility'),          -- Where would you prefer to live?
  (39, 'daily_rhythm'),               -- What time do you go to bed on weeknights? 
  (40, 'relationship_style'),         -- What is your primary "Love Language?"
  (41, 'friendship_social'),          -- I like wild parties.
  (42, 'interests_leisure'),          -- I enjoy outdoor activities such as camping and hiking.
  (43, 'values_worldview'),           -- How much have your values changed since you were 16?
  (44, 'politics'),                   -- If it were up to me, I would speed up AI development.
  (45, 'work'),                       -- Are you devoted to a mission?
  (47, 'friendship_social'),          -- How often do you check social media?
  (48, 'work'),                       -- I'm a workaholic'.
  (49, 'daily_rhythm'),               -- If you don’t do anything at all for an entire day, how does that
  (50, 'politics'),                   -- I would describe myself as woke.
  (51, 'interests_leisure'),          -- How do you like to spend your free time?
  (52, 'politics'),                   -- I would describe myself as an activist.
  (53, 'money'),                      -- Do you keep a budget (of your finances)?
  (54, 'location_mobility'),          -- Travel is important to me.
  (55, 'values_worldview'),           -- It's okay to tell white lies.
  (56, 'values_worldview'),           -- What's the probability of humanity going extinct in the next 30 
  (58, 'values_worldview'),           -- I'm afraid of death.
  (59, 'daily_rhythm'),               -- I'm a morning person.
  (60, 'interests_leisure'),          -- I read more fiction than non-fiction.
  (61, 'politics'),                   -- Do you consider government taxes (such as income tax) a form of 
  (62, 'interests_leisure'),          -- How often do you watch movies?
  (63, 'politics'),                   -- Politically, which are more important to you right now?
  (64, 'interests_leisure'),          -- There is art on my walls.
  (66, 'values_worldview'),           -- Do you identify as an Effective Altruist? 
  (68, 'daily_rhythm'),               -- I like making lists.
  (69, 'interests_leisure'),          -- I am an aspiring actor/artist/writer or other creative type.
  (70, 'relationship_style'),         -- I meditate frequently.
  (71, 'values_worldview'),           -- Have you read the LessWrong Sequences?
  (72, 'relationship_style'),         -- I journal frequently.
  (73, 'friendship_social'),          -- After a busy day, I typically recharge by spending time alone to
  (132, 'values_worldview'),          -- I enjoy engaging with viewpoints that challenge my assumptions
  (144, 'daily_rhythm'),              -- I am consistent in routines that support my mental and physical 
  (150, 'relationship_style'),        -- I prefer clear boundaries and explicit expectations in relations
  (153, 'relationship_style'),        -- I prefer slow-building intimacy over rapid, intense starts
  (158, 'relationship_style'),        -- I take mental health and therapy seriously as part of personal g
  (159, 'relationship_style'),        -- I communicate best in written form when discussing complex or em
  (160, 'relationship_style'),        -- I place high importance on reliability and follow-through from o
  (180, 'money'),                     -- I am comfortable living frugally and saving or donating what I d
  (183, 'kids_family'),               -- I would like to have children in the future
  (184, 'relationship_style'),        -- I value spending at least a couple of meaningful hours per day w
  (185, 'location_mobility'),         -- Geography is flexible for me if I find the right people
  (201, 'relationship_style'),        -- If major conflicts arise early, it usually means fundamental inc
  (202, 'relationship_style'),        -- The right partner should require minimal effort to maintain harm
  (215, 'values_worldview'),          -- I care more about coherence and evidence than social harmony
  (218, 'values_worldview'),          -- Reality is ultimately knowable with enough time and effort
  (219, 'values_worldview'),          -- The universe is better explained as probabilistic than determini
  (220, 'interests_leisure'),         -- How do you feel about long abstract conversations?
  (225, 'interests_leisure'),         -- I regularly seek out nature because it restores me
  (227, 'values_worldview'),          -- Modern lifestyles harm the planet in ways I cannot ignore
  (229, 'money'),                     -- Owning more things often reduces freedom and happiness
  (237, 'relationship_style'),        -- I can usually calm myself down when overwhelmed
  (242, 'values_worldview'),          -- I show up for people even when it’s not easy or fun
  (251, 'values_worldview'),          -- I sometimes disrupt stable situations to pursue something better
  (257, 'money'),                     -- You hate money
  (258, 'politics'),                  -- You are anti-capitalist
  (259, 'health'),                    -- Is health and wellness as important as attraction and chemistry 
  (260, 'interests_leisure'),         -- Do you appreciate or like talking about sports with people?
  (261, 'values_worldview'),          -- When making big life decisions, which do you trust most?
  (262, 'values_worldview'),          -- What gives your life the most meaning right now?
  (263, 'values_worldview'),          -- How do you define success?
  (264, 'relationship_style'),        -- When faced with conflict, your instinct is to:
  (265, 'relationship_style'),        -- When someone close to you is upset, what do you usually offer fi
  (267, 'relationship_style'),        -- What pace of emotional intimacy feels right to you?
  (268, 'relationship_style'),        -- How do you usually handle misunderstandings?
  (269, 'friendship_social'),         -- What kind of conversations energize you most?
  (271, 'relationship_style'),        -- When faced with ambiguity or uncertainty:
  (272, 'daily_rhythm'),              -- Your ideal daily rhythm looks like:
  (273, 'interests_leisure'),         -- In free time, you’re most likely to:
  (274, 'daily_rhythm'),              -- When plans change last-minute, you usually feel:
  (275, 'values_worldview'),          -- What principle guides your decisions most?
  (276, 'values_worldview'),          -- What best describes your relationship with belief systems (relig
  (277, 'values_worldview'),          -- When thinking about the future of humanity, you feel:
  (278, 'relationship_style'),        -- When life feels stagnant, you’re most likely to:
  (279, 'relationship_style'),        -- How do you respond to failure?
  (280, 'values_worldview'),          -- If someone you care about challenges your worldview:
  (556, 'sex_intimacy'),              -- Would you consider having a serious relationship with an active 
  (929, 'relationship_style'),        -- Generally speaking, are you a worrier?
  (1003, 'interests_leisure'),        -- Do you regularly paint or sculpt?
  (1131, 'politics'),                 -- Do you think people living in rural areas are more ignorant, on 
  (1136, 'politics'),                 -- Should drunk drivers who kill people in auto crashes face the de
  (1268, 'relationship_style'),       -- Are you a different person in public and in private?
  (1373, 'sex_intimacy'),             -- Would you be willing to engage in mutual masturbation with someo
  (1467, 'interests_leisure'),        -- Is being 'in-style' with regards to fashion important to you?
  (1493, 'politics'),                 -- Is it okay for men to wear makeup?
  (1520, 'values_worldview'),         -- Let's say a close friend told you something in confidence, but y
  (1569, 'values_worldview'),         -- You walk out of your home first thing in the morning, late for w
  (1773, 'interests_leisure'),        -- Do you enjoy gardening?
  (1831, 'interests_leisure'),        -- Have you ever attended -- or would you attend -- a Sci-Fi/Anime/
  (2074, 'relationship_style'),       -- Have you ever had multiple romantic partners during the same tim
  (2114, 'values_worldview'),         -- Do you consider a person's social class when you interact with t
  (2125, 'kids_family'),              -- Which of the following is MORE important to you:
  (2196, 'values_worldview'),         -- You see a mother breastfeeding at the mall.  For the most part s
  (2276, 'values_worldview'),         -- Is astrological sign at all important in a match?
  (2321, 'kids_family'),              -- Would you consider dating a person who is a single parent of a '
  (2423, 'relationship_style'),       -- If you had to choose one for the rest of your life, which would 
  (2549, 'kids_family'),              -- Can someone who cheats on their partner be a fit parent?
  (2784, 'kids_family'),              -- Would you be happy raising the kids while your spouse worked?
  (2876, 'health')                    -- Would you go out with a smoker?
) as v (id, category)
where cp.id = v.id;

-- Six prompts belong to no domain in the taxonomy: personal quirks and a life-satisfaction item that
-- measure nothing two people would have to negotiate. Left null on purpose rather than pushed into
-- the nearest bucket — a wrong category silently inflates a domain's share of the corpus, and a null
-- one is visibly missing.
update compatibility_prompts
set category = null
where id in (15, 16, 65, 67, 270, 1212);

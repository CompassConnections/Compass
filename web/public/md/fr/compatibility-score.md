# Comment le score de compatibilité fonctionne

Le nombre affiché sur un profil estime une seule chose : **la probabilité que vous soyez heureux ensemble
sur le long terme**, si vous formiez un couple. C’est de l’arithmétique sur ce que vous avez tous deux
écrit sur Compass, rien d’autre. Pas de modèle, pas de classement caché, pas de coup de pouce payant.
Chaque règle ci-dessous se trouve dans le
[code open source](https://github.com/CompassConnections/Compass/blob/main/common/src/profiles/compatibility-factors.ts),
et sur tout profil vous pouvez ouvrir le détail pour voir chaque ligne par vous-même.

**Gardez à l’esprit que le score n’est qu’une estimation approximative.** Aucune étude ne mesure
rigoureusement la capacité des algorithmes d’appariement à prédire si une relation fonctionnera. Prenez-le
donc comme un point de départ, restez ouvert et faites connaissance avec des personnes différentes pour
découvrir ce qui vous convient le mieux.

Concrètement, un score sous 50 % signifie en général que vous achoppez sur un point que l’un de vous
considère comme rédhibitoire, comme les enfants, la distance ou l’âge. Un score élevé ne garantit pas que
vous vous entendrez : il fait de cette personne une candidate prometteuse parmi d’autres. L’essentiel de ce
qui rend deux personnes compatibles n’apparaît qu’une fois qu’elles se parlent.

## Ce que disent les études

Les preuves sont très minces, parce que l’étude idéale, apparier des gens au hasard et mesurer comment ils
s’entendent, est difficile à mener de façon éthique (on ne peut pas forcer des gens à se fréquenter longtemps).
Et, malheureusement, ceux qui ont déployé des algorithmes d’appariement à grande échelle (les grandes
applications de rencontre) ont un intérêt financier à ce que leurs algorithmes ne fonctionnent pas, et encore
moins à publier leurs données sur la question. Voyons ce qui a été fait et ce que nous en retenons.

- **L’attirance après un speed-dating** ([Joel, Eastwick & Finkel, 2017](https://journals.sagepub.com/doi/10.1177/0956797617714580)). Les participants ont rempli
  une centaine de mesures auto-déclarées avant d’enchaîner des speed-datings tirés au sort, puis ont noté leur
  attirance pour chaque personne rencontrée. Une partie de l’attirance s’expliquait par l’attrait que la
  personne exerce sur les gens en général et par la propension du participant à être attiré par les gens en
  général. Mais le questionnaire n’expliquait pas si une paire donnée allait s’attirer plus ou moins que
  d’autres. Ce n’est pas étonnant quand on regarde les détails : les participants étaient tous des étudiants de
  19 ans d’une seule université américaine. Le questionnaire passait aussi à côté des questions qui nous
  semblent les plus prédictives d’une relation heureuse : enfants, lieu, religion, alimentation, études,
  carrière envisagée, projet de vie (mariage, façon d’élever les enfants, etc.) et les autres valeurs que l’on
  retrouve dans nos propres questions de compatibilité. Le fait que tous les participants viennent du même
  milieu n’arrange rien, puisqu’un questionnaire peine alors à les distinguer. La plupart des questions
  portaient plutôt sur des traits de personnalité, comme le Big Five, l’attachement, la sociosexualité et des
  auto-évaluations de soi et du partenaire idéal (rationnel, créatif, optimiste, etc.). Mais la raison
  principale pour laquelle cette étude ne devrait pas peser lourd dans la recherche sur la compatibilité, c’est
  la durée absurdement courte de l’interaction : **quatre minutes**. Quatre minutes mesurent une première
  attirance, rien qui ressemble à la durée d’une relation (c’est-à-dire la compatibilité).
- **Ce qui prédit un couple heureux** ([Joel et al., 2020](https://www.pnas.org/doi/10.1073/pnas.1917036117)). La même autrice principale a ensuite
  regroupé 11 196 couples issus de 43 études pour chercher ce qui prédit le mieux la satisfaction de chaque
  partenaire. Les faits sur chaque personne (personnalité, humeur, âge, études, revenus) en expliquaient au plus
  un cinquième. Ce que chacun disait de la relation elle-même (l’engagement perçu du partenaire, le sentiment
  d’être apprécié, la sexualité, les conflits) en expliquait deux fois plus, et les réponses du partenaire
  n’ajoutaient rien. Selon les auteurs, « qui je suis » compte à peine une fois que l’on sait « qui je suis quand
  je suis avec toi ». Cela ne dit pas pour autant si deux inconnus s’entendraient. Il s’agissait de couples qui
  s’étaient déjà choisis, souvent des années plus tôt, si bien que toute paire séparée par un critère
  éliminatoire ne s’était jamais formée ou avait rompu avant le début de l’étude. À cause de ce biais de
  survie, un décalage qui a déjà éloigné des gens avant qu’ils ne forment un couple ne peut pas apparaître comme
  prédicteur, et l’effet de tout décalage est sous-estimé : les couples qui ont franchi un écart et sont encore
  ensemble sont ceux pour qui il comptait le moins. C’est aussi pourquoi ajouter les réponses du partenaire à
  celles de la personne n’a apporté que deux points de variance expliquée, et pourquoi la religion, la politique,
  les études et « ce que je veux chez un partenaire » figurent en bas de leur liste. Les auteurs eux-mêmes
  appellent à étudier les débuts de relation, là où ces filtres agissent.
- **Les mariages interconfessionnels finissent plus souvent** ([Lehrer & Chiswick, 1993](https://doi.org/10.2307/2061647); [Call & Heaton, 1997](https://doi.org/10.2307/1387856); [Vaaler, Ellison & Powers, 2009](https://doi.org/10.1111/j.1741-3737.2009.00644.x)). Les enquêtes de satisfaction comme celle
  ci-dessus n’entendent que les couples encore ensemble : elles ne voient pas ce qu’un décalage a coûté à ceux
  qui ne le sont plus. Le divorce, lui, est un événement, et les démographes le suivent depuis des décennies dans
  de grands panels de ménages américains. Les couples de confessions différentes se séparent plus souvent que les
  couples de même confession ; l’écart est maximal entre les religions les plus éloignées et se réduit quand les
  deux sont proches par les croyances et les pratiques. Partager une religion pesait à peu près autant que l’âge
  au mariage, et une différence de fréquence de pratique comptait plus que l’étiquette de chacun. Les limites
  habituelles s’appliquent : échantillons américains, couples mariés des années 1980 et 1990, et ceux qui se sont
  mariés hors de leur confession étaient probablement déjà les moins attachés à la leur, ce qui fait paraître
  l’effet plus petit qu’il n’est, pas plus grand. C’est pourquoi la religion figure dans le score comme une ligne
  graduée plutôt qu’un critère éliminatoire, et pourquoi nous préférons la sous-pondérer que l’ignorer.
- **Sur quoi les couples se ressemblent vraiment** ([Horwitz et al., 2023](https://www.nature.com/articles/s41562-023-01672-z.pdf)). Une méta-analyse de 199 études
  sur 22 traits, plus 79 074 couples de la UK Biobank, qui pose une question plus simple que les précédentes : à quel
  point les deux membres d’un couple se ressemblent-ils ? Beaucoup sur les valeurs politiques (corrélation 0,58), la
  religiosité (0,56), le niveau d’études (0,55, sur près de deux millions de paires) et le tabac (0,49), un peu sur
  l’alcool (0,42), et à peine sur la personnalité : ouverture 0,21, conscienciosité 0,16, névrosisme et agréabilité
  0,11, extraversion 0,08. Le seul trait où les contraires s’assemblent un peu plus que le hasard est le fait d’être
  du matin ou du soir. L’étude ne voit que des couples déjà formés, si bien qu’une corrélation mélange trois choses
  qu’elle ne peut pas séparer : choisir quelqu’un qui nous ressemble, rencontrer surtout des gens qui nous
  ressemblent (campus, lieux de travail, quartiers) et se rapprocher au fil des années, ce qui explique sans doute
  une bonne part des chiffres sur le tabac et l’alcool. Elle ne dit rien non plus sur le bonheur des couples qui se
  ressemblent. Ce qu’elle nous donne, c’est un classement de ce sur quoi les gens finissent par se trier, sur deux
  millions de couples : les valeurs et les habitudes en haut, la personnalité en bas. C’est la distinction que fait
  ce score, et la raison pour laquelle la ligne Big Five pèse aussi peu. Elle suggère aussi que les études, le tabac
  et l’alcool méritent peut-être plus que le demi-point que nous leur donnons.
- **Les algorithmes d’appariement fonctionnent-ils ?** ([Finkel et al., 2012](https://www.psychologicalscience.org/publications/journals/pspi/online-dating.html)). Une revue de soixante
  pages sur les rencontres en ligne par cinq chercheurs en relations, dont deux auteurs de l’étude de
  speed-dating ci-dessus. Sur l’appariement, ils n’ont trouvé **aucune preuve convaincante qu’un algorithme
  fonctionne**, pour une raison simple : eHarmony, Chemistry et les autres n’ont jamais publié ni leurs données
  ni leurs méthodes, et les rares études qu’ils citaient comparaient le taux de réussite de leurs propres clients à
  un échantillon quelconque de célibataires. Cela en dit plus sur la motivation de ces clients (des gens qui ont
  payé pour un site orienté mariage, plus âgés, et qui ont rempli un long questionnaire) que sur la question de
  savoir si ces mêmes clients s’en seraient moins bien sortis sans l’algorithme, en parcourant les profils
  eux-mêmes. Les auteurs vont plus loin et
  soutiennent qu’aucun algorithme nourri seulement de ce que l’on sait avant une rencontre ne peut expliquer
  plus qu’une petite part des issues à long terme, parce qu’il ne peut pas savoir comment le couple va
  interagir, évoluer et affronter ce que la vie lui réserve. Ils reconnaissent que la similarité sur les valeurs
  qui organisent une vie commune, comme la religion et la vision des rôles familiaux, est « un début », et
  qu’un algorithme peut au moins écarter les personnes qui font de mauvais partenaires en général. Nous sommes
  d’accord avec tout cela, et c’est pourquoi ce score est présenté comme un filtre et non comme une prédiction.
  Gardez à l’esprit qu’ils passent en revue une industrie qui n’a jamais laissé personne regarder : « aucune
  preuve » signifie non testé, pas testé et raté.
- **Les défauts pèsent plus que les atouts** ([Jonason et al., 2015](https://journals.sagepub.com/doi/full/10.1177/0146167215609064)). Six études et plus de 6 500
  personnes. Des étudiants ont listé ce qui éliminerait quelqu’un, un sondage de 2 744 célibataires américains
  a coché ses critères rédhibitoires dans une liste, et d’autres groupes ont noté des partenaires fictifs décrits
  en quelques lignes, avec ou sans défaut. Les gens accordaient plus de poids à un défaut qu’à une qualité
  comparable, davantage pour une relation durable que pour une aventure, et les femmes plus que les hommes. Les
  critères les plus fréquents étaient un mode de vie malsain, le fait d’être peu fiable ou indifférent, de déjà
  fréquenter quelqu’un, et de vouloir un autre type de relation. En dehors du sondage national, les participants
  étaient là encore surtout des étudiants, personne n’a rencontré personne, et demander aux gens ce qu’ils
  rejetteraient n’est pas la même chose que regarder ce qu’ils rejettent : la recherche sur le speed-dating
  montre que les deux peuvent beaucoup diverger. Cela reste la meilleure preuve dont nous disposons que les
  critères éliminatoires déclarés sont ce que les gens regardent en premier, d’où leur place en tête de ce score.
- **Similarité perçue ou réelle** ([Montoya, Horton & Kirchner, 2008](https://journals.sagepub.com/doi/abs/10.1177/0265407508096700)). Une méta-analyse de 313 études.
  Être semblable à quelqu’un prédit fortement qu’on l’apprécie quand les deux ne se rencontrent jamais et ne
  lisent qu’une description l’un de l’autre, moins quand ils discutent brièvement, et plus du tout dans une
  relation établie. Se sentir semblable, en revanche, prédit l’appréciation dans les trois cas. La plupart de
  ces études sont de vieilles expériences de laboratoire où des étudiants notaient un inconnu à partir d’un
  questionnaire d’opinions rempli, à peu près aussi loin d’une relation qu’on puisse l’être, et quand on
  apprécie quelqu’un on a aussi tendance à le trouver semblable, si bien qu’une partie de l’effet va dans
  l’autre sens. Ce que cela nous apprend est modeste : un profil donne un sentiment de similarité ou de
  différence avant la rencontre, et ce sentiment décide qui reçoit un premier message, tandis que le
  recoupement réel des opinions compte peu une fois que deux personnes se connaissent. C’est aussi pourquoi les
  questions demandent une explication et pas seulement une case cochée.
- **Se confier crée la proximité** ([Aron et al., 1997](https://ggia.berkeley.edu/practice/36_questions_for_increasing_closeness)). Des paires d’inconnus dans un cours de
  psychologie ont passé 45 minutes à répondre à 36 questions de plus en plus personnelles, de « aimeriez-vous
  être célèbre » à « quand avez-vous pleuré pour la dernière fois devant quelqu’un », pendant qu’un groupe
  témoin faisait la conversation. Ensuite, les paires aux 36 questions jugeaient leur nouvelle connaissance plus
  proche que la relation la plus proche dans la vie d’environ 30 % d’étudiants comparables, et des semaines plus
  tard 57 % s’étaient reparlé et 35 % avaient fait quelque chose ensemble. Apparier les paires sur leurs
  opinions ou leur dire qu’elles allaient s’apprécier ne changeait rien. Il s’agissait là encore d’étudiants
  d’une seule université, les paires étaient mixtes ou composées de deux femmes, et les auteurs disent
  clairement que l’objectif était la proximité à la fin de l’heure, pas une relation ; les titres sur « les 36
  questions pour tomber amoureux » sont venus bien plus tard. Nous retenons le mécanisme plutôt que le
  résultat : la confidence réciproque et progressive crée vite de la proximité, et le fait d’être d’accord sur
  des opinions, non. Une question accompagnée d’une vraie explication est un petit premier pas de ce genre.

**Ce que nous en retenons.** Les preuves sont faibles, et personne ne devrait prétendre qu’un
algorithme peut choisir votre partenaire. À l’inverse, rien ne prouve non plus qu’un algorithme soit
inutile. Ce qui s’en dégage pour nous, c’est que le score peut remplir trois tâches étroites, et ne
prétend rien de plus :

- **Écarter les incompatibilités structurelles.** Un profil prédit avec justesse une absence de
  compatibilité quand il y a un critère éliminatoire : enfants, monogamie, lieu, âge, religion,
  alimentation (pour certains d’entre nous). Ils sont en tête de ce score, et nous les filtrons par
  défaut dans vos résultats de recherche.
- **Faire ressortir les points communs.** Les préférences (valeurs, habitudes, points communs) font
  ressortir des candidats prometteurs, mais sans la précision nécessaire pour désigner parmi eux la
  personne compatible. La similarité de valeurs, de projets et de parcours est liée à la stabilité, là
  où la similarité de traits de personnalité ne l’est guère. C’est pourquoi les questions portent sur
  les valeurs et les comportements, et pourquoi la ligne Big Five pèse peu.
- **Vous donner de quoi parler.** L’essentiel de ce qui rend deux personnes compatibles ne se révèle
  qu’en interagissant. Une question accompagnée d’une explication est un petit acte de confidence : elle
  crée de la proximité et catalyse l’interaction qui vous dira si une relation pourrait fonctionner.

## Les critères éliminatoires d’abord

Quelques incompatibilités rendent tout le reste sans objet. Quand l’une d’elles s’applique, la paire ne
reçoit aucun score, et le profil en donne la raison à la place du nombre :

- **Genre** — vous n’êtes pas le genre recherché l’un par l’autre.
- **Type de lien** — l’un de vous cherche uniquement l’amitié et l’autre uniquement une relation. Laisser
  le champ vide n’est jamais compté contre vous.
- **Style relationnel** — vous voulez tous deux une relation, et l’un est strictement monogame tandis que
  l’autre est strictement polyamoureux ou en relation ouverte.
- **Enfants** — vous voulez tous deux une relation et avez donné des réponses opposées sur le désir
  d’enfants (plus de deux crans d’écart sur l’échelle à cinq niveaux). Des réponses voisines sont une
  différence de degré et comptent plus bas.

La tranche d’âge et la distance ne sont **pas** des critères éliminatoires. Être hors de la tranche
indiquée par quelqu’un coûte cher, mais c’est un coût, pas un mur.

## De quoi le score est fait

Chaque ligne ci-dessous produit un nombre entre 0 et 1 et porte un poids. Les réponses aux questions
sont la ligne la plus lourde dès que vous en avez répondu quelques-unes ; vos profils fournissent le
reste.

- **Réponses aux questions** — poids jusqu’à 8, croissant avec les réponses communes. Pour chaque question à laquelle vous avez tous deux répondu : votre réponse, les réponses que vous accepteriez et l’importance que vous y accordez, dans les deux sens. Le poids part de 0 et atteint son maximum à 100 réponses communes.
- **Tranche d’âge** — poids 3. Note maximale dans la tranche indiquée par l’autre. En dehors : la moitié pour 1 à 2 ans, un cinquième pour 3 à 5, presque rien au-delà. Le sens le plus défavorable compte.
- **Désir d’enfants** — poids 3. Même réponse → 1, un cran d’écart → 0,85, deux crans → 0,6. Uniquement si vous voulez tous deux une relation.
- **Distance** — poids 3. Note maximale jusqu’à 40 km, puis une pente douce qui ne descend jamais sous 0,6 — sauf si l’un de vous a fixé une distance maximale : au-delà, la ligne chute progressivement jusqu’à presque rien à deux fois et demie la limite.
- **Statut relationnel** — poids 2. L’un célibataire et l’autre marié ou en relation longue, sans qu’aucun soit ouvert ou polyamoureux → 0,1. Uniquement si vous voulez tous deux une relation.
- **Langue commune** — poids 2. Au moins une langue en commun → 1, aucune → 0,1.
- **Centres d’intérêt, causes et travail partagés** — poids 2. Comparés par nom à travers les trois listes, de sorte qu’« altruisme efficace » compte que vous l’ayez classé comme centre d’intérêt ou comme cause. Plus de recoupement, meilleure note ; rien en commun → 0,5.
- **Alimentation** — poids 2 si l’un de vous est végane ou végétarien, sinon 0,5. Végane avec végane, ou végétarien avec végétarien → 1 ; végane avec végétarien → 0,9 ; végétal avec pescétarien → 0,6 ; végétal avec omnivore → 0,3. Deux omnivores en tirent peu (0,8).
- **Religion** — poids 1,5. Quelque chose en commun → 1, rien → 0,4.
- **Politique** — poids 1,5. Quelque chose en commun → 1, rien → 0,4.
- **Style relationnel** — poids 1. Réponses identiques → 1, recoupement partiel → 0,8. Uniquement si vous voulez tous deux une relation.
- **Cannabis**, **psychédéliques** — poids 1 chacun. Votre préférence déclarée sur l’usage d’un partenaire, face à son usage réel : « je préfère qu’il n’en consomme pas » avec un usage régulier → 0,1, « je préfère qu’il en consomme » avec jamais → 0,3, etc. Le sens le plus défavorable compte.
- **Personnalité Big Five** — poids 1. 1 moins l’écart moyen sur les cinq traits.
- **Tabac** — poids 0,5. Pareil → 1, différent → 0,5.
- **Alcool** — poids 0,5. Des consommations mensuelles proches notent mieux ; 20 verres d’écart ou plus → 0,4.
- **Exercice** — poids 0,5. Même fréquence → 1, un palier d’écart → 0,8, deux → 0,5.
- **Études** — poids 0,5. À un niveau d’écart → 1, deux → 0,8, plus → 0,6.

## Comment les lignes se combinent

Le score est une **moyenne géométrique pondérée** des lignes. En clair : on multiplie les lignes entre
elles, chacune élevée à sa part du poids total. Contrairement à une moyenne classique, une ligne très
basse sur un sujet important fait baisser tout le nombre au lieu d’être compensée par une douzaine de
bonnes lignes — ce qu’un quasi-critère éliminatoire doit faire. Aucune ligne ne peut descendre sous
0,05, donc une seule mauvaise ligne ne met jamais le score à zéro à elle seule.

## La fourchette probable

Chaque ligne est une estimation, donc chaque ligne porte une fourchette, et le score en affiche une
aussi : « 72 %, probablement entre 58 % et 84 % ». Les lignes auxquelles vous avez tous deux répondu
ont une fourchette étroite. Une ligne que l’un de vous a laissée vide n’est **pas traitée comme une
incompatibilité** : elle est comptée à une valeur neutre, avec une large fourchette et la moitié de son
poids. C’est pourquoi un profil à moitié vide se lit « quelque part entre 40 % et 90 % » plutôt que
comme un nombre sûr de lui, et pourquoi la fourchette se resserre à mesure que l’un de vous en remplit
davantage. La fourchette de la ligne des questions se resserre à mesure que vous répondez tous deux à
plus de questions.

**Le tri utilise le bas de la fourchette.** Quand vous triez les personnes par compatibilité, l’ordre
suit le bas de chaque fourchette, pas le nombre du milieu. Deux profils affichant 86 % ne sont pas
équivalents quand l’un est « 80 à 90 » et l’autre « 56 à 98 » : le second a laissé la plupart des
champs vides et se trouve correspondre sur les quelques-uns remplis. Classer par le bas de la
fourchette place en premier la paire dont on sait le plus, et cela signifie que remplir votre profil
ou répondre aux questions vous fait monter — laisser des champs vides, jamais. Le nombre affiché sur
une carte reste l’estimation du milieu.

## Ce qui est volontairement laissé de côté

L’origine ethnique et la taille ne sont jamais notées : personne n’exprime de préférence à leur sujet sur
Compass, et nous ne les noterions pas même si c’était le cas. Le MBTI est ignoré parce que sa validité
est faible et que le Big Five couvre le terrain. Le neurotype, l’orientation sexuelle (votre préférence
de genre porte déjà la correspondance), le lieu où vous avez grandi et tout texte libre — bio,
mots-clés, profession — ne sont pas notés non plus.

## Lire le détail

Sur tout profil, le bloc de compatibilité dans la colonne de droite ouvre le détail : le score global, le
score des questions seules, chaque ligne avec son poids et sa fourchette, et les lignes encore inconnues
parce que l’un de vous a laissé un champ vide. Le détail est calculé en direct dans votre navigateur à
partir des deux profils ; le nombre stocké utilisé pour le tri se met à jour peu après qu’un de vous
modifie son profil.

Le code est public et les contributions sont bienvenues :
[`compatibility-factors.ts`](https://github.com/CompassConnections/Compass/blob/main/common/src/profiles/compatibility-factors.ts)
pour les facteurs et
[`compatibility-score.ts`](https://github.com/CompassConnections/Compass/blob/main/common/src/profiles/compatibility-score.ts)
pour le score des questions.

## C’est une première version

C’est la première version du score, et nous la testons. Tout ce qui précède est un ensemble de règles et
de poids choisis à la main, pas un modèle entraîné sur des résultats, et nous comptons les faire évoluer
à mesure que nous apprenons. Si une ligne vous semble fausse, si un poids vous paraît mal réglé, ou si
le nombre ne correspond pas à votre expérience avec quelqu’un, dites-le-nous.

Ce qui nous ferait le plus bouger, ce sont des preuves : une étude, des données ou votre propre
expérience montrant que les profils et les algorithmes prédisent la compatibilité mieux que nous le
pensons, ou moins bien. Nous sommes aussi prêts à rendre le score plus ambitieux qu’à le rendre plus
modeste. Envoyez-les via le [formulaire de contact](/contact), le
[formulaire de retour](https://forms.gle/tKnXUMAbEreMK6FC6), ou ouvrez un ticket sur
[GitHub](https://github.com/CompassConnections/Compass/issues).

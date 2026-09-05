# Politique de confidentialité

Compass repose sur l'idée que vous devriez pouvoir voir comment la plateforme fonctionne. Cela vaut aussi pour
vos données : cette page cherche donc à décrire fidèlement ce qui se passe réellement — jusqu'au nom de chaque
cookie et de chaque prestataire — plutôt qu'à servir d'avertissement juridique. Si quelque chose ici ne
correspond pas à ce que fait l'application, c'est un bug : [dites-le-nous](/contact) et nous corrigerons la
page ou le code.

## Ce que nous collectons

- **Informations de compte** — votre adresse e-mail et tout ce que vous mettez dans votre profil : nom, âge,
  lieu, photos, biographie, réponses aux questions et réponses de compatibilité.
- **Contenus que vous créez** — messages, commentaires, événements, témoignages et votes.
- **Données d'usage** — quelles pages vous ouvrez et quelles fonctionnalités vous utilisez, pour savoir ce qui
  vaut la peine d'être construit. Voir [cookies et stockage local](/privacy#cookies-et-stockage-local)
  ci-dessous pour le détail exact de cette collecte.
- **Données techniques** — l'adresse IP et le navigateur avec lesquels vos requêtes arrivent, que tout serveur
  web voit nécessairement, ainsi que les rapports d'erreur quand quelque chose casse.

L'essentiel de votre profil est **public par conception** : tout l'intérêt d'un annuaire ouvert est que les
gens puissent se trouver sans qu'un algorithme décide à leur place. Ce qui est visible reste sous votre
contrôle dans les [paramètres](/settings), et rien de ce que vous n'avez pas rempli n'est affiché.

## Comment nous les utilisons

Vos données servent à faire fonctionner la plateforme, à vous montrer aux personnes qui cherchent quelqu'un
comme vous, et à déterminer quoi améliorer ensuite.

- Nous **ne vendons pas vos informations personnelles** et nous n'affichons pas de publicité.
- Nous ne partageons pas votre position précise avec d'autres membres sans votre consentement explicite.
- Nous n'entraînons aucun modèle sur vos contenus, et nous ne les vendons ni ne les partageons pour la
  publicité de qui que ce soit. Compass envoie en revanche du contenu à des prestataires d'IA pour deux
  fonctions facultatives que vous déclenchez vous-même — voir
  [Fonctions d'IA](/privacy#fonctions-d-ia-et-ce-que-nous-leur-envoyons) ci-dessous, qui détaille exactement
  ce qui part où.
- Les chiffres agrégés et non identifiants — nombre de membres, croissance, activité — sont publiés ouvertement
  sur [/stats](/stats), parce qu'une plateforme qui demande votre confiance devrait montrer ses propres
  chiffres.

## Les e-mails que nous envoyons, et les inscriptions interrompues

Chaque e-mail de Compass est de l'un de deux types. La plupart concernent ce que vous avez demandé à suivre —
un nouveau message, une correspondance, une recherche enregistrée qui a trouvé quelqu'un — et chacun se
désactive séparément dans les [paramètres](/settings#1). Quelques-uns concernent le compte lui-même : la
confirmation de votre adresse, et l'avis décrit ci-dessous. Ceux-là ne sont pas de la prospection et partent
quels que soient vos réglages de notification, parce qu'ils sont le moyen de vous dire ce que nous détenons à
votre sujet.

**Si vous commencez une inscription sans la terminer.** S'inscrire crée d'abord un identifiant de connexion,
puis un profil. Si vous créez l'identifiant — avec une adresse e-mail, ou via Google ou Apple — sans jamais
terminer le profil, nous détenons cette adresse et rien d'autre : pas de profil, pas de nom, rien de visible
pour qui que ce soit. Trois jours plus tard, nous envoyons **un** e-mail pour le dire, avec un lien pour
terminer et un lien pour supprimer l'identifiant sur-le-champ. Si rien ne se passe dans les **30 jours**
suivant cet e-mail, l'identifiant est supprimé automatiquement, adresse comprise. Les identifiants laissés
inachevés depuis **six mois** sont supprimés sans e-mail, parce qu'un message inattendu d'un site dont vous ne
vous souvenez pas est pire que pas de message du tout. Il n'y a pas de second rappel : cet e-mail existe pour
qu'aucune adresse que vous avez oublié nous avoir donnée ne reste chez nous, pas pour vous faire revenir.

## Cookies et stockage local

Les cookies sont la partie d'une politique de confidentialité qui reste d'ordinaire la plus vague : voici donc
la liste complète. Selon le droit européen (RGPD et directive ePrivacy), une partie est **strictement
nécessaire** et ne demande aucune autorisation, une autre exige votre **consentement**. Chaque entrée précise
laquelle — honnêtement.

### `analytics-consent` — nécessaire

Le choix que vous avez fait dans l'invite : « Autoriser » ou « Non merci ». Enregistrer un refus est le seul
moyen de ne pas reposer la question à chaque page, et c'est précisément pourquoi un cookie de consentement est
lui-même dispensé de consentement. Conservé un an, après quoi nous redemandons plutôt que de supposer qu'une
décision prise sur une version antérieure de la plateforme vaut toujours.

### `lang` — nécessaire

La langue que vous avez choisie dans le sélecteur de langue. Conservé un an, `SameSite=Lax`, avec `Secure` en
HTTPS. Écrit uniquement lorsque vous changez effectivement de langue, ce qui en fait un cookie de préférence et
non de pistage — aucun consentement requis.

### `ph_…_posthog` et `dmn_chk_…` — mesure d'audience, soumis au consentement

Déposés par [PostHog](https://posthog.com), l'outil d'analyse produit avec lequel nous comptons les pages vues
et l'usage des fonctionnalités. Ils contiennent un identifiant d'appareil et de session générés aléatoirement —
ni votre nom ni votre e-mail, même si l'identifiant est relié à celui de votre compte une fois connecté.
`dmn_chk_` est une sonde éphémère qui sert à PostHog à déterminer sur quel domaine il peut écrire. PostHog
recopie également les mêmes valeurs dans le `localStorage`.

**C'est la catégorie qui exige légalement votre consentement : nous le demandons donc avant que quoi que ce
soit ne démarre.** PostHog n'est pas lancé tant que vous n'avez pas cliqué sur « Autoriser » dans la petite
invite en coin. Cliquez sur « Non merci » et il n'est jamais chargé — et tout ce qu'il avait stocké lors d'une
visite précédente est supprimé sur-le-champ. Vous pouvez changer d'avis à tout moment depuis les
[paramètres](/settings).

### `FBUSER_…` — supprimé

Une version antérieure de Compass recopiait votre session Firebase dans un cookie afin que les pages puissent
être rendues côté serveur en vous considérant déjà connecté. Plus rien ne le lisait, et il contenait un jeton
de longue durée sous une forme lisible par JavaScript : il a donc disparu. L'application le **supprime
activement** au chargement de la page, ce qui l'efface aussi des navigateurs qui en portent encore un.

### Ce qui est stocké sur votre appareil sans être un cookie

Les mêmes règles couvrent tout stockage sur votre appareil ; par souci d'exhaustivité :

- **`device-token`** — un identifiant aléatoire dans le `localStorage` qui nous permet de reconnaître un
  navigateur pour lutter contre les abus et la fraude. Nécessaire, aucun consentement requis.
- **`theme`, `font-preference` et les données de profil en cache** — vos réglages d'affichage et une copie de
  votre propre profil pour que l'application s'affiche avant la réponse du réseau. Préférences et cache ; ils
  ne quittent jamais votre appareil.
- **Données d'erreur et de rejeu de session** — voir [Sentry](/privacy#les-tiers-dont-nous-dependons)
  ci-dessous.

## Les tiers dont nous dépendons

Compass est un petit projet : il tourne donc sur l'infrastructure d'autres. Chacun de ces services traite une
partie de vos données pour notre compte, et chacun a sa propre politique de confidentialité qui vaut la lecture :

- **[Supabase](https://supabase.com/privacy)** — la base Postgres qui contient les profils, les messages et les
  événements. Les messages de discussion sont stockés chiffrés (AES-256).
- **[Firebase](https://firebase.google.com/support/privacy) (Google)** — connexion et stockage des photos. Si
  vous utilisez Google Sign-In, Google sait que vous vous êtes connecté à Compass.
- **[Vercel](https://vercel.com/legal/privacy-policy)** — héberge le site ;
  **[Google Cloud](https://cloud.google.com/terms/cloud-privacy-notice)** héberge l'API.
- **[Resend](https://resend.com/legal/privacy-policy)** — envoie les e-mails que nous vous adressons, et traite
  donc votre adresse e-mail et le contenu de ces messages.
- **[Google Gemini](https://ai.google.dev/gemini-api/terms)** et
  **[OpenAI](https://openai.com/policies/privacy-policy/)** — l'assistant de profil facultatif, décrit en
  entier dans la section suivante.
- **[Notion](https://www.notion.so/privacy) et [Google Docs](https://policies.google.com/privacy)** — ce ne
  sont pas nos sous-traitants, mais si vous pointez l'assistant de profil vers une page hébergée chez eux,
  nous allons la chercher, et ils voient donc passer la requête.
- **[PostHog](https://posthog.com/privacy)** — analyse produit, comme décrit plus haut.
- **[Sentry](https://sentry.io/privacy/)** — rapports d'erreur, ainsi qu'un rejeu de session sur environ une
  session sur dix — et sur toute session où survient une erreur — pour voir à quoi ressemblait un bug. Le
  rejeu **masque par défaut tout le texte, tous les champs de formulaire et toutes les images** : nous
  obtenons la forme de la page et l'endroit où vous avez cliqué, pas ce que vous avez écrit. Les rapports
  d'erreur incluent votre adresse IP et démarrent sans rien demander : ils ne déposent rien sur votre appareil
  et sont ce qui rend l'application réparable. L'enregistreur de rejeu, lui, est derrière la même invite que la
  mesure d'audience ci-dessus, et ne tourne jamais dans l'application Android.
- **Google Fonts** — le site charge ses polices depuis les serveurs de Google, qui voit donc l'adresse IP de
  toute personne ouvrant une page. Les héberger nous-mêmes est une amélioration connue que nous n'avons pas
  encore faite.

## Fonctions d'IA, et ce que nous leur envoyons

Deux fonctions envoient votre contenu à un prestataire d'IA externe. Toutes deux sont déclenchées par vous —
rien ici ne tourne en arrière-plan sur votre profil, vos réponses ou vos messages —, mais c'est le moment où
vos mots quittent notre infrastructure, alors voici l'ensemble.

**Construire un profil à partir d'un document, d'un lien ou de votre voix.** Si vous collez du texte, donnez un
lien, ou dictez une réponse au lieu de la taper :

- Le texte — ou celui de la page que vous avez liée — est envoyé à l'**API Gemini de Google**, qui renvoie des
  champs structurés dont le formulaire se pré-remplit. Rien n'est enregistré avant que vous ayez relu et
  accepté.
- Si vous avez donné un lien, nous allons d'abord chercher la page nous-mêmes, y compris les pages Notion et
  les Google Docs.
- Si vous avez dicté, l'audio part chez **OpenAI** pour la transcription avant que le texte ne parte vers
  Gemini.
- Le résultat est mis en cache sur notre serveur pendant 24 heures au maximum, pour qu'une demande répétée ne
  refasse pas le travail.

**Les champs extraits comprennent des données sensibles** — religion, opinions politiques, orientation
sexuelle, origine, neurotype, informations liées à la santé, consommation de substances — parce que ce sont des
champs que le formulaire propose. Si votre document les mentionne, ils partent chez Gemini avec le reste. La
fonction est entièrement facultative : chaque champ se saisit directement, et le faire à la main ne vous coûte
que du temps.

**Ce que ces prestataires en font relève de leurs conditions, pas des nôtres.** Lisez les
[conditions de l'API Gemini](https://ai.google.dev/gemini-api/terms) de Google avant d'utiliser l'assistant
avec quoi que ce soit que vous ne voudriez pas voir relu : l'offre gratuite et l'offre payante de cette API
diffèrent nettement quant à l'utilisation possible du contenu soumis pour améliorer les produits de Google.

**Rien d'autre ne part vers un modèle.** Votre biographie, vos réponses de compatibilité, votre historique de
recherche et vos messages privés ne sont envoyés à aucun prestataire d'IA dans le cadre du fonctionnement de
Compass. Le score de compatibilité est un calcul, et
[son code est public](https://github.com/CompassConnections/Compass/blob/main/common/src/profiles/compatibility-score.ts).
Les administrateurs qui modèrent ou préparent une mise en relation peuvent utiliser des outils d'assistance, y
compris des assistants d'IA, sur des contenus de profil et sur des conversations auxquelles ils participent
eux-mêmes — jamais sur des conversations privées entre d'autres personnes.

## Stockage et sécurité

Nous utilisons des pratiques actuelles de chiffrement et de contrôle d'accès, et l'intégralité du code est
[open source](https://github.com/CompassConnections/Compass) — n'importe qui peut auditer exactement comment
les données sont stockées et qui peut y accéder, ce qui est une garantie plus solide qu'un paragraphe comme
celui-ci. Aucun système en ligne n'est totalement sûr : utilisez la plateforme en conséquence et ne publiez sur
un profil public rien que vous ne voudriez pas voir lu par un inconnu.

Les problèmes de sécurité peuvent être signalés en privé — voir [/security](/security).

## Vos droits et vos choix

Vous pouvez faire tout cela vous-même, sans nous le demander :

- **Consulter et modifier** tout ce qui figure sur votre profil dans les [paramètres](/settings).
- **Exporter** vos données — les paramètres proposent un téléchargement de tout ce que nous détenons.
- **Supprimer votre compte**, depuis [/delete-account](/delete-account). La suppression retire votre profil,
  vos messages et vos contenus, et efface l'identité analytique ainsi que le stockage local sur votre appareil.
- **Supprimer une inscription inachevée**, depuis le lien de l'avis que nous envoyons à son sujet, ou en nous
  écrivant. Elle disparaît de toute façon d'elle-même à l'issue du délai ci-dessus.

Si vous résidez dans l'UE ou au Royaume-Uni, vous disposez en outre du droit d'accès, de rectification, de
portabilité et d'effacement, du droit d'opposition au traitement, et du droit de saisir votre autorité
nationale de protection des données. Écrivez à [hello@compassmeet.com](mailto:hello@compassmeet.com) : une
personne vous répondra.

## Modifications de cette politique

Cette page vit dans le
[dépôt](https://github.com/CompassConnections/Compass/blob/main/web/public/md/privacy.md) comme le reste du
site : chaque changement est donc un commit public, daté et diffable. Les changements importants seront aussi
annoncés dans [/news](/news).

## Contact

Toute question sur cette page : [hello@compassmeet.com](mailto:hello@compassmeet.com), ou [/contact](/contact).

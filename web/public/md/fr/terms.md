# Conditions d'utilisation

Voici les règles d'utilisation de Compass. Elles sont écrites pour être lues, pas pour être subies — si une
clause vous paraît obscure, c'est un défaut et vous devriez [nous le dire](/contact). En créant un compte ou en
utilisant le site, vous acceptez ce qui suit, ainsi que la [Politique de confidentialité](/privacy), qui
explique ce qu'il advient de vos données.

Compass est un projet gratuit, open source et gouverné par sa communauté, pas une entreprise qui vous vend
quelque chose. Cela façonne l'essentiel de ce qui suit : il n'y a pas d'abonnement à résilier, pas de publicité
à refuser, et les règles se changent par [un vote](/vote), pas par une annonce.

## Qui peut utiliser Compass

- **Vous devez avoir 18 ans ou plus.** Compass s'adresse à des adultes ; le formulaire de profil refuse tout
  âge inférieur à 18 ans, et un compte dont il s'avère qu'il appartient à une personne mineure est supprimé.
- **Un compte par personne**, avec des informations qui vous concernent réellement. Se faire passer pour
  quelqu'un d'autre, ou tenir un profil pour une entreprise, n'est pas autorisé.
- **Vous êtes responsable de votre compte** — gardez vos identifiants en sécurité et prévenez-nous si vous
  pensez que quelqu'un d'autre y a accès.

## Vos contenus restent les vôtres

Vous conservez la propriété de tout ce que vous écrivez et téléversez : biographie, photos, réponses aux
questions, réponses de compatibilité, messages, commentaires, événements et témoignages.

En les publiant, vous donnez à Compass l'autorisation de les stocker et de les afficher là où vous avez choisi
qu'ils apparaissent. Cette autorisation existe pour que le site fonctionne, et elle prend fin lorsque vous
supprimez le contenu ou votre compte.

Deux conséquences découlent du fonctionnement de Compass, et autant les dire franchement :

- **L'essentiel de votre profil est public.** Un annuaire ouvert est la raison d'être du produit — n'importe
  qui, y compris les personnes non connectées et les moteurs de recherche, peut lire ce que votre profil
  affiche. Ce qui est visible reste sous votre contrôle dans les [paramètres](/settings), et vous devriez
  considérer comme public tout ce que vous mettez sur un profil public.
- **Un message que vous envoyez peut être lu, conservé, capturé en image ou signalé par son destinataire.**
  Compass chiffre les messages au repos et ne les vend pas, mais aucune plateforme ne peut contrôler ce qu'une
  personne fait de ce qu'elle reçoit.

Être mis en avant sur la page d'accueil est distinct et volontaire : Compass ne cite votre profil dans un
spotlight que si vous l'avez activé dans les paramètres, et le désactiver le retire.

## Fonctions d'IA, et ce qui quitte la plateforme

Compass utilise des services d'IA tiers pour un petit nombre de fonctionnalités. Ce sont toutes des actions que
vous déclenchez vous-même — aucune ne tourne en arrière-plan sur votre profil ou vos messages —, mais vous
devriez savoir exactement ce qui est envoyé et où avant de les utiliser.

### Remplir un profil à partir d'un document, d'un lien ou de votre voix

Si vous collez du texte, donnez un lien ou dictez une réponse pendant la création de votre profil, ce contenu
est envoyé à des prestataires externes pour être lu et transformé en champs de profil :

- **Le texte que vous collez, ou le contenu d'une page que vous liez**, part vers l'**API Gemini de Google**,
  qui renvoie des champs structurés dont le formulaire se pré-remplit. Vous relisez et modifiez ensuite tout
  avant que quoi que ce soit ne soit enregistré.
- **Si vous donnez un lien**, Compass va chercher cette page — y compris les pages Notion et les Google Docs —
  et en lit le texte. Ne donnez que des liens vers des pages que vous acceptez que nous lisions.
- **Si vous dictez**, l'enregistrement part d'abord chez **OpenAI** pour la transcription, puis le texte obtenu
  part vers Gemini comme ci-dessus.
- Le résultat est mis en cache sur notre serveur pendant 24 heures au maximum, afin qu'une même demande ne
  refasse pas le même travail.

**Cela mérite qu'on s'y arrête.** Les champs que Compass extrait comprennent des données sensibles — religion,
opinions politiques, orientation sexuelle, origine, neurotype, informations liées à la santé et consommation de
substances — parce que ce sont des champs que le formulaire propose. Si vous collez un document qui en
contient, vous envoyez ces informations à un prestataire d'IA tiers. Si vous préférez l'éviter, remplissez le
formulaire à la main : chaque champ est modifiable directement et les fonctions d'IA sont entièrement
facultatives.

### Ce qui n'est pas envoyé à un prestataire d'IA

Pour faire fonctionner la plateforme, Compass n'envoie **ni** votre biographie, **ni** vos réponses de
compatibilité, **ni** votre historique de recherche, **ni** vos messages privés à un modèle d'IA. Le score de
compatibilité est un calcul sur vos propres réponses — le
[code est public](https://github.com/CompassConnections/Compass/blob/main/common/src/profiles/compatibility-score.ts)
et aucun modèle n'intervient.

Les administrateurs qui modèrent le site ou préparent une mise en relation peuvent utiliser des outils
d'assistance, y compris des assistants d'IA, sur des contenus de profil et sur des conversations auxquelles ils
participent eux-mêmes. Pas sur des conversations privées entre d'autres personnes.

La liste à jour de tous les prestataires externes qui touchent à vos données figure dans la
[Politique de confidentialité](/privacy#les-tiers-dont-nous-dependons).

## Règles de la communauté

Compass existe pour des gens qui veulent de la profondeur plutôt que du volume, et les règles en découlent.

**Traitez les gens comme des personnes.** Soyez respectueux. Le harcèlement, les propos haineux, les menaces et
les prises de contact répétées après qu'une personne s'est retirée sont des motifs d'exclusion.

**Pas de spam ni de sollicitation.** N'utilisez pas Compass pour faire de la publicité, recruter, promouvoir
une activité ou monter des arnaques. Les messages identiques envoyés en masse en sont le signal le plus net et
sont limités automatiquement — voir ci-dessous.

**Pas de nudité ni de contenu sexuellement explicite.** Compass n'autorise pas le partage public de nudité,
d'actes sexuels ou de contenu à caractère sexuel suggestif. Ces contenus sont retirés et peuvent entraîner une
suspension.

**Tolérance zéro pour l'exploitation et les abus sexuels sur mineurs (CSAE).** Cela comprend le grooming, la
sextorsion, la traite, et tout contenu ou comportement qui exploite sexuellement, maltraite ou met en danger un
enfant. Toute suspicion entraîne la fermeture immédiate du compte et peut être signalée aux autorités et au
National Center for Missing and Exploited Children (NCMEC), comme la loi l'exige.

**Pas de violence graphique.** La violence réelle et crue, en dehors d'un but informatif, contextuel ou
éducatif, n'est pas autorisée, et les contenus qui font l'apologie de la violence sont retirés.

**Ne publiez pas les informations d'autrui.** Partager les détails privés, les photos ou les conversations de
quelqu'un sans son accord n'est pas autorisé. Cela vaut aussi pour les captures d'écran de conversations
Compass.

**Localisation.** Compass ne partage pas votre position précise avec les autres membres. Les profils affichent
une ville, à la précision que vous choisissez.

## Outils de sécurité, modération et suspensions

Vous pouvez [bloquer](/settings) un membre, masquer un profil, signaler une personne ou un contenu, et quitter
n'importe quelle conversation. Les signalements sont traités par des modérateurs humains.

Certaines limites sont appliquées automatiquement :

- **Démarrer plus de 5 nouvelles conversations en 24 heures suspend votre compte.** C'est une protection
  anti-spam, pas un jugement — elle attrape les comptes automatisés, et de temps en temps un membre bien réel
  particulièrement enthousiaste. Un humain examine chaque cas, en principe sous 24 heures, et rétablit les
  comptes qui semblent authentiques. Rien de ce que vous avez écrit n'est perdu pendant ce temps.
- **Les comptes en cours d'examen** sont limités jusqu'à ce qu'un modérateur les ait regardés.
- **Un abus confirmé — arnaque, spam, harcèlement — est définitif.** Il n'y a pas de réexamen, et nous
  n'expliquons pas quel signal a identifié le compte.

Les modérateurs peuvent retirer des contenus, masquer des commentaires et suspendre ou supprimer des comptes
qui enfreignent ces règles. Lorsqu'une décision relève de l'appréciation plutôt que d'une infraction évidente,
vous pouvez la contester en [nous écrivant](/contact).

## Compass est gratuit, et le reste

Il n'y a rien à acheter. Pas d'abonnement, pas d'offre payante, pas d'achat intégré, pas de publicité, et
aucune vente de vos informations personnelles. Toutes les fonctionnalités sont accessibles à tous les membres.

Les dons sont volontaires, financent l'hébergement et les frais de fonctionnement, et n'apportent absolument
aucun avantage sur la plateforme — ni visibilité, ni fonctionnalités, ni décisions de modération. L'usage de
l'argent est publié sur [/financials](/financials).

Ce ne sont pas de simples promesses dans un document : selon le modèle de gouvernance ci-dessous, introduire de
la publicité, des fonctions payantes ou une monétisation des données exigerait un vote de la communauté.

## Open source et licences

Compass est développé au grand jour. Sauf mention contraire, le code source, les designs et les éléments
associés sont sous licence **AGPL-3.0** ; certains composants sont sous licence permissive et signalés comme
tels dans le dépôt. Dans le respect de ces licences, vous pouvez utiliser, copier, modifier, publier et
distribuer ces éléments.

**Contributions.** En soumettant du code, des designs, de la documentation ou d'autres contributions, vous
acceptez qu'ils soient placés sous la licence qui régit le projet au moment de votre contribution, et vous
confirmez avoir le droit d'accorder cette licence et que votre contribution ne porte atteinte aux droits de
personne.

**Le contenu de votre profil n'est pas couvert par cette licence.** L'AGPL s'applique au logiciel, pas à ce que
les membres écrivent.

## Gouvernance communautaire

Les changements importants — de licence, de monétisation, de ces conditions, ou de la manière dont la
plateforme est gouvernée — passent par le [processus de gouvernance](/constitution) : les propositions sont
publiées, discutées et [soumises au vote](/vote), et les décisions sont publiques.

C'est le mécanisme derrière les promesses ci-dessus. Un engagement qu'une seule personne peut annuler
discrètement ne vaut pas grand-chose ; ceux-ci ne peuvent être annulés que par un vote auquel vous participez.

## Disponibilité et responsabilité

Compass est fourni tel quel, par un petit projet bénévole, sans aucune garantie. Nous ne garantissons ni que le
service sera ininterrompu, ni qu'aucune donnée ne sera jamais perdue, ni que chaque membre est bien celui qu'il
prétend être.

**Compass n'est pas responsable des différends entre membres, ni de ce qui se passe lorsque vous rencontrez
quelqu'un.** Faites preuve de discernement, voyez-vous dans un lieu public la première fois, et dites à
quelqu'un où vous allez. Dans les limites permises par la loi, Compass n'est pas responsable des dommages
indirects ou consécutifs découlant de votre utilisation de la plateforme.

Rien ici ne limite des droits qui ne peuvent pas l'être par contrat — y compris vos droits au titre du RGPD,
exposés dans la [Politique de confidentialité](/privacy).

## Mettre fin à votre utilisation

Vous pouvez supprimer votre compte à tout moment depuis [/delete-account](/delete-account). La suppression
retire votre profil, vos contenus et vos messages, et efface l'identité analytique stockée sur votre appareil.

Nous pouvons suspendre ou supprimer un compte qui enfreint ces conditions, comme décrit plus haut dans la
section modération.

## Modifications de ces conditions

Ces conditions vivent dans le
[dépôt](https://github.com/CompassConnections/Compass/blob/main/web/public/md/terms.md) comme le reste du site :
chaque changement est donc un commit public, daté et diffable — vous pouvez lire exactement ce qui a changé et
quand. Les changements importants passent par la gouvernance et sont annoncés dans [/news](/news). Continuer à
utiliser Compass après une modification vaut acceptation des conditions mises à jour.

## Contact

Questions sur ces conditions : [hello@compassmeet.com](mailto:hello@compassmeet.com), ou
[/contact](/contact). Les problèmes de sécurité ont leur propre canal — voir [/security](/security).

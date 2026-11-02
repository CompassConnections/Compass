# Datenschutzrichtlinie

Compass beruht auf dem Gedanken, dass Sie sehen können sollten, wie die Plattform funktioniert. Das gilt auch
für Ihre Daten. Diese Seite versucht deshalb, eine genaue Beschreibung dessen zu sein, was tatsächlich
geschieht — bis hin zu jedem einzelnen Cookie und jedem Drittanbieter — und kein juristischer Haftungsausschluss.
Wenn hier etwas steht, das nicht dem entspricht, was die App tut, ist das ein Fehler:
[sagen Sie uns Bescheid](/contact), und wir korrigieren die Seite oder den Code.

## Was wir erfassen

- **Kontodaten** — Ihre E-Mail-Adresse und alles, was Sie in Ihr Profil eintragen: Name, Alter, Ort, Fotos,
  Biografie, Antworten auf Prompts und Kompatibilitätsantworten.
- **Von Ihnen erstellte Inhalte** — Nachrichten, Kommentare, Veranstaltungen, Erfahrungsberichte und
  Abstimmungen.
- **Nutzungsdaten** — welche Seiten Sie öffnen und welche Funktionen Sie verwenden, damit wir erkennen, was
  sich zu bauen lohnt. Wie das genau erhoben wird, steht unter
  [Cookies und lokaler Speicher](/privacy#cookies-und-lokaler-speicher).
- **Technische Daten** — die IP-Adresse und der Browser, mit denen Ihre Anfragen eintreffen und die jeder
  Webserver zwangsläufig sieht, sowie Fehlerberichte, wenn etwas kaputtgeht.

Der größte Teil Ihres Profils ist **bewusst öffentlich**: Der ganze Sinn eines offenen Verzeichnisses ist,
dass Menschen einander finden können, ohne dass ein Algorithmus für sie entscheidet. Was sichtbar ist,
bestimmen Sie in den [Einstellungen](/settings), und was Sie nicht ausgefüllt haben, wird auch nicht gezeigt.

## Wie wir sie verwenden

Ihre Daten dienen dazu, die Plattform zu betreiben, Sie den Menschen zu zeigen, die jemanden wie Sie suchen,
und herauszufinden, was als Nächstes verbessert werden sollte.

- Wir **verkaufen Ihre personenbezogenen Daten nicht** und schalten keine Werbung.
- Wir geben Ihren genauen Standort nicht ohne Ihre ausdrückliche Einwilligung an andere Mitglieder weiter.
- Wir trainieren kein Modell mit Ihren Inhalten und verkaufen oder teilen sie nicht für fremde Werbung.
  Compass sendet Material an KI-Anbieter für zwei optionale Funktionen, die Sie selbst auslösen, und um die
  erste Nachricht jeder neuen Unterhaltung auf Spam, Betrug und Bots zu prüfen — siehe
  [KI-Funktionen](/privacy#ki-funktionen-und-was-wir-ihnen-senden) weiter unten, wo genau steht, was wohin
  geht.
- Aggregierte, nicht personenbezogene Zahlen — Mitgliederzahlen, Wachstum, Aktivität — veröffentlichen wir
  offen auf [/stats](/stats), denn eine Plattform, die um Vertrauen bittet, sollte ihre eigenen Zahlen zeigen.

## E-Mails, die wir senden, und abgebrochene Anmeldungen

Jede E-Mail von Compass gehört zu einer von zwei Arten. Die meisten betreffen Dinge, über die Sie informiert
werden wollten — eine neue Nachricht, ein Match, eine gespeicherte Suche, die jemanden gefunden hat — und jede
Art lässt sich in den [Einstellungen](/settings#1) einzeln abschalten. Einige wenige betreffen das Konto
selbst: die Bestätigung Ihrer Adresse und den unten beschriebenen Hinweis. Das ist keine Werbung, und diese
E-Mails gehen unabhängig von den Benachrichtigungseinstellungen hinaus, denn sie sind der Weg, Ihnen zu sagen,
was wir über Sie gespeichert haben.

**Wenn Sie eine Anmeldung beginnen und abbrechen.** Die Anmeldung legt zuerst einen Login an und erst danach
ein Profil. Wenn Sie den Login anlegen — mit einer E-Mail-Adresse oder über Google oder Apple — und das Profil
nie fertigstellen, halten wir diese Adresse und sonst nichts: kein Profil, keinen Namen, nichts, das
irgendjemand sieht. Drei Tage später senden wir **eine** E-Mail, die genau das sagt, mit einem Link zum
Fertigstellen und einem Link, der den Login sofort löscht. Passiert innerhalb von **30 Tagen** nach dieser
E-Mail nichts, wird der Login automatisch gelöscht, die Adresse eingeschlossen. Logins, die seit **sechs
Monaten** unvollendet sind, werden ohne E-Mail gelöscht — eine unerwartete Nachricht von einer Website, an die
man sich nicht erinnert, ist schlimmer als keine. Eine zweite Erinnerung gibt es nicht: Die E-Mail existiert,
damit bei uns keine Adresse liegt, die Sie vergessen haben uns gegeben zu haben, nicht um Sie zurückzuholen.

## Cookies und lokaler Speicher

Cookies sind der Teil einer Datenschutzrichtlinie, der meist am vagesten bleibt — hier ist deshalb die
vollständige Liste. Nach EU-Recht (DSGVO und ePrivacy-Richtlinie) ist ein Teil davon **unbedingt erforderlich**
und braucht keine Erlaubnis, ein anderer Teil braucht Ihre **Einwilligung**. Bei jedem Eintrag steht, was
zutrifft — ehrlich.

### `analytics-consent` — erforderlich

Ob Sie in der Abfrage „Erlauben“ oder „Nein danke“ gewählt haben. Eine Ablehnung festzuhalten ist die einzige
Möglichkeit, nicht auf jeder Seite erneut zu fragen — genau deshalb ist ein Einwilligungs-Cookie selbst von der
Einwilligungspflicht ausgenommen. Ein Jahr gespeichert; danach fragen wir noch einmal, statt anzunehmen, eine
Entscheidung über einen älteren Stand der Technik gelte weiterhin.

### `lang` — erforderlich

Die Sprache, die Sie in der Sprachauswahl gewählt haben. Ein Jahr gespeichert, `SameSite=Lax`, über HTTPS
zusätzlich `Secure`. Wird nur geschrieben, wenn Sie die Sprache tatsächlich ändern — genau das macht ihn zu
einem Präferenz-Cookie und nicht zu einem Tracking-Cookie. Keine Einwilligung nötig.

### `ph_…_posthog` und `dmn_chk_…` — Analyse, einwilligungspflichtig

Gesetzt von [PostHog](https://posthog.com), der Produktanalyse, mit der wir Seitenaufrufe und
Funktionsnutzung zählen. Sie enthalten eine zufällig erzeugte Geräte- und Sitzungs-ID — nicht Ihren Namen oder
Ihre E-Mail-Adresse, wobei die ID nach der Anmeldung mit Ihrer Konto-ID verknüpft wird. `dmn_chk_` ist ein
kurzlebiger Test, mit dem PostHog ermittelt, auf welche Domain es schreiben darf. PostHog spiegelt dieselben
Werte zusätzlich in den `localStorage`.

**Das ist die Kategorie, die rechtlich Ihre Einwilligung erfordert — deshalb fragen wir, bevor irgendetwas
davon läuft.** PostHog wird überhaupt erst gestartet, wenn Sie in der kleinen Abfrage in der Ecke auf
„Erlauben“ klicken. Klicken Sie auf „Nein danke“, wird es nie geladen — und was bei einem früheren Besuch
gespeichert wurde, wird auf der Stelle gelöscht. Sie können Ihre Entscheidung jederzeit in den
[Einstellungen](/settings) ändern.

### `FBUSER_…` — entfernt

Eine frühere Version von Compass spiegelte Ihre Firebase-Sitzung in ein Cookie, damit Seiten serverseitig
bereits im angemeldeten Zustand gerendert werden konnten. Gelesen hat es niemand mehr, und es enthielt ein
langlebiges Token in einer für JavaScript lesbaren Form — es ist deshalb weg. Die App **löscht es aktiv** beim
Laden der Seite, sodass es auch aus Browsern verschwindet, die es noch mit sich tragen.

### Was sonst auf Ihrem Gerät gespeichert wird

Dieselben Regeln gelten für jede Speicherung auf Ihrem Gerät, daher der Vollständigkeit halber:

- **`device-token`** — eine zufällige ID im `localStorage`, mit der wir einen Browser zur Missbrauchs- und
  Betrugsabwehr wiedererkennen. Erforderlich, keine Einwilligung nötig.
- **`theme`, `font-preference` und zwischengespeicherte Profildaten** — Ihre Anzeigeeinstellungen und eine
  Kopie Ihres eigenen Profils, damit die App rendern kann, bevor das Netzwerk antwortet. Präferenzen und
  Cache; sie verlassen Ihr Gerät nie.
- **Fehler- und Session-Replay-Daten** — siehe [Sentry](/privacy#drittanbieter-auf-die-wir-angewiesen-sind)
  weiter unten.

## Drittanbieter, auf die wir angewiesen sind

Compass ist ein kleines Projekt und läuft deshalb auf fremder Infrastruktur. Jeder dieser Dienste verarbeitet
einen Teil Ihrer Daten in unserem Auftrag, und jeder hat eine eigene Datenschutzrichtlinie, die zu lesen sich
lohnt:

- **[Supabase](https://supabase.com/privacy)** — die Postgres-Datenbank mit Profilen, Nachrichten und
  Veranstaltungen. Chat-Nachrichten werden verschlüsselt gespeichert (AES-256).
- **[Firebase](https://firebase.google.com/support/privacy) (Google)** — Anmeldung und Fotospeicher. Wenn Sie
  Google Sign-In nutzen, erfährt Google, dass Sie sich bei Compass angemeldet haben.
- **[Vercel](https://vercel.com/legal/privacy-policy)** — hostet die Website;
  **[Google Cloud](https://cloud.google.com/terms/cloud-privacy-notice)** hostet die API.
- **[Resend](https://resend.com/legal/privacy-policy)** — versendet unsere E-Mails an Sie und verarbeitet dabei
  Ihre E-Mail-Adresse und den Inhalt dieser E-Mails.
- **[Google Gemini](https://ai.google.dev/gemini-api/terms)** und
  **[OpenAI](https://openai.com/policies/privacy-policy/)** — der optionale Profil-Assistent und (nur Gemini)
  die automatische Prüfung der ersten Nachricht einer Unterhaltung, beide im nächsten Abschnitt vollständig
  beschrieben.
- **[Notion](https://www.notion.so/privacy) und [Google Docs](https://policies.google.com/privacy)** — keine
  Auftragsverarbeiter von uns, aber wenn Sie den Profil-Assistenten auf eine dort gehostete Seite richten,
  rufen wir diese ab, und sie sehen die Anfrage danach.
- **[PostHog](https://posthog.com/privacy)** — Produktanalyse, wie oben beschrieben.
- **[Sentry](https://sentry.io/privacy/)** — Fehlerberichte sowie Session Replay bei etwa jeder zehnten
  Sitzung — und bei jeder Sitzung, in der ein Fehler auftritt —, damit wir sehen, wie ein Fehler aussah.
  Replay **maskiert standardmäßig sämtlichen Text, alle Formulareingaben und alle Bilder**, wir sehen also die
  Form der Seite und wohin Sie geklickt haben, nicht was Sie geschrieben haben. Fehlerberichte enthalten Ihre
  IP-Adresse und starten ohne Nachfrage — sie legen nichts auf Ihrem Gerät ab und sind das, was die App
  reparierbar hält. Die Replay-Aufzeichnung steht hinter derselben Abfrage wie die Analyse oben und läuft in
  der Android-App gar nicht.
- **Google Fonts** — die Seite lädt ihre Schriften von Googles Servern, wodurch Google die IP-Adresse jeder
  Person sieht, die eine Seite öffnet. Das Selbst-Hosten ist eine bekannte Verbesserung, die wir noch nicht
  umgesetzt haben.

## KI-Funktionen und was wir ihnen senden

Drei Dinge senden Ihr Material an einen externen KI-Anbieter. Zwei sind Funktionen, die Sie selbst starten.
Das dritte läuft einmal pro Unterhaltung, auf deren erster Nachricht, ob Sie sie gesendet oder erhalten haben.
Sonst läuft nichts im Hintergrund über Ihr Profil, Ihre Antworten oder Ihre Nachrichten. An diesen Stellen
verlassen Ihre Worte unsere Infrastruktur, deshalb hier das Ganze.

**Ein Profil aus einem Dokument, einem Link oder Ihrer Stimme aufbauen.** Wenn Sie Text einfügen, einen Link
angeben oder eine Antwort diktieren, statt sie zu tippen:

- Der Text — oder der Text der verlinkten Seite — wird an **Googles Gemini-API** gesendet, die strukturierte
  Felder zurückgibt, mit denen das Formular vorausgefüllt wird. Nichts wird gespeichert, bevor Sie es geprüft
  und übernommen haben.
- Bei einem Link rufen wir diese Seite zuvor selbst ab, auch Notion-Seiten und Google Docs.
- Beim Diktieren geht die Aufnahme zur Transkription an **OpenAI**, bevor der Text an Gemini geht.
- Das Ergebnis wird bis zu 24 Stunden auf unserem Server zwischengespeichert, damit eine wiederholte Anfrage
  nicht dieselbe Arbeit auslöst.

**Zu den extrahierten Feldern gehören sensible** — Religion, politische Ansichten, sexuelle Orientierung,
Herkunft, Neurotyp, gesundheitsbezogene Hinweise, Substanzkonsum —, weil das Profilformular diese Felder
anbietet. Wenn Ihr Dokument sie erwähnt, gehen sie zusammen mit allem anderen an Gemini. Die Funktion ist
vollständig optional: Jedes Feld lässt sich direkt eintippen, und Tippen kostet Sie nichts außer Zeit.

**Was diese Anbieter damit tun, richtet sich nach deren Bedingungen, nicht nach unseren.** Lesen Sie Googles
[Gemini-API-Bedingungen](https://ai.google.dev/gemini-api/terms), bevor Sie den Assistenten mit etwas
verwenden, das niemand einsehen soll — die kostenlose und die kostenpflichtige Stufe dieser API unterscheiden
sich erheblich darin, ob eingereichte Inhalte zur Verbesserung von Googles Produkten verwendet werden dürfen.

**Die erste Nachricht einer Unterhaltung prüfen.** Wenn Sie jemandem die erste Nachricht schreiben oder
jemand Ihnen seine erste schreibt, wird diese Nachricht zusammen mit beiden Profilen an **Googles Gemini-API**
gesendet, und das Modell wird gefragt, ob sie generisch ist, sich aufs Aussehen bezieht, nach Betrug aussieht
oder etwas übergeht, worum die empfangende Person gebeten hat. Es ist die einzige Stelle, an der Ihr Profil an
ein Modell geht, ohne dass Sie es ausgelöst haben, und es gilt für beide Personen der Unterhaltung: Ihr Profil
wird gesendet, wenn Sie jemandem schreiben, und wenn jemand Ihnen schreibt.

- **Was gesendet wird**: der Text der ersten Nachricht und beide Profile, wie sie auf der Seite zu lesen sind
  — Name, Überschrift, Stichwörter, Biografie, Interessen, Anliegen, Arbeit, bis zu 30 Kompatibilitätsantworten
  und jedes weitere Feld, das Sie ausgefüllt haben, was die oben genannten sensiblen einschließen kann. Das
  Kontoalter der sendenden Person geht ebenfalls mit. Fotos, Koordinaten, E-Mail-Adresse und Einstellungen
  nicht.
- **Nur die Eröffnungsnachricht.** Jede spätere Nachricht dieser Unterhaltung bleibt zwischen Ihnen beiden
  und wird nirgendwohin gesendet.
- **Was die Antwort bewirkt.** Eine Nachricht, die das Modell für generisch hält, geht mit einer
  einzeiligen Begründung an die sendende Person zurück, die darauf reagieren kann. Eine Nachricht, die nach
  Betrug aussieht oder sich aufs Aussehen bezieht, setzt das Konto der sendenden Person aus, bis ein Mensch
  sie innerhalb von 24 Stunden prüft. Eine Grenzfall-Nachricht wird zugestellt und einer Moderatorin oder
  einem Moderator gemeldet. Die empfangende Person sieht die Antwort des Modells nie, und eine abgelehnte
  Nachricht erreicht sie nie.
- **Was wir behalten**: das Urteil in unseren Server-Logs, mit der Konto-ID der sendenden Person. Wird eine
  Nachricht ausgesetzt, zurückgeschickt oder gemeldet, wird der Satz des Modells zusammen mit den beiden
  Benutzernamen im privaten Kanal der Moderation veröffentlicht, damit ein Mensch die Entscheidung prüfen
  kann. Nachrichtentext und Profile werden durch diesen Schritt nicht über das hinaus gespeichert, was Compass
  ohnehin hält.
- **Antwortet das Modell nicht** innerhalb von 30 Sekunden oder ist es nicht erreichbar, geht die Nachricht
  allein über unsere eigenen regelbasierten Prüfungen durch. Die Prüfung lässt sich nicht pro Mitglied
  abschalten: Sie hält Massennachrichten und Betrug aus den Postfächern, und die Alternative wäre ein Mensch,
  der jede erste Nachricht liest.

Alles in einer Nachricht, auch der ersten, behandelt das Modell als zu beurteilende Daten, nicht als zu
befolgende Anweisungen. Wenn eine Entscheidung unseren [Werten](/values) zu widersprechen scheint, sagen Sie
es uns über [/contact](/contact).

**Sonst geht nichts an ein Modell.** Über die erste Nachricht einer Unterhaltung hinaus werden Ihre privaten
Nachrichten an keinen KI-Anbieter gesendet. Ihre Biografie, Ihre Kompatibilitätsantworten und Ihr Suchverlauf
werden für den Betrieb von Compass ebenfalls an keinen gesendet, außer im Rahmen dieser Prüfung der ersten
Nachricht. Der Kompatibilitätswert ist Rechnung auf Ihren Antworten und Profilfeldern —
[so funktioniert er](/compatibility-score), und [sein Code ist öffentlich](https://github.com/CompassConnections/Compass/blob/main/common/src/profiles/compatibility-factors.ts).
Administratorinnen und Administratoren, die moderieren oder eine Vorstellung vorbereiten, dürfen Hilfsmittel
einschließlich KI-Assistenten einsetzen — auf Profilinhalte und auf Unterhaltungen, an denen sie selbst
beteiligt sind, nie auf private Unterhaltungen zwischen anderen Personen.

## Speicherung und Sicherheit

Wir setzen aktuelle Verschlüsselungs- und Zugriffskontrollpraktiken ein, und der gesamte Quellcode ist
[Open Source](https://github.com/CompassConnections/Compass) — jede und jeder kann genau nachprüfen, wie Daten
gespeichert werden und wer an sie herankommt. Das ist eine stärkere Zusicherung als ein Absatz wie dieser. Kein
Online-System ist vollständig sicher; nutzen Sie die Plattform entsprechend und stellen Sie nichts in ein
öffentliches Profil, das Fremde nicht lesen sollen.

Sicherheitslücken können Sie vertraulich melden — siehe [/security](/security).

## Ihre Rechte und Ihre Wahl

All das können Sie selbst tun, ohne uns zu fragen:

- **Ansehen und bearbeiten** — alles in Ihrem Profil in den [Einstellungen](/settings).
- **Exportieren** — die Einstellungen bieten einen Download all dessen, was wir gespeichert haben.
- **Konto löschen** — über [/delete-account](/delete-account). Die Löschung entfernt Ihr Profil, Ihre
  Nachrichten und Ihre Inhalte und räumt die Analyse-Identität sowie den lokalen Speicher auf Ihrem Gerät auf.
- **Eine abgebrochene Anmeldung löschen** — über den Link im Hinweis, den wir dazu senden, oder per E-Mail an
  uns. Nach der oben genannten Frist verschwindet sie ohnehin von selbst.

Wenn Sie in der EU oder im Vereinigten Königreich sind, haben Sie zusätzlich das Recht auf Auskunft,
Berichtigung, Datenübertragbarkeit und Löschung, das Recht auf Widerspruch gegen die Verarbeitung und das
Recht auf Beschwerde bei Ihrer nationalen Datenschutzbehörde. Schreiben Sie an
[hello@compassmeet.com](mailto:hello@compassmeet.com) — es antwortet ein Mensch.

## Änderungen an dieser Richtlinie

Diese Seite liegt wie der Rest der Website im
[Repository](https://github.com/CompassConnections/Compass/blob/main/web/public/md/privacy.md). Jede Änderung
daran ist also ein öffentlicher Commit mit Datum und Diff. Wesentliche Änderungen kündigen wir zusätzlich unter
[/news](/news) an.

## Kontakt

Fragen zu irgendetwas auf dieser Seite: [hello@compassmeet.com](mailto:hello@compassmeet.com) oder
[/contact](/contact).

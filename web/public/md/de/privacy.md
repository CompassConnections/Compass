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
- Wir verwenden Ihre Inhalte nicht, um Modelle für maschinelles Lernen zu trainieren.
- Aggregierte, nicht personenbezogene Zahlen — Mitgliederzahlen, Wachstum, Aktivität — veröffentlichen wir
  offen auf [/stats](/stats), denn eine Plattform, die um Vertrauen bittet, sollte ihre eigenen Zahlen zeigen.

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
- **[OpenAI](https://openai.com/policies/privacy-policy/)** — transkribiert Spracheingaben, und zwar
  **ausschließlich** dann, wenn Sie eine Profilantwort diktieren statt sie zu tippen. Die Aufnahme wird zur
  Transkription übermittelt und von uns nicht aufbewahrt; wenn Sie die Mikrofontaste nie benutzen, erreicht
  OpenAI nichts von Ihnen.
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

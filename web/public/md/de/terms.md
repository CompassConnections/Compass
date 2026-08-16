# Nutzungsbedingungen

Dies sind die Regeln für die Nutzung von Compass. Sie sind zum Lesen geschrieben, nicht zum Überstehen — wenn
eine Klausel hier unklar ist, ist das ein Mangel, und Sie sollten es uns [sagen](/contact). Mit dem Anlegen
eines Kontos oder der Nutzung der Website stimmen Sie dem Folgenden zu, ebenso wie der
[Datenschutzrichtlinie](/privacy), die erklärt, was mit Ihren Daten geschieht.

Compass ist ein kostenloses, quelloffenes, von der Gemeinschaft verwaltetes Projekt und kein Unternehmen, das
Ihnen etwas verkauft. Das prägt fast alles, was unten steht: Es gibt kein Abo zu kündigen, keine Werbung
abzulehnen, und die Regeln werden per [Abstimmung](/vote) geändert, nicht per Ankündigung.

## Wer Compass nutzen darf

- **Sie müssen mindestens 18 Jahre alt sein.** Compass ist für Erwachsene; das Profilformular akzeptiert kein
  Alter unter 18, und ein Konto, das nachweislich einer minderjährigen Person gehört, wird entfernt.
- **Ein Konto pro Person**, mit Angaben, die tatsächlich Sie betreffen. Sich als jemand anderes auszugeben
  oder ein Profil für ein Unternehmen zu führen, ist nicht erlaubt.
- **Sie sind für Ihr Konto verantwortlich** — halten Sie Ihre Anmeldedaten sicher und sagen Sie uns Bescheid,
  wenn Sie vermuten, dass jemand anderes Zugriff hat.

## Ihre Inhalte bleiben Ihre

Alles, was Sie schreiben und hochladen, gehört weiterhin Ihnen: Biografie, Fotos, Antworten auf Prompts,
Kompatibilitätsantworten, Nachrichten, Kommentare, Veranstaltungen und Erfahrungsberichte.

Mit dem Veröffentlichen geben Sie Compass die Erlaubnis, diese Inhalte zu speichern und dort anzuzeigen, wo Sie
es vorgesehen haben. Diese Erlaubnis besteht, damit die Website funktionieren kann, und sie endet, wenn Sie den
Inhalt oder Ihr Konto löschen.

Zwei Dinge ergeben sich daraus, wie Compass funktioniert, und wir sagen sie lieber deutlich:

- **Der größte Teil Ihres Profils ist öffentlich.** Ein offenes Verzeichnis ist der Sinn des Produkts — alle,
  auch nicht angemeldete Personen und Suchmaschinen, können lesen, was Ihr Profil zeigt. Was sichtbar ist,
  bestimmen Sie in den [Einstellungen](/settings), und Sie sollten alles, was auf einem öffentlichen Profil
  steht, als öffentlich betrachten.
- **Eine Nachricht, die Sie senden, kann von der empfangenden Person gelesen, gespeichert, abfotografiert oder
  gemeldet werden.** Compass verschlüsselt Nachrichten bei der Speicherung und verkauft sie nicht, aber keine
  Plattform kann steuern, was eine Empfängerin oder ein Empfänger damit tut.

Auf der Startseite vorgestellt zu werden, ist davon getrennt und freiwillig: Compass zitiert Ihr Profil nur
dann in einem Spotlight, wenn Sie das in den Einstellungen aktiviert haben — und das Deaktivieren entfernt es
wieder.

## KI-Funktionen und was die Plattform verlässt

Compass nutzt für einige wenige Funktionen KI-Dienste von Dritten. Sie alle starten Sie selbst — keine davon
läuft im Hintergrund über Ihr Profil oder Ihre Nachrichten —, aber Sie sollten genau wissen, was wohin gesendet
wird, bevor Sie sie verwenden.

### Ein Profil aus einem Dokument, einem Link oder Ihrer Stimme ausfüllen

Wenn Sie beim Erstellen Ihres Profils Text einfügen, einen Link angeben oder eine Antwort diktieren, wird
dieses Material an externe Anbieter gesendet, um gelesen und in Profilfelder umgewandelt zu werden:

- **Eingefügter Text oder der Inhalt einer verlinkten Seite** geht an **Googles Gemini-API**, die strukturierte
  Felder zurückgibt, mit denen das Formular vorausgefüllt wird. Sie prüfen und bearbeiten anschließend alles,
  bevor irgendetwas gespeichert wird.
- **Wenn Sie eine Seite verlinken**, ruft Compass diese Seite ab — auch Notion-Seiten und Google Docs — und
  liest ihren Text. Geben Sie nur Links zu Seiten an, deren Inhalt wir lesen dürfen.
- **Wenn Sie diktieren**, geht die Aufnahme zunächst zur Transkription an **OpenAI**, und das Transkript dann
  wie oben an Gemini.
- Das Ergebnis wird bis zu 24 Stunden auf unserem Server zwischengespeichert, damit dieselbe Anfrage nicht
  dieselbe Arbeit erneut auslöst.

**Hier lohnt sich ein Innehalten.** Zu den Feldern, die Compass extrahiert, gehören sensible — Religion,
politische Ansichten, sexuelle Orientierung, Herkunft, Neurotyp, gesundheitsbezogene Hinweise und
Substanzkonsum —, weil das Profilformular diese Felder anbietet. Wenn Sie ein Dokument einfügen, das solche
Angaben enthält, senden Sie diese Informationen an einen KI-Anbieter. Wenn Sie das nicht möchten, füllen Sie
das Formular von Hand aus: Jedes Feld ist direkt bearbeitbar, und die KI-Funktionen sind vollständig optional.

### Was nicht an einen KI-Anbieter gesendet wird

Für den Betrieb der Plattform gibt Compass **weder** Ihre Biografie, Ihre Kompatibilitätsantworten, Ihren
Suchverlauf **noch** Ihre privaten Nachrichten an ein KI-Modell. Der Kompatibilitätswert ist reine Rechnung auf
Ihren eigenen Antworten — der
[Code ist öffentlich](https://github.com/CompassConnections/Compass/blob/main/common/src/profiles/compatibility-score.ts),
und es ist kein Modell beteiligt.

Administratorinnen und Administratoren, die die Website moderieren oder eine Vorstellung vorbereiten, dürfen
Hilfsmittel einschließlich KI-Assistenten einsetzen — auf Profilinhalte und auf Unterhaltungen, an denen sie
selbst beteiligt sind. Nicht auf private Unterhaltungen zwischen anderen Personen.

Die aktuelle Liste aller externen Anbieter, die Ihre Daten berühren, steht in der
[Datenschutzrichtlinie](/privacy#drittanbieter-auf-die-wir-angewiesen-sind).

## Gemeinschaftsstandards

Compass ist für Menschen da, die Tiefe statt Masse wollen, und die Regeln folgen daraus.

**Behandeln Sie Menschen als Menschen.** Gehen Sie respektvoll miteinander um. Belästigung, Hassrede,
Drohungen und wiederholte unerwünschte Kontaktaufnahme, nachdem sich jemand zurückgezogen hat, sind Gründe für
eine Entfernung.

**Kein Spam, keine Werbung.** Nutzen Sie Compass nicht, um zu werben, zu rekrutieren, ein Unternehmen zu
bewerben oder Betrug zu begehen. Massenhaft identische Nachrichten sind das deutlichste Signal dafür und werden
automatisch begrenzt — siehe unten.

**Keine Nacktheit und keine sexuell expliziten Inhalte.** Compass erlaubt kein öffentliches Teilen von
Nacktheit, sexuellen Handlungen oder sexuell anzüglichem Material. Solche Inhalte werden entfernt und können zu
einer Sperre führen.

**Null Toleranz gegenüber sexuellem Kindesmissbrauch und Kinderausbeutung (CSAE).** Dazu gehören Grooming,
Sextortion, Menschenhandel sowie jeder Inhalt und jedes Verhalten, das ein Kind sexuell ausbeutet, missbraucht
oder gefährdet. Ein Verdacht auf CSAE führt zur sofortigen Kontolöschung und kann, soweit gesetzlich
vorgeschrieben, an Strafverfolgungsbehörden und an das National Center for Missing and Exploited Children
(NCMEC) gemeldet werden.

**Keine Gewaltdarstellungen.** Reale, drastische Gewalt außerhalb eines nachrichtlichen, einordnenden oder
bildenden Zwecks ist nicht erlaubt, und Inhalte, die Gewalt bewerben oder verherrlichen, werden entfernt.

**Veröffentlichen Sie keine Informationen anderer Personen.** Private Angaben, Fotos oder Unterhaltungen ohne
Einwilligung zu teilen, ist nicht erlaubt. Das gilt auch für Screenshots von Compass-Unterhaltungen.

**Standort.** Compass teilt Ihren genauen Standort nicht mit anderen Mitgliedern. Profile zeigen eine Stadt, in
der Genauigkeit, die Sie wählen.

## Sicherheitsfunktionen, Moderation und Sperren

Sie können ein Mitglied [blockieren](/settings), ein Profil ausblenden, eine Person oder einen Inhalt melden
und jede Unterhaltung verlassen. Meldungen gehen an menschliche Moderatorinnen und Moderatoren.

Einige Grenzen werden automatisch durchgesetzt:

- **Mehr als 5 neue Unterhaltungen innerhalb von 24 Stunden setzen Ihr Konto vorübergehend aus.** Das ist ein
  Spamschutz, kein Urteil — er trifft automatisierte Konten, und gelegentlich ein echtes Mitglied mit einem
  besonders eifrigen Tag. Ein Mensch prüft jeden Fall, in der Regel innerhalb von 24 Stunden, und stellt Konten
  wieder her, die echt wirken. Nichts von dem, was Sie geschrieben haben, geht dabei verloren.
- **Konten in Prüfung** sind eingeschränkt, bis eine moderierende Person sie angesehen hat.
- **Bestätigter Missbrauch — Betrug, Spam, Belästigung — ist endgültig.** Es gibt keine Überprüfung, und wir
  erklären nicht, welches Signal das Konto auffällig gemacht hat.

Moderierende können Inhalte entfernen, Kommentare ausblenden und Konten sperren oder löschen, die gegen diese
Regeln verstoßen. Wenn eine Entscheidung eine Ermessensfrage und kein klarer Verstoß ist, können Sie ihr
widersprechen, indem Sie [uns schreiben](/contact).

## Compass ist kostenlos und bleibt es

Es gibt nichts zu kaufen. Keine Abos, keine Bezahlstufen, keine In-App-Käufe, keine Werbung und keinen Verkauf
Ihrer personenbezogenen Daten. Jede Funktion steht jedem Mitglied offen.

Spenden sind freiwillig, finanzieren Hosting und laufende Kosten und verschaffen auf der Plattform keinerlei
Vorteil — weder Sichtbarkeit noch Funktionen noch Moderationsentscheidungen. Wohin das Geld fließt, steht auf
[/financials](/financials).

Das sind nicht bloß Versprechen in einem Dokument: Nach dem unten beschriebenen Governance-Modell würde die
Einführung von Werbung, Bezahlfunktionen oder Datenmonetarisierung eine Abstimmung der Gemeinschaft erfordern.

## Open Source und Lizenzierung

Compass wird offen entwickelt. Sofern nicht anders angegeben, stehen Quellcode, Designs und zugehörige
Materialien unter der **AGPL-3.0**; einzelne Komponenten stehen unter permissiven Lizenzen und sind im
Repository entsprechend gekennzeichnet. Im Rahmen dieser Lizenzbedingungen dürfen Sie die Materialien nutzen,
kopieren, verändern, veröffentlichen und verbreiten.

**Beiträge.** Mit dem Einreichen von Code, Designs, Dokumentation oder anderen Beiträgen stimmen Sie zu, dass
diese unter derselben Lizenz stehen, die zum Zeitpunkt Ihres Beitrags für das Projekt gilt, und Sie bestätigen,
dass Sie zur Erteilung dieser Lizenz berechtigt sind und Ihr Beitrag keine Rechte Dritter verletzt.

**Ihre Profilinhalte fallen nicht unter diese Lizenz.** Die AGPL gilt für die Software, nicht für das, was
Mitglieder schreiben.

## Gemeinschaftliche Governance

Wesentliche Änderungen — an der Lizenzierung, an der Monetarisierung, an diesen Bedingungen oder daran, wie die
Plattform verwaltet wird — durchlaufen den [Governance-Prozess](/constitution): Vorschläge werden
veröffentlicht, diskutiert und [abgestimmt](/vote), und die Entscheidungen sind öffentlich.

Das ist der Mechanismus hinter den Versprechen oben. Eine Zusage, die eine einzelne Person still zurücknehmen
kann, ist keine besonders belastbare Zusage; diese hier lassen sich nur durch eine Abstimmung zurücknehmen, an
der Sie teilnehmen können.

## Verfügbarkeit und Haftung

Compass wird so bereitgestellt, wie es ist, von einem kleinen ehrenamtlichen Projekt, ohne jede Gewährleistung.
Wir garantieren weder einen unterbrechungsfreien Betrieb noch, dass niemals Daten verloren gehen, noch dass
jedes Mitglied die Person ist, die es zu sein vorgibt.

**Compass ist nicht verantwortlich für Streitigkeiten zwischen Mitgliedern oder dafür, was geschieht, wenn Sie
jemanden treffen.** Nutzen Sie Ihr Urteilsvermögen, treffen Sie sich beim ersten Mal an einem öffentlichen Ort
und sagen Sie jemandem, wohin Sie gehen. Soweit gesetzlich zulässig, haftet Compass nicht für mittelbare Schäden
oder Folgeschäden aus Ihrer Nutzung der Plattform.

Nichts hiervon schränkt Rechte ein, die vertraglich nicht eingeschränkt werden können — einschließlich Ihrer
Rechte nach der DSGVO, die in der [Datenschutzrichtlinie](/privacy) dargestellt sind.

## Nutzung beenden

Sie können Ihr Konto jederzeit unter [/delete-account](/delete-account) löschen. Die Löschung entfernt Ihr
Profil, Ihre Inhalte und Ihre Nachrichten und räumt die auf Ihrem Gerät gespeicherte Analyse-Identität auf.

Wir können ein Konto sperren oder löschen, das gegen diese Bedingungen verstößt, wie oben unter Moderation
beschrieben.

## Änderungen dieser Bedingungen

Diese Bedingungen liegen wie der Rest der Website im
[Repository](https://github.com/CompassConnections/Compass/blob/main/web/public/md/terms.md). Jede Änderung ist
also ein öffentlicher Commit mit Datum und Diff — Sie können genau nachlesen, was sich wann geändert hat.
Wesentliche Änderungen durchlaufen die Governance und werden unter [/news](/news) angekündigt. Wenn Sie Compass
nach einer Änderung weiter nutzen, akzeptieren Sie die aktualisierten Bedingungen.

## Kontakt

Fragen zu diesen Bedingungen: [hello@compassmeet.com](mailto:hello@compassmeet.com) oder
[/contact](/contact). Für Sicherheitslücken gibt es einen eigenen Weg — siehe [/security](/security).

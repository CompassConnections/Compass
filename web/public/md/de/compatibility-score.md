# Wie der Kompatibilitätsscore funktioniert

Die Zahl auf einem Profil schätzt genau eines: **wie wahrscheinlich Sie beide auf lange Sicht
miteinander glücklich wären**, wenn Sie zusammenkämen. Sie ist reine Rechnung auf dem, was Sie beide
auf Compass geschrieben haben, sonst nichts. Kein Modell, kein verstecktes Ranking, kein bezahlter
Vorteil. Jede Regel unten steht im
[Open-Source-Code](https://github.com/CompassConnections/Compass/blob/main/common/src/profiles/compatibility-factors.ts),
und auf jedem Profil können Sie die Aufschlüsselung öffnen und jede Zeile selbst nachsehen.

**Bedenken Sie, dass der Score nur eine grobe Schätzung ist.** Keine Studie misst bisher sauber, wie gut
Matching-Algorithmen vorhersagen können, ob eine Beziehung funktioniert. Nehmen Sie ihn also als
Ausgangspunkt, bleiben Sie offen und lernen Sie unterschiedliche Menschen kennen, um herauszufinden, was
für Sie am besten passt.

Konkret heißt ein Wert unter 50 % meist, dass Sie beide bei etwas auseinanderliegen, das für eine Seite
ein K.-o.-Kriterium ist, etwa Kinder, Entfernung oder Alter. Ein hoher Wert bedeutet nicht, dass Sie sicher
zueinander passen: Er macht diese Person zu einem vielversprechenden Kandidaten unter vielen. Das meiste,
was zwei Menschen kompatibel macht, zeigt sich erst im Gespräch.

## Was die Forschung sagt

Die Evidenz ist sehr dünn, weil die ideale Studie, Menschen zufällig zusammenzubringen und zu messen, wie sie
miteinander auskommen, ethisch kaum umsetzbar ist (man kann niemanden zwingen, lange zusammenzubleiben). Und
leider haben diejenigen, die Matching-Algorithmen im großen Stil einsetzen (die großen Dating-Apps), ein
finanzielles Interesse daran, dass ihre Algorithmen nicht funktionieren, erst recht daran, keine Daten dazu zu
veröffentlichen. Schauen wir uns an, was es gibt und was wir daraus mitnehmen.

- **Anziehung nach einem Speed-Date** ([Joel, Eastwick & Finkel, 2017](https://journals.sagepub.com/doi/10.1177/0956797617714580)). Die Teilnehmenden füllten
  rund hundert Selbstauskünfte aus, bevor sie zufällig zugeloste Speed-Dates absolvierten, und bewerteten dann
  ihre Anziehung zu jedem Gegenüber. Ein Teil der Anziehung ließ sich dadurch erklären, wie anziehend das
  Gegenüber auf Menschen im Allgemeinen wirkt und wie leicht die bewertende Person sich generell zu Menschen
  hingezogen fühlt. Ob sich aber ein bestimmtes Paar mehr oder weniger zueinander hingezogen fühlen würde,
  erklärte der Fragebogen nicht. Das überrascht nicht, wenn man genauer hinsieht: Alle Teilnehmenden waren
  19-jährige Studierende einer einzigen US-Universität. Der Fragebogen ließ zudem genau die Fragen aus, die uns
  für eine glückliche Beziehung am aussagekräftigsten erscheinen: Kinder, Wohnort, Religion, Ernährung,
  Studienfach, angestrebter Beruf, Lebensplanung (Heirat, Kindererziehung usw.) und die anderen Werte, die in
  unseren eigenen Kompatibilitätsfragen vorkommen. Dass alle Teilnehmenden aus demselben Umfeld stammten, macht
  es noch schwerer, denn ein Fragebogen kann sie dann kaum unterscheiden. Stattdessen drehten sich die meisten
  Fragen um Persönlichkeitsmerkmale wie die Big Five, Bindungsstil, Soziosexualität und Selbsteinschätzungen
  der eigenen Person und des idealen Partners (rational, kreativ, optimistisch usw.). Der wichtigste Grund,
  warum diese Studie in der Kompatibilitätsforschung nicht viel Gewicht haben sollte, ist aber die absurd kurze
  Dauer der Begegnung: **vier Minuten**. Vier Minuten messen eine erste Anziehung, nicht annähernd, ob eine
  Beziehung hält (also Kompatibilität).
- **Was ein glückliches Paar vorhersagt** ([Joel et al., 2020](https://www.pnas.org/doi/10.1073/pnas.1917036117)). Dieselbe Erstautorin fasste danach
  11 196 Paare aus 43 Studien zusammen und fragte, was die Zufriedenheit jedes Partners am besten vorhersagt.
  Die Fakten über jede Person (Persönlichkeit, Stimmung, Alter, Bildung, Einkommen) erklärten höchstens ein
  Fünftel davon. Was jede Person über die Beziehung selbst sagte (wie engagiert der Partner wirkt, wie geschätzt
  man sich fühlt, Sexualität, Konflikte), erklärte doppelt so viel, und die Antworten des Partners fügten nichts
  hinzu. In den Worten der Autoren: „Wer ich bin“ zählt kaum, sobald man weiß, „wer ich bin, wenn ich mit dir
  zusammen bin“. Ob zwei Fremde miteinander auskommen würden, beantwortet das allerdings nicht. Es waren Paare,
  die sich bereits gewählt hatten, oft Jahre zuvor, sodass jedes Paar mit einem Ausschlusskriterium zwischen
  sich entweder nie entstanden oder vor Studienbeginn getrennt war. Wegen dieses Überlebensbias kann ein
  Unterschied, der Menschen schon auseinandergebracht hat, bevor sie ein Paar wurden, nicht als Prädiktor
  auftauchen, und der Effekt jedes Unterschieds wird unterschätzt: Die Paare, die eine Kluft überbrückt haben
  und noch zusammen sind, sind die, für die sie am wenigsten zählte. Deshalb brachte es auch nur zwei Punkte
  erklärter Varianz, die Antworten des Partners zu den eigenen hinzuzunehmen, und deshalb stehen Religion,
  Politik, Bildung und „was ich mir von einem Partner wünsche“ am Ende ihrer Liste. Die Autoren selbst rufen zu
  Forschung über die Anfänge von Beziehungen auf, dort, wo diese Filter wirken.
- **Interkonfessionelle Ehen enden öfter** ([Lehrer & Chiswick, 1993](https://doi.org/10.2307/2061647); [Call & Heaton, 1997](https://doi.org/10.2307/1387856); [Vaaler, Ellison & Powers, 2009](https://doi.org/10.1111/j.1741-3737.2009.00644.x)). Zufriedenheitsbefragungen wie die oben hören nur Paare, die
  noch zusammen sind: Was ein Unterschied die gekostet hat, die es nicht mehr sind, sehen sie nicht. Eine
  Scheidung dagegen ist ein Ereignis, und Demografen verfolgen sie seit Jahrzehnten in großen US-Haushaltspanels.
  Paare unterschiedlicher Konfession trennen sich öfter als Paare derselben; der Abstand ist am größten zwischen
  den Religionen, die sich am meisten unterscheiden, und schrumpft, wenn beide sich in Glauben und Praxis nahe
  sind. Eine gemeinsame Religion wog etwa so viel wie das Alter bei der Heirat, und ein Unterschied darin, wie
  oft beide Gottesdienste besuchen, zählte mehr als die Bezeichnung, die jeder trägt. Die üblichen Grenzen gelten:
  US-Stichproben, verheiratete Paare aus den 1980er und 1990er Jahren, und wer über die Konfession hinweg
  geheiratet hat, hing wohl ohnehin am wenigsten an seiner, was den Effekt kleiner aussehen lässt, als er ist,
  nicht größer. Deshalb steht Religion im Score als abgestufte Zeile und nicht als Ausschlusskriterium, und
  deshalb gewichten wir sie lieber zu schwach, als sie zu übergehen.
- **Worin sich Paare tatsächlich gleichen** ([Horwitz et al., 2023](https://www.nature.com/articles/s41562-023-01672-z.pdf)). Eine Metaanalyse von 199 Studien zu 22
  Merkmalen plus 79 074 Paare aus der UK Biobank, mit einer einfacheren Frage als die obigen: Wie ähnlich sind sich
  die beiden Menschen eines Paares? Sehr ähnlich bei politischen Werten (Korrelation 0,58), Religiosität (0,56),
  Bildung (0,55, aus fast zwei Millionen Paaren) und Rauchen (0,49), etwas beim Trinken (0,42) und kaum bei der
  Persönlichkeit: Offenheit 0,21, Gewissenhaftigkeit 0,16, Neurotizismus und Verträglichkeit 0,11, Extraversion
  0,08. Das einzige Merkmal, bei dem sich Gegensätze etwas häufiger als zufällig finden, ist Morgen- oder
  Abendmensch. Die Studie sieht nur Paare, die es schon gibt, sodass eine Korrelation drei Dinge vermischt, die sie
  nicht trennen kann: dass man jemanden wählt, der einem gleicht, dass man vor allem Menschen trifft, die einem
  gleichen (Campus, Arbeitsplatz, Nachbarschaft), und dass Partner sich über die Jahre angleichen, was wohl einen
  guten Teil der Zahlen zu Rauchen und Trinken erklärt. Ob die ähnlichen Paare glücklicher sind, sagt sie auch
  nicht. Was sie uns gibt, ist eine Rangfolge dessen, wonach Menschen sich am Ende sortieren, über zwei Millionen
  Paare: Werte und Gewohnheiten oben, Persönlichkeit unten. Genau diese Trennung macht dieser Score, und deshalb
  wiegt die Big-Five-Zeile so wenig. Sie deutet auch an, dass Bildung, Rauchen und Trinken vielleicht mehr verdienen
  als den halben Punkt, den wir ihnen geben.
- **Funktionieren Matching-Algorithmen?** ([Finkel et al., 2012](https://www.psychologicalscience.org/publications/journals/pspi/online-dating.html)). Eine sechzigseitige Übersicht über
  Online-Dating von fünf Beziehungsforschern, von denen zwei die obige Speed-Dating-Studie durchführten. Zum
  Matching fanden sie **keinen überzeugenden Beleg, dass irgendein Algorithmus funktioniert**, aus einem
  einfachen Grund: eHarmony, Chemistry und die anderen haben weder ihre Daten noch ihre Methoden je
  veröffentlicht, und die wenigen Studien, auf die sie verwiesen, verglichen die Erfolgsquote ihrer eigenen Kunden
  mit einem beliebigen Querschnitt von Datenden. Das sagt mehr darüber, wie motiviert diese Kunden sind (Leute,
  die für eine auf Ehe ausgerichtete Seite bezahlt haben, älter waren und einen langen Fragebogen ausgefüllt
  haben), als darüber, ob dieselben Kunden ohne den Algorithmus schlechter gefahren wären, wenn sie die Profile
  selbst durchgesehen hätten. Die Autoren gehen weiter und
  argumentieren, dass kein Algorithmus, der nur mit dem gefüttert wird, was vor einer Begegnung bekannt ist,
  mehr als einen kleinen Teil langfristiger Ergebnisse erklären kann, weil er nicht wissen kann, wie das Paar
  interagieren, sich entwickeln und mit dem umgehen wird, was das Leben bringt. Sie räumen ein, dass
  Ähnlichkeit in den Werten, die ein gemeinsames Leben ordnen, etwa Religion und Vorstellungen von
  Familienrollen, „ein Anfang“ ist, und dass Algorithmen zumindest Menschen aussortieren können, die generell
  schlechte Partner abgeben. Wir stimmen dem allem zu, und deshalb ist dieser Score als Filter und nicht als
  Vorhersage angelegt. Bedenken Sie, dass hier eine Branche begutachtet wird, die nie jemanden hineinschauen
  ließ: „kein Beleg“ heißt ungeprüft, nicht geprüft und gescheitert.
- **Ausschlusskriterien wiegen schwerer als Pluspunkte** ([Jonason et al., 2015](https://journals.sagepub.com/doi/full/10.1177/0146167215609064)). Sechs Studien mit
  über 6 500 Personen. Studierende listeten auf, was jemanden ausschließen würde, eine Umfrage unter 2 744
  alleinstehenden US-Erwachsenen ließ Ausschlusskriterien aus einer Liste ankreuzen, und andere Gruppen
  bewerteten erfundene Partner, die in wenigen Zeilen beschrieben waren, mit und ohne Makel. Die Menschen
  gewichteten einen Makel stärker als eine vergleichbare Stärke, mehr bei einer festen Beziehung als bei einer
  Affäre, und Frauen mehr als Männer. Die häufigsten Ausschlusskriterien waren ein ungesunder Lebensstil,
  Unzuverlässigkeit oder Gleichgültigkeit, bereits jemanden zu daten und eine andere Art von Beziehung zu
  wollen. Außer in der landesweiten Umfrage waren die Teilnehmenden wieder überwiegend Studierende, niemand hat
  jemanden getroffen, und Menschen zu fragen, was sie ablehnen würden, ist nicht dasselbe, wie zu beobachten,
  was sie ablehnen: Die Speed-Dating-Forschung zeigt, dass beides weit auseinanderliegen kann. Dennoch ist es
  der beste Beleg, den wir haben, dass erklärte Ausschlusskriterien das sind, worauf Menschen zuerst achten,
  und deshalb stehen sie in diesem Score ganz oben.
- **Gefühlte und tatsächliche Ähnlichkeit** ([Montoya, Horton & Kirchner, 2008](https://journals.sagepub.com/doi/abs/10.1177/0265407508096700)). Eine Metaanalyse von
  313 Studien. Jemandem ähnlich zu sein sagt stark voraus, dass man ihn mag, wenn sich die beiden nie begegnen
  und nur eine Beschreibung voneinander lesen, weniger, wenn sie kurz miteinander sprechen, und gar nicht mehr
  in einer bestehenden Beziehung. Sich ähnlich zu fühlen sagt Zuneigung dagegen in allen drei Situationen
  voraus. Die meisten dieser Studien sind alte Laborexperimente, in denen Studierende einen Fremden anhand
  eines ausgefüllten Meinungsfragebogens bewerteten, so weit entfernt von einer Beziehung, wie es nur geht, und
  wer jemanden mag, hält ihn auch eher für ähnlich, sodass ein Teil des Effekts in die andere Richtung läuft.
  Was wir daraus lernen, ist bescheiden: Ein Profil lässt Menschen sich vor der Begegnung ähnlich oder
  verschieden fühlen, und dieses Gefühl entscheidet, wer eine erste Nachricht bekommt, während die tatsächliche
  Übereinstimmung der Meinungen wenig zählt, sobald sich zwei Menschen kennen. Deshalb verlangen die Fragen auch
  eine Erklärung und nicht nur ein Häkchen.
- **Sich-Öffnen schafft Nähe** ([Aron et al., 1997](https://ggia.berkeley.edu/practice/36_questions_for_increasing_closeness)). Paare von Fremden in einem Psychologiekurs
  beantworteten 45 Minuten lang 36 Fragen, die nach und nach persönlicher wurden, von „Möchten Sie berühmt
  sein“ bis „Wann haben Sie zuletzt vor jemandem geweint“, während eine Kontrollgruppe Smalltalk hielt. Danach
  stuften die Fragen-Paare ihre neue Bekanntschaft als enger ein als die engste Beziehung im Leben von etwa
  30 % vergleichbarer Studierender, und Wochen später hatten 57 % wieder miteinander gesprochen und 35 % etwas
  zusammen unternommen. Die Paare nach Meinungen zusammenzustellen oder ihnen zu sagen, sie würden einander
  mögen, änderte nichts. Es waren wieder Studierende einer einzigen Universität, die Paare waren
  gemischtgeschlechtlich oder zwei Frauen, und die Autoren sagen klar, dass das Ziel Nähe am Ende der Stunde
  war, keine Beziehung; die Schlagzeilen über „36 Fragen, um sich zu verlieben“ kamen viel später. Wir nehmen
  den Mechanismus mit, nicht das Ergebnis: Wechselseitiges, sich steigerndes Sich-Öffnen schafft schnell Nähe,
  Einigkeit in Meinungen nicht. Eine Frage mit einer echten Erklärung ist ein kleiner erster Schritt dieser Art.

**Was wir daraus mitnehmen.** Die Evidenz ist schwach, und niemand sollte behaupten, ein Algorithmus
könne Ihren Partner auswählen. Umgekehrt gibt es auch keinen Beleg dafür, dass ein Algorithmus nutzlos
wäre. Für uns zeichnet sich ab, dass der Score drei eng gefasste Aufgaben erfüllen kann, und mehr
behauptet er nicht:

- **Strukturelle Unvereinbarkeiten aussortieren.** Ein Profil sagt fehlende Kompatibilität zuverlässig
  vorher, wenn ein Ausschlusskriterium vorliegt: Kinder, Monogamie, Wohnort, Alter, Religion, Ernährung
  (für manche von uns). Sie stehen in diesem Score ganz oben, und wir filtern sie in Ihren
  Suchergebnissen standardmäßig heraus.
- **Gemeinsamkeiten sichtbar machen.** Vorlieben (Werte, Gewohnheiten, Gemeinsamkeiten) weisen auf
  vielversprechende Kandidaten hin, aber nicht genau genug, um unter ihnen die eine passende Person
  herauszugreifen. Ähnlichkeit in Werten, Plänen und Herkunft hängt mit Stabilität zusammen,
  Ähnlichkeit in Persönlichkeitsmerkmalen kaum. Deshalb fragen die Fragen nach Werten und Verhalten,
  und deshalb wiegt die Big-Five-Zeile wenig.
- **Ihnen Gesprächsstoff geben.** Das meiste von dem, was zwei Menschen zueinander passen lässt, zeigt
  sich erst im Miteinander. Eine Frage mit Erklärung ist ein kleiner Akt des Sich-Öffnens: Sie schafft
  Nähe und stößt das Miteinander an, das zeigt, ob eine Beziehung funktionieren würde.

## Zuerst die Ausschlusskriterien

Einige Unvereinbarkeiten machen alles andere bedeutungslos. Trifft eine davon zu, bekommt das Paar gar
keinen Score, und das Profil nennt stattdessen den Grund:

- **Geschlecht** — Sie sind nicht das jeweils gesuchte Geschlecht.
- **Art der Verbindung** — eine Person sucht nur Freundschaft, die andere nur eine Beziehung. Ein leeres
  Feld zählt nie gegen Sie.
- **Beziehungsstil** — Sie wollen beide eine Beziehung, und eine Person ist strikt monogam, die andere
  strikt polyamor oder offen.
- **Kinder** — Sie wollen beide eine Beziehung und haben gegensätzlich zum Kinderwunsch geantwortet (mehr
  als zwei Stufen auseinander auf der fünfstufigen Skala). Benachbarte Antworten sind ein gradueller
  Unterschied und zählen weiter unten.

Altersbereich und Entfernung sind **keine** Ausschlusskriterien. Außerhalb des angegebenen Bereichs zu
liegen kostet viel, aber es ist ein Preis, keine Mauer.

## Woraus der Score besteht

Jede Zeile unten ergibt eine Zahl zwischen 0 und 1 und trägt ein Gewicht. Die Antworten auf die Fragen
sind die schwerste Zeile, sobald Sie einige beantwortet haben; Ihre Profile liefern den Rest.

- **Antworten auf die Fragen** — Gewicht bis 8, wachsend mit gemeinsamen Antworten. Für jede Frage, die Sie beide beantwortet haben: Ihre Antwort, die Antworten, die Sie akzeptieren würden, und wie wichtig sie Ihnen ist, in beide Richtungen. Das Gewicht beginnt bei 0 und erreicht sein Maximum bei 100 gemeinsamen Antworten.
- **Altersbereich** — Gewicht 3. Volle Punkte innerhalb des vom anderen angegebenen Bereichs. Außerhalb: die Hälfte bei 1–2 Jahren, ein Fünftel bei 3–5, fast nichts darüber. Die ungünstigere Richtung zählt.
- **Kinderwunsch** — Gewicht 3. Gleiche Antwort → 1, eine Stufe auseinander → 0,85, zwei Stufen → 0,6. Nur wenn Sie beide eine Beziehung wollen.
- **Entfernung** — Gewicht 3. Volle Punkte bis 40 km, dann ein sanfter Abfall, der nie unter 0,6 geht — es sei denn, eine Person hat eine Höchstentfernung gesetzt: darüber fällt die Zeile stufenweise auf fast nichts bei zweieinhalbfacher Grenze.
- **Beziehungsstatus** — Gewicht 2. Eine Person single, die andere verheiratet oder in einer langen Beziehung, und niemand offen oder polyamor → 0,1. Nur wenn Sie beide eine Beziehung wollen.
- **Gemeinsame Sprache** — Gewicht 2. Mindestens eine gemeinsame Sprache → 1, keine → 0,1.
- **Gemeinsame Interessen, Anliegen, Arbeit** — Gewicht 2. Über alle drei Listen hinweg nach Namen verglichen, sodass „Effektiver Altruismus“ zählt, egal ob als Interesse oder Anliegen eingetragen. Mehr Überschneidung, höherer Wert; nichts gemeinsam → 0,5.
- **Ernährung** — Gewicht 2, wenn eine Person vegan oder vegetarisch ist, sonst 0,5. Vegan mit vegan oder vegetarisch mit vegetarisch → 1; vegan mit vegetarisch → 0,9; pflanzlich mit pescetarisch → 0,6; pflanzlich mit omnivor → 0,3. Zwei Omnivore gewinnen wenig daraus (0,8).
- **Religion** — Gewicht 1,5. Etwas gemeinsam → 1, nichts → 0,4.
- **Politik** — Gewicht 1,5. Etwas gemeinsam → 1, nichts → 0,4.
- **Beziehungsstil** — Gewicht 1. Identische Antworten → 1, Überschneidung → 0,8. Nur wenn Sie beide eine Beziehung wollen.
- **Cannabis**, **Psychedelika** — Gewicht je 1. Ihre angegebene Präferenz zum Konsum eines Partners gegen dessen tatsächlichen Konsum: „lieber nicht“ bei regelmäßigem Konsum → 0,1, „lieber ja“ bei nie → 0,3 und so weiter. Die ungünstigere Richtung zählt.
- **Big-Five-Persönlichkeit** — Gewicht 1. 1 minus der durchschnittliche Unterschied über die fünf Merkmale.
- **Rauchen** — Gewicht 0,5. Gleich → 1, verschieden → 0,5.
- **Alkohol** — Gewicht 0,5. Nähere Monatswerte zählen höher; 20 oder mehr Getränke auseinander → 0,4.
- **Sport** — Gewicht 0,5. Gleiche Häufigkeit → 1, eine Stufe auseinander → 0,8, zwei → 0,5.
- **Bildung** — Gewicht 0,5. Höchstens eine Stufe auseinander → 1, zwei → 0,8, mehr → 0,6.

## Wie die Zeilen zusammenkommen

Der Score ist ein **gewichtetes geometrisches Mittel** der Zeilen. Einfach gesagt: Die Zeilen werden
multipliziert, jede mit ihrem Anteil am Gesamtgewicht als Exponent. Anders als beim Durchschnitt zieht
eine sehr niedrige Zeile bei etwas Wichtigem die ganze Zahl nach unten, statt von einem Dutzend guter
Zeilen ausgeglichen zu werden — genau das, was ein Beinahe-Ausschlusskriterium tun soll. Keine Zeile
kann unter 0,05 fallen, sodass eine einzelne schlechte Zeile den Score nie allein auf null setzt.

## Der wahrscheinliche Bereich

Jede Zeile ist eine Schätzung, also trägt jede Zeile einen Bereich, und der Score zeigt ebenfalls einen:
„72 %, wahrscheinlich zwischen 58 % und 84 %“. Zeilen, die Sie beide beantwortet haben, haben einen
engen Bereich. Eine Zeile, die eine Person leer gelassen hat, wird **nicht als Unvereinbarkeit
behandelt**: Sie zählt mit einem neutralen Wert, einem weiten Bereich und halbem Gewicht. Deshalb liest
sich ein halb leeres Profil als „irgendwo zwischen 40 % und 90 %“ statt als selbstsichere Zahl, und
deshalb wird der Bereich enger, je mehr eine Person ausfüllt. Der Bereich der Fragen-Zeile wird enger,
je mehr Fragen Sie beide beantworten.

**Die Sortierung nutzt das untere Ende des Bereichs.** Wenn Sie Menschen nach Kompatibilität sortieren,
folgt die Reihenfolge dem unteren Ende jedes Bereichs, nicht der Zahl in der Mitte. Zwei Profile mit
86 % sind nicht gleich, wenn eines „80 bis 90“ zeigt und das andere „56 bis 98“: Das zweite hat die
meisten Felder leer gelassen und passt zufällig bei den wenigen ausgefüllten. Die Sortierung nach dem
unteren Ende setzt das Paar nach vorn, über das man mehr weiß, und sie bedeutet, dass das Ausfüllen
Ihres Profils oder das Beantworten von Fragen Sie nach oben bringt — leere Felder nie. Die Zahl auf
einer Karte bleibt die Schätzung in der Mitte.

## Was absichtlich weggelassen wird

Ethnische Herkunft und Körpergröße werden nie bewertet: Niemand gibt auf Compass eine Präferenz dazu an,
und wir würden sie auch dann nicht bewerten. Der MBTI wird übersprungen, weil seine Aussagekraft schwach
ist und die Big Five das Feld abdecken. Neurotyp, sexuelle Orientierung (Ihre Geschlechtspräferenz
trägt die Übereinstimmung bereits), der Ort, an dem Sie aufgewachsen sind, und aller Freitext — Bio,
Schlagwörter, Beruf — werden ebenfalls nicht bewertet.

## Die Aufschlüsselung lesen

Auf jedem Profil öffnet der Kompatibilitätsblock in der rechten Spalte die Aufschlüsselung: den
Gesamtscore, den Score allein aus den Fragen, jede Zeile mit Gewicht und Bereich und die Zeilen, die
noch unbekannt sind, weil eine Person ein Feld leer gelassen hat. Die Aufschlüsselung wird live in Ihrem
Browser aus den beiden Profilen berechnet; die gespeicherte Zahl für die Sortierung zieht kurz nach einer
Profiländerung nach.

Der Code ist öffentlich, Änderungen sind willkommen:
[`compatibility-factors.ts`](https://github.com/CompassConnections/Compass/blob/main/common/src/profiles/compatibility-factors.ts)
für die Faktoren und
[`compatibility-score.ts`](https://github.com/CompassConnections/Compass/blob/main/common/src/profiles/compatibility-score.ts)
für den Fragen-Score.

## Das ist eine erste Version

Das ist die erste Version des Scores, und wir testen sie. Alles oben ist ein Satz von Hand gewählter
Regeln und Gewichte, kein an Ergebnissen trainiertes Modell, und wir rechnen damit, sie zu ändern,
während wir dazulernen. Wenn eine Zeile falsch wirkt, ein Gewicht nicht stimmt oder die Zahl nicht zu
Ihrer Erfahrung mit jemandem passt, sagen Sie es uns.

Am meisten bewegen würden uns Belege: eine Studie, ein Datensatz oder Ihre eigene Erfahrung, die zeigt,
dass Profile und Algorithmen Kompatibilität besser vorhersagen, als wir denken, oder schlechter. Wir
sind ebenso bereit, den Score ehrgeiziger zu machen wie bescheidener. Schicken Sie es über das
[Kontaktformular](/contact), das [Feedback-Formular](https://forms.gle/tKnXUMAbEreMK6FC6), oder öffnen
Sie ein Issue auf [GitHub](https://github.com/CompassConnections/Compass/issues).

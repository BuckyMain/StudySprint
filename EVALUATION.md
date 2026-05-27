# Usability Evaluation – StudySprint

## Inhaltsverzeichnis

1. [Vorbereitung](#1-vorbereitung)
  1. [Ziele der Evaluation](#11-ziele-der-evaluation)
  2. [Fragestellungen](#12-fragestellungen)
  3. [Testaufbau](#13-testaufbau)
  4. [Testaufgaben / Szenarien](#14-testaufgaben--szenarien)
  5. [Fragen nach dem Test](#15-fragen-nach-dem-test)
2. [Durchführung](#2-durchführung)
  1. [Ablauf](#21-ablauf)
  2. [Feedback Grid (Vorlage)](#22-feedback-grid-vorlage)
3. [Auswertung](#3-auswertung)
  1. [Stichprobe](#31-stichprobe)
  2. [Kennzahlen & Beobachtungen (Issue Map)](#32-kennzahlen--beobachtungen-issue-map)
  3. [Zusammenfassung der Resultate](#33-zusammenfassung-der-resultate)
  4. [Abgeleitete Verbesserungen](#34-abgeleitete-verbesserungen)

---

## 1. Vorbereitung

### 1.1 Ziele der Evaluation

Mit der Usability Evaluation soll überprüft werden, ob der StudySprint-Prototyp den zentralen Lernworkflow **Planung → Fokus → Fortschritt → Reflexion** verständlich und intuitiv unterstützt. Im Vordergrund stehen die Fragen, ob Nutzer:innen die Kernfunktionen ohne Anleitung nutzen können und ob der Prototyp die Erwartungen der Zielgruppe (Studierende) erfüllt.

### 1.2 Fragestellungen


| #   | Fragestellung                                                                                | Betroffener Workflow     |
| --- | -------------------------------------------------------------------------------------------- | ------------------------ |
| F1  | Können Nutzer:innen eine neue Lernaufgabe eigenständig anlegen und verwalten?                | Aufgaben-Workflow        |
| F2  | Ist der Einstieg in eine Fokus-Session und das Abschliessen derselben intuitiv verständlich? | Fokus-Workflow           |
| F3  | Wird die Reflexionseingabe nach einer Session als sinnvoller Schritt wahrgenommen?           | Fokus-Workflow           |
| F4  | Können Nutzer:innen ihren Lernfortschritt und absolvierte Sessions nachvollziehen?           | Fortschritts-Workflow    |
| F5  | Ist der Deadline-Import via Texteingabe verständlich und wird er als hilfreich empfunden?    | Deadline-Import-Workflow |


### 1.3 Testaufbau


| Attribut             | Beschreibung                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Vorgehen**         | Moderiert, On-site (Kleinklasse)                                                                                                                                         |
| **Infrastruktur**    | Laptop/Notebook des Testleiters/der Testleiterin mit geöffneter App (Browserprototyp), separates Gerät (Smartphone oder zweiter Laptop) zur Anzeige der Aufgabenstellung |
| **Prototyp-Version** | Interaktiver SvelteKit-Prototyp (deployed oder lokal auf `localhost:5173`)                                                                                               |
| **Aufgabenstellung** | Schriftlich auf separatem Gerät – Testperson kann jederzeit nachlesen                                                                                                    |
| **Protokollierung**  | Feedback Grid (handschriftlich oder digital) durch Testleiter:in; Testperson denkt laut                                                                                  |
| **Anzahl Tests**     | Mind. 2 Testpersonen (je ca. 10 Minuten), Rollen danach tauschen                                                                                                         |
| **Stichprobe**       | Mitstudierende, die den Prototyp noch nicht kennen                                                                                                                       |


> **Hinweis zu Eingabefeldern:** Alle Formularfelder sind im Prototyp interaktiv. Falls eine Datenbankverbindung fehlt, kann die Testleiter:in direkt nachfragen, was die Testperson eingeben würde, und den nächsten Schritt manuell anzeigen.

### 1.4 Testaufgaben / Szenarien

> Die Aufgaben werden der Testperson **schriftlich** auf einem separaten Gerät präsentiert. Die Testperson liest jede Aufgabe selbst, bevor sie beginnt. Keine Hinweise auf konkrete UI-Elemente oder Begriffe der Lösung.

---

#### Aufgabe 1 – Einstieg: Lernaufgabe anlegen

**Ausgangslage:**
Sie sind Studierende:r im dritten Semester und stehen kurz vor der Prüfungsphase. Sie nutzen StudySprint zum ersten Mal und möchten die App für Ihr Lernen einsetzen.

**Vorhaben:**
Sie haben nächste Woche eine Prüfung im Modul «Statistik». Sie möchten diese Prüfungsvorbereitung in der App festhalten, damit Sie den Überblick behalten. Gehen Sie vor, wie es für Sie am natürlichsten erscheint.

---

#### Aufgabe 2 – Aufgabe bearbeiten und priorisieren

**Ausgangslage:**
Sie haben mehrere Aufgaben in der App erfasst. Eine davon – die Prüfungsvorbereitung für Statistik – ist inzwischen dringlicher geworden.

**Vorhaben:**
Sie möchten die Aufgabe als «Hoch dringend» markieren und gleichzeitig festhalten, dass Sie bereits begonnen haben, sich vorzubereiten. Nehmen Sie die entsprechenden Anpassungen vor.

---

#### Aufgabe 3 – Fokus-Session starten und abschliessen

**Ausgangslage:**
Sie haben heute Abend eine Stunde Zeit und möchten konzentriert für Statistik lernen. Sie wissen, dass die App eine Funktion hat, die Sie beim fokussierten Arbeiten unterstützen soll.

**Vorhaben:**
Starten Sie eine Lernsession für Ihre Statistik-Aufgabe. Lassen Sie den Timer laufen (Sie können ihn für den Test kurz pausieren oder direkt beenden) und schliessen Sie die Session ab.

---

#### Aufgabe 4 – Reflexion erfassen

**Ausgangslage:**
Sie haben gerade Ihre Lernsession beendet. Die App scheint eine Möglichkeit zu bieten, kurz festzuhalten, wie die Session gelaufen ist.

**Vorhaben:**
Halten Sie fest, dass die heutige Session gut lief, dass Sie aber gemerkt haben, dass das Thema «Hypothesentests» noch mehr Zeit braucht. Gehen Sie vor, wie es Ihnen am sinnvollsten erscheint.

---

#### Aufgabe 5 – Lernfortschritt nachvollziehen

**Ausgangslage:**
Sie nutzen StudySprint seit einer Weile und möchten sehen, wie produktiv Sie in den letzten Tagen waren.

**Vorhaben:**
Verschaffen Sie sich einen Überblick darüber, wie viele Lernsessions Sie absolviert haben und welche Module Sie zuletzt bearbeitet haben.

---

### 1.5 Fragen nach dem Test

#### Kurzfragen nach jeder Aufgabe

- Was hat gut funktioniert, was weniger?
- Hatten Sie Schwierigkeiten? Wenn ja, wo und weshalb?
- Haben Sie etwas vermisst oder etwas Unerwartetes erlebt?
- *(Aufgabenspezifisch, z.B. nach Aufgabe 3):* Wie hat sich der Timer-Bereich angefühlt? War klar, wie Sie eine Session beenden?

#### Kurzinterview nach dem gesamten Test

**Allgemein zur App:**

- Was ist Ihnen besonders positiv aufgefallen?
- Was hat Sie gestört oder verwirrt?
- Kennen Sie ähnliche Apps (z.B. Todoist, Forest, Notion)? Wie unterscheidet sich StudySprint?
- Würden Sie die App in Ihrem Studienalltag einsetzen? Weshalb (nicht)?

**Zu den Aufgaben:**

- Welche der Aufgaben wären im Alltag für Sie relevant?
- Welche Funktion hat gefehlt, die Sie erwartet hätten?
- War die Navigation zwischen den Bereichen (Aufgaben, Fokus, Fortschritt) klar?

---

## 2. Durchführung

### 2.1 Ablauf

Ein:e Testleiter:in führt durch den Test:

1. **Begrüssung & Briefing:** Kurze Erklärung des Ablaufs (ca. 2 Min.). Testperson wird gebeten, laut zu denken.
2. **Aufgaben stellen:** Testperson liest Aufgabe selbst auf separatem Gerät.
3. **Beobachten:** Testleiter:in notiert Beobachtungen im Feedback Grid, greift so wenig wie möglich ein.
4. **Reagieren auf Interaktionen:**
  - Bei fehlender Interaktion (z.B. Button noch nicht verlinkt): Testleiter:in zeigt, was passiert wäre.
  - Bei Unklarheit: Testleiter:in fragt nach («Was würden Sie hier erwarten?»), gibt aber keine Hinweise.
5. **Kurzfragen nach jeder Aufgabe** (siehe Abschnitt 1.5).
6. **Kurzinterview** am Schluss (ca. 3–5 Min.).
7. **Rollentausch** und zweite Runde.

### 2.2 Feedback Grid (Vorlage)

> Dieses Grid wird für jede Testperson separat ausgefüllt.

---

**Name/Code Testperson:** _______________  
**Version Prototyp:** _______________  
**Datum:** _______________


| Was hat gut funktioniert? / Was hat gefallen? | Was hat nicht/schlecht funktioniert? / Was hat gestört? |
| --------------------------------------------- | ------------------------------------------------------- |
|                                               |                                                         |
|                                               |                                                         |



| Was hat gefehlt (Funktionen, Optionen, Infos …)? | Was war unklar (Abfolge, Benennungen, Texte …)? / Welche Fragen sind aufgetaucht? |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
|                                                  |                                                                                   |
|                                                  |                                                                                   |



| Neue Ideen / Anforderungen |
| -------------------------- |
|                            |


---

## 3. Auswertung

### 3.1 Stichprobe


| Attribut                | Beschreibung                                                             |
| ----------------------- | ------------------------------------------------------------------------ |
| **Anzahl Testpersonen** | 2                                                                        |
| **Profil**              | Mitstudierende (ZHAW), keine Vorerfahrung mit StudySprint                |
| **Datum der Tests**     | 20.05.2026                                                               |
| **Getestete Version**   | [https://studysprintv1.netlify.app/](https://studysprintv1.netlify.app/) |



| Code  | Profil                                            |
| ----- | ------------------------------------------------- |
| TP-01 | Laurenz Ströbele (stroelau) – Mitstudierender     |
| TP-02 | Maaruthan Vignarajah (vignamaa) – Mitstudierender |


---

### 3.2 Kennzahlen & Beobachtungen (Issue Map)

**Schweregrad-Skala:**


| Wert | Bedeutung                                                                        |
| ---- | -------------------------------------------------------------------------------- |
| 0    | Kein Problem                                                                     |
| 1    | Kosmetisches Problem – nur fixen, wenn keine andere Arbeit anfällt               |
| 2    | Kleines Problem – mit tiefer Priorität angehen                                   |
| 3    | Grosses Problem – sollte behoben werden, hohe Priorität                          |
| 4    | Usability-Katastrophe – muss umgehend behoben werden, sonst kein Release möglich |


*(Quelle: [Nielsen Norman Group – Severity Ratings](https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/))*

---

**Issue Map – Workflow: Aufgaben verwalten (F1)**


| Issue # | Ort                       | Problem                                                                               | Ursache                                                       | Empfehlung                                                                                     | Schweregrad | Testperson(en) |
| ------- | ------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------- | -------------- |
| I-01    | Aufgaben-Tab – Navigation | Kein «Zurück»-Button vorhanden; unklar ob alle oder nur offene Tasks angezeigt werden | Fehlende Navigationselemente; kein Hinweis auf aktiven Filter | «Zurück»-Button einheitlich platzieren; Listenüberschrift zeigt aktiven Filterstatus           | 3           | TP-01          |
| I-02    | Aufgaben-Tab – Formular   | Label «Dauer (Minuten)» unklar: geschätzte Bearbeitungszeit oder Zielvorgabe?         | Zu generisches Label ohne Kontext                             | Label präzisieren: «Geschätzte Bearbeitungsdauer (Min.)»                                       | 2           | TP-01          |
| I-03    | Aufgaben-Tab – Formular   | Label für Datumsfeld fehlt; unklar was eingetragen werden soll                        | Kein beschreibendes Label gesetzt                             | Label «Deadline / Abgabefrist» hinzufügen                                                      | 2           | TP-01          |
| I-04    | Home-Tab                  | «Quick Actions» spiegeln nur Menüpunkte; kein Mehrwert auf Startseite                 | Konzeptuelle Doppelung mit Bottom-Navigation                  | Quick Actions durch Dashboard-Elemente ersetzen (Fortschrittsübersicht, Aufgaben dieser Woche) | 3           | TP-01          |
| I-05    | Home-Tab                  | Bezeichnung «Task-Seitenansicht» unverständlich                                       | Interne Benennung versehentlich im UI sichtbar                | Umbenennen zu «Meine Aufgaben» oder entfernen                                                  | 2           | TP-01          |
| I-06    | Aufgaben-Tab – Liste      | Liste nicht sortierbar oder filterbar; keine Modulfilterung                           | Feature im Prototyp v1 nicht implementiert                    | Sortierung nach Priorität, Deadline, Dauer; Filter nach Modul                                  | 3           | TP-01          |
| I-07    | Profil-Tab                | Profil-Bereich noch unvollständig                                                     | Noch nicht ausgebaut im Testzeitpunkt                         | Profilverwaltung (Name, Einstellungen) ergänzen                                                | 2           | TP-02          |


**Issue Map – Workflow: Fokus-Session & Reflexion (F2, F3)**


| Issue # | Ort                   | Problem                                                           | Ursache                                                             | Empfehlung                                                                  | Schweregrad | Testperson(en) |
| ------- | --------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------- | -------------- |
| I-08    | Fokus-Tab / allgemein | Begriff «Session» vs. «Task» unklar – braucht es den Unterschied? | Konzeptuell zwei Entitäten, die im UI nicht klar differenziert sind | «Session»-Begriff entfernen oder als «Fokus-Einheit» einer Task unterordnen | 3           | TP-01          |
| I-09    | Navigation            | Menüpunkt «Validate» erscheint im UI und verwirrt Nutzende        | Entwicklungsartefakt nicht entfernt                                 | Menüpunkt vollständig entfernen                                             | 4           | TP-01          |


**Issue Map – Workflow: Fortschritt (F4)**


| Issue # | Ort                              | Problem                                                                          | Ursache                                                        | Empfehlung                                                                                              | Schweregrad | Testperson(en) |
| ------- | -------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------- | -------------- |
| I-10    | Fortschritts-Tab                 | «Anzahl Sessions = 2», obwohl nur 1 Task abgeschlossen wurde – Diskrepanz unklar | Sessions und Tasks werden separat gezählt ohne klare Erklärung | Sessions-Zähler entfernen oder klar beschriften; Bezug zur abgeschlossenen Task herstellen              | 3           | TP-01          |
| I-11    | Fortschritts-Tab – Aufgabenliste | Abgeschlossene Tasks ohne Details: Modul, Titel, Soll/Ist-Dauer fehlen           | Nur Basisinfos dargestellt                                     | Modul, Titel, geschätzte vs. tatsächliche Dauer anzeigen; farbliche Kennzeichnung (effizient / zu lang) | 2           | TP-01          |
| I-12    | Fortschritts-Tab                 | Kein wöchentlicher Verlauf als Diagramm sichtbar                                 | Feature nicht implementiert                                    | Wochenchart (Tasks pro Wochentag) oder Monatsansicht ergänzen                                           | 2           | TP-01          |


**Issue Map – Workflow: Deadline-Import (F5)**


| Issue # | Ort                             | Problem                                                                                                                 | Ursache                                              | Empfehlung                                                                                                    | Schweregrad | Testperson(en) |
| ------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------- | -------------- |
| I-13    | Tasks-Tab – Semesterplan-Import | Importierte Tasks können nicht einzeln überprüft, bearbeitet oder selektiv übernommen werden; nur Löschen möglich       | Übernahme war «Alle oder nichts» ohne Review-Schritt | Import-Review-Ansicht einbauen: jede extrahierte Aufgabe einzeln bearbeiten und gezielt übernehmen            | 4           | TP-01          |
| I-14    | Tasks-Tab – Semesterplan-Import | Beschreibung des Import-Feldes unklar: Nutzende wissen nicht, dass Semesterplan-Text eingefügt werden kann              | Beschreibungstext zu generisch                       | Beschreibung präzisieren: «Semesterplan-Text oder PDF-Inhalt einfügen – Deadlines werden automatisch erkannt» | 2           | TP-01          |
| I-15    | Tasks-Tab – Semesterplan-Import | OCR/PDF-Erkennung funktioniert nicht zuverlässig                                                                        | API-Limitierungen oder Bildqualität                  | Ladespinner und Fehlermeldung verbessern; Fallback auf Text-Import empfehlen                                  | 3           | TP-02          |
| I-16    | Tasks-Tab – Layout              | Import-Block und «Neue Aufgabe»-Formular stehen über der Aufgabenliste; Nutzende müssen weit scrollen um Tasks zu sehen | Reihenfolge im UI: Formulare vor Liste               | Aufgabenliste an erste Position; Import/Neu als separate Unterseiten oder ausklappbare Sektionen              | 3           | TP-01          |


---

### 3.3 Zusammenfassung der Resultate

Die Evaluation mit zwei Mitstudierenden (20.05.2026, Version v1) zeigt, dass der **Gesamtworkflow Planung → Fokus → Fortschritt grundsätzlich verständlich** ist und die Startseite einen guten Überblick verschafft. Der Deadline-Import per Semesterplan wurde als nützliches Feature wahrgenommen. Gleichzeitig wurden mehrere Usability-Probleme identifiziert: Die **Navigation ist inkonsistent** (fehlender «Zurück»-Button, kein einheitliches Aktions-Layout), der **Deadline-Import erlaubt keine selektive Übernahme** einzelner Tasks (kritisch), und der **Fortschritts-Tab fehlt wichtige Details** zu abgeschlossenen Aufgaben. Der Begriff «Session» schafft konzeptuelle Verwirrung und sollte aus dem UI entfernt werden. Die OCR-Funktion lieferte bei einem Tester unzuverlässige Ergebnisse.

---

### 3.4 Abgeleitete Verbesserungen


| Priorität | Verbesserung                                                                       | Begründung (Issue-Referenz)                                        | Status         |
| --------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------- |
| Hoch      | Menüpunkt «Validate» entfernen                                                     | I-09: Verwirrt Nutzende, Entwicklungsartefakt                      | umgesetzt (v2) |
| Hoch      | Import-Review einbauen: Einzelne Tasks prüfen, bearbeiten und selektiv übernehmen  | I-13: Übernahme war bisher alles-oder-nichts, kein Kontrollschritt | umgesetzt (v2) |
| Hoch      | «Session»-Begriff entfernen; Fortschritt nur über abgeschlossene Tasks tracken     | I-08, I-10: Konzeptuelle Verwirrung bei Nutzenden                  | umgesetzt (v2) |
| Hoch      | Aufgabenliste in den Vordergrund; Import/Neu als Unteransicht                      | I-16: Nutzende mussten weit scrollen um Task-Liste zu sehen        | umgesetzt (v2) |
| Mittel    | Back-Navigation einheitlich positionieren                                          | I-01: Fehlender Zurück-Button führte zu Orientierungslosigkeit     | umgesetzt (v2) |
| Mittel    | Sortierung und Filterung der Aufgabenliste (Priorität, Deadline, Modul)            | I-06: Nutzende konnten keine Übersicht nach Relevanz erstellen     | umgesetzt (v2) |
| Mittel    | Fortschritts-Tab: Modul, Titel, Soll/Ist-Dauer pro abgeschlossener Task anzeigen   | I-11: Fortschritt war zu wenig informativ                          | umgesetzt (v2) |
| Mittel    | Quick Actions auf Home durch Fortschrittsübersicht und Aufgaben-der-Woche ersetzen | I-04: Duplikat zur Navigation, kein Mehrwert                       | umgesetzt (v2) |
| Tief      | Label «Dauer (Minuten)» präzisieren zu «Geschätzte Bearbeitungsdauer (Min.)»       | I-02: Semantisch unklar für Nutzende                               | umgesetzt (v2) |
| Tief      | Label für Datumsfeld ergänzen («Deadline / Abgabefrist»)                           | I-03: Fehlende Orientierung im Formular                            | umgesetzt (v2) |
| Tief      | Import-Beschreibungstext präzisieren                                               | I-14: Nutzende erkannten Funktion des Feldes nicht                 | umgesetzt (v2) |
| Tief      | OCR-Fehlermeldung und Ladespinner verbessern                                       | I-15: Unzuverlässige Rückmeldung bei PDF-Import                    | offen          |


> Umgesetzte Verbesserungen sind in **Kapitel 4 (Erweiterungen)** der Hauptdokumentation festgehalten.

---

*Usability Evaluation – StudySprint | ZHAW Prototyping | HS 2026*
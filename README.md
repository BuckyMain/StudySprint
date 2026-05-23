# Projektdokumentation - StudySprint

## Inhaltsverzeichnis

1. [Ausgangslage](#1-ausgangslage)
2. [Lösungsidee](#2-lösungsidee)
3. [Vorgehen & Artefakte](#3-vorgehen--artefakte)
    1. [Understand & Define](#31-understand--define)
    2. [Sketch](#32-sketch)
    3. [Decide](#33-decide)
    4. [Prototype](#34-prototype)
    5. [Validate](#35-validate)
4. [Erweiterungen](#4-erweiterungen-optional)
5. [Projektorganisation](#5-projektorganisation-optional)
6. [KI-Deklaration](#6-ki-deklaration)
7. [Anhang](#7-anhang-optional)


## 1. Ausgangslage

Im Studienalltag haben viele Studierende Mühe, ihre Lernzeit realistisch zu planen und konzentriert zu arbeiten. Häufig werden Lernaufgaben zwar vorgenommen, aber nicht klar priorisiert, zu spät begonnen oder durch Ablenkungen unterbrochen. Dadurch entstehen Stress, Zeitdruck und das Gefühl, trotz hohem Aufwand nicht produktiv genug zu sein. Besonders vor Prüfungen oder bei mehreren parallelen Abgaben fehlt oft eine einfache, motivierende und strukturierte Unterstützung für Planung, Fokus und Reflexion.

Viele bestehende Tools decken nur Teilaspekte ab. Kalender-Apps helfen bei der Terminplanung, To-do-Apps beim Erfassen von Aufgaben und Timer-Apps beim Fokussieren. Was oft fehlt, ist eine integrierte Lösung, die speziell auf den Lernalltag von Studierenden ausgerichtet ist und die wichtigsten Schritte in einem konsistenten Workflow verbindet: Lernziel festlegen, Session planen, fokussiert arbeiten, Fortschritt festhalten und daraus lernen.

- **Problem:** Studierende haben häufig Schwierigkeiten, ihre Lernzeit realistisch einzuschätzen, Lernaufgaben sinnvoll zu priorisieren, konzentrierte Lernphasen ohne Ablenkung durchzuführen, ihren Fortschritt sichtbar zu machen und aus vergangenen Lernsessions Verbesserungen abzuleiten. Dies führt zu ineffizientem Lernen, höherem Stresslevel und geringerer Zufriedenheit mit dem eigenen Lernverhalten.
- **Ziele:** Mit **StudySprint** soll ein digitaler Prototyp entstehen, der Studierende dabei unterstützt, Lernziele klar zu formulieren, Lernsessions einfach zu planen, fokussiert zu arbeiten, Lernfortschritt sichtbar zu machen und nach einer Session kurz zu reflektieren. Das angestrebte Ergebnis ist eine benutzerfreundliche, interaktive App mit klarem Workflow.
- **Primäre Zielgruppe:** Studierende an Hochschulen, die mehrere Module gleichzeitig organisieren müssen, unter Zeitdruck stehen und ihre Lernphasen strukturierter gestalten möchten.
- **Weitere Stakeholder [Optional]:** _[keine weiteren Stakeholder im Mindestumfang definiert]_


## 2. Lösungsidee

**StudySprint** ist eine Lernplan- und Fokus-App für Studierende. Die App verbindet Aufgabenplanung, Lernsessions, Fokusmodus und Reflexion in einem zusammenhängenden Prozess. Nutzer:innen sollen nicht nur To-dos erfassen, sondern ihren Lernalltag aktiv strukturieren und verbessern können.

Der zentrale Lernworkflow lautet: **Planung → Fokus → Fortschritt → Reflexion**

- **Kernfunktionalität:** Lernaufgaben anlegen und verwalten, eine Fokus-Session mit Timer starten, Fortschritt erfassen, eine kurze Reflexion festhalten und eine Übersicht über offene Aufgaben sowie absolvierte Sessions anzeigen.
- **Annahmen [Optional]:** Die wichtigste Hypothese ist, dass ein integrierter Workflow (Planung + Fokus + Reflexion in einer App) mehr Mehrwert bietet als einzelne Speziallösungen. Weitere Annahme: Studierende sind bereit, kurze Reflexionen nach Sessions einzutragen, wenn der Aufwand minimal ist.
- **Abgrenzung [Optional]:** Nicht Teil des Mindestumfangs sind Integrationen mit externen Kalendern, Push-Benachrichtigungen oder kollaborative Lernfunktionen.

## 3. Vorgehen & Artefakte

Die Durchführung erfolgt phasenbasiert; dokumentieren Sie die wichtigsten Ergebnisse je Phase.

### 3.1 Understand & Define

- **Zielgruppenverständnis:** Der Problemraum liegt in den Bereichen Bildung, Digitalisierung und Produktivität im Alltag. Typische Nutzer:innen sind Bachelor- oder Masterstudierende mit mehreren parallelen Modulen, engem Zeitbudget und dem Wunsch nach besserer Selbstorganisation.
- **Wesentliche Erkenntnisse:**
  - Viele Studierende nutzen heute mehrere getrennte Tools für Planung, Fokus und Reflexion.
  - Das Kernproblem ist nicht nur fehlende Planung, sondern die fehlende Verbindung zwischen Planung, Durchführung und Reflexion.
  - Bestehende Productivity-Tools sind oft zu generisch oder zu komplex.
  - Ein reduzierter, studierendengerechter MVP bietet mehr Mehrwert als eine überladene Lösung.
  - **How-Might-We-Fragen:** Wie könnten wir Studierenden helfen, ihre Lernzeit realistischer zu planen? Wie könnten wir Ablenkung während Lernphasen reduzieren? Wie könnten wir Lernfortschritte sichtbar machen, damit Motivation und Selbstorganisation steigen?

### 3.2 Sketch

- **Variantenüberblick:** Es wurden drei grobe Lösungsrichtungen identifiziert.
- **Skizzen:**
  - **Variante A: Fokus auf Planung** – Aufgabenverwaltung und Session-Planung stehen im Zentrum. Einfache To-do-Liste mit Zeitschätzungen.
  - **Variante B: Fokus auf Fokusmodus** – Timer und konzentriertes Arbeiten stehen im Zentrum. Pomodoro-ähnliche Struktur ohne Aufgabenverwaltung.
  - **Variante C: Integrierter Lernworkflow** – Planung, Fokusmodus, Fortschritt und Reflexion werden in einem durchgehenden Ablauf kombiniert. Komplexer, aber vollständiger Ansatz.

### 3.3 Decide

- **Gewählte Variante & Begründung:** **Variante C – Integrierter Lernworkflow**, da sie das Kernproblem am vollständigsten adressiert, mehrere klare Workflows ermöglicht und sich gut für einen interaktiven Prototyp mit Datenverarbeitung eignet. Entscheidkriterien: Problemabdeckung, Interaktionstiefe, technische Umsetzbarkeit.
- **End-to-End-Ablauf:** Nutzer:in öffnet das Dashboard, legt eine Aufgabe an, startet eine Fokus-Session mit Timer, trägt anschliessend Fortschritt ein, ergänzt eine kurze Reflexion und sieht die aktualisierte Übersicht.
- **Mockup:** [Figma-Prototyp (Übung 10)](https://www.figma.com/proto/RmKMdEYCp6l5oIJJj5h3HG/StudySprint---Uebung-10-Prototyp?node-id=16-494&t=slL3OtXg9dkGPyHz-1)

### 3.4 Prototype

#### 3.4.1. Entwurf (Design)

Beschreibt die Gestaltung und Interaktion.

> **Hinweis:** Hier wird der **Prototyp** beschrieben, nicht das **Mockup**.

- **Informationsarchitektur:** Hauptseiten sind Dashboard (mit Tabs: Home, Aufgaben, Fokus, Fortschritt, Profil), Aufgaben-Übersicht, Aufgabe erstellen/bearbeiten, Fokusmodus und Reflexion. Navigation erfolgt primär über eine Bottom-Tab-Leiste (Mobile-first).
- **User Interface Design:** _[Screenshots werden nach Deployment ergänzt]_
- **Designentscheidungen:**
  - Mobile-first mit Bottom-Navigation (Tab-Leiste).
  - Reduzierte, ruhige Oberfläche mit wenig Ablenkung.
  - Fokusmodus visuell klar abgesetzt (grosser Timer, eine aktive Aufgabe).
  - Sichtbarer Fortschritt als Motivationselement.
  - Reflexion als kurze Mikro-Interaktion nach einer Session.

#### 3.4.2. Umsetzung (Technik)

Fasst die technische Realisierung zusammen.

- **Technologie-Stack:**

  | Technologie | Verwendung |
  |---|---|
  | SvelteKit (Svelte 5 Runes) | Frontend-Framework, Routing, API-Handler |
  | Bootstrap 5 + Bootstrap Icons | UI-Styling und Icons |
  | MongoDB (via `mongodb` Node-Driver) | Persistenz (Tasks, Sessions, Reflections) |
  | Google Gemini API (`@google/genai`) | OCR-Erkennung für Deadline-Extraktion |
  | `@sveltejs/adapter-auto` | Deployment-Adapter |

- **Tooling:** VS Code / Cursor IDE mit Svelte-Extension; MongoDB Atlas (Cloud-Datenbank); Netlify/Vercel für Deployment. KI-Einsatz siehe Kapitel **KI-Deklaration**.

- **Struktur & Komponenten:**

  | Komponente | Beschreibung |
  |---|---|
  | `TaskList.svelte` | Kachelliste aller Aufgaben; dispatcht `toggle`- und `delete`-Events |
  | `TaskForm.svelte` | Wiederverwendbares Formular für Erstellen und Bearbeiten von Aufgaben |
  | `FeedbackMessage.svelte` | Zeigt Erfolgs- und Fehlermeldungen an |

  Implementierte Seiten/Routen:

  | Route | Beschreibung |
  |---|---|
  | `/` | Dashboard mit Tab-Navigation (Home, Aufgaben, Fokus, Fortschritt, Profil) |
  | `/tasks` | Aufgaben-Übersicht mit Filter- und Sortierfunktion |
  | `/tasks/new` | Neue Aufgabe erfassen |
  | `/tasks/[id]/edit` | Bestehende Aufgabe bearbeiten |

- **Daten & Schnittstellen:** Daten werden in MongoDB Atlas gespeichert und über REST-API-Endpunkte verwaltet. Das Datenmodell für Tasks:

  ```json
  {
    "title": "String (Pflicht)",
    "module": "String (Pflicht)",
    "priority": "Number (1–5, Standard: 3)",
    "status": "String (open | in-progress | done)",
    "dueDate": "Date (optional)",
    "duration": "Number (Minuten, Standard: 60)",
    "createdAt": "Date"
  }
  ```

  API-Endpunkte:

  | Endpunkt | Methoden | Funktion |
  |---|---|---|
  | `/api/tasks` | GET, POST | Alle Aufgaben abrufen / neue Aufgabe erstellen |
  | `/api/tasks/[id]` | GET, PATCH, DELETE | Einzelne Aufgabe lesen, aktualisieren, löschen |
  | `/api/sessions` | GET, POST | Lernsessions abrufen / erstellen |
  | `/api/sessions/[id]` | PATCH, DELETE | Session aktualisieren / löschen |
  | `/api/reflections` | GET, POST | Reflexionen abrufen / erstellen |
  | `/api/deadlines/extract` | POST | Deadlines per Regex aus Text extrahieren |
  | `/api/deadlines/ocr` | POST | Deadlines aus Bild per Google Gemini extrahieren |

- **Deployment:** *(Link wird nach Deployment ergänzt)* – Platform: Netlify / Vercel (via `@sveltejs/adapter-auto`). Benötigte Umgebungsvariablen: `MONGODB_URI`, `MONGODB_DB_NAME`, `GEMINI_API_KEY`.

  Lokale Entwicklung:

  ```sh
  npm install
  # .env-Datei erstellen mit MONGODB_URI, MONGODB_DB_NAME, GEMINI_API_KEY
  npm run dev
  ```

- **Besondere Entscheidungen:** MongoDB wurde gegenüber einer SQL-Datenbank bevorzugt, da das Datenmodell flexibel und schemalos entwickelt werden sollte. Die Reflexions- und Session-Entitäten wurden bewusst getrennt gehalten, um spätere Erweiterungen zu vereinfachen. OCR-Deadline-Erkennung wurde als optionale Erweiterung über die Gemini API integriert, da eine lokale OCR-Lösung zu aufwändig gewesen wäre.

### 3.5 Validate

- **URL der getesteten Version:** *(wird nach Deployment ergänzt)*
- **Ziele der Prüfung:** Es soll untersucht werden, ob Nutzer:innen den Ablauf intuitiv verstehen, Aufgaben einfach erstellen und bearbeiten können, der Fokusmodus als hilfreich wahrgenommen wird und Fortschritt sowie Reflexion verständlich sind.
- **Vorgehen:** *(wird nach Evaluation ergänzt – geplant: moderiert, on-site)*
- **Stichprobe:** *(wird nach Evaluation ergänzt)*
- **Aufgaben/Szenarien:**
  1. Lege eine neue Aufgabe für ein Modul an.
  2. Setze die Aufgabe auf «In Bearbeitung».
  3. Starte eine Fokus-Session und schliesse sie ab.
  4. Hinterlasse eine kurze Reflexion zur Session.
  5. Bearbeite die Aufgabe und ändere die Priorität.
- **Kennzahlen & Beobachtungen:** *(wird nach Evaluation ergänzt)*
- **Zusammenfassung der Resultate:** *(wird nach der Evaluation ergänzt)*
- **Abgeleitete Verbesserungen:** *(wird nach der Evaluation ergänzt)*

## 4. Erweiterungen
Dokumentiert Erweiterungen über den Mindestumfang hinaus.

> **Hinweis:** Jede Erweiterung ist separat nach dem folgenden Schema beschrieben.

### 4.1 OCR-Deadline-Erkennung
- **Beschreibung & Nutzen:** Bilder (z. B. Stundenplan-Screenshots) können hochgeladen werden. Google Gemini extrahiert automatisch Deadlines aus dem Bild. Spart manuelles Abtippen und reduziert Fehler.
- **Wo umgesetzt:**
  - **Frontend:** Datei-Upload im Dashboard-Tab «Home»
  - **Backend:** API-Endpunkt `/api/deadlines/ocr` in `src/routes/api/deadlines/ocr/+server.js`
- **Referenz:** Technologie-Stack-Tabelle in Kap. 3.4.2
- **Aus Evaluation abgeleitet?:** Nein, von Beginn an geplant.

### 4.2 Text-basierte Deadline-Extraktion
- **Beschreibung & Nutzen:** Freitext kann eingegeben werden; ein Regex-Algorithmus erkennt Daten und Modulnamen automatisch. Ermöglicht schnellen Import ohne manuelle Eingabe.
- **Wo umgesetzt:**
  - **Frontend:** Texteingabe-Feld im Dashboard-Tab «Home»
  - **Backend:** API-Endpunkt `/api/deadlines/extract` in `src/routes/api/deadlines/extract/+server.js`
- **Referenz:** API-Endpunkte-Tabelle in Kap. 3.4.2
- **Aus Evaluation abgeleitet?:** Nein, von Beginn an als Ergänzung zur OCR-Variante geplant.

### 4.3 Reflexions-Workflow
- **Beschreibung & Nutzen:** Nach Lernsessions kann eine kurze Reflexion mit Bewertung (Rating 1–5) und optionaler Notiz gespeichert werden. Fördert die Metakognition und hilft, Lerngewohnheiten zu verbessern.
- **Wo umgesetzt:**
  - **Frontend:** Reflexions-Formular im Anschluss an den Fokusmodus
  - **Backend:** API-Endpunkte `/api/reflections` (GET, POST) in `src/routes/api/reflections/+server.js`
  - **Datenbank:** Separate `reflections`-Collection in MongoDB
- **Referenz:** Fokus-Workflow-Beschreibung in Kap. 3.4.2; API-Tabelle in Kap. 3.4.2
- **Aus Evaluation abgeleitet?:** Nein, von Beginn an Teil des Konzepts.

### 4.4 Sessions-Persistenz
- **Beschreibung & Nutzen:** Lernsessions werden mit Thema, Modul, Startzeit und Dauer in MongoDB gespeichert. Ermöglicht die Anzeige von Fortschrittsstatistiken.
- **Wo umgesetzt:**
  - **Backend:** API-Endpunkte `/api/sessions` und `/api/sessions/[id]` in `src/routes/api/sessions/`
  - **Datenbank:** Separate `sessions`-Collection in MongoDB
- **Referenz:** API-Tabelle und Fortschritts-Workflow in Kap. 3.4.2
- **Aus Evaluation abgeleitet?:** Nein, strukturell notwendig für den Fortschritts-Tab.

### 4.5 Prioritäten-System
- **Beschreibung & Nutzen:** Aufgaben können mit Priorität 1–5 versehen werden. Ermöglicht bessere Priorisierung im Lernalltag.
- **Wo umgesetzt:**
  - **Frontend:** Prioritäts-Selektor im `TaskForm.svelte`
  - **Backend:** `priority`-Feld im Task-Datenmodell, gespeichert in MongoDB
- **Referenz:** Datenmodell in Kap. 3.4.2
- **Aus Evaluation abgeleitet?:** Nein, von Beginn an geplant.

### 4.6 Filter & Sortierung
- **Beschreibung & Nutzen:** Die Aufgabenliste unterstützt Filterung nach Status und Sortierung nach Priorität, Fälligkeit und Erstelldatum. Verbessert die Übersicht bei vielen Aufgaben.
- **Wo umgesetzt:**
  - **Frontend:** Filter- und Sortier-Dropdowns in der Aufgaben-Übersicht (`/tasks`)
  - **Backend:** Query-Parameter-Verarbeitung im API-Endpunkt `/api/tasks`
- **Referenz:** Routen-Tabelle in Kap. 3.4.2
- **Aus Evaluation abgeleitet?:** Nein, von Beginn an geplant.

### 4.7 Fokus-Timer
- **Beschreibung & Nutzen:** Eingebauter Countdown-Timer im Fokusmodus mit Pause- und Abbruchfunktion. Unterstützt konzentriertes Arbeiten in definierten Zeitblöcken.
- **Wo umgesetzt:**
  - **Frontend:** Timer-Logik im Dashboard-Tab «Fokus», umgesetzt mit Svelte-Stores und `setInterval`
- **Referenz:** Fokus-Workflow-Beschreibung in Kap. 3.4.2
- **Aus Evaluation abgeleitet?:** Nein, zentrales Feature des Konzepts.

## 5. Projektorganisation
- **Repository & Struktur:** [GitHub – StudySprint](https://github.com/manuelmarti/StudySprint) *(Link wird ergänzt)*. Struktur: `src/routes/` für Seiten und API-Handler, `src/lib/` für wiederverwendbare Komponenten und Stores.
- **Issue-Management:** Aufgaben und Bugs werden als GitHub Issues erfasst und nach Priorität bearbeitet.
- **Commit-Praxis:** Sprechende Commits mit Präfixen (`feat:`, `fix:`, `refactor:`, `docs:`). Entwicklung primär auf `main`, Feature-Branches bei grösseren Änderungen.

## 6. KI-Deklaration

Die folgende Deklaration ist verpflichtend und beschreibt den Einsatz von KI im Projekt.

### 6.1 KI-Tools

- **Eingesetzte Tools:**
  - **Claude Sonnet** (via Cursor IDE) – KI-gestützte Code-Generierung, Refactoring, Debugging und Dokumentation
  - **ChatGPT** – Ideenfindung, Strukturierung der Problemstellung und Formulierung der Dokumentation
  - **GitHub Copilot** – Unterstützende Code-Vorschläge beim Schreiben
  - **Google Gemini API** – Eingebunden als Produktfeature für die OCR-basierte Deadline-Erkennung
- **Zweck & Umfang:** Claude Sonnet wurde am intensivsten eingesetzt, primär für Codevorschläge, Komponentenstruktur, API-Implementierungen und Refactoring. ChatGPT wurde für Ideenfindung und Textformulierungen genutzt. Copilot lieferte kleinere Autovervollständigungen. Grössere Teile des Codes (insbesondere API-Handler und Svelte-Komponenten) entstanden mit KI-Unterstützung und wurden eigenständig überprüft, angepasst und integriert.
- **Eigene Leistung (Abgrenzung):** Die Auswahl des Projektthemas, die inhaltliche Ausrichtung, alle Architektur- und Designentscheidungen sowie die Überarbeitung und Integration der KI-Vorschläge erfolgten eigenständig. KI dient unterstützend, ersetzt aber nicht die eigene Analyse, Umsetzung und Verantwortung.

### 6.2 Prompt-Vorgehen

Beim Einsatz von KI wurde darauf geachtet, konkrete und kontextbezogene Anweisungen zu formulieren. Typische Vorgehensweise: Zunächst wurde der Kontext (Technologie-Stack, Ziel der Komponente) beschrieben, dann eine klare Aufgabe formuliert. Ergebnisse wurden stets kritisch geprüft, auf Projektkonventionen angepasst und bei Bedarf iterativ verfeinert. Keine KI-Ausgabe wurde ungeprüft übernommen.

### 6.3 Reflexion

KI ist besonders bei Strukturierung, Boilerplate-Code und Formulierungen hilfreich und beschleunigt die Entwicklung erheblich. Gleichzeitig besteht das Risiko, zu generische Lösungen zu übernehmen, die nicht zum Projektkontext passen. Eine kritische Prüfung aller Ergebnisse ist deshalb unerlässlich. Bei komplexen Architekturentscheidungen erwies sich KI als weniger verlässlich – hier war eigenes Urteil gefragt.

## 7. Anhang

- **Quellen:**
  - App-Icon: [Flaticon – Study Icon](https://www.flaticon.com/de/kostenloses-icon/study_8445148)
- **Testskript & Materialien:** *(wird nach Evaluation ergänzt)*
- **Rohdaten/Auswertung:** *(wird nach Evaluation ergänzt)*

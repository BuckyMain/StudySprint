# Projektdokumentation – StudySprint

## Inhaltsverzeichnis

1. [Ausgangslage](#1-ausgangslage)
2. [Lösungsidee](#2-lösungsidee)
3. [Vorgehen & Artefakte](#3-vorgehen--artefakte)
   1. [Understand & Define](#31-understand--define)
   2. [Sketch](#32-sketch)
   3. [Decide](#33-decide)
   4. [Prototype](#34-prototype)
   5. [Validate](#35-validate)
4. [Erweiterungen](#4-erweiterungen)
5. [Projektorganisation](#5-projektorganisation)
6. [KI-Deklaration](#6-ki-deklaration)

---

## 1. Ausgangslage

Im Studienalltag haben viele Studierende Mühe, ihre Lernzeit realistisch zu planen und konzentriert zu arbeiten. Häufig werden Lernaufgaben zwar vorgenommen, aber nicht klar priorisiert, zu spät begonnen oder durch Ablenkungen unterbrochen. Dadurch entstehen Stress, Zeitdruck und das Gefühl, trotz hohem Aufwand nicht produktiv genug zu sein. Besonders vor Prüfungen oder bei mehreren parallelen Abgaben fehlt oft eine einfache, motivierende und strukturierte Unterstützung für Planung, Fokus und Reflexion.

Viele bestehende Tools decken nur Teilaspekte ab. Kalender-Apps helfen bei der Terminplanung, To-do-Apps beim Erfassen von Aufgaben und Timer-Apps beim Fokussieren. Was oft fehlt, ist eine integrierte Lösung, die speziell auf den Lernalltag von Studierenden ausgerichtet ist und die wichtigsten Schritte in einem konsistenten Workflow verbindet: Lernziel festlegen, Session planen, fokussiert arbeiten, Fortschritt festhalten und daraus lernen.

- **Problem:** Studierende haben häufig Schwierigkeiten, ihre Lernzeit realistisch einzuschätzen, Lernaufgaben sinnvoll zu priorisieren, konzentrierte Lernphasen ohne Ablenkung durchzuführen, ihren Fortschritt sichtbar zu machen und aus vergangenen Lernsessions Verbesserungen abzuleiten. Dies führt zu ineffizientem Lernen, höherem Stresslevel und geringerer Zufriedenheit mit dem eigenen Lernverhalten.
- **Ziele:** Mit **StudySprint** soll ein digitaler Prototyp entstehen, der Studierende dabei unterstützt, Lernziele klar zu formulieren, Lernsessions einfach zu planen, fokussiert zu arbeiten, Lernfortschritt sichtbar zu machen und nach einer Session kurz zu reflektieren. Das angestrebte Ergebnis ist eine benutzerfreundliche, interaktive App mit klarem Workflow.
- **Primäre Zielgruppe:** Studierende an Hochschulen, die mehrere Module gleichzeitig organisieren müssen, unter Zeitdruck stehen und ihre Lernphasen strukturierter gestalten möchten.

---

## 2. Lösungsidee

**StudySprint** ist eine Lernplan- und Fokus-App für Studierende. Die App verbindet Aufgabenplanung, Lernsessions, Fokusmodus und Reflexion in einem zusammenhängenden Prozess. Nutzer:innen sollen nicht nur To-dos erfassen, sondern ihren Lernalltag aktiv strukturieren und verbessern können.

Der zentrale Lernworkflow lautet: **Planung → Fokus → Fortschritt → Reflexion**

- **Kernfunktionalität:** Lernaufgaben anlegen und verwalten, eine Fokus-Session mit Timer starten, Fortschritt erfassen, eine kurze Reflexion festhalten und eine Übersicht über offene Aufgaben sowie absolvierte Sessions anzeigen.
- **Abgrenzung:** Nicht Teil des Mindestumfangs sind Integrationen mit externen Kalendern, Push-Benachrichtigungen oder kollaborative Lernfunktionen.

### Implementierte Seiten / Screens

| Route | Beschreibung |
|---|---|
| `/` | Dashboard mit Tab-Navigation (Home, Aufgaben, Fokus, Fortschritt, Profil) |
| `/tasks` | Aufgaben-Übersicht mit Filter- und Sortierfunktion |
| `/tasks/new` | Neue Aufgabe erfassen |
| `/tasks/[id]/edit` | Bestehende Aufgabe bearbeiten |

---

## 3. Vorgehen & Artefakte

### 3.1 Understand & Define

- **Zielgruppenverständnis:** Der Problemraum liegt in den Bereichen Bildung, Digitalisierung und Produktivität im Alltag. Typische Nutzer:innen sind Bachelor- oder Masterstudierende mit mehreren parallelen Modulen, engem Zeitbudget und dem Wunsch nach besserer Selbstorganisation.
- **Wesentliche Erkenntnisse:**
  - Viele Studierende nutzen heute mehrere getrennte Tools für Planung, Fokus und Reflexion.
  - Das Kernproblem ist nicht nur fehlende Planung, sondern die fehlende Verbindung zwischen Planung, Durchführung und Reflexion.
  - Bestehende Productivity-Tools sind oft zu generisch oder zu komplex.
  - Ein reduzierter, studierendengerechter MVP bietet mehr Mehrwert als eine überladene Lösung.

#### How-Might-We-Fragen

- Wie könnten wir Studierenden helfen, ihre Lernzeit realistischer zu planen?
- Wie könnten wir Ablenkung während Lernphasen reduzieren?
- Wie könnten wir Lernfortschritte sichtbar machen, damit Motivation und Selbstorganisation steigen?

### 3.2 Sketch

Es wurden drei grobe Lösungsrichtungen identifiziert:

- **Variante A: Fokus auf Planung** – Aufgabenverwaltung und Session-Planung stehen im Zentrum.
- **Variante B: Fokus auf Fokusmodus** – Timer und konzentriertes Arbeiten stehen im Zentrum.
- **Variante C: Integrierter Lernworkflow** – Planung, Fokusmodus, Fortschritt und Reflexion werden in einem Ablauf kombiniert.

### 3.3 Decide

- **Gewählte Variante:** **Variante C – Integrierter Lernworkflow**, da sie das Kernproblem am vollständigsten adressiert, mehrere klare Workflows ermöglicht und sich gut für einen interaktiven Prototyp mit Datenverarbeitung eignet.
- **End-to-End-Ablauf:** Nutzer:in öffnet das Dashboard, legt eine Aufgabe an, startet eine Fokus-Session mit Timer, trägt anschliessend Fortschritt ein, ergänzt eine kurze Reflexion und sieht die aktualisierte Übersicht.
- **Figma-Prototyp (Übung 10):** [Mockup auf Figma](https://www.figma.com/proto/RmKMdEYCp6l5oIJJj5h3HG/StudySprint---Uebung-10-Prototyp?node-id=16-494&t=slL3OtXg9dkGPyHz-1)

### 3.4 Prototype

#### 3.4.1 Entwurf (Design)

- **Informationsarchitektur:** Hauptseiten sind Dashboard (mit Tabs), Aufgaben-Übersicht, Aufgabe erstellen/bearbeiten, Fokusmodus und Reflexion.
- **Designentscheidungen:**
  - Mobile-first mit Bottom-Navigation (Tab-Leiste).
  - Reduzierte, ruhige Oberfläche mit wenig Ablenkung.
  - Fokusmodus visuell klar abgesetzt (grosser Timer, eine aktive Aufgabe).
  - Sichtbarer Fortschritt als Motivationselement.
  - Reflexion als kurze Mikro-Interaktion nach einer Session.

#### 3.4.2 Umsetzung (Technik)

**Technologie-Stack:**

| Technologie | Verwendung |
|---|---|
| SvelteKit (Svelte 5 Runes) | Frontend-Framework, Routing, API-Handler |
| Bootstrap 5 + Bootstrap Icons | UI-Styling und Icons |
| MongoDB (via `mongodb` Node-Driver) | Persistenz (Tasks, Sessions, Reflections) |
| Google Gemini API (`@google/genai`) | OCR-Erkennung für Deadline-Extraktion |
| `@sveltejs/adapter-auto` | Deployment-Adapter |

**Komponentenstruktur:**

| Komponente | Beschreibung |
|---|---|
| `TaskList.svelte` | Kachelliste aller Aufgaben; dispatcht `toggle`- und `delete`-Events |
| `TaskForm.svelte` | Wiederverwendbares Formular für Erstellen und Bearbeiten von Aufgaben |
| `FeedbackMessage.svelte` | Zeigt Erfolgs- und Fehlermeldungen an |

**API-Endpunkte:**

| Endpunkt | Methoden | Funktion |
|---|---|---|
| `/api/tasks` | GET, POST | Alle Aufgaben abrufen / neue Aufgabe erstellen |
| `/api/tasks/[id]` | GET, PATCH, DELETE | Einzelne Aufgabe lesen, aktualisieren, löschen |
| `/api/sessions` | GET, POST | Lernsessions abrufen / erstellen |
| `/api/sessions/[id]` | PATCH, DELETE | Session aktualisieren / löschen |
| `/api/reflections` | GET, POST | Reflexionen abrufen / erstellen |
| `/api/deadlines/extract` | POST | Deadlines per Regex aus Text extrahieren |
| `/api/deadlines/ocr` | POST | Deadlines aus Bild per Google Gemini extrahieren |

**Datenmodell Tasks:**

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

**Implementierte Workflows:**

1. **Hauptworkflow – Aufgaben verwalten (End-to-End):**

   ```
   /tasks (Übersicht) → /tasks/new (Aufgabe erfassen) → /tasks (aktualisierte Liste)
   /tasks → /tasks/[id]/edit (bearbeiten) → /tasks (Änderung sichtbar)
   /tasks → Status-Toggle (offen / in Bearbeitung / erledigt)
   /tasks → Aufgabe löschen
   ```

2. **Fokus-Workflow:**

   ```
   Dashboard (Tab "Fokus") → Aufgabe auswählen → Timer starten → Pausieren / Fortsetzen → Session abschliessen → Reflexion erfassen
   ```

3. **Deadline-Import-Workflow:**

   ```
   Dashboard (Tab "Home") → Deadlines importieren → Text eingeben oder Bild hochladen → OCR-Erkennung via Gemini → Extrahierte Deadlines anzeigen
   ```

4. **Fortschritts-Workflow:**

   ```
   Dashboard (Tab "Fortschritt") → Absolvierte Sessions anzeigen → Wochenziel-Übersicht → Modul-Statistiken
   ```

**Lokale Entwicklung:**

```sh
# Abhängigkeiten installieren
npm install

# Umgebungsvariablen konfigurieren (.env-Datei erstellen)
# MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net
# MONGODB_DB_NAME=StudySprint          # Optional, Standard: StudySprint
# GEMINI_API_KEY=<dein-api-key>        # Für OCR-Funktion

# Entwicklungsserver starten
npm run dev

# oder mit automatischem Browser-Öffnen
npm run dev -- --open
```

**Build & Deployment:**

```sh
# Produktions-Build erstellen
npm run build

# Build lokal vorschauen
npm run preview
```

#### 3.4.3 Deployment

- **Deployed App:** *(Link wird ergänzt)*
- **Platform:** Netlify / Vercel (via `@sveltejs/adapter-auto`)
- **Benötigte Umgebungsvariablen im Deployment:**
  - `MONGODB_URI` – MongoDB Atlas Connection String
  - `MONGODB_DB_NAME` – Datenbankname (optional, Standard: `StudySprint`)
  - `GEMINI_API_KEY` – Google Gemini API Key für OCR

### 3.5 Validate

- **URL der getesteten Version:** *(wird nach Deployment ergänzt)*
- **Ziele der Prüfung:** Es soll untersucht werden, ob Nutzer:innen den Ablauf intuitiv verstehen, Aufgaben einfach erstellen und bearbeiten können, der Fokusmodus als hilfreich wahrgenommen wird und Fortschritt sowie Reflexion verständlich sind.
- **Aufgaben/Szenarien:**
  1. Lege eine neue Aufgabe für ein Modul an.
  2. Setze die Aufgabe auf «In Bearbeitung».
  3. Starte eine Fokus-Session und schliesse sie ab.
  4. Hinterlasse eine kurze Reflexion zur Session.
  5. Bearbeite die Aufgabe und ändere die Priorität.
- **Zusammenfassung der Resultate:** *(wird nach der Evaluation ergänzt)*
- **Abgeleitete Verbesserungen:** *(wird nach der Evaluation ergänzt)*

---

## 4. Erweiterungen

Folgende Erweiterungen wurden über den Mindestumfang hinaus umgesetzt:

| Erweiterung | Beschreibung |
|---|---|
| **OCR-Deadline-Erkennung** | Bilder (z.B. Stundenplan-Screenshots) können hochgeladen werden. Google Gemini extrahiert automatisch Deadlines aus dem Bild. |
| **Text-basierte Deadline-Extraktion** | Freitext kann eingegeben werden; ein Regex-Algorithmus erkennt Daten und Modulnamen. |
| **Reflexions-Workflow** | Nach Lernsessions kann eine kurze Reflexion mit Bewertung (Rating) und optionaler Notiz gespeichert werden. |
| **Sessions-Persistenz** | Lernsessions werden mit Thema, Modul, Startzeit und Dauer in MongoDB gespeichert. |
| **Prioritäten-System** | Aufgaben können mit Priorität 1–5 versehen werden. |
| **Filter & Sortierung** | Die Aufgabenliste unterstützt Filterung nach Status und Sortierung nach Priorität, Fälligkeit und Erstelldatum. |
| **Fokus-Timer** | Eingebauter Countdown-Timer im Fokusmodus mit Pause- und Abbruchfunktion. |

---

## 5. Projektorganisation

- **Repository:** [GitHub – StudySprint](https://github.com/manuelmarti/StudySprint) *(Link wird ergänzt)*
- **Commit-Praxis:** Sprechende Commits mit Präfixen (`feat:`, `fix:`, `refactor:`, `docs:`).
- **Branching:** Entwicklung auf `main`, Feature-Branches bei grösseren Änderungen.

---

## 6. KI-Deklaration

### 6.1 KI-Tools

- **Eingesetzte Tools:**
  - **Claude Sonnet** – KI-gestützte Code-Generierung, Refactoring, Debugging und Dokumentation 
  - **ChatGPT** – Ideenfindung, Strukturierung der Problemstellung und Formulierung der Dokumentation.
  - **GitHub Copilot** – Unterstützende Code-Vorschläge beim Schreiben.
  - **Google Gemini API** – Eingebunden als Produktfeature für die OCR-basierte Deadline-Erkennung.

- **Eigene Leistung (Abgrenzung):** Die Auswahl des Projektthemas, die inhaltliche Ausrichtung, alle Architektur- und Designentscheidungen sowie die Überarbeitung und Integration der KI-Vorschläge erfolgten eigenständig. KI dient unterstützend, ersetzt aber nicht die eigene Analyse, Umsetzung und Verantwortung.

### 6.2 Prompt-Vorgehen

Beim Einsatz von KI wurde darauf geachtet, konkrete und kontextbezogene Anweisungen zu formulieren, Ergebnisse kritisch zu prüfen und Inhalte an die spezifischen Projektanforderungen anzupassen. Keine KI-Ausgabe wurde ungeprüft übernommen.

### 6.3 Reflexion

KI ist besonders bei Strukturierung, Boilerplate-Code und Formulierungen hilfreich. Gleichzeitig besteht das Risiko, zu generische Lösungen zu übernehmen, die nicht zum Projektkontext passen. Eine kritische Prüfung aller Ergebnisse ist deshalb unerlässlich.

---

*App-Icon: [Flaticon – Study Icon](https://www.flaticon.com/de/kostenloses-icon/study_8445148)*

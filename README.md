# MicroLearn — Single‑File SPA (Bite‑sized Facts)

Kurze, selbst gehostete Single‑Page App zum Lernen mit Card‑Decks. Keine Server‑Abhängigkeiten — alles wird im Browser (localStorage) gespeichert. Ideal für GitHub Pages oder lokal.

Features
- Mobile‑first Swipe UI (Touch & Mouse)
- Decks erstellen / auswählen / löschen
- Card erstellen / bearbeiten / löschen
- Import / Export einzelner Decks als JSON (selbst beschreibbares Schema)
- Speicherung in localStorage (kein Backend)

Schnellstart
1. Dateien in ein GitHub Repo packen (index.html, styles.css, app.js, sample-deck.json).
2. Auf GitHub Pages aktivieren oder lokal öffnen: `index.html` im Browser.
3. Deck wählen oder neues Deck erstellen. + Card drücken, um Cards hinzuzufügen.
4. Export zum Teilen, Import um ein geteiltes Deck hinzuzufügen.

JSON Schema (Kurz)
- Exportierte Dateien haben die Form:
```json
{
  "deck": { "id":"...", "title":"...", "description":"...", ... },
  "cards": [
    { "id":"...", "deckId":"...", "front":"...", "back":"...", "tags":[...], ... }
  ]
}
```
- Dieses Schema ist bewusst klein gehalten und kompatibel mit dem Prototyp.

Sicherheit & Hinweise
- Wenn du synchronisation/Cloud oder KI‑Generierung (OpenAI) ergänzen willst, empfehle ich, ein serverseitiges Proxy/Backend zu verwenden (keine API‑Keys im Browser).
- localStorage kann gelöscht sein — regelmäßige Exporte empfohlen.

Weiterentwicklung (Optionen)
- Spaced Repetition / SM‑2 Integration
- Sharing / Public Deck Gallery (statisch gehostet)
- Bilder / Audio in Cards (S3 / Git LFS / Base64)
- Optional: Integration mit OpenAI via serverless function (wenn du das möchtest, kann ich dir dazu eine einfache Cloud‑Function schreiben)

Beispiele
- sample-deck.json ist im Repo enthalten — importieren oder es wird beim ersten Start geladen.

Viel Spaß! Wenn du willst, erstelle ich daraus direkt ein GitHub‑Repo‑Template mit Issues/README/License oder erweitere die App z.B. um:
- direkte OpenAI‑Card‑Generierung (Serverless)
- lokale Bild‑Uploads
- einfache SRS (Spaced Repetition)

Welche Ergänzung willst du als Nächstes?

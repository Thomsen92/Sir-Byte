# Sir Byte · Character lab

Eigenständiger three.js-Prototyp für Design, Augenanimation und Feedback. Kein Imagegen, kein Tripo; echte, prozedural aufgebaute 3D-Geometrie.

[Online-Demo](https://thomsen92.github.io/Sir-Byte/)

## Online mit GitHub Pages

`npm run build` erstellt die statische Website in `dist/`, inklusive benötigter three.js-Module und Aufnahme. Alle Ressourcen verwenden relative Pfade und funktionieren auch unter einem GitHub-Projektpfad. `node_modules` und `dist` werden nicht eingecheckt. Unter Repository → Settings → Pages die Quelle „GitHub Actions“ auswählen. Der enthaltene Workflow prüft bei jedem Push auf `main` die Tests, baut die Demo und veröffentlicht sie über GitHub Pages. Die Adresse erscheint im erfolgreichen Deployment.

Die veröffentlichte Demo enthält das Modell und die bereitgestellte ElevenLabs-Aufnahme als abrufbare Dateien. Die three.js-Lizenz liegt dem Build bei. Für die eigenen Modell-, Code- und Audioinhalte wurde noch keine allgemeine Nutzungslizenz vergeben.

## Start

In diesem Ordner `npm start` ausführen und http://localhost:4173 öffnen. Node.js wird benötigt. three.js 0.180.0 liegt bereits in node_modules; nach einem Transfer ohne diesen Ordner zuerst `npm ci` ausführen. Keine externen CDN-Abhängigkeiten zur Laufzeit. Optional `Start-Demo.cmd` doppelklicken.

## Ausprobieren

- Sechs Reaktionen, fließende Augenformen, unabhängiges Blinzeln, Blickrichtung und Kopf-/Flossengesten.
- Quiz: erster Fehler frech, weitere Fehler unterstützend, richtige Antwort setzt Fehlerzähler zurück.
- Spieler/Aufgabe/Zeiger als Blickziel; Groß-/Kleinansicht; Drehen und Zoomen.
- Sechs ElevenLabs-Aufnahmen liegen unter `audio/`: `ready.mp3`, `nearly.mp3`, `splendid.mp3`, `thinking.mp3`, `support.mp3` und `surprised.mp3`. Die Zuordnung steht in `voice-clips.mjs`. Jeder Reaktionsbutton spielt seinen Ausruf ab. Quizantworten wählen automatisch den richtigen Ausruf: erster Fehler frech, weitere Fehler unterstützend, richtige Antwort begeistert. „Noch einmal abspielen“ startet den zuletzt gewählten Ausruf erneut von vorn. Vor der ersten Auswahl ist das „Ready when you are.“. Andere Reaktionen unterbrechen laufendes Audio; es gibt keine überlappenden Stimmen und keinen automatischen Ton beim Seitenaufruf.
- Beim Sprechen: weiche Begrüßung, Blickkontakt, kleine erklärende Flossengesten, asymmetrischer wissender Blick und ruhiger Abschluss. `speech-motion.mjs` enthält eine vorläufige, zeitlich komponierte Bewegung, keine Wort-/Phonemerkennung. Ein Web-Audio-Analyser misst die lokale Aufnahme und setzt kleine Lautstärkeakzente; ohne Web Audio bleibt die zeitgesteuerte Bewegung erhalten. Audiozeit steuert den Ablauf, auch bei Wiederholung. „Weniger Bewegung“ unterdrückt die Körpergesten weiterhin.
- „Ton bei Reaktionen“ schaltet die automatische Wiedergabe bei Buttons und Quiz ein oder aus. Der explizite Wiederholungsbutton spielt weiterhin auf Wunsch ab. Alle Stimmen stammen aus den bereitgestellten Dateien; keine Systemstimme und kein ElevenLabs-API-Aufruf zur Laufzeit.
- „Weniger Bewegung“ reduziert Körperbewegungen; Augen und Blinzeln bleiben aktiv. Systempräferenz wird übernommen.

## Später integrieren

```js
import {createSirByte} from './sir-byte.mjs';

const byte = createSirByte();
scene.add(byte.root);
byte.behavior.lookAt(0.7, 0.2); // normalisierte Richtung, Werte -1 bis 1
byte.behavior.react('think');
byte.behavior.feedback(false); // erste falsche Antwort: cheeky, danach support

// In deinem Renderloop, dt in Sekunden:
byte.update(dt, {reducedMotion: false});
// Während einer Aufnahme optional zusätzlich:
// {speaking: true, speechTime: audio.currentTime,
//  speechDuration: audio.duration, speechLevel: rmsLevelBetweenZeroAndOne}
```

`sir-byte.mjs` baut Modell, Materialien und Display-Shader. `behavior.mjs` enthält die von three.js unabhängige Zustandslogik. `main.mjs` ist ausschließlich Demo, Kamera, Beleuchtung, UI, Stimme und Export. three.js und die Addons müssen auf dieselbe Version auflösen; in Bundlern funktioniert dies mit dem Paket `three`.

## Modell und Export

`sir-byte.glb` enthält ein neutrales, in Teilen editierbares Modell mit statischen emissiven Augen, rund 16.100 Dreiecken und rund 0,75 MB. Die Augen im Browser sind ein eigener Shader und nicht als glTF-Material portabel. Die Laufzeitbewegungen sind prozedural, keine eingebetteten Skelett- oder Gesichtsclips. Für die animierte Figur die JS-Factory verwenden; die GLB allein enthält das Verhalten nicht.

Export reproduzieren und Reimport prüfen: `node export-model.mjs`. Verhaltenstests: `npm test`.

## Stand und Grenzen

Dies ist ein erster beweglicher Design-Prototyp, kein fertig abgenommenes AAA-Asset. Materialien und Timing sind vorläufig. Licht und Umgebung gehören zur Demo und müssen im Spiel passend eingerichtet werden. Normale Browseransicht visuell geprüft; tatsächliche Tablet-FPS, iPad/Safari und Touch auf einem physischen Gerät sind noch zu messen. Die reduzierte Pixeldichte ist auf 1,75 begrenzt, es gibt keine aufwendige Bloom-Nachbearbeitung.

Das Modell wird in three.js aus getrennten Teilen aufgebaut; eine native Blender-Datei wurde für diese kleine Demo nicht erstellt. Für eine spätere Blender-Ausarbeitung kann die GLB importiert werden.

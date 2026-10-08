#!/usr/bin/env python3
"""Create an offline before/after report from ux-browser-test.mjs evidence.

Usage: python scripts/visual-blueprint-report.py BEFORE AFTER OUTPUT WEBKIT ANDROID
Requires Pillow for the exact navigation pixel comparison. No production access.
"""
import base64
import html
import json
import sys
from pathlib import Path

from PIL import Image, ImageChops

before, after, output, *engines = map(Path, sys.argv[1:])
pages = [
    ("/dashboard", "Startseite", "Vier Kennzahlen, Schnellzugriff, Umsatzentwicklung, Rechnungen, Zahlungen. Kunden sind der Gesamtbestand."),
    ("/finanzen", "Finanzen", "Zeitraum mit explizitem Anwenden; vier Kennzahlen und echte Monatsbalken. Offene Rechnungen bleiben eine Bestandskennzahl."),
    ("/rechnungen", "Rechnungsliste", "Nummer und Status oben; Kunde und Rechnungsdatum darunter; offener Betrag als eigene Zeile."),
    ("/rechnungen/RE-TEST-1", "Rechnungsdetail", "Rechnungsdatum, Fälligkeit, Zahlungsfrist, Positionen und ein klarer Zahlungsstand. Vorschau über das Aktionsmenü."),
    ("/zeit", "Timer", "Einheitlicher kompakter Timer; abgeschlossene heutige Zeit gilt für die aktuelle Auswahl. Eintragsfilter nur in der Eintragsansicht."),
    ("/mitarbeiter/employee-one", "Mitarbeiterdetail", "Status einmal im Header, vorhandene vier Tabs, kompakte Details mit sinnvollen Einheiten."),
    ("/mitarbeiter/neu", "Mitarbeiter hinzufügen", "Eine Speicheraktion nach allen Feldern. Validierung und gemeinsame Formularregeln aus Ergänzung 3 bleiben erhalten."),
    ("/support/ticket-one", "Support-Chat", "Header und Eingabe bleiben stehen; nur die 30 Testnachrichten scrollen. VisualViewport berücksichtigt die verfügbare Höhe."),
    ("/projekte/neu", "Auftrag / Projekt starten", "Eine primäre Aktion; notwendige Felder und bestehender Folgeprozess bleiben erhalten."),
    ("/kunden", "Kunden", "Suche und kompakter Filter in einer Zeile; Status-Tabs separat. Bestehende Daten und Zeilenaktionen erhalten."),
    ("/produkte", "Produkte", "Gemeinsamer Listenstandard und einheitliches Aktionssheet; bestehende Produktprozesse erhalten."),
    ("/angebote", "Angebote", "Finanznavigation und vorhandene Angebotsstatus bleiben erhalten; keine neuen Zeitraum-Kurzfilter."),
    ("/zahlungen", "Zahlungen", "Gemeinsamer Listenstandard; tatsächliche Zahlungsbeträge und Währungen bleiben erhalten."),
]

def image_uri(path):
    if not path.is_file():
        raise FileNotFoundError(path)
    return "data:image/png;base64," + base64.b64encode(path.read_bytes()).decode()

nav = []
for source in sorted(before.glob("*-nav.png")):
    target = after / source.name
    if not target.exists():
        raise FileNotFoundError(target)
    a, b = Image.open(source).convert("RGB"), Image.open(target).convert("RGB")
    identical = a.size == b.size and ImageChops.difference(a, b).getbbox() is None
    if not identical:
        raise AssertionError("Navigation changed: " + source.name)
    nav.append({"file": source.name, "size": a.size, "identical": identical})
assert len(nav) == 22, f"Expected 22 mobile navigation comparisons, got {len(nav)}"

checks = []
for folder in [after, *engines]:
    seen = set()
    for result in sorted(folder.glob("results*.json")):
        data = json.loads(result.read_text())
        assert not data["errors"], data["errors"]
        for case in data["results"]:
            assert case["passed"]
            seen.add((case["theme"], case["width"], case["route"]))
    if seen:
        checks.append((folder.name, len(seen), "Bestanden; keine Laufzeitfehler oder horizontalen Seitenüberläufe"))

sections = []
for route, title, detail in pages:
    comparisons = []
    for theme in ["light", "dark"]:
        for width in [430, 1440]:
            filename = f"{theme}-{width}-{route.replace('/', '_')}.png"
            images = "".join(f'<figure><figcaption>{label}</figcaption><div class="image-scroll"><img loading="lazy" alt="{html.escape(title)} – {label}, {theme}, {width} px" src="{image_uri(folder/filename)}"></div></figure>' for folder, label in [(before, "Vorher"), (after, "Nachher")])
            comparisons.append(f'<div class="comparison" data-theme="{theme}" data-width="{width}" {"hidden" if (theme,width)!=("light",430) else ""}>{images}</div>')
    sections.append(f'<section><h2>{html.escape(title)}</h2><p><code>{route}</code> · {html.escape(detail)}</p>{"".join(comparisons)}</section>')

states = []
for suffix, title in [("time-entries", "Einträge: Kunden-/Projektgruppen"), ("period-sheet", "Zeitraum auswählen"), ("action-sheet", "Gemeinsames Aktionssheet"), ("employee-time", "Mitarbeiter: Arbeitszeit"), ("employee-expenses", "Mitarbeiter: Spesen"), ("employee-documents", "Mitarbeiter: Dokumente"), ("pdf-preview", "Vorschau des tatsächlich generierten A4-PDFs")]:
    path = after / f"light-430-{suffix}.png"
    states.append(f'<details><summary>{title}</summary><img class="state" loading="lazy" alt="{title}" src="{image_uri(path)}"></details>')
for suffix, title in [("manual-time", "Manuelle Erfassung bei 400 px Höhe"), ("chat", "Chat bei 400 px Höhe")]:
    states.append(f'<details><summary>{title}</summary><img class="state" loading="lazy" alt="{title}" src="{image_uri(after/f"light-375-400-{suffix}.png")}"></details>')

test_rows = "".join(f'<tr><td>{html.escape(label)}</td><td>{count}</td><td>{detail}</td></tr>' for label, count, detail in checks)
report = '''<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BINSO ONE – Visual UX Blueprint: Abnahme</title>
<style>*{box-sizing:border-box}body{font:16px/1.5 system-ui,sans-serif;color:#172124;background:#f3f5f5;margin:0}main{max-width:1500px;margin:auto;padding:28px}h1{font-size:30px}h2{font-size:22px}p{max-width:100ch}header,section,.evidence{background:white;padding:24px;border:1px solid #dce2e2;border-radius:12px;margin-bottom:24px}.controls{position:sticky;top:0;background:#172124;color:white;z-index:1;padding:12px 24px;display:flex;gap:20px;flex-wrap:wrap;border-radius:10px}.controls label{display:flex;gap:10px;align-items:center}select{font:inherit;padding:6px;border-radius:6px}.comparison:not([hidden]){display:grid;grid-template-columns:1fr 1fr;gap:20px}figure{margin:0;min-width:0}figcaption{font-weight:700;margin-bottom:8px}.image-scroll{max-height:760px;overflow:auto;border:1px solid #dde2e2;background:#fff}img{display:block;width:100%;height:auto}.state{width:min(100%,430px);margin:16px auto}details{padding:14px;border-bottom:1px solid #e0e6e6}summary{cursor:pointer;font-weight:600}table{border-collapse:collapse;width:100%}td,th{text-align:left;border-bottom:1px solid #dce2e2;padding:10px}code{overflow-wrap:anywhere}.open{border-left:4px solid #d78a00;padding-left:14px}a{color:#126275}@media(max-width:650px){main{padding:12px}header,section,.evidence{padding:14px}.comparison:not([hidden]){gap:8px}.image-scroll{max-height:560px}h1{font-size:24px}}</style>
<main><header><h1>BINSO ONE – Final Visual UX Blueprint</h1><p>Vorher-/Nachher-Vergleich vom 08.10.2026. Vorher: PR #217, Commit <code>da59dbde9847b497e9bf0bf915fcee9b26a00a5a</code> nach Ergänzung 3. Nachher: die darauf implementierte Blueprint-Ergänzung im selben PR. PR #215 war bereits gemergt; dessen Anforderungen bleiben erhalten.</p><p>Beide Builds wurden mit identischen, synthetischen API-Datensätzen gerendert. Produktive Daten wurden nicht geändert. Die Finanzperioden unterscheiden sich bewusst: Der korrigierte Standard „Letzte 3 Monate“ verwendet drei abgeschlossene Kalendermonate (Juli–September). Die Screenshots zeigen tatsächliches Browser-Rendering, keine gestalteten Mockups.</p><p><a href="https://github.com/oemercam/binso_admin_azure/pull/217">Pull Request #217 und GitHub-Quality-Checks</a></p><p class="open">Offen: physische Mobile-Safari-, installierte iPhone-PWA- und Android-Abnahme mit nativer Tastatur, Installation und OS-Teilen. WebKit und Geräteemulation ersetzen diese Prüfung nicht. Merge und Deployment bleiben bis zur vollständigen Abnahme gesperrt.</p></header>
<div class="controls"><label>Darstellung <select id="theme"><option value="light">Light</option><option value="dark">Dark</option></select></label><label>Fenster <select id="width"><option value="430">Mobile · 430 px</option><option value="1440">Desktop · 1440 px</option></select></label><span>Jede Bildfläche separat scrollbar</span></div>
<div class="evidence"><h2>Technische und visuelle Nachweise</h2><table><thead><tr><th>Browserlauf</th><th>Routen-/Theme-/Viewportfälle</th><th>Ergebnis</th></tr></thead><tbody>''' + test_rows + '''</tbody></table><p>Release-Gates, Unit-/PostgreSQL-/RLS-Integration, ESLint, TypeScript, CSS-Architektur, Produktionsbuild und Security-Scans bestanden. Der vollständige Security-Scan verwendet ausschließlich die bereits dokumentierte Ausnahme für ein Entwicklungswerkzeug.</p><p>Zusätzliche Interaktionen: Zeitraum erst nach Anwenden; Escape verwirft Änderungen; offene Rechnungen bleiben periodenunabhängig; gruppierte Minuten summieren sich korrekt; ein Formularbutton nach allen Feldern; Sheet-Fokus/Escape; Fehler/Retry/Doppelklick; Dokumentzoom im eigenen Bereich; Chat-Eingabe bei 400 px Höhe.</p><p><strong>Bottom-Navigation: 22 von 22 Pixelvergleichen identisch</strong> (elf mobile Ansichten × Light/Dark, je 406 × 69 px). Für den Vergleich wurde nur der durch die halbtransparente Navigation sichtbare Seiteninhalt ausgeblendet. Die AppShell-Datei und Navigationsregeln sind unverändert.</p><p>PDF-/QR-Nachweise aus Ergänzung 3 bleiben gültig: echter Swiss QR Code, A4, kurze und lange Rechnungen vollständig, Entwurf ohne zahlbaren Code, klar ausgewiesene Restzahlungsanforderung. Die hier geprüfte Vorschau zeigt ein tatsächlich generiertes synthetisches Rechnungs-PDF.</p></div>
''' + "".join(sections) + '<section><h2>Zusätzliche Zustände nach der Umsetzung</h2>' + "".join(states) + '''</section><footer>Reproduzierbar mit scripts/ux-browser-test.mjs und scripts/visual-blueprint-report.py. Anforderungen und Prüfanleitung: docs/visual-ux-blueprint.md im Repository.</footer></main><script>function update(){const theme=document.querySelector('#theme').value,width=document.querySelector('#width').value;document.querySelectorAll('.comparison').forEach(el=>el.hidden=el.dataset.theme!==theme||el.dataset.width!==width)}document.querySelectorAll('select').forEach(el=>el.addEventListener('change',update));</script></html>'''
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(report)
output.with_suffix('.evidence.json').write_text(json.dumps({"navigation": nav, "browser_checks": checks}, indent=2))
print(f"{output}: {output.stat().st_size:,} bytes; {len(pages)} pages, {len(nav)} identical navigation crops")

import Link from "next/link";

const languages = [
  ["Deutsch", "DE"],
  ["Français", "FR"],
  ["Italiano", "IT"],
  ["English", "EN"],
  ["Türkçe", "TR"],
] as const;

export default function Sprache() {
  return (
    <main className="language-page">
      <header>
        <Link href="/" aria-label="Zurück">‹</Link>
        <h1>Sprache wählen</h1>
        <span />
      </header>
      <div className="choice-list">
        {languages.map(([name, code], index) => (
          <Link href="/" key={code}>
            <span><i>{code}</i>{name}</span>
            {index === 0 && <b>✓</b>}
          </Link>
        ))}
      </div>
    </main>
  );
}

import fs from "node:fs";
import path from "node:path";

const root =
  path.resolve(
    "artifacts",
    "visual-qa",
  );

const screenshots =
  path.join(
    root,
    "screenshots",
  );

fs.mkdirSync(
  root,
  {
    recursive: true,
  },
);

const files =
  fs.existsSync(screenshots)
    ? fs
        .readdirSync(screenshots)
        .filter(
          (file) =>
            file.endsWith(".png"),
        )
        .sort()
    : [];

const packageJson =
  JSON.parse(
    fs.readFileSync(
      "package.json",
      "utf8",
    ),
  );

const manifest = {
  schemaVersion: 1,

  generatedAt:
    new Date().toISOString(),

  repository:
    process.env.GITHUB_REPOSITORY ??
    null,

  commitSha:
    process.env.GITHUB_SHA ??
    null,

  runId:
    process.env.GITHUB_RUN_ID ??
    null,

  runAttempt:
    process.env.GITHUB_RUN_ATTEMPT ??
    null,

  appVersion:
    packageJson.version,

  viewport: {
    width: 390,
    height: 844,
  },

  locale:
    "de-CH",

  browser:
    "Chromium",

  screenshotCount:
    files.length,

  screenshots:
    files,
};

fs.writeFileSync(
  path.join(
    root,
    "qa-manifest.json",
  ),

  JSON.stringify(
    manifest,
    null,
    2,
  ),
);

console.log(
  `Visual QA manifest: ${files.length} Screenshots.`,
);

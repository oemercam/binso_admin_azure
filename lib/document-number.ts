export function createDocumentNumber(prefix:"R"|"O") {
  const now = new Date();
  const suffix = String(now.getTime()).slice(-6);
  return `${prefix}-${now.getFullYear()}-${suffix}`;
}

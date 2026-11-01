// Minimal typing for the two node:fs calls used by tests (the repo has no @types/node).
declare module 'node:fs' {
  export function mkdirSync(path: string, opts?: { recursive?: boolean }): void;
  export function writeFileSync(path: string, data: string): void;
}

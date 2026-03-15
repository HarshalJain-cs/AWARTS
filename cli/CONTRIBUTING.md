# Contributing to AWARTS CLI

Thanks for your interest in contributing to AWARTS! Here's how to get started.

## Development Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/HarshalJain-cs/AWARTS.git
   cd AWARTS/cli
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in dev mode:
   ```bash
   npm run dev
   ```

## Project Structure

```
cli/
  src/
    index.ts          # CLI entry point (commander setup)
    types.ts          # Shared TypeScript types
    adapters/         # Provider adapters (claude, codex, gemini, antigravity)
    commands/         # Command implementations
    lib/              # Core libraries (auth, daemon, api, output)
  dist/               # Built output
  package.json
```

## Adding a New Provider Adapter

1. Create `src/adapters/<provider>.ts` implementing the `Adapter` interface:
   ```typescript
   interface Adapter {
     name: ProviderKey;
     displayName: string;
     detect(): Promise<boolean>;
     read(): Promise<UsageEntry[]>;
   }
   ```

2. Register it in `src/lib/detect.ts`

3. Test with `awarts push --provider <name> --dry-run`

## Guidelines

- Write clear commit messages
- Keep PRs focused on a single change
- Test your changes locally before submitting
- Don't commit API keys or credentials

## Reporting Issues

Open an issue at [github.com/HarshalJain-cs/AWARTS/issues](https://github.com/HarshalJain-cs/AWARTS/issues) with:
- Node.js version (`node --version`)
- OS and version
- Steps to reproduce
- Expected vs actual behavior

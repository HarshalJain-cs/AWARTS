# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 0.2.x   | :white_check_mark: |
| < 0.2   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in AWARTS, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, email us at **harshaljaincs@gmail.com** with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### What to expect

- **Acknowledgment** within 48 hours
- **Status update** within 7 days
- **Fix timeline** depends on severity:
  - Critical: 24-48 hours
  - High: 1 week
  - Medium: 2 weeks
  - Low: next release

## Scope

### In scope
- AWARTS CLI (`npx awarts`)
- AWARTS web application (awarts.vercel.app)
- Convex backend functions
- Authentication and authorization flows
- API key storage and handling

### Out of scope
- Third-party dependencies (report to their maintainers)
- Social engineering attacks
- Denial of service attacks

## Security Best Practices for Users

- Never share your `~/.awarts/auth.json` token
- API keys stored via `awarts keys set` are local-only and never transmitted
- Always install from the official npm registry: `npm i awarts`
- Verify package integrity: `npm audit`

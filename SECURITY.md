# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | ✅ Yes             |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** create a public GitHub issue
2. Use [GitHub's private vulnerability reporting](https://github.com/vbomfim/openworld/security/advisories/new)
3. Or email the maintainer directly

We will acknowledge receipt within 48 hours and provide a fix timeline within 7 days.

## Security Design

OpenWorld runs entirely in the browser with no backend:

- **No data exfiltration**: All AI inference happens locally via WebGPU
- **No server communication**: No API calls, no telemetry, no analytics
- **Local storage only**: Personas and conversations are stored in IndexedDB
- **No credentials**: The app requires no login or API keys

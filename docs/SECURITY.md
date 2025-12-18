# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| Latest  | ✅        |
| < 1.0   | ❌        |

## Reporting a Vulnerability

Do not report security vulnerabilities through public GitHub issues.

**Contact**: YOUR_SECURITY_EMAIL

Include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fixes (if any)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Assessment**: Within 7 days
- **Fix**: Timeline depends on severity
- **Disclosure**: After fix is available

## Security Measures

This app uses Tauri's security model:

- **Permissions**: Minimal system permissions via `capabilities/`
- **IPC**: Type-safe commands via tauri-specta
- **File Access**: Scoped to app directories by default
- **CSP**: Configured in `index.html`

## For Developers

### File Operations

```rust
// ✅ Validate paths - prevent traversal attacks
if filename.contains("..") {
    return Err("Invalid filename".into());
}

// ❌ Never trust raw user input for paths
std::fs::write(user_input, data)
```

### Secrets

- Never commit secrets to version control
- Use `.env.local` (gitignored) for local secrets
- Use GitHub Secrets for CI/CD

### Dependency Audits

```bash
npm audit
cargo audit
```

## Resources

- [Tauri Security Guide](https://tauri.app/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

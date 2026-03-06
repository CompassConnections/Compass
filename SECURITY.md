# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.10.x  | :white_check_mark: |
| 1.9.x   | :white_check_mark: |
| < 1.9.0 | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within Compass, please send an email to hello@compassmeet.com. All security vulnerabilities will be promptly addressed.

Please do not publicly disclose the vulnerability until it has been resolved.

## Security Practices

Compass takes security seriously and implements several best practices to protect user data and ensure application integrity.

### Authentication & Authorization

- **Firebase Authentication**: User authentication is handled by Firebase Auth, which provides industry-standard security for user credentials
- **JWT Tokens**: Secure token-based authentication for API access
- **Role-Based Access Control**: Different permission levels for users, moderators, and administrators
- **Session Management**: Secure session handling with automatic timeout

### Data Protection

- **Encryption at Rest**: Sensitive data is encrypted in the database
- **Encryption in Transit**: All communications use HTTPS/TLS encryption
- **Environment Variables**: Secrets are managed through secure environment variable configuration
- **Data Minimization**: Only necessary data is collected and stored

### Input Validation

- **Zod Validation**: Strong type checking and validation for all API inputs
- **Sanitization**: Input sanitization to prevent injection attacks
- **Rate Limiting**: Protection against brute force and denial of service attacks

### API Security

- **CORS Configuration**: Restricted cross-origin resource sharing policies
- **Rate Limiting**: Per-endpoint rate limiting to prevent abuse
- **Authentication Middleware**: All protected endpoints require valid authentication
- **Input Validation**: Comprehensive validation of all API inputs

### Database Security

- **Row Level Security**: Fine-grained access control at the database level
- **Parameterized Queries**: Prevention of SQL injection attacks
- **Audit Logging**: Tracking of database access and modifications
- **Regular Backups**: Automated database backups for disaster recovery

### Third-Party Services

- **Firebase Security Rules**: Strict security rules for Firestore and Storage
- **Supabase RLS**: Row-level security policies for PostgreSQL
- **Secrets Management**: Secure storage of API keys and credentials

### Development Practices

- **Code Reviews**: All changes reviewed by multiple developers
- **Automated Testing**: Security-focused tests integrated into CI/CD pipeline
- **Dependency Management**: Regular updates and security scanning of dependencies
- **Security Audits**: Periodic security assessments and penetration testing

## Common Security Issues and Resolutions

### XSS Prevention

- **Content Security Policy**: Strict CSP headers to prevent cross-site scripting
- **Input Sanitization**: All user-generated content is sanitized before display
- **Output Encoding**: Proper encoding of user data in HTML contexts

### CSRF Protection

- **SameSite Cookies**: CSRF protection through SameSite cookie attributes
- **Anti-Forgery Tokens**: Token-based protection for state-changing operations

### Injection Attacks

- **SQL Injection**: Parameterized queries and prepared statements
- **Command Injection**: Input validation and sanitization
- **Script Injection**: Content Security Policy and input filtering

## Incident Response

In the event of a security incident:

1. **Immediate Containment**: Isolate affected systems
2. **Investigation**: Determine scope and impact of breach
3. **Remediation**: Apply fixes and security patches
4. **Notification**: Inform affected users and stakeholders
5. **Review**: Post-incident analysis and process improvement

## Compliance

Compass aims to comply with relevant data protection regulations:

- **GDPR**: General Data Protection Regulation compliance
- **CCPA**: California Consumer Privacy Act compliance
- **Data Retention**: Clear policies for data retention and deletion

## Third-Party Security

We regularly audit third-party services for:

- Security certifications and compliance
- Regular security updates and patches
- Data handling and privacy practices
- Incident response procedures

## Security Contact

For security-related inquiries, contact:

- Email: hello@compassmeet.com
- Response Time: Within 24 hours for critical issues
- Disclosure Policy: Coordinated disclosure with 90-day timeline

---

_Last Updated: March 2026_

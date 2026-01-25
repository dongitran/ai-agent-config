---
name: code-review
description: Perform thorough code review with security, performance, and best practices checks
allowed-tools: [Read, Grep, Glob]
---

# Code Review Skill

When performing a code review, follow this systematic approach:

## 1. Security Review

- Check for hardcoded secrets, API keys, or credentials
- Look for SQL injection vulnerabilities
- Verify input validation and sanitization
- Check for XSS vulnerabilities in web code
- Review authentication and authorization logic
- Check for insecure dependencies

## 2. Code Quality

- Verify proper error handling
- Check for code duplication
- Review naming conventions (variables, functions, classes)
- Ensure consistent code style
- Look for dead code or unused imports
- Check for proper logging

## 3. Performance

- Identify N+1 query problems
- Check for unnecessary loops or iterations
- Review memory usage patterns
- Look for blocking operations in async code
- Check for missing indexes in database queries

## 4. Best Practices

- Verify unit test coverage for new code
- Check for proper documentation/comments
- Review API design and contracts
- Ensure backward compatibility
- Check for proper dependency injection

## 5. Output Format

Provide feedback in this format:

```
## Summary
Brief overview of the changes

## Issues Found
- [CRITICAL] Description of critical issue
- [HIGH] Description of high priority issue
- [MEDIUM] Description of medium priority issue
- [LOW] Suggestion for improvement

## Positive Aspects
- What was done well

## Recommendations
- Specific actionable improvements
```

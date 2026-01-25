---
name: git-commit
description: Create well-formatted git commits following conventional commit standards
allowed-tools: [Bash, Read]
---

# Git Commit Skill

When creating git commits, follow these guidelines:

## Conventional Commit Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

## Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring without changing functionality
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system or external dependency changes
- `ci`: CI/CD configuration changes
- `chore`: Other changes that don't modify src or test files

## Guidelines

1. **Keep commits atomic**: One logical change per commit
2. **Write clear descriptions**: Explain what and why, not how
3. **Use imperative mood**: "Add feature" not "Added feature"
4. **Limit subject to 50 characters**
5. **Wrap body at 72 characters**
6. **Reference issues**: Include issue numbers when applicable

## Examples

```bash
# Simple feature
feat(auth): add password reset functionality

# Bug fix with body
fix(api): handle null response from payment provider

The payment provider occasionally returns null instead of
an error object. This caused unhandled exceptions.

Fixes #123

# Breaking change
feat(api)!: change response format for user endpoint

BREAKING CHANGE: The user endpoint now returns a nested
object structure instead of a flat object.
```

## Before Committing

1. Run `git status` to review changes
2. Run `git diff --staged` to verify staged changes
3. Ensure all tests pass
4. Check for any sensitive data in the diff

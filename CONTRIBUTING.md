# Contributing to Pride of Spices

This document outlines the workflow and standards for contributing to the project. Every developer must adhere to these guidelines to ensure the platform remains stable, performant, and maintainable.

## 1. Feature Development Workflow

No feature should skip these stages:
1. **Architecture Review:** Discuss integration with the Event Bus, Camera Contract, and Scene Lifecycle.
2. **Technical Design:** Outline data flows and token usage.
3. **Implementation:** Write the code following the Open/Closed Principle.
4. **Performance Review:** Verify against the Performance Budget (e.g., maximum animations, particles).
5. **Accessibility Review:** Validate keyboard navigation, screen reader tagging, and reduced motion fallbacks.
6. **Testing:** Write required Playwright E2E and Vitest unit tests.
7. **Documentation:** Document the new module's Purpose, Responsibilities, Public API, Dependencies, and Lifecycle.
8. **Merge:** Submit PR and pass all CI/CD Quality Gates.

## 2. Coding Standards
- **Composition over Inheritance:** Build complex visual components from smaller, decoupled React components.
- **No Magic Numbers:** Use centralized Design Tokens for all sizes, opacities, durations, and timing functions.
- **Fail Gracefully:** Use Error Boundaries around media components and major timelines.
- **Types:** Strict TypeScript is required. `any` is prohibited.

## 3. Pull Request & Commit Rules
- **Branch Naming:** `feat/feature-name`, `fix/bug-description`, `chore/task-name`.
- **Commit Conventions:** Follow Conventional Commits (`feat: ...`, `fix: ...`, `chore: ...`).
- **Review Requirement:** PRs must be reviewed by the Lead Architect.

## 4. Testing Requirements
Before submitting a PR, ensure:
- `npm run lint` passes with 0 errors.
- TypeScript compilation succeeds.
- E2E Tests (Playwright) pass.
- Lighthouse scores remain within budget (no regressions).

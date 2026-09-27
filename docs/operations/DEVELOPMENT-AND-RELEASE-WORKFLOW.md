# Development and Release Workflow

## Current operating model

Binso One is currently in active development.

The current technical workflow is:

Local Development
→ Local Development Checks
→ Commit to main
→ Full GitHub CI Validation
→ Immutable Build Artifact
→ Manual Production Deployment
→ Azure Staging Slot
→ Health and Smoke Validation
→ Production Slot Swap
→ Production Health Validation

A separate persistent Development environment is not currently provisioned.

This is an intentional temporary state and must not be documented as full environment separation.

## Local development

Normal development should use:

    pnpm dev

Fast validation during development:

    pnpm dev:check

This performs:

- ESLint
- TypeScript validation
- Unit tests

A full production build and Critical E2E validation are not required after every small local UI or content change.

## Release candidate

Before a change is committed as a release candidate:

    pnpm release:check

Production deployment must never be triggered directly from an unvalidated local build.

## Main branch

The main branch represents the current release candidate.

A push to main performs the full GitHub validation workflow and creates the immutable deployment artifact.

A successful push does not automatically deploy Production.

During active development, validated change sets may be deployed frequently to Production so that the real Azure-hosted application can be verified on desktop, browser, mobile and PWA under production runtime conditions.

Production deployment is still never automatic.

## Production

Production deployment remains explicit and manual.

Frequent Production validation during active development does not bypass any Production quality, artifact, migration, staging, smoke, health or rollback controls.

During the current active development phase, frequent Production deployments are an intentional validation strategy after a change set has passed the required local and GitHub CI checks.

Requirements:

- exact validated commit
- successful GitHub CI
- immutable validated artifact
- production migration
- staging deployment
- staging health check
- smoke validation
- slot swap
- production health validation
- rollback capability

## Development environment roadmap

A separate Development environment is planned but not currently implemented.

Future target:

Local
→ Development
→ Release Candidate
→ Production

The future Development environment must use separate:

- secrets
- database
- authentication configuration
- Stripe mode
- runtime configuration

Production customer data must not be copied into Development.

## Versioning

Do not create a new application version for every uncommitted local change.

Version changes represent committed engineering or release states.

Git commits and GitHub Actions provide the authoritative technical history.

## Safety

The absence of a dedicated Development environment must never weaken the Production deployment gates.

Production deployment remains explicit and manual.

Frequent Production validation during active development does not bypass any Production quality, artifact, migration, staging, smoke, health or rollback controls.

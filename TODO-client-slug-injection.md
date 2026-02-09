# TODO: Client Slug Injection

## Problem
When setting up a new site using the MVP package, dev scripts and configs need manual updates to set the correct client slug (e.g., `vibe_cryptaply_web`, `ideal_resume_website`).

Currently devs have to manually edit:
- `scripts/dev-broker.ps1` - `$ClientId` param default
- `.env.development` - `CLIENT_ID`
- Any other places that reference the client slug

## Solution
The MVP install/setup process should:

1. Accept a `CLIENT_SLUG` environment variable or config value
2. Auto-inject it into generated dev scripts
3. Use it as the default in broker mode startup

## Implementation Ideas

Option A: Template-based generation
- During `npm install` or a setup script, read `CLIENT_SLUG` from `.env.development`
- Generate/update `scripts/dev-broker.ps1` with the correct default

Option B: Runtime injection
- Have dev-broker.ps1 read from `.env.development` instead of hardcoding
- e.g., `$ClientId = $env:CLIENT_ID -or "default_client"`

Option C: MVP CLI command
- `npx @payez/next-mvp init --client-slug=vibe_cryptaply_web`
- Generates all configs with correct values

## Priority
Medium - Quality of life improvement for new site setup

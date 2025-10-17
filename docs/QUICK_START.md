# Quick Start Guide

Get Leger v0.1.0 up and running in minutes.

## Prerequisites

```bash
# Install Node.js 20+
node --version  # Should be v20.x or higher

# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

## 5-Minute Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Cloudflare Resources

Run these commands and save the IDs:

```bash
# Create KV namespaces (run all 4 commands)
wrangler kv:namespace create "LEGER_USERS"
wrangler kv:namespace create "LEGER_USERS" --preview
wrangler kv:namespace create "LEGER_SECRETS"
wrangler kv:namespace create "LEGER_SECRETS" --preview

# Create R2 bucket
wrangler r2 bucket create leger-static-sites

# Create D1 database
wrangler d1 create leger-db
```

### 3. Update wrangler.toml

Open `wrangler.toml` and replace these PLACEHOLDER values with your actual IDs from step 2:

```toml
# Find and replace these:
PLACEHOLDER_USERS_KV_ID
PLACEHOLDER_USERS_KV_PREVIEW_ID
PLACEHOLDER_SECRETS_KV_ID
PLACEHOLDER_SECRETS_KV_PREVIEW_ID
PLACEHOLDER_DB_ID
```

### 4. Apply Database Migrations

```bash
wrangler d1 execute leger-db --file=./db/migrations/0001_initial.sql
```

### 5. Set Secrets

Generate and set your encryption key:

```bash
# Generate key
openssl rand -base64 32

# Copy the output, then:
wrangler secret put ENCRYPTION_KEY
# Paste the key when prompted

# Set JWT secret (coordinate with CLI)
wrangler secret put JWT_SECRET
# Enter your JWT secret
```

### 6. Test Locally

Create local secrets file:

```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your keys
```

Start dev server:

```bash
npm run dev
```

Open http://localhost:3000 - you should see the Leger placeholder.

Test health check:

```bash
curl http://localhost:3000/health
```

### 7. Deploy

```bash
npm run deploy
```

Test production:

```bash
curl https://app.leger.run/health
```

## GitHub Actions Setup (Optional)

For automatic deployment:

1. Go to GitHub repo **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:
   - `CLOUDFLARE_ACCOUNT_ID` (find with `wrangler whoami`)
   - `CLOUDFLARE_API_TOKEN` (create at cloudflare.com/profile/api-tokens)
   - `ANTHROPIC_API_KEY` (optional, for Claude Code assistant)

Now pushes to `main` will auto-deploy.

## Next Steps

✅ Infrastructure is ready!

Now implement the actual functionality:

1. **Issue #3**: Base64 and crypto utilities
2. **Issue #4**: JWT validation middleware
3. **Issue #5**: User creation endpoint
4. **Issue #6**: Secret encryption service
5. **Issue #7**: Secret CRUD endpoints
6. **Issue #8**: Release CRUD endpoints
7. **Issue #9**: Wire up all routes

Then build the frontend (Issues #10-21).

## Common Issues

**"No namespace found"**
→ Double-check IDs in wrangler.toml match `wrangler kv:namespace create` output

**"Database not found"**
→ Verify database ID in wrangler.toml matches `wrangler d1 create` output

**"Secret not set"**
→ Run `wrangler secret put ENCRYPTION_KEY` and `wrangler secret put JWT_SECRET`

**Build fails**
→ Make sure you ran `npm install` first

**Health check 404**
→ Check that `dist/_worker.js` exists after build

## Development Workflow

```bash
# Daily development
npm run dev              # Start dev server
npm run typecheck        # Check types
npm run lint            # Check code quality

# Before committing
npm run lint:fix        # Fix lint issues
npm run format          # Format code
npm run build           # Test production build

# Deploy
git push origin main    # Auto-deploys via GitHub Actions
# OR
npm run deploy          # Manual deployment
```

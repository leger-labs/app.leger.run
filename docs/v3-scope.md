# Status

app.leger.run is a cf workers hosted vite spa. It is in alpha stage, we are refining the front-end ui pages and finalizing the template application leading to deployments of fully configured quadlets. Conteptually: "vercel config ui for self hosted llm advanced funcionality"

/models is a full list of available llms. 
https://app.leger.run/models/claude-3-haiku for example is one llm. on there we can add providers that are listed on the page

/providers is for adding one or more API keys for services, and interfaces with Secrets (not part of the template application serivce)

/marketplace is for configuring services specifically for openwebui that enable further functionality. api keys are still centralized there.

/settings is a one time setup specific to tailscale variables for tailnet config

We are now revising the Releases ui/ux. the purpose of this is to 'crystalize' all the configurations created in the above sections. the output of this configuration step leads to the upload of njk template-applied quadlets with all the configurations and the api secrets have placeholders that the local cli knows how to apply.

the parts of the releases ui lets the user finalize:
- models selection: out of the configured providers, the user selects the models to load on system
- marketplace service selection: out of the configured services, special situation here because it is where we enforce a one-provider policy (for example one RAG provider or Search provider, an openwebui contraint)
- final openwebui variables configuration: i have identified 40+ final variables that the end user should make with regards to the openwebui specific parts
- finalizing caddy per-container confirations (the schema.json defaults in core)

Now so you get a sense of the repo map with the corresponding info:
/src/data/ has:
- core: "core config" json files
- services: .json defined services that are addons for openwebui
- models: .json defined llm and provider definitions

and the templates for the quadlets are found in:
/api/templates
all the njk templates are there

from a utility perspective, 
core services:
openwebui, litellm, llamaswap. always present
caddy (routes generated per service) and cockpit (static, always present) are special cases becaue they are often configured per-service if they expose a certain port

---

Primary entry points
src/App.tsx wires the /releases, /releases/new, and /releases/:id routes to the list and form pages, so any navigation or layout changes for the Releases area start here.

Releases listing experience
src/pages/ReleasesPage.tsx renders the Releases index: it loads data through useReleases, fetches deployment status for each release via the API client, supports search filtering, and exposes deploy/view actions with polling for status updates.

Release creation & editing flow
src/pages/ReleaseFormPage.tsx handles create/edit flows, including loading existing releases, validating names, managing schema-driven configuration state via CategoryBasedReleaseForm, and triggering deployments with status polling once a release exists.

Schema-driven configuration UI
src/components/releases/CategoryBasedReleaseForm.tsx builds the multi-tab configuration wizard: it filters categories based on dependencies, groups fields, renders grouped sections with ReleaseConfigForm, and provides a final review step with navigation controls.

src/components/releases/FieldGroup.tsx and src/components/releases/ConfigurationSummary.tsx supply the grouped field layout and the review summary of enabled features/providers that appear inside the wizard.

src/components/rjsf/ReleaseConfigForm.tsx wraps RJSF with custom logic to filter the schema, apply progressive disclosure rules, and surface custom widgets/templates for the visible fields the wizard passes in.

Supporting utilities & data loading
src/lib/schema-loader.ts loads the generated release schema, UI schema, and category metadata (with caching) that drive the wizard; the generated JSON artifacts live in src/generated/ and are produced by the schema pipeline described in src/generated/README.md.

src/lib/progressive-disclosure.ts and src/lib/field-grouping.ts implement the dependency checks, category visibility, completion status, and provider/feature-specific field grouping consumed by the wizard UI.

API, hooks, and shared types
src/hooks/use-releases.ts encapsulates release CRUD interactions and loading state management for both the list and form pages.

src/lib/api-client.ts exposes the release endpoints (list, create, update, delete, save configuration, deploy, deployment status) used throughout the Releases flow.

src/types/index.ts and src/types/release-schema.ts define the core types for releases, deployment records, configuration payloads, and schema categories that shape the UI logic.

---

- hidden openwebui env (no ldap, no oauth, etc.)
- always have defaults guiding the user all the way through

- i acknowledge that the few DEFAULT_PROMPT are special, and to be treated externally at a later point in time
- may want to add a cosmetic section where we can modify the font, the color scheme, the background image - very owui specific

- secret api provider consolidation (openai once, propagates) hierarchy

- next up i want to implement the comprehensive ui overhaul for the Releases.


---

big changes needed in the canonical src/data/schema.json
- currently there is a hardcoded tailscale section, and a dedicated secrets at the end. this is wrong:
    - tailscale config is done once, in the settings page
    - api secrets (which are externally managed anyway, using leger secrets, not part of the njk template application but we give PLACEHOLDER format which the cli is familiar with). keep the secrets section as placeholder for now, but i want this to be removed from the schema.json and ingested at the template njk appication step

- currently the infrastructure section is solid and that should be its own page of the release config flow. but i want to make the distinction between core services (which are always configured and available) and optional services (which are tied to the service being selected and configured in the marketplace section)

conceptually it is important to distinguish 

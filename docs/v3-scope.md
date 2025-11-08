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




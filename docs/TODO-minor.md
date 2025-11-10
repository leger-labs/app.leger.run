Note: we add a "custom model" entry with huggingface logo: asks user to add a huggingface url; and user gives the model a name
fix the two-time api key entry in "providers" there should only be one menu

make the default color black not blue. we remove the blue component; update in icon, company logo, image in internet browser, and on website
make on website the leger circle the same height as the slash.

- in header, update button to Docs, and modify icon profile menu with the same dark mode toggle utility as vercel website

- in the brand kit we must fix the grey sections for the menu in the dark mode
    - also check the "subtle hint" when highlighting something, currently in that lavender color
    - on other menu pages, the default color is a light grey (that makes it difficult to read on the dark mode)

- in Models part, i want to ahve the same change as what was made for Providers to be reflected on the ui: specifically how the provider logos are contained in smaller circles
    - also make sure to update the model tags so that it s the same as vercel ui (ie. make sure that image and embeddings options are same on leger models list)
    - models have a Copy button

- in Marketplace i want to:
    - reflect a hierarchy of api keys such that if openai is configured w api key then adding other items that depend on openai key is automatically refistered.
    - must review the integrations one by one to make sure that the logo is correct, and that the service definition is satisfactory
    - are api secrets (in providers) reflected in the marketplace? wrt saving the secrets 

- in Settings, the tailscale configuration should be different. also "account information" must not contain those pieces of information besides tailscale configuration; and should have "generic" settings like "delete"

- Releases needs a lot of reworking. 
    - in Models selection (first section): do not show the disabled options only the available ones. it is ok to select models with a "tick box" but i want this experience to remain very close to the existing models selection gallery: the logos should also be there. there are also more local models than gets rendered (i believe i had added more). the goal for this page is: "out of all the models that you have configured providers for, which ones do you want to load on your system?"
    - same with the Providers section: only the configured options should be avaiable. also there is the special "RAG Shared Settings" which should be configured externally not a part of the service selection. finally i also want to be able to see the logos/icons for the services.
    - openwebui settings: this page is horrendous. hard to understand and navigate. i am afraid that we are not ingesting the whole picture here, ie many fields in schema.json are not rendered at all. there is a bug that does not let me move forward: it says TASK_MODEL is requried (notification popup) despite there being no field to enter that. 
    - cannot move forward with the Caddy routes (supposely the final step).

- full review of src/data/models to reflect how there are only: 'chat', 'image', 'embeddings' model types (some frontier models have both chat and image)
- full review of the secrets injection mechnism; possibly with a dedicated section of user-config.json indicating to the njk template ingestion mechanism what Secrets were selected for this specific release


- [soon] flagged menu selection items: Promts; MCP; Utilities (owui specific items)

---

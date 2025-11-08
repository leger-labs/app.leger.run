there was previously a mismatch between the src/generated repo, which means that the actual ui was not registering correctly despite my making changes to the underlying src/data/core json definitions inclding schema.json
after investigating with claude code i found out that:

```
What to do
Whenever src/data/core/schema.json (or any of the supporting model metadata) changes, rerun node scripts/schema-gen/generate-all.js so the src/generated/* files stay in sync.

Commit the regenerated artifacts; they are what the runtime imports today. If you want to avoid checking them in long-term, you’d need to adjust the build so the generator runs automatically before the UI bundles.

Following that process will ensure /release/new immediately reflects the latest schema version.
```

this might be something that is added to the deploy.json
or something that you run on your end including with tests and if it works you update the generated repo with the code that manfests on your server (i don t mean "generate what the output could be" i want the actual code output) 

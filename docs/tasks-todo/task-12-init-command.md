# Task: Init Command

Add a Claude code command called `/init` Which asks the user to describe the name of their app and also write a slightly longer description of what it is for.

1. Reword the description so it's coherent.
2. Update `package.json` to include the proper app name and description.
3. Update the title in `index.html`
4. Update CLAUDE.md and README.md to include the title and description.
5. Update `tauri.config.json` To include a suitable productName and identifier. Update the "bundle" section to include "shortDescription", "longDescription" etc properly.
6. Get the users guthub username (using gh or git) and update `tauri.config.json` updater endpoint correctly.
7. Update `.github/actions/release.yml` as appropriate.
8. Create `CLAUDE.local.md` containing "# Temporary local Claude instructions\n\n\n## Current Task\n\nNone\n"
9. Remind the user to add their "tauri updater" public key to `tauri.config.json` and add their TAURI_SIGNING_PRIVATE_KEY and TAURI_SIGNING_PRIVATE_KEY_PASSWORD to GitHub Actions.
10. Run `npm install` then `npm run tauri:check` then `npm run check:all`
11. Explain to the user what you have done

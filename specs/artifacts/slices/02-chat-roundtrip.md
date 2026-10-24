# Slice 02 — Chat round trip

## Contract

Any completed assistant response can be saved into the library with a useful title and appropriate document/code classification. The save action exposes progress and failure. From the library, a student can open the artifact in chat with its title and contents in an editable composer draft; model usage begins only when they submit.

## Boundaries

- Use the current persisted artifact API; chat messages cannot directly mutate the database.
- A refinement response is saved as a new artifact unless the student explicitly edits the original from the artifact editor.
- Preserve the generic chat flow for all other navigation.

## Checkpoint

Save a response, navigate to Artifacts, reopen it, continue in chat, edit the prepared prompt, submit, and save the refined answer as a separate artifact.

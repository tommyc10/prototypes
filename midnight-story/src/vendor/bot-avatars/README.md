# bot-avatars (vendored)

A copy of `code-library/components/bot-avatars/src`: the local fork of
[bot-avatars](https://libraries.dev/bots) by Jakub Antalik (MIT, see `LICENSE`)
that adds the `dragon` and `trooper` types. Pip, the story's guide, is the dragon.

It's copied in so this repo builds on its own. Treat it as read-only: make changes in
`code-library` and copy them across.

One change from the source, to pass this project's `noUnusedLocals`: `FLIP_POST` in
`engine.ts` is exported instead of left unused.

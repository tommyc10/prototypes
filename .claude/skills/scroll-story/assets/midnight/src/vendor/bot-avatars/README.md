# bot-avatars (vendored)

A bundled fork of
[bot-avatars](https://libraries.dev/bots) by Jakub Antalik (MIT, see `LICENSE`)
that adds the `dragon` and `trooper` types. Pip, the story's guide, is the dragon.

The source is included so this build works independently. Preserve the MIT license and
attribution when copying or modifying it.

One change from the source, to pass this project's `noUnusedLocals`: `FLIP_POST` in
`engine.ts` is exported instead of left unused.

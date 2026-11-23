# Fancy mode

Clicking the rift on "frontend" reveals the animated dark presentation with a particle universe.
Visitors can pause the motion and switch back to plain HTML.

## Sub-features

- `fancy-enter` switches through the rift with an 850ms circular reveal.
- `fancy-pause` pauses and resumes motion.
- `fancy-exit` switches back with "Back to plain HTML" and keeps the reading position.

## How to get to it (user POV)

- Click the word "frontend" in the introduction.

## Driving it with playwright-cli

Preconditions:

- A fresh load of `/`.

- **Enter.** Run
  `playwright-cli click "getByRole('button', { name: 'Frontend, show the animated version' })"`.
  `document.documentElement` gets the class `fancy`, and after a second
  `playwright-cli eval "document.documentElement.dataset.revealResult"` returns `finished`.
- **Pause.** Run `playwright-cli click "getByRole('button', { name: 'Pause motion' })"`. The button is
  pressed (`aria-pressed="true"`).
- **Exit.** Run `playwright-cli click "getByRole('button', { name: 'Back to plain HTML' })"`. The
  `fancy` class is gone and focus is on the "frontend" control.
- **Phone.** Repeat Enter after `playwright-cli resize 390 844` and a reload. Narrow screens use the
  masked reveal from `src/page-reveal.ts`, and the result is again `finished`.
- **Proof.** Screenshot plain, fancy and plain again, and record `revealResult` and `revealReason`
  after each switch.

## Gotchas

- Under reduced motion there is no animated reveal. Don't emulate it unless the change is about it.
- A reveal the browser skipped is not a success. Check `revealReason` when the result isn't
  `finished`.

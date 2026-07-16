# Behavioral gates — deterministic validation of assembled pages

Token and time cost of an agent run are easy to measure. The hard part of an
eval is grading the *output*: did the assembled page actually behave — does
clicking a chapter seek the video, does the transcript follow playback? This
folder makes that part deterministic too, so it does not have to happen
manually.

```bash
# Grade the live video-lesson example (the reference implementation):
node scripts/eval/run-gates.mjs \
  --gates scripts/eval/gates/video-lesson.gates.json \
  --url "https://ivanboring.github.io/magoocomponentui/examples?example=video-lesson"

# Grade any other implementation of the same task — a local build, an agent's
# one-shot attempt, a file:
node scripts/eval/run-gates.mjs \
  --gates scripts/eval/gates/video-lesson.gates.json \
  --url scripts/eval/fixtures/vanilla-baseline.html
```

Exit codes: `0` all gates pass · `1` at least one gate fails · `2` infra
failure (page would not load, invalid spec). `--out report.json` writes the
full per-check report; `--gate <id>` runs a single gate; `--exec <path>` points
at a specific Chromium binary; `--headed` shows the browser.

## Why gates are content-anchored

A gate never references class names, ids, or DOM shape. Anchors are either
visible text (`{ "text": ["Stage 2", "1:58"] }` resolves to the smallest
visible element containing every fragment) or accessible names
(`{ "ariaLabel": "Play" }`). The text and timestamps come from the *task
fixture* (for video-lesson: `preview/src/lib/examples/video-lesson.js`), not
from any implementation.

That makes one gate suite grade **any** implementation of the same task, which
is what turns it into an eval harness: run the same prompt through an agent
armed with this library (arm A) and a vanilla agent (arm B), point the same
gates at both outputs, and compare gate pass rate alongside tokens and wall
time. The shipped `fixtures/vanilla-baseline.html` is a worked negative
control: a plausible one-shot vanilla build where the video player itself works
but nothing is wired together. Scoreboard as of authoring:

| Implementation | Gates |
|---|---|
| Live `video-lesson` example (reference) | 11/11 |
| `fixtures/vanilla-baseline.html` (working player, no sync) | 4/11 |

The four passing baseline gates are exactly "the player works"
(play/pause/speed/initial rate); the seven failing ones are exactly "it all
works together" (chapter/cue click seeks, playback drives the active row in
both directions, end screen).

## Failure semantics

A missing control is a gate **FAIL**, not an infra error: the gate spec encodes
the task's acceptance contract, so "there is no accessible Play button" or
"there is no video element" is a failed acceptance. Infra (`exit 2`) is
reserved for harness breakage — the page would not load, the spec is invalid,
the runner crashed. A grader must never report "pass" or "fail" on a run it
could not actually grade.

## Gate spec format

```jsonc
{
  "specVersion": "0.1",
  "example": "video-lesson",
  "settleMs": 900,                       // wait after load before each gate
  "gates": [
    {
      "id": "chapter-click-seeks",
      "desc": "…",
      "steps": [                          // each gate starts on a fresh page load
        { "do": "click", "anchor": { "text": ["Stage 2", "1:58"] } },
        { "do": "seek", "seconds": 180 }, // or { "fromEnd": 0.4 } — scrubs the <video>
        { "do": "play" },                 // muted, so headless autoplay allows it
        { "do": "pause" },
        { "do": "wait", "ms": 500 }
      ],
      "expect": [
        { "read": "video.currentTime", "near": 118, "tol": 2.5 },
        { "read": "video.paused", "equals": false },
        { "read": "video.playbackRate", "notEquals": 1 },
        { "read": "video.ended", "equals": true },
        // Is the anchored element (or a close ancestor) marked active via
        // aria-current / aria-selected / data-active / an active|current class?
        { "read": "activeMarker", "anchor": { "text": ["Stage 3"] }, "equals": true },
        // Exactly-one semantics across a set of anchors:
        { "read": "markedCount", "anchors": [ { "text": ["Introduction"] } ], "equals": 1 },
        // Visibility of possibly-hidden content (end screens, overlays):
        { "read": "visible", "anchor": { "text": ["Up next"] }, "equals": true }
      ]
    }
  ]
}
```

Authoring a suite for another example: copy `gates/video-lesson.gates.json`,
take titles/timestamps/cue text from that example's definition under
`preview/src/lib/examples/`, and keep every anchor's fragments discriminating
(unique to the element you mean — combine a title fragment with its timestamp
when a word also appears in the transcript). `pnpm test` validates the shipped
specs structurally; the pure logic lives in `lib.mjs` with unit tests in
`run-gates.test.mjs`.

## Known limits

Anchors resolve in the page's light DOM only: content inside iframes, shadow
roots (custom elements), or native `<video controls>` shadow controls is not
reachable. An implementation built that way fails its gates even if it behaves
correctly, so either treat light-DOM, accessibly-labeled controls as part of
the task's acceptance contract (they are an a11y requirement anyway) or extend
the resolver before grading such an arm.

Gaming resistance, since an eval harness invites it: follow-playback gates
assert exactly-one active row across the listed anchors (mark-everything fails),
each follow direction is asserted at two different timestamps in paired gates
(a statically pre-marked "right answer" fails one of the pair), and the speed
gate is paired with an initial-rate gate (a player pre-set to a non-default
rate with a dead control fails). Every gate runs on a fresh page load, so no
gate can lean on state a previous gate created.

## What stays manual

Aesthetics and taste. Layout/geometry fidelity is deterministic too when a
design source exists, but that is a different instrument (computed-style and
bounding-box assertions); these gates deliberately grade only behavior.

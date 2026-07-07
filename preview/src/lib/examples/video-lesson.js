// Video lesson — a synced video page. One video-player broadcasts its position on a
// document-level event bus; the video-chapters and video-transcript carry the same sync_id,
// so clicking a chapter/cue seeks the player and the active row follows playback. A
// watch-next-rail is slotted into the player's end_screen (revealed when the video ends),
// and the foot of the page has a rich-text block (in the padding component) + a related grid.
// See ../examples.js for the item-shape reference.

const VIDEO_SYNC = "child-dev";
// A real, playable MP4 (the author's own page). Not a /stock/ path, so it isn't rebased.
const VIDEO_SRC = "https://workflows-of-ai.com/child_development.mp4";

// Turn a seconds offset into a "m:ss" display label.
const secLabel = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// Transcript: one cue per sentence (the two "Stage one." fragments merged so it reads well).
// [seconds, text] — the display time is derived from the offset.
const VIDEO_CUES = [
  [6.96, "Today's video is based on an article from issue four of our magazine."],
  [11.2, "If you'd like more from our magazine, you can buy it from www.psych2go.shop or you can pledge to our Patreon at www.patreon.com/psych2gomagazine."],
  [23.965, "Today, we'll be talking about three big stages of emotional development in children."],
  [29.89, "When children are young, they go through lots of changes."],
  [33.09, "As well as learning to walk and talk, they go through many emotional milestones."],
  [37.73, "These are, of course, unique to each child, so it's important to remember the months given in this video are just a guide."],
  [44.475, "The milestones do, however, occur in the same stage for each child."],
  [49.675, "Stage one. The first six months."],
  [53.195, "When a child is born, they are emotionally undeveloped."],
  [56.74, "They can indicate distress by crying, but they lack other more developed responses."],
  [62.18, "By one month, babies cry a lot and will make it known that they are either hungry, tired, or craving attention."],
  [69.295, "By two months, they start to indicate if they like something or not."],
  [73.215, "For example, by showing excitement at a toy."],
  [76.175, "They also begin to exhibit a social smile, realizing that smiling gets them more positive attention."],
  [83.53, "At three months, babies start to recognize and show excitement, and may even show boredom if shown the same stimuli again and again."],
  [91.37, "They may start to show frustration if not attended to."],
  [95.21, "By four months, the baby is starting to laugh."],
  [98.275, "As well as this, four months is when babies first show anger."],
  [102.195, "They may turn their head away from something they dislike, for example."],
  [106.195, "Finally, by six months, babies can match the emotions of others, like smiling when their mother does."],
  [112.85, "Fear and anger might be more evident now, though that may vary wildly from child to child."],
  [118.85, "Stage two, six to twelve months."],
  [123.41, "By seven months, a child will show fear, anger, defiance, and even possibly shyness."],
  [129.895, "By eight months, a baby is better at identifying emotions and, as a result, can experience mixed emotional states."],
  [136.855, "So around now, the baby develops much more of a personality."],
  [141.11, "At nine months, babies will seek out others for comfort when tired."],
  [145.35, "Another major milestone at this age is that babies are able to recognize themselves in a mirror."],
  [151.27, "At 10, babies will show much more extreme positive and negative emotions."],
  [155.825, "They'll show more curious behavior."],
  [158.705, "They'll test things out and reach out to items that interest them."],
  [162.305, "By 11, individual differences in children's emotions will become clear."],
  [167.425, "The child may even insist on feeding themselves at this point."],
  [171.31, "Stage three, twelve to twenty four months."],
  [175.23, "After the first year, children are able to display complex emotions."],
  [179.55, "For example, they may start to show signs of jealousy."],
  [183.165, "Some positive things can develop too."],
  [185.965, "Children at this age often smile and laugh at their own cleverness."],
  [189.645, "By 15, children show caring traits toward other children and show preferences for certain clothes."],
  [195.78, "They show what they like and dislike and will show frustration if a child plays dirty with them."],
  [202.34, "At 18, children can throw temper tantrums."],
  [205.38, "They also start to show signs of shame when they've done something wrong."],
  [209.875, "Another cute development is that they show a strong preference toward a comforting item, like a blanket."],
  [216.515, "By 21, children will attempt to control negative emotions and situations."],
  [222.4, "By 24, children can be consciously upset by what they dream."],
  [227.04, "They can also respond to others' emotions fully."],
  [230.24, "They also start to identify their gender and their first name."],
  [235.335, "Obviously, beyond this point, children still develop emotionally."],
  [238.775, "They continue to learn about emotions, about displaying them, interacting through them, and learning to feel more than one emotion at once."],
  [245.975, "We hope this video has taught you a little bit about how children develop emotions in their early years."],
  [251.36, "If you liked this video, be sure to check out our magazine."],
  [254.64, "Also, like and share the video, and be sure to subscribe to our channel."],
].map(([seconds, text], i) => ({ time: secLabel(seconds), seconds: Math.floor(seconds), text, active: i === 0 }));

// Chapters are placeholders (to be revised) that mirror the article's three stages.
const VIDEO_CHAPTERS = [
  [0, "Introduction", "/stock/introduction.jpg"],
  [49, "Stage 1 - The First Six Months", "/stock/stage1.jpg"],
  [118, "Stage 2 - Six to Twelve Months", "/stock/stage2.jpg"],
  [171, "Stage 3 - Twelve to Twenty-Four Months", "/stock/stage3.jpg"],
].map(([seconds, title, thumbnail], i) => ({ title, time: secLabel(seconds), seconds, thumbnail, active: i === 0 }));

// Whole lesson shares one centered measure.
const LESSON = "mx-auto max-w-6xl";

const VIDEO_HEADING = `<div class="${LESSON}">
  <p class="font-mono text-xs uppercase tracking-wider text-primary">Psychology · Explainer</p>
  <h1 class="mt-1 font-heading text-3xl font-semibold tracking-tight">Stages of Emotional Development in Children</h1>
  <p class="mt-2 text-on-surface-muted">Three big stages of a child's emotional growth, from birth to two years — watch along with chapters and a synced transcript.</p>
</div>`;

// A simple section header rendered before the chapters list (with top padding to separate it).
const CHAPTERS_HEADING = `<div class="${LESSON} pt-8"><h2 class="font-heading text-lg font-semibold text-on-surface">Chapters</h2></div>`;

// Heading for the related-videos grid at the foot of the page.
const RELATED_HEADING = `<div class="${LESSON} pt-8"><h2 class="font-heading text-lg font-semibold text-on-surface">Related Videos</h2></div>`;

// Body copy for the rich-text (html) block — passed to editorial/rich-text's `html` prop.
const ABOUT_HTML =
  "<h2>About this video</h2>" +
  "<p>Emotional development in the first two years follows a broadly predictable path. Long before they can talk, babies learn to signal distress, share a smile, and read the feelings of the people around them.</p>" +
  "<p>The ages given in this guide are averages, not deadlines &mdash; every child moves through the stages at their own pace, but nearly always in the same order. Use the chapters above to jump straight to a stage.</p>" +
  "<ul><li><strong>Stage 1 &mdash; 0 to 6 months:</strong> from crying to the first social smile.</li><li><strong>Stage 2 &mdash; 6 to 12 months:</strong> fear, defiance, and self-recognition.</li><li><strong>Stage 3 &mdash; 12 to 24 months:</strong> complex emotions like jealousy, shame, and empathy.</li></ul>";

export default {
  id: "video-lesson",
  label: "Video lesson",
  description: "A synced video page: nav, title, and a split-view holding the video-player (70%) beside its transcript (30%), with the chapters full-width below — all seeking the player and following playback via a shared sync_id. Video by Psych2Go, licensed CC BY 4.0.",
  components: [
    "navigation/navbar",
    {
      section: [
        { raw: VIDEO_HEADING },
        {
          split: {
            ratio: "70-30",
            gap: "lg",
            start: {
              id: "video/video-player",
              args: {
                title: "Stages of Emotional Development in Children",
                src: VIDEO_SRC,
                poster: "/stock/introduction_video.jpg",
                duration: "0:00 / 4:18",
                sync_id: VIDEO_SYNC,
              },
              // Revealed as an overlay over the video when it finishes playing.
              slots: { end_screen: { id: "video/watch-next-rail" } },
            },
            end: { id: "video/video-transcript", args: { cues: VIDEO_CUES, sync_id: VIDEO_SYNC } },
          },
          wrap: LESSON,
        },
        { raw: CHAPTERS_HEADING },
        { id: "video/video-chapters", args: { chapters: VIDEO_CHAPTERS, sync_id: VIDEO_SYNC }, wrap: `${LESSON} pt-3` },
        // HTML body copy (editorial/rich-text) wrapped in the padding component (layout/spacing-box).
        {
          id: "layout/spacing-box",
          args: { padding: "sm" },
          slots: { content: { id: "editorial/rich-text", args: { html: ABOUT_HTML } } },
          wrap: LESSON,
        },
        { raw: RELATED_HEADING },
        { id: "video/video-grid", wrap: `${LESSON} pt-3` },
      ],
    },
    "layout/footer-columns",
  ],
};

---
name: E-Sahulat
description: Passport answers quoted verbatim from official DGI&P pages, attested as true copies, in English, Urdu and Roman Urdu.
colors:
  paper: "#f3f3f0"
  sheet: "#fbfbf8"
  strip: "#ffffff"
  ink: "#1b1b1f"
  ink-2: "#45454c"
  ink-3: "#64646b"
  rule: "#dcdbd4"
  rule-strong: "#c4c3bb"
  toner: "rgba(27, 27, 31, 0.05)"
  cover: "#1d4a37"
  cover-deep: "#153728"
  cover-ink: "#eef4ef"
  cover-ink-2: "#b4cabc"
  verified: "#5a3ea8"
  particulars: "#8a5a00"
  not-on-record: "#b3261e"
  verified-wash: "#efebf8"
  series-1: "#1f8a5f"
  series-2: "#2f6fc4"
  series-3: "#c25e8a"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, Segoe UI, sans-serif"
    fontSize: "34px"
    fontWeight: 750
    lineHeight: 1.15
    letterSpacing: "-0.022em"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, Segoe UI, sans-serif"
    fontSize: "21px"
    fontWeight: 650
    lineHeight: 1.45
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
    fontFeature: "\"tnum\" 1"
  quote:
    fontFamily: "Source Serif 4, Georgia, Times New Roman, serif"
    fontSize: "21px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.003em"
  urdu:
    fontFamily: "Noto Nastaliq Urdu, Jameel Noori Nastaleeq, Urdu Typesetting, serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 2.25
  stamp:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 850
    lineHeight: 1.05
    letterSpacing: "0.06em"
    fontVariation: "\"wdth\" 72"
  code:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.04em"
    fontVariation: "\"wdth\" 78"
  figure:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 750
    lineHeight: 1.05
    letterSpacing: "-0.03em"
    fontVariation: "\"wdth\" 92"
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11.5px"
    fontWeight: 650
    lineHeight: 1.4
    letterSpacing: "0.06em"
rounded:
  sheet: "4px"
  sm: "6px"
  control: "9px"
  md: "10px"
  lg: "14px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "40px"
components:
  cover-bar:
    backgroundColor: "{colors.cover}"
    textColor: "{colors.cover-ink}"
    height: "64px"
    padding: "0 32px"
  button-primary:
    backgroundColor: "{colors.cover}"
    textColor: "{colors.cover-ink}"
    rounded: "{rounded.control}"
    padding: "9px 18px"
  button-primary-hover:
    backgroundColor: "{colors.cover-deep}"
    textColor: "{colors.cover-ink}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "7px 14px"
  button-quiet-hover:
    backgroundColor: "{colors.sheet}"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "6px 13px"
  chip-hover:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
  segmented-option-active:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "7px"
    padding: "5px 11px"
  composer:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    typography: "{typography.body}"
  input-search:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 14px 0 40px"
  passage-code:
    backgroundColor: "transparent"
    textColor: "{colors.cover}"
    typography: "{typography.code}"
    rounded: "5px"
    height: "24px"
    padding: "0 7px"
  passage-code-hover:
    backgroundColor: "{colors.cover}"
    textColor: "{colors.cover-ink}"
  attested-document:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "32px 36px 28px"
  quote-strip:
    backgroundColor: "{colors.strip}"
    textColor: "{colors.ink}"
    typography: "{typography.quote}"
    padding: "20px 24px"
  stamp-verified:
    textColor: "{colors.verified}"
    typography: "{typography.stamp}"
    rounded: "{rounded.control}"
  stamp-particulars:
    textColor: "{colors.particulars}"
    typography: "{typography.stamp}"
    rounded: "{rounded.control}"
  stamp-not-on-record:
    textColor: "{colors.not-on-record}"
    typography: "{typography.stamp}"
    rounded: "{rounded.control}"
  tooltip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "7px"
    padding: "7px 10px"
---

# Design System: E-Sahulat

## Overview

**Creative North Star: "The Attested True Copy"**

Every answer is a photocopy of the official line, attested by a rubber stamp. The interface is an office file, not a conversation: a bottle-green file cover holds the app, a photocopy-white ground carries toner-gray rules, and each question produces one document sheet with the verbatim official passage pasted on as a paper strip and a stamp pressed into its corner. There is no message thread and no assistant voice; the quote and its source are the answer, and the stamp is the verdict.

Density is calm and clerical. The Ask view runs a two-thirds working column beside a one-third "Today's file" register; the Knowledge base reads like a ledger of coded passages; Evaluation reads like a measured report sheet with KPI figures under a heavy ink rule. Refusal carries equal visual weight: "Particulars required" and "Not on record" get the same stamp, sheet and care as "Verified true copy".

English and Urdu are set as equals. Urdu is always Nastaliq, right to left, with generous leading, and sits beside the English quote on the same strip rather than below it as a translation.

**Key Characteristics:**
- Bottle-green file-cover shell over photocopy-white paper.
- One attested document per question; no chat bubbles, no thread.
- Three rubber-stamp inks carry the three decisions, and only decisions.
- Verbatim official text in a gazette serif on slightly tilted paper strips.
- Urdu Nastaliq and English side by side on the same strip, same weight.
- Flat controls with hairline borders; shadows belong only to paper.

## Colors

A near-neutral photocopy palette with one institutional green and three stamp inks held in reserve for verdicts.

### Primary
- **Bottle-Green File Cover** (cover): the sticky top bar, the primary Ask button, passage code tags, the composer and search focus border (with a 3px 14% green halo), checked toggles and the loading progress bar. It is the colour of the file and of acting on it.
- **Deep Cover** (cover-deep): the hover state of the primary button and the 1px seam under the cover bar.
- **Cover Ink / Cover Ink Muted** (cover-ink, cover-ink-2): text on the cover; the active tab and its indicator in full cover ink, inactive tabs, the Urdu wordmark and status text in the muted green-gray.

### Secondary (the stamp inks)
- **Attestation Violet** (verified): the "Verified true copy" stamp, the "Citation verified" line, the file-list mark for answered questions, and the keyboard focus ring. Its pale **Violet Wash** (verified-wash) is the brief flash on a Knowledge base row reached from a code tag.
- **Particulars Ochre** (particulars): the "Particulars required" stamp and the clarify mark in Today's file; also the banner warning icon.
- **Not-on-Record Red** (not-on-record): the "Not on record" and "Copy not verified" stamps, the abstain mark, failed verification, and the flag for numbers in a summary that are not in the quotes.

### Tertiary (chart series)
- **Ledger Green, Survey Blue, Docket Rose** (series-1, series-2, series-3): bar series in Evaluation charts and their legend swatches, in that order. This set was validated for colour-vision deficiency and contrast and is deliberately distinct from the stamp inks. The confusion-matrix heatmap uses a sequential green ramp from near-white to deep cover green.

### Neutral
- **Photocopy White** (paper): the page ground, segmented-control track, summary panel and tags.
- **Sheet White** (sheet): document and report sheets, composer, inputs, selected file items and hover fills.
- **Strip White** (strip): the pure-white quote strip pasted onto a sheet.
- **Toner Black** (ink): primary text; also the 2px heavy rule that heads Today's file, the Knowledge base ledger and the KPI row, and the tooltip ground.
- **Toner Gray / Toner Light** (ink-2, ink-3): secondary text and Urdu companion quotes; meta, placeholders, captions and axis labels.
- **Hairline / Strong Hairline** (rule, rule-strong): dividers, chart grid and trace cell gaps; control borders, chips and dashed separators.
- **Toner Haze** (toner): the skeleton-row sweep.

### Named Rules
**The Three Inks Rule.** Violet, ochre and red mean verified, particulars required and not on record. They appear on stamps, decision marks, verification lines and warnings about unverified content, never as decoration, category colour or chart series. Violet's only non-verdict duties are the focus ring and the highlight tint.

**The Chart Is Not a Verdict Rule.** Evaluation series use series-1/2/3 in order, never a stamp ink, so a red bar is never read as "not on record".

**The Green Means Act Rule.** Bottle green is the file cover and every primary action on the file; it is not used for status or success.

## Typography

**Display Font:** Archivo (with ui-sans-serif, system-ui, Segoe UI)
**Body Font:** Archivo, variable width and weight (62–125 wdth, 400–900 wght)
**Quote Font:** Source Serif 4 (with Georgia, Times New Roman)
**Urdu Font:** Noto Nastaliq Urdu (with Jameel Noori Nastaleeq, Urdu Typesetting)

**Character:** A sturdy grotesque for the office around the document, a gazette serif for the official words themselves, and Archivo's own condensed heavy cut for the rubber stamp. Tabular figures are on everywhere.

### Hierarchy
- **Display** (750, 34px, 1.15; 27px under 760px): one page heading per view, balanced wrap, with an Urdu companion line at 19px aligned opposite.
- **Headline** (650, 21px, 1.45): the question as the document's title; Urdu questions at 400, 19px.
- **Title** (650–750, 15–17px): chart titles, report title, Today's file, the outcomes heading.
- **Body** (400, 16px, 1.5): running text; ledes cap at 62ch, document messages at 18px/1.6 and 70ch.
- **Quote** (400, 21px, 1.5; 19px on mobile): verbatim official English on quote strips; Knowledge base passages at 17.5px/1.55, 68ch.
- **Urdu** (400, Nastaliq, line-height 2.25 by default, 2.1 in the composer and answer message, 1.9–2 in compact places): every Urdu string.
- **Stamp** (850, 19px, 72% width, 0.06em, uppercase; sub-lines 650, 11px, 80% width, 0.1em): stamp text only.
- **Code** (800, 14px, 78% width, 0.04em; 17px in the ledger): passage codes such as F14.
- **Figure** (750, 40px, 92% width, -0.03em; 32px on mobile): KPI values.
- **Label** (650, 11.5–12px, 0.03–0.06em, uppercase): field names in the decision trace grid and the decision word under a Today's file entry. Labels name data; they never sit above a heading.

### Named Rules
**The Gazette Quote Rule.** The serif is reserved for verbatim official text. UI, summaries and headings stay in Archivo.

**The Equal Scripts Rule.** Urdu is always Nastaliq, right to left, with line-height of at least 1.9, at a size equal to or larger than the English beside it. When the question is Urdu, the strip flips: Urdu leads at 21px in full ink, English follows at 17px in ink-2.

**The Stamp Cut Rule.** The condensed heavy uppercase cut belongs to stamps; the condensed bold cut to passage codes and KPI figures. Neither is used for headings.

## Layout

Content sits in a 1240px container with 32px side padding (16px under 760px); the page frame pads 44px top and 96px bottom. The Ask view is a two-column grid, a fluid working column and a 320px register, 40px apart; Today's file is sticky at 96px from the top. At 1080px the grid stacks, charts go to one column and the trace grid to two. At 760px the cover bar wraps with tabs on a scrollable 44px second row, the Ask button goes full width at 44px, example chips become one horizontally scrolling row, stamps drop into the flow beside the question, and quote strips stack Urdu under English.

Rhythm runs on 4/8 multiples with 16, 24, 32 and 40px as the main steps; sheets pad 32px 36px 28px. Ledgers and KPI rows are open tables: a 2px ink rule on top, 1px hairlines between rows, no boxes. The Knowledge base row is a three-column grid (72px code, English, Urdu at 0.85fr).

## Elevation & Depth

Hybrid, and literal: only paper objects lift. Controls are flat with hairline borders; the document sheet, the report sheet and the quote strips cast soft paper shadows, and the strips sit on the sheet. Depth also comes from material: a 160px fractal-noise toner grain and an 18px toner edge on the left of the sheet, and the stamp pressed in with multiply blend, a grain mask and heavier ink on the left.

### Shadow Vocabulary
- **Sheet** (`box-shadow: 0 1px 1px rgba(27,27,31,0.04), 0 10px 28px -16px rgba(27,27,31,0.28)`): the attested document and the evaluation report.
- **Strip** (`box-shadow: inset 1px 0 0 rgba(27,27,31,0.07), inset -1px 0 0 rgba(27,27,31,0.07), 0 1px 1px rgba(27,27,31,0.06), 0 6px 14px -10px rgba(27,27,31,0.35)`): the quote strip pasted on a sheet.
- **Rest** (`box-shadow: 0 1px 2px rgba(27,27,31,0.05)`): the composer at rest; the pressed segmented option uses 0.12.
- **Focus halo** (`box-shadow: 0 0 0 3px rgba(29,74,55,0.14)`): composer and search on focus, with a cover-green border.
- **Float** (`box-shadow: 0 8px 20px -8px rgba(0,0,0,0.4)`): the chart tooltip only.

### Named Rules
**The Paper Lifts Rule.** If it is not a sheet of paper, it does not cast a shadow. Buttons, chips, inputs and panels are flat.

## Shapes

Paper is nearly square (4px on sheets) and a little off-true: quote strips are rotated -0.25deg, alternating to +0.2deg, and stamps are rotated -5deg (-3deg for not on record and in the outcomes legend). Controls are softly rounded and perfectly level: 9px buttons and segmented tracks, 10px banners, inputs and summary panels, 14px for the composer, full pills for example chips, 5px for passage codes, 4px for tags. Stamps are a double border, 2.5px outer at 9px radius and 1px inner at 6px with a heavier left edge. Dashed hairlines mark provisional or auxiliary regions: the outcomes explainer and the trace divider. Icons are 24px-grid stroke SVGs at 1.75 stroke with round caps, sized at 1em.

## Components

### Buttons
Plain and institutional.
- **Shape:** gently rounded (9px).
- **Primary:** bottle green with cover ink, 650 weight 15px, 9px 18px, trailing arrow icon; full width and 44px tall on mobile.
- **Hover / Focus:** hover deepens to cover-deep, only on fine pointers; press scales to 0.97 over 140ms ease-out; focus is a 2px violet outline offset 2px; disabled drops to 45% opacity.
- **Quiet:** transparent with a strong hairline border, 14px, 7px 14px; hover fills sheet white.

### Chips
- **Style:** example questions as transparent pills with a strong hairline, ink-2 13.5px text, ellipsis on overflow; Urdu chips switch to Nastaliq.
- **State:** hover fills sheet and darkens border and text; press scales to 0.97.

### Segmented control and switch
- **Segmented:** paper track with hairline, 9px radius, 2px inset; the pressed option becomes a sheet-white tab with a 1px shadow. Used for reply language and the test/dev split.
- **Switch:** 30x18 track in strong hairline, cover green when on, white thumb sliding 12px over 180ms ease-out.

### Cards / Containers
- **Attested document:** sheet white, 4px corners, sheet shadow, toner grain, 32px 36px 28px padding (22px 18px on mobile). The head carries the question, a meta line, and the stamp at top right overlapping the sheet edge.
- **Summary panel:** paper ground inside the sheet, hairline border, 10px radius; a streaming caret while text arrives.
- **Banner:** sheet ground, strong hairline, 10px radius, 14px text with an ochre alert icon (green spinner while loading).

### Inputs / Fields
- **Composer:** sheet white, strong hairline, 14px radius, 18px textarea that grows to 240px; the foot holds reply language, summary switch, the keyboard hint and Ask. Urdu input switches to Nastaliq automatically.
- **Search and select:** 44px, sheet white, strong hairline, 10px radius; search has a leading icon at 40px inset.
- **Focus:** cover-green border plus the 3px green halo.

### Navigation
- **Cover bar:** sticky 64px bottle-green bar; wordmark in Archivo 800 21px with the Urdu name beside it; tabs in 600 15px cover-ink-2, active in cover ink with a 3px indicator that slides under it (220ms ease-out); a status dot and label at the right (amber loading, light green ready, coral failed, tuned for the dark ground). On mobile tabs move to their own scrollable row.

### Stamp (signature)
The verdict. A rotated double-bordered rubber stamp in one of the three inks, condensed heavy caps, a grain mask and left-heavy press, multiply blend. Titles are "Verified true copy", "Particulars required", "Not on record" and "Copy not verified"; sub-lines carry the passage code, source and date, or the reason. When a fresh answer lands, it drops in from 1.22 scale and -4deg over 200ms ease-out after a 120ms delay, once, after the sheet rises 8px over 260ms. In forced-colors mode the mask and blend are removed.

### Quote strip (signature)
The official words, pasted on. A pure-white strip slightly wider than the sheet's text column (-8px margins), tilted a quarter degree, with English serif and Urdu Nastaliq in two columns split by a 1px rule. Under it: the passage code tag, the source page link, and the violet "Citation verified" line. Strips stagger in at 50ms steps.

### Passage code
Condensed bold codes (F01–F30) in cover green inside a 1.5px green border, 5px radius. As a button or link, it fills green on hover and jumps to the passage in the Knowledge base, which flashes violet wash.

### Today's file
A register under a 2px ink rule: each entry has a small rotated square mark outlined in its decision ink, the question clamped to two lines, and the decision word as a label. The current entry and hovered entries fill sheet white.

## Do's and Don'ts

### Do:
- **Do** give every question exactly one stamped document, whatever the decision.
- **Do** keep violet, ochre and red for verdicts and verification only, per The Three Inks Rule.
- **Do** use series-1, series-2, series-3 in order for chart series.
- **Do** set every verbatim official sentence in Source Serif 4 on a white quote strip, with its passage code and source link beneath.
- **Do** set Urdu in Noto Nastaliq Urdu, right to left, line-height 1.9 or more, at a size no smaller than the English beside it.
- **Do** gate hover effects behind `(hover: hover) and (pointer: fine)`, press feedback at scale 0.97, and honour reduced motion.
- **Do** head ledgers, registers and KPI rows with a 2px ink rule and separate rows with 1px hairlines.

### Don't:
- **Don't** render answers as chat bubbles or a conversation thread.
- **Don't** use a stamp ink for a chart series, a category colour, or decoration.
- **Don't** set UI chrome, headings or summaries in the serif; it marks official text.
- **Don't** show Urdu in Archivo or any non-Nastaliq face.
- **Don't** give controls, chips or panels a shadow; only paper lifts.
- **Don't** put uppercase tracked labels above headings; labels name trace fields and decisions only.
- **Don't** tilt controls; only paper strips and stamps sit off-true.

## Open Items

- Fonts load from Google Fonts (Archivo, Noto Nastaliq Urdu, Source Serif 4). Self-hosting is pending the user's approval; until then the system fonts in each stack are the fallback.

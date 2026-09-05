# Design critique: Treasury Atom authenticated workspace

## Overall impression

The application has a clear operational structure and strong treasury labeling, but the original light theme still felt like a dark dashboard recolored with pale grey. Blue carried primary, live, successful, informative, and decorative meaning, weakening scan speed for finance reviewers.

## Usability

| Finding | Severity | Implemented recommendation |
| --- | --- | --- |
| Operational states shared one blue treatment | Moderate | Introduced distinct text-labeled teal, green, amber, violet, and red semantic states. |
| Several compact controls were below comfortable touch size | Moderate | Established a 44px minimum target for navigation and primary controls. |
| Small metadata reduced readability | Moderate | Increased high-use dashboard and intelligence metadata to 10–11px with stronger line height. |
| Agent authority could be inferred from visual confidence | Critical | Kept the assistant explicitly propose-only and exposed source readiness and trust boundaries. |

## Visual hierarchy

- **Primary focus:** the close status or current intelligence question remains first.
- **Reading flow:** page purpose → live operational signal → decision work → evidence and controls.
- **Emphasis:** navy is reserved for navigation and primary action; semantic accents identify meaning without competing with core data.

## Consistency

| Element | Issue | Resolution |
| --- | --- | --- |
| Background | Grey shell conflicted with the white-first brief | Replaced with a bright white application canvas and restrained tinted regions. |
| Color | Blue represented unrelated states | Added a documented semantic palette. |
| Interaction | Focus visibility varied by control | Added a consistent three-pixel focus treatment. |
| Motion | Persistent motion risked becoming decorative | Retained only the central state visual and existing reduced-motion behavior. |

## Accessibility

- Dark navy body text and stronger muted text maintain readable contrast on white surfaces.
- State changes pair color with text, icons, or status labels.
- Keyboard focus is visible, navigation includes labels, and the skip link remains intact.
- Primary touch targets now meet the 44px minimum.
- Reduced-motion styles remain enabled.

## What works well

- Clear separation between dashboard, reconciliation, evidence, approvals, and audit.
- Accurate illustrative-data and connector disclosures.
- Live SSE status is visible without blocking financial workflows.

## Priority recommendations completed

1. Establish a genuinely white base canvas.
2. Separate semantic operational colors from the navy action color.
3. Strengthen control size, text readability, and focus visibility.

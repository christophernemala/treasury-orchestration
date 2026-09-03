# Treasury Atom — Implementation Prompt

Redesign the frontend of the existing `agentic-treasury` application as a premium enterprise treasury platform named **Treasury Atom**. Work inside the current React 19 + TypeScript + Vite client. **Preserve the existing backend unchanged.** Reuse its API, authentication behavior, live treasury data, routes, types, seeded data, validation rules, workflows, and business logic exactly as they currently function. Use React Three Fiber/Three.js for the spatial assistant and Framer Motion for interface transitions. Do not replace working product behavior with a static mockup.

## Non-negotiable backend preservation

This is a frontend redesign, not a backend rewrite.

- Do not edit, replace, migrate, or remove the existing server.
- Do not change API routes, request bodies, response shapes, status codes, or streaming-event contracts.
- Do not change authentication rules, authorization behavior, approval logic, treasury calculations, seeded records, persistence, or audit behavior.
- Do not introduce a second backend, mock server, new database, or alternate source of truth.
- Do not move server-side business logic into the browser.
- Adapt the new interface to the existing API contracts through the current client API layer and types.
- If the new UI needs information the backend does not expose, show a graceful unavailable or illustrative state; do not invent a server response or silently modify the backend.
- Existing backend tests and health checks must continue to pass without modification.

## Creative direction

Use the supplied financial login design only as inspiration for a clean split-screen authentication layout. Use the supplied robotics design only as inspiration for a cinematic humanoid focal point and floating information cards. Create an original architecture, brand system, composition, logo, copy, palette, robot, and motion language. Do not copy either reference's colors, assets, wording, or exact proportions.

The product should feel intelligent, precise, secure, calm, cinematic, and executive. Avoid generic fintech blue gradients, crypto styling, cartoon robots, gaming HUDs, excessive neon, and decorative charts that do not support a treasury decision.

## Brand

- Product: **Treasury Atom**
- Short mark: **TA**
- Assistant designation: **TA–01**
- Tagline: **Governed intelligence for every treasury decision.**

Create an original logo from a central treasury core and three controlled orbital paths representing liquidity, risk, and execution. Hide a subtle `T` or `TA` in the geometry. The mark must work at favicon size. Use brushed silver with a restrained mint signal accent. Do not use a dollar sign, coin, bank, shield, or literal chemistry icon.

## Visual system

- Background: `#080B0F`
- Raised surface: `#11161C`
- Secondary surface: `#171D24`
- Primary text: `#F3F5F6`
- Muted text: `#98A2AD`
- Border: `rgba(255,255,255,0.10)`
- Signal mint: `#72E6BF`
- Controlled amber: `#F2B563`
- Alert coral: `#EF7B72`
- Intelligence violet: `#8F87FF`, used sparingly

Use Geist, Inter, or Manrope with tabular numerals for financial values. Prefer precise spacing, thin borders, subtle elevation, disciplined glass surfaces, and generous negative space. Do not reproduce the blue or purple backgrounds from the references.

## Login experience

Create a full-height 55/45 desktop split layout.

### Left: secure access

Show the Treasury Atom mark and wordmark above:

- Eyebrow: `SECURE TREASURY WORKSPACE`
- Heading: `Welcome back.`
- Copy: `Sign in to your governed liquidity and risk command center.`
- Work email field
- Password field with show/hide control
- Remember this device
- Forgot password?
- Primary action: `Enter Treasury Atom →`
- Secondary actions: `Continue with Microsoft` and `Continue with SSO`
- Security line: `Protected by role-based access, policy controls and complete audit evidence.`
- Optional demo line: `Demo workspace credentials are prefilled.`

Implement default, hover, focus, filled, validation, error, disabled, loading, and success states. Do not include consumer social login or an unnecessary sign-up tab.

### Right: cinematic treasury assistant

Present one photorealistic chest-up humanoid assistant integrated into a dark architectural treasury control room. Give it a brushed titanium and satin-silver shell, precise seams, optical-glass eyes, restrained mint-white illumination, and a calm, trustworthy expression. Avoid toy proportions, exposed horror machinery, exaggerated anatomy, weapons, or overtly gendered styling.

Place three small, depth-aware glass cards around the robot without covering its face:

1. `LIQUIDITY SIGNAL` — `+AED 14.8M` — `Expected Thursday` — `Confidence 94%`
2. `POLICY CONTROL` — `✓ Verified` — `Maker-checker review ready`
3. `ATOM RESPONSE` — `Moving the EMEA funding window forward could reduce Thursday’s liquidity gap by AED 3.2M.`

Status: `TA–01 ONLINE · Governed intelligence · 24ms`

## Login motion

- Nearly imperceptible breathing and idle movement
- Slow 6–10 degree head turn toward the active form
- Gentle eye refocus and one soft blink every 6–9 seconds
- Physically believable metallic reflection changes
- Staggered card fade, small depth shift, and blur-to-focus entry
- One-time liquidity count-up
- Self-drawing verification check
- Slow ambient data particles
- Restrained magnetic hover on the primary button
- Atom-orbit confirmation before entering the workspace

Keep motion slow and premium. No constant spinning, flashing, rapid parallax, or aggressive camera movement. Under `prefers-reduced-motion`, replace spatial motion with brief opacity transitions.

## Authenticated application architecture

After login, transition into a purpose-built treasury operating workspace. Preserve all working API-backed behaviors from the existing application.

Navigation:

- Command
- Liquidity
- Forecasting
- Cash & Banking
- FX & Risk
- Funding
- Policies
- Approvals
- Evidence
- Assistant

Top bar:

- Entity selector
- Reporting currency
- Data freshness
- Global search
- Notifications
- User menu
- `Ask Atom` action

## Command page

Heading: `Good morning, Nadia.`

Summary: `Your liquidity position is stable. Two decisions need review.`

Primary metrics:

- Available liquidity: `AED 2.46B`
- 30-day forecast variance: `3.1%`
- Net FX exposure: `AED 186.4M`
- Actions awaiting approval: `2`
- Data freshness: `24 seconds`

Create a decision-first 30-day liquidity forecast showing base case, downside case, minimum liquidity buffer, material inflows/outflows, and explainable event annotations.

Primary decision:

- Question: `Should Thursday’s EMEA funding be moved forward?`
- Recommendation: `Move AED 42M one day earlier.`
- Effect: `Reduce the projected liquidity gap by AED 3.2M and keep the entity above its minimum buffer.`
- Controls: scope secured, evidence resolved at 94%, policy checks passed, maker-checker approval required
- Actions: `Review evidence`, `Approve recommendation`, `Request changes`

## Atom Assistant

Inside the authenticated product, reduce the robot to a restrained portrait or presence indicator. The interface and financial evidence must remain primary.

Suggested questions:

- Explain today’s liquidity movement
- Stress-test a 5% AED appreciation
- Show entities below the policy buffer
- Draft the EMEA funding recommendation

Every answer must expose its conclusion, supporting evidence, confidence, policy impact, required approval, timestamp, and source trace. Never imply that money moved unless approval and execution are confirmed.

## Responsive behavior

- Tablet: approximately 60/40 login split, careful robot crop, fewer cards
- Mobile: form first, compact robot portrait or metallic Atom orb, one insight card, full-width controls
- Minimum touch target: 44px
- Support 360px through 1920px
- Keep security, recovery, and validation actions visible at all sizes

## Product and accessibility requirements

- WCAG 2.2 AA contrast
- Visible keyboard focus
- Semantic labels and screen-reader-friendly validation
- Text alternatives and summaries for charts
- RTL-ready layout for future Arabic support
- Realistic treasury content; no lorem ipsum
- Clear loading, empty, stale-data, error, permission-denied, and success states
- Every financial number must be traceable
- Every AI conclusion must expose evidence
- Every external action must remain behind explicit human approval
- Use progressive disclosure for advanced details

## Engineering constraints

- Keep the current React/TypeScript/Vite architecture
- Reuse existing types, hooks, API calls, and live treasury events
- Treat the entire `server` workspace as read-only
- Preserve all existing API contracts and backend behavior
- Prefer reusable components and CSS design tokens over page-specific duplication
- Use React Three Fiber only where spatial depth materially improves the experience
- Maintain good performance and lazy-load heavy 3D assets
- Provide a graceful static fallback if WebGL is unavailable
- Do not add a new dependency unless it provides clear value and cannot be achieved with the installed stack
- Do not modify or remove working backend functionality
- Do not hard-code the entire product into one component
- Do not expose secrets or real financial credentials

## Acceptance criteria

Deliver a working responsive application containing:

1. Treasury Atom logo and favicon treatment
2. Desktop, tablet, and mobile login layouts
3. Complete login interaction states
4. Cinematic but restrained robot motion
5. Authenticated application shell
6. Command dashboard using live or existing seeded application data
7. Atom Assistant with evidence-aware response cards
8. Approval and evidence workflow
9. Reusable design tokens and components
10. Reduced-motion and no-WebGL fallbacks

The final result should feel cinematic at entry, disciplined during daily treasury work, and trustworthy at every financial decision.

## Dedicated humanoid generation prompt

Photorealistic premium humanoid treasury AI assistant, chest-up composition, brushed titanium and satin silver shell, precise mechanical seams, realistic optical glass eyes with subtle mint-white illumination, calm intelligent expression, positioned inside a dark architectural enterprise treasury command room, cinematic soft side lighting, physically accurate metallic reflections, volumetric atmosphere, generous negative space for finance interface cards. The assistant begins looking slightly away from camera, breathes almost imperceptibly, blinks naturally once, then slowly turns its face eight degrees toward the login interface as if acknowledging the user. Its eyes refocus softly on the active form. Three translucent financial intelligence cards appear sequentially in surrounding depth with restrained blur-to-focus transitions. Movement is extremely smooth, slow, minimal, and trustworthy. Locked camera, no zoom, no speech, no lip movement, no neon cyberpunk environment, no cartoon styling, no weaponry, no uncanny smile, no exaggerated anatomy, no visible brand marks, and no text deformation. Seamless 6–8 second loop, enterprise cinematic quality, realistic global illumination, 16:9.

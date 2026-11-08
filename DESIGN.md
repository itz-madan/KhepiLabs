# KhepiLabs Design Direction

## Design Read

KhepiLabs is an independent Android app and game discovery directory. The interface should help visitors scan a catalogue, compare listing details, and reach publisher-provided download sources without implying that KhepiLabs has verified or guaranteed third-party software.

The visual identity uses a dark, quiet canvas with a mint signal colour. Its geometric mark is a compact brand signature, not a reason to add decorative shapes throughout the interface. Public information pages use an editorial reading layout; the catalogue remains the primary product surface. The admin area is an operational workspace and follows the same restrained surface and icon principles.

## Dials

- ENERGY: 2 / 5. Calm, useful, and focused on discovery.
- RHYTHM: 3 / 5. Catalogue browsing is dense; editorial and policy pages use a slower reading rhythm with varied section widths.
- MOTION: 1 / 5. Motion is limited to state changes and the detail-panel transition. No decorative looping animation.

## Palette

Values are taken from the existing KhepiLabs root tokens and mark, then used consistently:

- Background: `#090d12`
- Main surface: `#111820`
- Secondary surface: `#151f28`
- Primary text: `#f4f5f7`
- Muted text: `#8e9aa6`
- Mint accent: `#a7f0d0`
- Mint interaction accent: `#5bd7ad`
- Borders: `rgba(205,224,237,.12)`

Mint is reserved for the brand mark, focus indication, key links, and selected states. It is not a universal fill for every card or icon. Light mode keeps neutral paper surfaces and the green accent.

## Typography

- Manrope is the primary interface and heading face.
- DM Mono is reserved for compact metadata and technical labels.
- Long-form page copy uses readable sentence case and a restrained line length.
- Avoid decorative all-caps labels where a plain heading is clearer.

## Layout and Surfaces

- The app catalogue prioritises name, icon, version, category, and available source details.
- Public information pages use an editorial hero, content-led sections, and a compact contact action. Policy pages prioritise readable text over decorative artwork.
- The footer has three purposeful areas: brand context, catalogue navigation, and support. Legal links sit in a compact secondary row rather than a fourth equal column.
- Cards use solid surfaces and restrained borders. Backdrop blur is reserved for the app detail overlay and admin modal backdrop only.
- The public site and admin area retain distinct density appropriate to their tasks without inventing separate brand identities.

## Iconography

Lucide icons are retained only for actions and concepts with a clear label: navigation, contact, downloads, category browsing, database/storage, and editing. The consistent stroke family supports functional recognition. Do not use sparkle, star, shield, or lightning icons as decoration or as unsupported safety/performance signals. If a concept is already clear from text, omit the icon.

## Copy and Claims

Describe what the interface actually displays. Publisher, version, release notes, and download-source details may appear when supplied by a listing owner. Do not describe downloads as safe, secure, verified, or always current unless a documented process supports the exact claim.

## Responsive Behaviour

- Footer columns collapse to two and then one as width requires.
- Public page heroes stack on narrow screens.
- Editorial content moves from a two-column reading layout to one column.
- Keep keyboard focus visible and preserve native link and button semantics.

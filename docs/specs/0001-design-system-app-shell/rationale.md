# 0001. Design system and app shell: reasoning

Decision record for [index.md](index.md). Nothing here is needed to build.

## Context

Roam is one Expo app with one guest facing surface, but today it carries the Expo template's visual layer: a four color theme, a text component with its own sizes, two demo screens and two png tab icons. Six planned features add real screens on top of that, and every one of them would otherwise decide its own colors, sizes and corners. The design sheet in `prompts/prompt-imgs/design.png` already fixes those values, the screen images show them in use, and Plus Jakarta Sans sits unused in `prompts/fonts/`. The cost of not deciding is the familiar one: four screens in, the app has four shades of gray and three button heights, and restyling means editing every screen.

The constraints that shape this decision are the installed stack and the review budget. The app runs Expo SDK 58 with React Native 0.88, React 19.3 and the React Compiler on, and it has no test runner, so every check is lint, type check and a screenshot. There is one designer supplied artefact (the sheet) and no dark design, no logo file and no brand guideline, which means some values will be read off images and must stay visibly marked as estimates. The tab bar on the sheet is a floating translucent pill with a yellow active circle, which no native tab bar can draw.

> ⚠️ Premise note: the sheet names its typeface "Geometric Sans", and the repository only ships Plus Jakarta Sans. This spec treats Plus Jakarta Sans as the brand face and maps the sheet's five styles onto it, since it is a geometric sans in the same weight range. If the real brand face differs, the type tokens change in one file and no component changes. Dark mode, the logo asset and the app icon are out of scope here and tracked as follow-ups; the sheet shows light only, so building a dark palette now would be invention rather than design.

## Options considered

### Option 1: TypeScript tokens with plain StyleSheet and a component library

One `src/theme/` module holds every named value as a typed constant, components read those constants and style themselves with `StyleSheet.create`, and a small library in `src/components/ui/` wraps the repeated shapes from the sheet.

**Pros**:
- Nothing new to learn or debug: it is the styling React Native already ships, and the React Compiler and reanimated both understand it.
- Tokens are plain objects, so values can be read in JavaScript where a style prop will not do (glass tint, navigator theme, icon tint).
- No version risk on SDK 58, works in Expo Go, no build step.

**Cons**:
- Class style utility composition is not available, so a component's variants live in a switch or a style map, which is more code than a `className` string.
- Every new screen must import tokens rather than typing a value, and discipline is the only thing enforcing it (no lint rule out of the box).

### Option 2: NativeWind (Tailwind classes in React Native)

Install NativeWind, a Tailwind config holding the palette, a Babel preset and a Metro wrapper, and style components with class names.

**Pros**:
- The team writes the same utility vocabulary as on the web, and the Tailwind config is a single place for the palette.
- Fast iteration: class changes hot reload without naming a style.

**Cons**:
- NativeWind 4.2.7 documents Expo 57 as its supported target and NativeWind 5 is a release candidate tested on Expo 57.0.22 and React Native 0.86; this app is SDK 58 on React Native 0.88, so the styling layer under every screen is unverified.
- It adds a build step and a second styling model to a project with one screen author, and some props (glass tint, navigator theme) still need plain JS values.
- Custom fonts and the React Compiler are both extra configuration surface.

### Option 3: A third party React Native UI kit (Tamagui, gluestack or similar)

Adopt a kit that brings components, theming and a compiler, then restyle its parts to the sheet.

**Pros**:
- Many components arrive already written (inputs, sheets, menus) with accessibility handled.
- Theming and variants are a first class feature of the kit.

**Cons**:
- The sheet's shapes are specific (pill buttons at 56 height, floating glass bar, purple policy cards); matching them means overriding most kit defaults.
- A large dependency with its own compiler and upgrade cycle, against the project rule to prefer Expo modules, for components that are mostly one screen of styled views each.

### Option 4: Keep the template theme and style each screen as it lands

Leave `src/constants/theme.ts` and `ThemedText` in place and give each new screen its own styles.

**Pros**:
- Zero up front work; the first screen ships fastest.
- No new files to learn.

**Cons**:
- Every screen decides the palette again, and the template's colors (`#000000` text, `#F0F0F3` surfaces) do not match the sheet at all.
- Restyling later touches every screen and every component; the cost arrives with interest.

## Rationale

The decisive force is that the styling layer is unverified on SDK 58 while it sits under every later screen. NativeWind's own documentation stops at Expo 57 for the stable release and at Expo 57.0.22 for the release candidate, and this project is already on 58; if the wrapper breaks, six features are blocked on a styling tool. Option 1 asks nothing of the runtime that SDK 58 does not already ship, and the sheet is a fixed system of named values, which is exactly what a typed token object expresses. The design also needs token values outside style props (the glass tint, the navigation theme, icon colors), where a plain object is simpler than resolving a class into a style.

The component library is deliberately small and the tab bar is custom because the sheet's floating pill with a yellow active circle cannot be produced by the native tab bars. The headless `expo-router/ui` components were the other candidate for the same job and lost because they are still marked experimental in SDK 58, while the JavaScript tabs ship a stable navigator whose custom `tabBar` is a documented prop. That choice has a real cost: the app owns its bottom inset, its keyboard behaviour and the shadow on the glass, and it pays once in a `Screen` frame and one bar component instead of in every screen. Everything that could be bought cheaply was bought: icons come from `@expo/vector-icons` rather than traced SVGs, glass comes from `expo-glass-effect` rather than a blur library, and fonts load through `expo-font` at runtime so the project keeps working in Expo Go without a prebuild.

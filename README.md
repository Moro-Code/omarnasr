# Omar Nasr — personal portfolio

Resume-based portfolio at [omarnasr.ca](https://omarnasr.ca), built with Next.js and React. Includes selected engineering work, a complete career timeline, skills, education, and contact links.

## Development

Use Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

## Validation

```sh
npm run lint
npm test
npm run build
npm run build-storybook
```

`npm run format` applies Prettier. `npm run storybook` starts the component explorer at port 6006. `npm start` serves the production build at port 3000.

## Editing content

Career history, selected work, and skill groups are in `pages/index.js`. Styling lives in `styles/Home.module.css` and `styles/globals.css`. The original resume PDF and its phone number are not published.

## Deployment

The existing Next.js deployment can continue using `npm run build`. Configure the hosting runtime to use Node.js 22 or newer. The portfolio does not require environment variables. The optional live workout feed requires server-only configuration and an Apple Health export from your phone; see [WORKOUT_SETUP.md](WORKOUT_SETUP.md). No external font services are required. The Pages Router is retained; Storybook uses the current Next.js Vite integration.

## Interactive playground

The hero’s Build / Secure / Scale controls explain engineering principles without auto-playing animation. The Resilience Lab in `components/PlatformLab.js` lets visitors change traffic, replicas, caching, and a single-server failure. It is an explicitly illustrative local simulation, not live infrastructure or a performance benchmark. Nothing is sent to a server or persisted.

The deterministic model is in `lib/platform-lab.mjs`; `npm test` covers it alongside the existing workout ingestion and privacy tests. New components have interactive Storybook stories. Controls support keyboard input, reduced motion, and mobile layouts. The existing Career Quest and workout integration remain separate and unchanged.

## Section navigation

The shared directory in `lib/site-navigation.mjs` keeps header links in page order, including the Toolkit and Career Quest. `components/SiteNavigation.js` highlights the section at the reading line without changing the URL or announcing each scroll. On smaller screens the same links become a numbered directory; Escape restores the Menu button, focus or pointer navigation outside closes it, and selecting a destination focuses its heading. Native hash links preserve browser history and reduced-motion behavior. A no-JavaScript fallback keeps the mobile directory visible.

`npm test` covers the section registry, tall and short sections, boundaries, and the bottom-of-page case. The existing workout integration, personal content, and interactive labs remain independent.

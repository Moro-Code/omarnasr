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
npm run build
npm run build-storybook
```

`npm run format` applies Prettier. `npm run storybook` starts the component explorer at port 6006. `npm start` serves the production build at port 3000.

## Editing content

Career history, selected work, and skill groups are in `pages/index.js`. Styling lives in `styles/Home.module.css` and `styles/globals.css`. The original resume PDF and its phone number are not published.

## Deployment

The existing Next.js deployment can continue using `npm run build`. Configure the hosting runtime to use Node.js 22 or newer. The portfolio does not require environment variables. The optional live workout feed requires server-only configuration and an Apple Health export from your phone; see [WORKOUT_SETUP.md](WORKOUT_SETUP.md). No external font services are required. The Pages Router is retained; Storybook uses the current Next.js Vite integration.

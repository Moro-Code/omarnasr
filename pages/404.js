import Head from "next/head";
import SiteNavigation from "../components/SiteNavigation";
import SiteFooter from "../components/SiteFooter";
import styles from "../styles/Home.module.css";

export default function NotFound() {
  return (
    <>
      <Head>
        <title>Page not found — Omar Nasr</title>
        <meta
          name="description"
          content="This page is not on Omar Nasr’s portfolio."
        />
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0c141b" />
      </Head>
      <a className={styles.skipLink} href="#main">
        Skip to content
      </a>
      <SiteNavigation atHome={false} />
      <main id="main" className={styles.container} tabIndex={-1}>
        <section
          className={styles.notFound}
          aria-labelledby="not-found-heading"
        >
          <p className={styles.eyebrow}>
            <span className={styles.dot} /> 404
          </p>
          <h1 id="not-found-heading">This page isn’t here.</h1>
          <p className={styles.heroDescription}>
            The address may be out of date. The rest of the site is unchanged.
          </p>
          <a className={styles.primaryButton} href="/">
            Back to the homepage
          </a>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

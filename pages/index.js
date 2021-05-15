import Head from "next/head";
import PageImage from "../components/molecules/PageImage";
import DarkModeToggle from "react-dark-mode-toggle";
import { useState } from "react";
import styles from "../styles/Home.module.css";
import Icon from "../components/atoms/Icon";

export default function Home() {
  const [isDarkMode, setDarkMode] = useState(false);
  const onThemeChange = () => {
    if (!isDarkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      setDarkMode(true);
    } else {
      document.documentElement.removeAttribute("data-theme");
      setDarkMode(false);
    }
  };
  return (
    <>
      <Head>
        <title>Omar Nasr</title>
        <meta name="description" content="Omar Nasr's website" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/images/logo.png" />
      </Head>
      <header>
        <PageImage
          image={"/images/profile.png"}
          altText={"vercel"}
          width={250}
          height={250}
        />
      </header>
      <main className={`layout-container ${styles.mainContainer}`}>
        <div className={styles.toggleContainer}>
          <DarkModeToggle
            size={80}
            onChange={onThemeChange}
            checked={isDarkMode}
          />
        </div>
        <h1>Welcome to my site !</h1>
        <p className={styles.textBody}>
          I've decided to move off of Ghost CMS and onto using Next JS with
          Hashnode for the blog! As you can see it's still very much under
          construction but check back often as I'm actively working on it. In
          the meantime checkout my blog and socials !
        </p>
      </main>

      <footer className={`layout-container ${styles.footerContainer}`}>
        <a href="https://blog.omarnasr.ca" className={styles.footerLinkItem}>
          <Icon icon="icon-quill" className={styles.footerLinkIcon} />
          The Blog
        </a>
        <a
          href="https://github.com/Moro-Code"
          className={styles.footerLinkItem}
        >
          <Icon icon="icon-github" className={styles.footerLinkIcon} />
          Github
        </a>
        <a
          href="https://twitter.com/thenextmusk"
          className={styles.footerLinkItem}
        >
          <Icon icon="icon-twitter" className={styles.footerLinkIcon} />
          Twitter
        </a>
        <a
          href="https://www.linkedin.com/in/ott-omar-nasr/"
          className={styles.footerLinkItem}
        >
          <Icon icon="icon-linkedin" className={styles.footerLinkIcon} />
          LinkedIn
        </a>
        <a
          href="https://blog.omarnasr.ca/rss.xml"
          className={styles.footerLinkItem}
        >
          <Icon icon="icon-rss" className={styles.footerLinkIcon} />
          RSS
        </a>
        <a
          href="https://www.instagram.com/thenextmusk/"
          className={styles.footerLinkItem}
        >
          <Icon icon="icon-instagram" className={styles.footerLinkIcon} />
          Instagram
        </a>
      </footer>
    </>
  );
}

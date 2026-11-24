import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_ORIGIN, SITE_URL } from "./lib/site.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const modernPolyfill = "./lib/modern-polyfill.js";
const modernPolyfillAbsolute = path.join(root, "lib/modern-polyfill.js");

// Hosts that should not serve the site. Preview URLs stay reachable.
export const REDIRECT_HOSTS = ["omarnasr.ca", "omarnasr.vercel.app"];

export function hostRedirects() {
  return REDIRECT_HOSTS.flatMap((host) => {
    const has = [{ type: "host", value: host }];
    return [
      {
        source: "/",
        has,
        destination: SITE_URL,
        permanent: true,
      },
      {
        source: "/:path*",
        has,
        destination: `${SITE_ORIGIN}/:path*`,
        permanent: true,
      },
    ];
  });
}

export function contentSecurityPolicy(nodeEnv = process.env.NODE_ENV) {
  if (nodeEnv === "production") {
    return [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'none'",
      "script-src 'self'",
      "script-src-attr 'none'",
      "style-src 'self'",
      "style-src-attr 'none'",
      "img-src 'self'",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-src 'none'",
      "worker-src 'none'",
      "manifest-src 'self'",
    ].join("; ");
  }
  // next dev needs eval, inline boot scripts, and the HMR websocket.
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' ws: wss:",
    "frame-src 'self'",
  ].join("; ");
}

export function documentHeaders(nodeEnv = process.env.NODE_ENV) {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(nodeEnv) },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    {
      key: "Permissions-Policy",
      value: [
        "accelerometer=()",
        "camera=()",
        "display-capture=()",
        "geolocation=()",
        "gyroscope=()",
        "magnetometer=()",
        "microphone=()",
        "payment=()",
        "usb=()",
        "browsing-topics=()",
        "interest-cohort=()",
      ].join(", "),
    },
  ];
}

const polyfillAliases = {
  "../build/polyfills/polyfill-module": modernPolyfill,
  "../build/polyfills/polyfill-module.js": modernPolyfill,
  "next/dist/build/polyfills/polyfill-module": modernPolyfill,
  "next/dist/build/polyfills/polyfill-module.js": modernPolyfill,
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async redirects() {
    return hostRedirects();
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: documentHeaders(),
      },
    ];
  },
  turbopack: {
    resolveAlias: polyfillAliases,
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "../build/polyfills/polyfill-module": modernPolyfillAbsolute,
      "../build/polyfills/polyfill-module.js": modernPolyfillAbsolute,
      "next/dist/build/polyfills/polyfill-module": modernPolyfillAbsolute,
      "next/dist/build/polyfills/polyfill-module.js": modernPolyfillAbsolute,
    };
    return config;
  },
};

export default nextConfig;

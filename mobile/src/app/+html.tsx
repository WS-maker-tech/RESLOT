import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        <title>Reslot</title>

        {/* Favicons */}
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon.png" />

        {/* Apple touch icons */}
        <link rel="apple-touch-icon" sizes="57x57" href="/assets/logo/icon-57.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/assets/logo/icon-72.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/assets/logo/icon-76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/assets/logo/icon-114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/assets/logo/icon-120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/assets/logo/icon-144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/assets/logo/icon-152.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/assets/logo/icon-167.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/assets/logo/icon-180.png" />

        {/* PWA / Android */}
        <link rel="icon" type="image/png" sizes="192x192" href="/assets/logo/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/assets/logo/icon-512.png" />

        {/* Meta */}
        <meta name="description" content="Din genväg till fullbokade restauranger." />
        <meta name="theme-color" content="#FAFAF8" />
        <meta name="application-name" content="Reslot" />
        <meta name="apple-mobile-web-app-title" content="Reslot" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* Open Graph (länkförhandsvisning) */}
        <meta property="og:title" content="Reslot" />
        <meta property="og:description" content="Din genväg till fullbokade restauranger." />
        <meta property="og:image" content="/assets/logo/icon-512.png" />
        <meta property="og:type" content="website" />

        {/* Twitter/X card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Reslot" />
        <meta name="twitter:description" content="Din genväg till fullbokade restauranger." />
        <meta name="twitter:image" content="/assets/logo/icon-512.png" />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}`;

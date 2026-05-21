// Runtime-injectar paper-bg.css på web. Expo Router 5 strippar custom <link>-
// tags från +html.tsx HEAD, så build-time injection funkar inte. Den här
// side-effect-modulen körs när bundlen mountas och lägger till länken via DOM.

import { Platform } from 'react-native';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const HREF = '/paper-bg.css';
  const exists = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]'))
    .some((l) => (l as HTMLLinkElement).href.endsWith(HREF));
  if (!exists) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = HREF;
    document.head.appendChild(link);
  }
}

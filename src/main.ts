// Pixel-perfect Winamp clone in the browser, powered by the canonical
// `webamp` library (https://github.com/captbaritone/webamp). That library
// is the de-facto faithful HTML5 reimplementation of Winamp 2.x — every
// sprite offset, control behavior and keyboard shortcut matches the
// original. Our job here is just to wire it up.
import Webamp from 'webamp';
import './styles.css';

const BASE = import.meta.env.BASE_URL;

const container = document.getElementById('webamp');
if (!container) {
  throw new Error('Missing #webamp container in index.html');
}

if (!Webamp.browserIsSupported()) {
  container.innerHTML =
    '<div style="color:#fff;font-family:Arial;text-align:center;padding:40px;">' +
    'Sorry — this browser does not support the features Winamp needs to run.' +
    '</div>';
} else {
  // Layout: main window on top, equalizer right below it, playlist below
  // that — the classic vertical stack you get when Winamp first launches
  // and the user has clicked "snap" on every window.
  const webamp = new Webamp({
    initialTracks: [
      {
        url: `${BASE}audio/llama.mp3`,
        defaultName: "It really whips the llama's ass!",
        metaData: {
          artist: 'DJ Mike Llama',
          title: "Llama Whippin' Intro",
        },
        duration: 5,
      },
    ],
    enableHotkeys: true,
    enableMediaSession: true,
    enableDoubleSizeMode: true,
    windowLayout: {
      main:      { position: { top:   0, left: 0 } },
      equalizer: { position: { top: 232, left: 0 } },
      playlist:  { position: { top: 464, left: 0 }, size: { extraHeight: 4, extraWidth: 4 } },
    },
  });

  // Render Webamp into our container; the promise resolves when the user
  // closes Webamp via the X button.
  webamp.renderWhenReady(container).catch((err) => {
    console.error('Failed to render Webamp:', err);
  });

  // Hide the closeable Winamp from being closed away — restore it if the
  // user accidentally closes the main window. (Keeps the demo always-on.)
  webamp.onClose((cancel) => {
    cancel();
  });
}

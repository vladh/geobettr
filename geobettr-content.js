/*
  Copyright 2020 Vlad-Stefan Harbuz <vlad@vladh.net>.
  Distributed under the MIT License. (https://opensource.org/licenses/MIT)
*/

(function() {
  var state = {
    game: null,
    geocoder: null,
  };

  function getCountryForLatLng(pos, done) {
    state.geocoder.geocode({'location': pos}, (results, status) => {
      if (status != 'OK') {
        return done(status);
      }
      done(null, results);
    });
  }

  function updateForNewGame() {
    console.log('guesses', state.game.player.guesses);
    console.log('rounds', state.game.rounds);
    const pos = {lat: state.game.rounds[0].lat, lng: state.game.rounds[0].lng};
    getCountryForLatLng(pos, (err, res) => {
      if (err) {
        console.error(
          '[geobettr-content#updateForNewGame] Error getting country.', err, res
        );
        return;
      }
      console.log(res);
    });
  }

  function processMessage(message) {
    if (!message.game.bounds) {
      console.error('[geobettr-content#processMessage] Got non-game-like object', message);
    }
    state.game = message.game;
    updateForNewGame();
  }

  function addMessageListener() {
    browser.runtime.onMessage.addListener(processMessage);
  }

  function tryToLoadGame() {
    try {
      state.game = __NEXT_DATA__.props.pageProps.game;
      updateForNewGame();
    } catch (e) {
      // All good, we'll get it later.
    }
  }

  function ensureGoogleMaps() {
    if (typeof window.wrappedJSObject.google == 'undefined') {
      console.error('[geobettr-content#setup] No `window.google` object, cannot continue.');
      return false;
    }
    return true;
  }

  function setupGeocoder(receiveGeocodeResult) {
    exportFunction(receiveGeocodeResult, window, {defineAs: 'receiveGeocodeResult'});
  }

  function runGeocoder(pos) {
    /*
    NOTE: This is super janky. Like, really janky. The problem is that our script runs in a
    content script context, and the Google Maps API exists in a page script context. Normally,
    code from one doesn't have permission to call the other. We can get around this somewhat
    by using `window.wrappedJSObject`, but it turns out this does not fully work in calling
    `(new Geocoder()).geocode()`, as there is some object permissions problem. This solution
    executes everything in the page script context. It's a bit of a hack, but it works okay.
    */
    window.wrappedJSObject.eval(`
      (new window.google.maps.Geocoder()).geocode(
        {'location': ${JSON.stringify(pos)}},
        receiveGeocodeResult
      );
    `);
  }

  function setup() {
    function receiveGeocodeResult(results, status) {
      console.log(state);
      console.log(results, status);
    }
    setupGeocoder(receiveGeocodeResult);
    runGeocoder({lat: 10, lng: 10});

    return;

    if (!ensureGoogleMaps()) {
      return;
    }
    console.log('[geobettr-content#setup] Starting.');
    setupGeocoder();
    console.log('[geobettr-content#setup] Set up geocoder.');
    addMessageListener();
    console.log('[geobettr-content#setup] Set up message listener.');
    tryToLoadGame();
    console.log('[geobettr-content#setup] Tried to load game.');
  }

  setup();
})();

/*
  Copyright 2020 Vlad-Stefan Harbuz <vlad@vladh.net>.
  Distributed under the MIT License. (https://opensource.org/licenses/MIT)
*/

(function() {
  var state = {
    game: null,
  };

  function updateForNewGame() {
    console.log('guesses', state.game.player.guesses);
    console.log('rounds', state.game.rounds);
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

  function setup() {
    addMessageListener();
    tryToLoadGame();
  }

  setup();
})();

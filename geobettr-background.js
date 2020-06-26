/*
  Copyright 2020 Vlad-Stefan Harbuz <vlad@vladh.net>.
  Distributed under the MIT License. (https://opensource.org/licenses/MIT)
*/

(function() {
  const TARGET_URL = 'https://www.geoguessr.com/api/*';

  function sendMessageToContent(message) {
    browser.tabs.query({
      currentWindow: true,
      active: true
    }).then((tabs) => {
      for (const tab of tabs) {
        browser.tabs.sendMessage(tab.id, message);
      }
    }).catch((err) => {
      console.error(err);
    });
  }

  function isRequestGuess(responseDetails) {
    return responseDetails.method == 'POST' &&
      responseDetails.url.startsWith('https://www.geoguessr.com/api/v3/games/');
  }

  function passResponseIfNeeded(responseDetails) {
    console.log('[geobettr-background,#passResponseIfNeeded]', responseDetails);
    if (isRequestGuess(responseDetails)) {
      sendMessageToContent({response: responseDetails});
    }
  }

  function listenForRequest(details) {
    const filter = browser.webRequest.filterResponseData(details.requestId);
    const decoder = new TextDecoder('utf-8');
    const encoder = new TextEncoder();

    filter.ondata = event => {
      const body = decoder.decode(event.data, {stream: true});

      if (isRequestGuess(details)) {
        try {
          const game = JSON.parse(body);
          sendMessageToContent({game: game});
        } catch (e) {
          console.error('[geobettr-background#listenForRequest] Could not parse JSON.', body);
        }
      }

      filter.write(encoder.encode(body));
      filter.disconnect();
    }

    return {};
  }

  function addRequestListener() {
    const filters = {urls: [TARGET_URL]};
    browser.webRequest.onBeforeRequest.addListener(
      listenForRequest, filters, ['blocking']
    );
    console.log('[geobettr-background#addRequestListener] Added listener.');
  }

  function setup() {
    addRequestListener();
  }

  setup();
})();

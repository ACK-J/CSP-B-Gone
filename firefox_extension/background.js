// Constants
const CACHE_KEY = 'cspData';
const LAST_FETCH_KEY = 'lastFetchTimestamp';
const CACHE_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Clear all data in local storage on extension load (first time or refresh)
async function clearLocalStorage() {
  try {
    // Clear all data in local storage
    await browser.storage.local.clear();
    console.log('Local storage cleared.');
  } catch (error) {
    console.error('Error clearing local storage:', error);
  }
}

// Fetch and store the CSP TSV data in local storage, only if it's older than 24 hours
async function fetchAndStoreTSVData() {
  // Get stored data and the last fetch timestamp
  const storedData = await browser.storage.local.get([CACHE_KEY, LAST_FETCH_KEY]);
  const currentTime = Date.now();
  
  // If the data exists and was fetched recently (within 24 hours), don't refetch it
  if (storedData[CACHE_KEY] && (currentTime - storedData[LAST_FETCH_KEY] < CACHE_EXPIRATION_TIME)) {
    console.log('Using cached CSP data.');
    return; // Data is still valid, no need to fetch again
  }

  try {
    // Fetch the TSV file from GitHub
    const response = await fetch('https://api.github.com/repos/ACK-J/CSP-B-Gone/contents/data.tsv?ref=main', {
      headers: { 'Accept': 'application/vnd.github.v3.raw' }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch CSP data');
    }

    const tsvData = await response.text();

    // Store the TSV data and update the last fetch timestamp
    await browser.storage.local.set({
      [CACHE_KEY]: tsvData,
      [LAST_FETCH_KEY]: currentTime
    });

    console.log('CSP data fetched and stored successfully.');
    
  } catch (error) {
    console.error('Error fetching and storing TSV data:', error);
  }
}

// First listener to check for the CSP header in response headers
browser.webRequest.onHeadersReceived.addListener(
  function(details) {
    const cspHeader = details.responseHeaders.find(header => header.name.toLowerCase() === 'content-security-policy');
    
    if (cspHeader && details.tabId !== -1) {
      const url = new URL(details.url);
      const domain = url.hostname;
      
      // Store the CSP header
      browser.storage.local.set({ [domain]: cspHeader.value });
      
      // Update the badge
      browser.browserAction.setBadgeText({ tabId: details.tabId, text: 'H' });
      browser.browserAction.setBadgeBackgroundColor({ tabId: details.tabId, color: [0, 255, 0, 255] });
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

// Second listener to check for the CSP meta tag in the response HTML
browser.webRequest.onCompleted.addListener(
  function(details) {
    if ((details.type === "main_frame" || details.type === "sub_frame") && details.tabId !== -1) {
      fetch(details.url)
        .then(response => response.text())
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          const metaTag = doc.querySelector('meta[http-equiv="Content-Security-Policy"]');

          if (metaTag && metaTag.content) {
            const url = new URL(details.url);
            const domain = url.hostname;

            // Store the CSP from the meta tag
            browser.storage.local.set({ [domain]: metaTag.content });

            // Update the badge
            browser.browserAction.setBadgeText({ tabId: details.tabId, text: 'M' });
            browser.browserAction.setBadgeBackgroundColor({ tabId: details.tabId, color: [255, 165, 0, 255] });  // Orange for Meta Tag
          }
        })
        .catch(error => console.error("Failed to fetch the HTML for CSP meta tag:", error));
    }
  },
  { urls: ["<all_urls>"] }
);

// First initialize the extension: Clear local storage and fetch/store data
clearLocalStorage().then(() => {
  // Fetch and store the TSV data when the extension is loaded or refreshed
  fetchAndStoreTSVData();
});

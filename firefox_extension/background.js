// First listener to check for the CSP header in response headers
browser.webRequest.onHeadersReceived.addListener(
  function(details) {
    // Find the CSP header in the response
    const cspHeader = details.responseHeaders.find(header => header.name.toLowerCase() === 'content-security-policy');

    // If a CSP header is found, store it using the domain as the key
    if (cspHeader && details.tabId !== -1) {  // Ensure tabId is valid
      const url = new URL(details.url); // Create a URL object to extract the domain
      const domain = url.hostname; // Extract the domain

      // Store the CSP header and the source as 'H' for the domain
      browser.storage.local.set({ [domain]: cspHeader.value });

      // Update the badge to show "H" (Header) for this tab
      browser.browserAction.setBadgeText({ tabId: details.tabId, text: 'H' });
      browser.browserAction.setBadgeBackgroundColor({ tabId: details.tabId, color: [0, 255, 0, 255] });  // Green for Header
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

// Second listener to check for the CSP meta tag in the response HTML
browser.webRequest.onCompleted.addListener(
  function(details) {
    // Only execute if the response is an HTML document and tabId is valid
    if ((details.type === "main_frame" || details.type === "sub_frame") && details.tabId !== -1) {
      fetch(details.url)
        .then(response => response.text())
        .then(html => {
          // Check for a meta tag with the CSP in the HTML
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          const metaTag = doc.querySelector('meta[http-equiv="Content-Security-Policy"]');

          if (metaTag && metaTag.content) {
            const url = new URL(details.url);
            const domain = url.hostname; // Extract the domain

            // Store the CSP from the meta tag and the source as 'M' for the domain
            browser.storage.local.set({ [domain]: metaTag.content });

            // Update the badge to show "M" (Meta Tag) for this tab
            browser.browserAction.setBadgeText({ tabId: details.tabId, text: 'M' });
            browser.browserAction.setBadgeBackgroundColor({ tabId: details.tabId, color: [255, 165, 0, 255] });  // Orange for Meta Tag
          }
        })
        .catch(error => console.error("Failed to fetch the HTML for CSP meta tag:", error));
    }
  },
  { urls: ["<all_urls>"] }
);

// Listen for tab removal and clean up the badge when the tab is closed
browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
  // Loop through all stored domains and clear the badge for this tab
  browser.storage.local.get(null, (storedData) => {
    for (let domain in storedData) {
      if (storedData.hasOwnProperty(domain)) {
        browser.storage.local.remove(domain); // Remove the stored CSP for the domain
      }
    }
  });

  browser.browserAction.setBadgeText({ tabId, text: '' }); // Clear the badge for the closed tab
});


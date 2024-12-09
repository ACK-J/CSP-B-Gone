chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    const cspHeader = details.responseHeaders.find(header => header.name.toLowerCase() === 'content-security-policy');
    if (cspHeader && details.tabId !== -1) {
      const url = new URL(details.url);
      const domain = url.hostname;
      chrome.storage.local.set({ [domain]: cspHeader.value });
      chrome.action.setBadgeText({ tabId: details.tabId, text: 'H' });
      chrome.action.setBadgeBackgroundColor({ tabId: details.tabId, color: '#00FF00' });
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

chrome.webRequest.onCompleted.addListener(
  async (details) => {
    if ((details.type === "main_frame" || details.type === "sub_frame") && details.tabId !== -1) {
      try {
        const response = await fetch(details.url);
        const html = await response.text();
        // Use regex to find meta CSP since DOMParser isn't available in service workers
        const cspMetaMatch = html.match(/<meta[^>]*http-equiv="Content-Security-Policy"[^>]*content="([^"]+)"[^>]*>/i);
        if (cspMetaMatch && cspMetaMatch[1]) {
          const url = new URL(details.url);
          const domain = url.hostname;
          chrome.storage.local.set({ [domain]: cspMetaMatch[1] });
          chrome.action.setBadgeText({ tabId: details.tabId, text: 'M' });
          chrome.action.setBadgeBackgroundColor({ tabId: details.tabId, color: '#FFA500' });
        }
      } catch (error) {
        console.error("Failed to fetch HTML for CSP meta tag:", error);
      }
    }
  },
  { urls: ["<all_urls>"] }
);

chrome.tabs.onRemoved.addListener((tabId) => {
  // Clear badge for the closed tab. We do not necessarily need to remove storage 
  // data since multiple domains can be visited. 
  // If desired, implement domain tracking per tab and remove only those related entries.
  chrome.action.setBadgeText({ tabId, text: '' });
});

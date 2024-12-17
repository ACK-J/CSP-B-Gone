document.addEventListener('DOMContentLoaded', function () {
  let tsvData = [];
  const resultsList = document.getElementById('results');

  const htmlEncode = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  // Parse the TSV data into an array of objects
  const parseTSV = (tsv) => {
    return tsv.trim().split('\n').slice(1).map(line => {
      const [domain, code] = line.split('\t');
      return domain && code ? { domain: domain.trim(), code: code.trim() } : null;
    }).filter(Boolean);
  };

  // Display the search results in the UI
  const displayResults = (data) => {
    resultsList.innerHTML = data.length
      ? data.map(item => `<li><strong>${htmlEncode(item.domain)}</strong><br><br>${htmlEncode(item.code)}</li>`).join('')
      : '<li>No results found</li>';
  };

  // Process a given CSP directive, handling special cases like wildcards
  const processCSPDirective = (cspDirective) => {
    const items = cspDirective.split(' ').flatMap(item => {
      if (item.includes('*')) {
        const cleanItem = item.replace(/https?:\/\//, '').split('*').slice(-2).join('');
        return [cleanItem.startsWith('.') ? cleanItem : '.' + cleanItem];
      }
      return item.includes('.') ? item : [];
    });
    return Array.from(new Set(items)); // Remove duplicates
  };

  // Filter and display the search results based on query items
  const filterAndDisplay = (queryItems) => {
    const results = tsvData.filter(data =>
      queryItems.some(item => data.domain.includes(item) || data.code.includes(item))
    );
    displayResults(results);
  };

  // Apply the search query to the full dataset
  const applySearch = (query) => {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) {
      resultsList.innerHTML = '';  // Clear results when query is empty
      return;
    }

    // If searching for specific CSP directives (e.g., 'script-src', 'default-src')
    if (trimmedQuery.includes('script-src') || trimmedQuery.includes('default-src')) {
      const directive = trimmedQuery.includes('script-src') ? 'script-src' : 'default-src';
      const cspDirective = trimmedQuery.split(directive)[1]?.split(';')[0]?.trim();
      if (cspDirective) {
        const processedItems = processCSPDirective(cspDirective);
        filterAndDisplay(processedItems);  // Filter by directive
        return;
      }
    }

    // Filter data based on query in domain or CSP code
    const results = tsvData.filter(item =>
      item.domain.toLowerCase().includes(trimmedQuery) ||
      item.code.toLowerCase().includes(trimmedQuery)
    );
    displayResults(results);
  };

    // Apply the search bar query to the full dataset
    const applySearchBar = (query) => {
      const trimmedQuery = query.trim().toLowerCase();
      if (!trimmedQuery) {
        resultsList.innerHTML = '';  // Clear results when query is empty
        return;
      }
 
      // Filter data based on query in domain or CSP code
      const results = tsvData.filter(item =>
        item.domain.toLowerCase().includes(trimmedQuery)
      );
      displayResults(results);
    };

  // Initialize the popup and load the data from local storage
  async function initialize() {
    try {
      const storedData = await browser.storage.local.get('cspData');
      if (storedData.cspData) {
        tsvData = parseTSV(storedData.cspData); // Parse and store TSV data
      } else {
        console.error('CSP data is not available.');
      }
    } catch (error) {
      console.error('Error retrieving CSP data:', error);
    }
  }

  initialize().then(() => {
    // Attach event listener to the search bar for live search
    const searchBox = document.getElementById('searchBox');
    searchBox.addEventListener('input', (event) => {
      applySearchBar(event.target.value);
    });

    // Get the active tab and display its CSP
    browser.tabs.query({ active: true, currentWindow: true })
      .then(tabs => {
        const activeTabUrl = tabs[0].url;
        const url = new URL(activeTabUrl);
        const domain = url.hostname;

        // Retrieve the CSP for the domain
        browser.storage.local.get([domain])
          .then(result => {
            const cspContainer = document.getElementById('csp-container');
            if (result[domain]) {
              cspContainer.innerHTML = `<pre>${htmlEncode(result[domain])}</pre>`;
              applySearch(result[domain]);  // Apply search for active tab's CSP
            } else {
              cspContainer.innerHTML = `<p class="no-csp">No CSP found for this domain.</p>`;
            }
          })
          .catch(error => {
            console.error('Error retrieving CSP for the domain:', error);
            const cspContainer = document.getElementById('csp-container');
            cspContainer.innerHTML = `<p class="error">An error occurred while retrieving the CSP.</p>`;
          });
      })
      .catch(error => {
        console.error('Error retrieving active tab:', error);
        const cspContainer = document.getElementById('csp-container');
        cspContainer.innerHTML = `<p class="error">An error occurred while retrieving the active tab.</p>`;
      });
  });
});

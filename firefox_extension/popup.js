document.addEventListener('DOMContentLoaded', function() {

  /**
   * Data variables
   */
  let tsvData = [];
  const resultsList = document.getElementById('results');

  /**
   * Encodes a string to prevent HTML injection.
   * @param {string} str - The string to encode.
   * @returns {string} - The encoded string.
   */
  const htmlEncode = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  /**
   * Parses TSV data into an array of objects.
   * @param {string} tsv - The TSV data as a string.
   * @returns {Array} - An array of parsed objects.
   */
  const parseTSV = (tsv) => {
    return tsv.trim().split('\n').slice(1).map(line => {
      const [domain, code] = line.split('\t');
      return domain && code ? { domain: domain.trim(), code: code.trim() } : null;
    }).filter(Boolean);
  };

  /**
   * Displays the search results in the results list.
   * @param {Array} data - The data to display.
   */
  const displayResults = (data) => {
    resultsList.innerHTML = data.length
      ? data.map(item => `<li><strong>${htmlEncode(item.domain)}</strong><br><br>${htmlEncode(item.code)}</li>`).join('')
      : '<li>No results found</li>';
  };

  /**
   * Processes script-src or default-src directives.
   * @param {string} cspDirective - The CSP directive string.
   * @returns {Array} - An array of processed items.
   */
  const processCSPDirective = (cspDirective) => {
    const items = cspDirective.split(' ').flatMap(item => {
      if (item.includes('*')) {
        const cleanItem = item.replace(/https?:\/\//, '').split('*').slice(-2).join('');
        return [cleanItem.startsWith('.') ? cleanItem : '.' + cleanItem];
      }
      return item.includes('.') ? item : [];
    });
    return Array.from(new Set(items));
  };

  /**
   * Filters the data based on query items and displays the results.
   * @param {Array} queryItems - The items to filter by.
   */
  const filterAndDisplay = (queryItems) => {
    const results = tsvData.filter(data =>
      queryItems.some(item => data.domain.includes(item) || data.code.includes(item))
    );
    displayResults(results);
  };

  /**
   * Applies the search logic based on the query.
   * @param {string} query - The search query.
   */
  const applySearch = (query) => {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) {
      resultsList.innerHTML = '';
      return;
    }

    if (trimmedQuery.includes('script-src') || trimmedQuery.includes('default-src')) {
      const directive = trimmedQuery.includes('script-src') ? 'script-src' : 'default-src';
      const cspDirective = trimmedQuery.split(directive)[1]?.split(';')[0]?.trim();
      if (cspDirective) {
        const processedItems = processCSPDirective(cspDirective);
        filterAndDisplay(processedItems);
        return;
      }
    }

    const results = tsvData.filter(item =>
      item.domain.toLowerCase().includes(trimmedQuery) ||
      item.code.toLowerCase().includes(trimmedQuery)
    );
    displayResults(results);
  };

  /**
   * Initializes the application by fetching data and setting up event listeners.
   */
  async function initialize () {
    try {
      const response = await fetch('https://api.github.com/repos/ACK-J/CSP-B-Gone/contents/data.tsv?ref=main', {
        headers: { 'Accept': 'application/vnd.github.v3.raw' }
      });
      const data = await response.text();
      tsvData = parseTSV(data);  // Ensure this function is accessible
    } catch (error) {
      console.error('Error fetching TSV data:', error);
    }
  };
  
  // Start the application
  initialize().then(() => {
	  // Get the active tab in the current window
	  browser.tabs.query({ active: true, currentWindow: true })
	    .then(tabs => {
	      const activeTabUrl = tabs[0].url; // Get the URL of the active tab

	      // Extract the domain (hostname) from the URL
	      const url = new URL(activeTabUrl);
	      const domain = url.hostname; // Extract the hostname (domain)

	      // Retrieve the CSP for the domain
	      browser.storage.local.get([domain])
		.then(result => {
		  const cspContainer = document.getElementById('csp-container');

		  if (result[domain]) {
		    // If the CSP for the domain is found, display it in the <pre> tag
		    cspContainer.innerHTML = `<pre>${htmlEncode(result[domain])}</pre>`;
		    applySearch(result[domain]);
		  } else {
		    // If no CSP is found for the domain, show a "No CSP found" message
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


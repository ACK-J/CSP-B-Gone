document.addEventListener('DOMContentLoaded', async () => {
  let tsvData = [];
  const resultsList = document.getElementById('results');
  const cspContainer = document.getElementById('csp-container');

  const htmlEncode = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  const parseTSV = (tsv) => {
    return tsv.trim().split('\n').slice(1).map(line => {
      const [domain, code] = line.split('\t');
      return domain && code ? { domain: domain.trim(), code: code.trim() } : null;
    }).filter(Boolean);
  };

  const displayResults = (data) => {
    if (!data.length) {
      resultsList.innerHTML = '<li>No results found</li>';
      return;
    }
    resultsList.innerHTML = data.map(item => 
      `<li><strong>${htmlEncode(item.domain)}</strong><br><br>${htmlEncode(item.code)}</li>`
    ).join('');
  };

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

  const filterAndDisplay = (queryItems) => {
    const results = tsvData.filter(data =>
      queryItems.some(item => data.domain.includes(item) || data.code.includes(item))
    );
    displayResults(results);
  };

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

  async function initialize() {
    try {
      const response = await fetch('https://api.github.com/repos/renniepak/CSPBypass/contents/data.tsv?ref=main', {
        headers: { 'Accept': 'application/vnd.github.v3.raw' }
      });
      const data = await response.text();
      tsvData = parseTSV(data);
    } catch (error) {
      console.error('Error fetching TSV data:', error);
    }
  }

  await initialize();

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTabUrl = tabs[0].url;
    const url = new URL(activeTabUrl);
    const domain = url.hostname;

    chrome.storage.local.get([domain], (result) => {
      if (result[domain]) {
        cspContainer.innerHTML = `<pre>${htmlEncode(result[domain])}</pre>`;
        applySearch(result[domain]);
      } else {
        cspContainer.innerHTML = `<p class="no-csp">No CSP found for this domain.</p>`;
      }
    });
  });
});

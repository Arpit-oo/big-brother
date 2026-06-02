function interceptSearchInput() {
  const searchSelectors = [
    'input[name="q"]', // Google
    'input[name="search_query"]', // YouTube
    'input[name="p"]', // Yahoo
    '#sb_form_q', // Bing
    'input[type="search"]', // Generic
    'textarea[name="q"]', // Google (newer)
  ];

  for (const selector of searchSelectors) {
    const inputs = document.querySelectorAll(selector) as NodeListOf<HTMLInputElement>;
    for (const input of inputs) {
      if (input.dataset.bbMonitored) continue;
      input.dataset.bbMonitored = 'true';

      const handler = () => {
        if (input.value.length > 2) {
          chrome.runtime.sendMessage({
            type: 'search_query',
            query: input.value,
          });
        }
      };

      input.addEventListener('change', handler);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handler();
      });
    }
  }
}

const observer = new MutationObserver(() => interceptSearchInput());
observer.observe(document.body, { childList: true, subtree: true });
interceptSearchInput();

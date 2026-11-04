import { spawn } from 'child_process';

// 1. Get real admin token from backend
const loginRes = await fetch('http://127.0.0.1:8081/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ usernameOrEmail: 'admin@factorygrid.com', password: 'Admin12345678' })
});
const loginData = await loginRes.json();
const adminToken = loginData.accessToken || loginData.data?.accessToken;
console.log('Obtained Admin Token:', !!adminToken);

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const chromeProcess = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9223',
  '--no-sandbox',
  '--disable-gpu',
  '--user-data-dir=' + process.env.TEMP + '\\chrome_ui_profile_' + Date.now(),
  'about:blank'
]);

await new Promise(r => setTimeout(r, 2000));

try {
  const versionRes = await fetch('http://127.0.0.1:9223/json/version');
  const versionData = await versionRes.json();
  console.log('Connected to Chrome DevTools Protocol:', versionData.Browser);

  const newTabRes = await fetch('http://127.0.0.1:9223/json/new?http://localhost:5173', { method: 'PUT' });
  const tabData = await newTabRes.json();
  const wsUrl = tabData.webSocketDebuggerUrl;

  const ws = new WebSocket(wsUrl);

  let messageId = 1;
  const pendingRequests = new Map();

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++messageId;
      pendingRequests.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pendingRequests.has(msg.id)) {
      const { resolve, reject } = pendingRequests.get(msg.id);
      pendingRequests.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  };

  await sendCommand('Runtime.enable');
  await sendCommand('Page.enable');

  // Inject admin token into localStorage
  await sendCommand('Page.navigate', { url: 'http://localhost:5173' });
  await new Promise(r => setTimeout(r, 2500));

  await sendCommand('Runtime.evaluate', {
    expression: `
      localStorage.setItem('fg_auth', 'true');
      localStorage.setItem('fg_auth_token', '${adminToken}');
      localStorage.setItem('fg_role', 'ADMIN');
      localStorage.setItem('fg_auth_user', JSON.stringify(${JSON.stringify(loginData.user)}));
    `
  });

  // Navigate to category-master module
  await sendCommand('Page.navigate', { url: 'http://localhost:5173/admin/category-master' });
  await new Promise(r => setTimeout(r, 3500));

  // Run DOM assertions
  const evalResult = await sendCommand('Runtime.evaluate', {
    returnByValue: true,
    awaitPromise: true,
    expression: `
      (async function() {
        const results = [];

        // Check if browser can fetch attributes directly
        try {
          const testFetch = await fetch('http://localhost:8081/api/v1/catalog/attributes').then(r => r.json());
          results.push({ check: 'Direct Browser API Fetch', count: Array.isArray(testFetch) ? testFetch.length : 0 });
        } catch (e) {
          results.push({ check: 'Direct Browser API Fetch', error: e.message });
        }

        // 1. Switch to Product Types tab
        const buttons = Array.from(document.querySelectorAll('button'));
        const ptTabBtn = buttons.find(b => b.textContent && b.textContent.includes('Product Types'));
        if (!ptTabBtn) {
          return {
            error: 'Product Types tab button not found.',
            bodyText: document.body.innerText,
            allButtons: buttons.map(b => b.textContent)
          };
        }
        ptTabBtn.click();
        await new Promise(r => setTimeout(r, 1000));

        // 2. Check table actions: only View and Edit actions in table rows
        const actionHeaders = Array.from(document.querySelectorAll('th')).map(th => th.textContent.trim());
        const actionButtons = Array.from(document.querySelectorAll('table tbody tr')).map(row => {
          const btns = Array.from(row.querySelectorAll('button')).map(b => b.textContent.trim());
          return btns;
        });
        results.push({
          check: 'Product Type Table Actions',
          sampleRowActions: actionButtons[0] || [],
          hasOnlyViewAndEdit: (actionButtons[0] || []).every(b => b === 'View' || b === 'Edit' || b === '')
        });

        // 3. Open "+ Add Product Type" modal
        const addPtBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Add Product Type'));
        if (!addPtBtn) {
          return { error: 'Add Product Type button not found' };
        }
        addPtBtn.click();
        await new Promise(r => setTimeout(r, 800));

        // Find modal container
        const modal = document.querySelector('[style*="z-index: 1000"]') || document.body;
        const modalText = modal.innerText;

        // 4. Check for absence of the word "Reuse"
        const reuseRegex = /\\breuse\\b/i;
        const hasReuseWord = reuseRegex.test(modalText);
        results.push({
          check: 'Absence of word "Reuse"',
          passed: !hasReuseWord,
          foundReuseMatches: modalText.match(/\\b.{0,20}reuse.{0,20}\\b/gi) || []
        });

        // 5. Check Section B header and label
        const hasAssignedAttributesHeader = modalText.includes('ASSIGNED ATTRIBUTES');
        const hasSelectAttributesLabel = modalText.includes('Select Attributes');
        results.push({
          check: 'UI Wording',
          hasAssignedAttributesHeader,
          hasSelectAttributesLabel
        });

        // 6. Check dropdown options: ONLY display Attribute Name
        const select = modal.querySelector('select');
        const options = select ? Array.from(select.options).map(o => o.text.trim()) : [];
        const nonPlaceholderOptions = options.filter(o => !o.includes('Choose an attribute to assign') && !o.includes('All available active attributes'));
        
        // Inspect options for unwanted metadata (codes with underscores like ATTR_ or data types like TEXT, NUMBER)
        const hasUnwantedMetadata = nonPlaceholderOptions.some(o => /\[.*\]|TEXT|NUMBER|DECIMAL|BOOLEAN/.test(o));
        results.push({
          check: 'Dropdown shows ONLY Attribute Name',
          passed: !hasUnwantedMetadata,
          sampleOptions: nonPlaceholderOptions.slice(0, 5),
          totalAvailableInDropdown: nonPlaceholderOptions.length
        });

        // 7. Check that definition fields (Data Type, Unit of Measure, Remark, Is Filterable, Is Searchable, Is Required) DO NOT exist in form
        const labels = Array.from(modal.querySelectorAll('label')).map(l => l.textContent.trim());
        const hasDataTypeField = labels.some(l => /data\\s*type/i.test(l));
        const hasUomField = labels.some(l => /unit\\s*of\\s*measure/i.test(l));
        const hasRemarkField = labels.some(l => /remark|description.*attribute/i.test(l));
        const hasFilterableToggle = labels.some(l => /filterable/i.test(l));
        const hasSearchableToggle = labels.some(l => /searchable/i.test(l));
        
        results.push({
          check: 'No definition fields inside Product Type form',
          passed: !hasDataTypeField && !hasUomField && !hasRemarkField && !hasFilterableToggle && !hasSearchableToggle,
          fieldsFound: { hasDataTypeField, hasUomField, hasRemarkField, hasFilterableToggle, hasSearchableToggle }
        });

        // 8. Test selecting an attribute
        if (select && select.options.length > 1) {
          const optValue = select.options[1].value;
          const optText = select.options[1].text;
          const nativeSelectValueSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
          nativeSelectValueSetter.call(select, optValue);
          select.dispatchEvent(new Event('change', { bubbles: true }));
          await new Promise(r => setTimeout(r, 600));

          const removeButtons = Array.from(modal.querySelectorAll('button')).filter(b => b.textContent && b.textContent.includes('Remove'));
          results.push({
            check: 'Attribute Selection & Clean List',
            selectedAttributeName: optText,
            assignedCount: removeButtons.length,
            hasRemoveButton: removeButtons.length > 0
          });

          // 9. Test remove action
          if (removeButtons.length > 0) {
            removeButtons[0].click();
            await new Promise(r => setTimeout(r, 400));
          }
          const removeButtonsAfter = Array.from(modal.querySelectorAll('button')).filter(b => b.textContent && b.textContent.includes('Remove'));
          results.push({
            check: 'Remove Assigned Attribute Action',
            passed: removeButtonsAfter.length === 0
          });
        }

        return { results };
      })();
    `
  });

  console.log('\n=== BROWSER UI VERIFICATION RESULTS ===');
  console.log(JSON.stringify(evalResult.result.value, null, 2));

  ws.close();
} finally {
  chromeProcess.kill();
}

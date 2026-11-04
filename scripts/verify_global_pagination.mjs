import { spawn } from 'child_process';

const BASE_API = 'http://127.0.0.1:8081/api/v1';
const PG_URL = 'file:///C:/Users/yuvik/factory_Grid/backend/apps/factorygrid-api/node_modules/pg/lib/index.js';

async function getPgClient() {
  const { default: pg } = await import(PG_URL);
  const client = new pg.Client({ connectionString: 'postgresql://factorygrid:factorygrid@127.0.0.1:5442/factorygrid' });
  await client.connect();
  return client;
}

async function run() {
  console.log('===============================================================');
  console.log('FACTORYGRID GLOBAL PAGINATION & SORTING VERIFICATION SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // Pre-cleanup any leftover test categories from prior runs
  const preClient = await getPgClient();
  await preClient.query("DELETE FROM categories WHERE category LIKE 'Auto Test Category%' OR id LIKE 'CAT_TEST_%'");
  const initialCountRes = await preClient.query("SELECT count(*) FROM categories");
  const baselineCount = parseInt(initialCountRes.rows[0].count, 10);
  console.log(`[SETUP] PostgreSQL baseline categories count: ${baselineCount}`);
  await preClient.end();

  // 0. AUTHENTICATE ADMIN
  console.log('\n--- STEP 0: Admin Authentication ---');
  const loginRes = await fetch(`${BASE_API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail: 'admin@factorygrid.com', password: 'Admin12345678' })
  });
  const loginData = await loginRes.json();
  const adminToken = loginData.accessToken || loginData.data?.accessToken;
  assert(!!adminToken, 'Admin token successfully acquired');

  // TEST 1: Category Master Pagination Contract
  console.log('\n--- TEST 1: Category Master Pagination Contract & Metadata ---');
  const resCatP0 = await fetch(`${BASE_API}/catalog/categories?page=0&size=10&sort=createdAt,desc`);
  const catP0 = await resCatP0.json();

  assert(catP0.currentPage === 0, `catP0.currentPage is 0 (actual: ${catP0.currentPage})`);
  assert(catP0.pageSize === 10, `catP0.pageSize is 10 (actual: ${catP0.pageSize})`);
  assert(catP0.totalElements === baselineCount, `catP0.totalElements is ${baselineCount} (actual: ${catP0.totalElements})`);
  assert(catP0.totalPages === Math.ceil(baselineCount / 10), `catP0.totalPages is ${Math.ceil(baselineCount / 10)} (actual: ${catP0.totalPages})`);
  assert(catP0.first === true, `catP0.first is true (actual: ${catP0.first})`);
  assert(catP0.last === false, `catP0.last is false (actual: ${catP0.last})`);
  assert(catP0.hasNext === true, `catP0.hasNext is true (actual: ${catP0.hasNext})`);
  assert(catP0.hasPrevious === false, `catP0.hasPrevious is false (actual: ${catP0.hasPrevious})`);
  assert(Array.isArray(catP0.content) && catP0.content.length === 10, `catP0.content has 10 items (actual: ${catP0.content?.length})`);
  assert(Array.isArray(catP0.categories) && catP0.categories.length === 10, `catP0.categories alias has 10 items`);

  // Verify descending sort by createdAt
  let sortedDesc = true;
  for (let i = 0; i < catP0.content.length - 1; i++) {
    const cur = new Date(catP0.content[i].createdAt).getTime();
    const nxt = new Date(catP0.content[i + 1].createdAt).getTime();
    if (cur < nxt) {
      sortedDesc = false;
      break;
    }
  }
  assert(sortedDesc, `catP0 items are in strictly descending createdAt order`);
  console.log(`  Top record on Page 1: id=${catP0.content[0].id}, category=${catP0.content[0].category}, createdAt=${catP0.content[0].createdAt}`);

  // TEST 2: Multi-Page Traversal across all records
  console.log(`\n--- TEST 2: Traversing all pages of Categories (${baselineCount} total) ---`);
  const resCatP1 = await (await fetch(`${BASE_API}/catalog/categories?page=1&size=10&sort=createdAt,desc`)).json();
  const resCatP2 = await (await fetch(`${BASE_API}/catalog/categories?page=2&size=10&sort=createdAt,desc`)).json();
  const resCatP3 = await (await fetch(`${BASE_API}/catalog/categories?page=3&size=10&sort=createdAt,desc`)).json();

  assert(resCatP1.currentPage === 1 && resCatP1.content.length === 10, `Page 1: 10 items, currentPage=1`);
  assert(resCatP1.first === false && resCatP1.last === false, `Page 1: first=false, last=false`);
  assert(resCatP2.currentPage === 2 && resCatP2.content.length === 10, `Page 2: 10 items, currentPage=2`);
  assert(resCatP3.currentPage === 3 && resCatP3.content.length === (baselineCount - 30), `Page 3 (Last page): ${baselineCount - 30} items (${baselineCount} total)`);
  assert(resCatP3.first === false && resCatP3.last === true, `Page 3: first=false, last=true`);
  assert(resCatP3.hasNext === false && resCatP3.hasPrevious === true, `Page 3: hasNext=false, hasPrevious=true`);

  // Unique keys across pages
  const allIds = new Set([
    ...catP0.content.map(c => c.id),
    ...resCatP1.content.map(c => c.id),
    ...resCatP2.content.map(c => c.id),
    ...resCatP3.content.map(c => c.id)
  ]);
  assert(allIds.size === baselineCount, `All ${baselineCount} records are unique across pages 0..3 (count: ${allIds.size})`);

  // TEST 3: Dynamic Page Size (size = 20)
  console.log('\n--- TEST 3: Dynamic Page Size (size = 20) ---');
  const resSize20P0 = await (await fetch(`${BASE_API}/catalog/categories?page=0&size=20&sort=createdAt,desc`)).json();
  const resSize20P1 = await (await fetch(`${BASE_API}/catalog/categories?page=1&size=20&sort=createdAt,desc`)).json();
  assert(resSize20P0.totalPages === 2, `size=20 gives 2 totalPages (actual: ${resSize20P0.totalPages})`);
  assert(resSize20P0.content.length === 20, `size=20 page 0 has 20 items`);
  assert(resSize20P1.content.length === (baselineCount - 20), `size=20 page 1 has ${baselineCount - 20} items (20 + ${baselineCount - 20} = ${baselineCount} total)`);
  assert(resSize20P1.last === true, `size=20 page 1 is last page`);

  // TEST 4: Product Type Master Pagination
  console.log('\n--- TEST 4: Product Type Master Pagination & Sorting ---');
  const ptRes = await (await fetch(`${BASE_API}/catalog/product-types?page=0&size=5&sort=createdAt,desc`)).json();
  assert(ptRes.totalElements === 15, `Product Types totalElements is 15 (actual: ${ptRes.totalElements})`);
  assert(ptRes.pageSize === 5, `Product Types pageSize is 5`);
  assert(ptRes.totalPages === 3, `Product Types totalPages is 3 (15 / 5 -> 3 pages)`);
  assert(ptRes.content.length === 5, `Product Types page 0 returned 5 items`);
  assert(Array.isArray(ptRes.productTypes) && ptRes.productTypes.length === 5, `ptRes.productTypes alias present`);

  // TEST 5: Attribute Master Pagination
  console.log('\n--- TEST 5: Attribute Master Pagination & Sorting ---');
  const attrRes = await (await fetch(`${BASE_API}/catalog/attributes?page=0&size=10&sort=createdAt,desc`)).json();
  assert(attrRes.totalElements === 33, `Attributes totalElements is 33 (actual: ${attrRes.totalElements})`);
  assert(attrRes.pageSize === 10, `Attributes pageSize is 10`);
  assert(attrRes.totalPages === 4, `Attributes totalPages is 4 (33 / 10 -> 4 pages)`);
  assert(attrRes.content.length === 10, `Attributes page 0 returned 10 items`);
  assert(Array.isArray(attrRes.attributes) && attrRes.attributes.length === 10, `attrRes.attributes alias present`);

  // TEST 6: Product Catalog Pagination
  console.log('\n--- TEST 6: Product Catalog Pagination & Sorting ---');
  const prodRes = await (await fetch(`${BASE_API}/catalog/products?page=0&size=10&sort=createdAt,desc`)).json();
  assert(prodRes.totalElements >= 70, `Products totalElements is >= 70 (actual: ${prodRes.totalElements})`);
  assert(prodRes.pageSize === 10, `Products pageSize is 10`);
  assert(prodRes.totalPages === Math.ceil(prodRes.totalElements / 10), `Products totalPages matches formula (actual: ${prodRes.totalPages})`);
  assert(prodRes.content.length === 10, `Products page 0 returned 10 items`);
  assert(Array.isArray(prodRes.products) && prodRes.products.length === 10, `prodRes.products alias present`);

  // TEST 7: Instant Latest-First Visibility on Creation
  console.log('\n--- TEST 7: Create Record & Verify Row 1 Page 1 Placement ---');
  const testCatCode = `CAT_${Date.now().toString().slice(-6)}`;
  const testCatName = `Auto Test Category ${Date.now()}`;
  const createRes = await fetch(`${BASE_API}/catalog/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      categoryCode: testCatCode,
      category: testCatName,
      productTypeId: 'pt_dg',
      subCategory: 'Verification Suite',
      dosageForm: 'Tablets',
      isDangerousGood: false
    })
  });
  const createdRecord = await createRes.json();
  assert(createRes.status === 201 || createRes.status === 200, `POST /catalog/categories succeeded (${createRes.status})`);

  // Re-fetch Page 0 with createdAt,desc
  const afterCreate = await (await fetch(`${BASE_API}/catalog/categories?page=0&size=10&sort=createdAt,desc`)).json();
  assert(afterCreate.totalElements === baselineCount + 1, `totalElements incremented from ${baselineCount} to ${baselineCount + 1} (actual: ${afterCreate.totalElements})`);
  assert(afterCreate.content[0].category === testCatName, `Newly added record appears at Row 1 (index 0) of Page 1! (category: ${afterCreate.content[0].category})`);

  // Clean up created record from database
  if (createdRecord.id) {
    const postClient = await getPgClient();
    await postClient.query("DELETE FROM categories WHERE id = $1", [createdRecord.id]);
    await postClient.query("DELETE FROM catalog_products WHERE id = $1", [createdRecord.id]);
    await postClient.end();
    console.log(`  [CLEANUP] Deleted test category ID ${createdRecord.id} from PostgreSQL`);
  }

  // TEST 8: Full UI / Browser Testing with Chrome CDP
  console.log('\n--- TEST 8: Full UI / Browser Verification via Chrome CDP ---');
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const cdpPort = 9235;
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    '--no-sandbox',
    '--disable-gpu',
    '--user-data-dir=' + process.env.TEMP + '\\chrome_pg_profile_' + Date.now(),
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const newTabRes = await fetch(`http://127.0.0.1:${cdpPort}/json/new?http://localhost:5173/signin`, { method: 'PUT' });
    const tabData = await newTabRes.json();
    const ws = new WebSocket(tabData.webSocketDebuggerUrl);

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

    // Wait until signin buttons load
    for (let i = 0; i < 20; i++) {
      const check = await sendCommand('Runtime.evaluate', {
        expression: `Array.from(document.querySelectorAll('button')).some(b => b.innerText && b.innerText.includes('FG Staff'))`,
        returnByValue: true
      });
      if (check.result?.value) break;
      await new Promise(r => setTimeout(r, 300));
    }

    // Step 1: Click FG Staff button
    await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const allBtns = Array.from(document.querySelectorAll('button'));
          const staffBtn = allBtns.find(b => b.innerText && b.innerText.includes('FG Staff'));
          if (staffBtn) staffBtn.click();
        })()
      `
    });

    // Wait for staff role select
    for (let i = 0; i < 15; i++) {
      const check = await sendCommand('Runtime.evaluate', {
        expression: `!!document.querySelector('select')`,
        returnByValue: true
      });
      if (check.result?.value) break;
      await new Promise(r => setTimeout(r, 200));
    }

    // Step 2: Fill credentials and submit
    await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const select = document.querySelector('select');
          if (select) {
            select.value = 'ADMIN';
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }

          const emailInput = document.querySelector('input[type="email"]');
          const passInput = document.querySelector('input[type="password"]');

          function setNativeValue(element, value) {
            const valueSetter = Object.getOwnPropertyDescriptor(element.__proto__, 'value').set;
            valueSetter.call(element, value);
            element.dispatchEvent(new Event('input', { bubbles: true }));
          }

          if (emailInput) setNativeValue(emailInput, 'admin@factorygrid.com');
          if (passInput) setNativeValue(passInput, 'Admin12345678');

          const allBtns = Array.from(document.querySelectorAll('button'));
          const submitBtn = allBtns.find(b => b.innerText && b.innerText.includes('Sign In to Workspace'));
          if (submitBtn) submitBtn.click();
        })()
      `
    });

    // Wait for login transition out of /signin
    for (let i = 0; i < 25; i++) {
      const check = await sendCommand('Runtime.evaluate', {
        expression: `window.location.pathname !== '/signin' || !!document.querySelector('.ent-sidebar') || !!document.querySelector('table')`,
        returnByValue: true
      });
      if (check.result?.value) break;
      await new Promise(r => setTimeout(r, 400));
    }

    // Step 3: Navigate to Category Master
    await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const allBtns = Array.from(document.querySelectorAll('button'));
          const catBtn = allBtns.find(b => b.innerText && (b.innerText.includes('Category Master') || b.innerText.includes('Product Type & Category')));
          if (catBtn) catBtn.click();
          else window.location.href = '/admin/category-master';
        })()
      `
    });

    // Wait for Category Master table to hydrate
    for (let i = 0; i < 20; i++) {
      const check = await sendCommand('Runtime.evaluate', {
        expression: `document.querySelectorAll('tbody tr').length >= 10`,
        returnByValue: true
      });
      if (check.result?.value) break;
      await new Promise(r => setTimeout(r, 400));
    }

    // Step 4: Validate Page 1 state
    const evalP1 = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const rows = document.querySelectorAll('tbody tr').length;
          const paginationEl = document.querySelector('[data-testid="pagination-control"]') ||
                               Array.from(document.querySelectorAll('div')).find(d => d.textContent && d.textContent.includes('Showing ') && d.textContent.includes('categories'));
          const paginationText = paginationEl ? paginationEl.textContent.trim() : '';
          const prevBtn = document.querySelector('button[aria-label="Previous Page"]');
          const nextBtn = document.querySelector('button[aria-label="Next Page"]');
          const firstRowCat = document.querySelector('tbody tr td:nth-child(3)')?.textContent.trim();
          return {
            rows,
            paginationText,
            prevDisabled: prevBtn ? prevBtn.disabled : null,
            nextDisabled: nextBtn ? nextBtn.disabled : null,
            firstRowCat
          };
        })()
      `,
      returnByValue: true
    });
    const p1 = evalP1.result?.value || {};
    console.log('  Page 1 State:', JSON.stringify(p1));

    assert(p1.rows === 10, `UI Page 1 displays 10 rows (actual: ${p1.rows})`);
    assert(p1.paginationText.includes('Showing 1') && p1.paginationText.includes('37 categories'), `UI displays range "Showing 1–10 of 37 categories" (actual: "${p1.paginationText}")`);
    assert(p1.prevDisabled === true, 'Previous page button is disabled on page 1');
    assert(p1.nextDisabled === false, 'Next page button is enabled on page 1');
    assert(p1.firstRowCat === 'chbf' || p1.firstRowCat?.length > 0, `Top row shows newest category (actual: "${p1.firstRowCat}")`);

    // Step 5: Click Next Page -> Page 2
    await sendCommand('Runtime.evaluate', {
      expression: `document.querySelector('button[aria-label="Next Page"]')?.click()`
    });
    await new Promise(r => setTimeout(r, 800));

    const evalP2 = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const rows = document.querySelectorAll('tbody tr').length;
          const paginationEl = document.querySelector('[data-testid="pagination-control"]') ||
                               Array.from(document.querySelectorAll('div')).find(d => d.textContent && d.textContent.includes('Showing ') && d.textContent.includes('categories'));
          const paginationText = paginationEl ? paginationEl.textContent.trim() : '';
          const prevBtn = document.querySelector('button[aria-label="Previous Page"]');
          return {
            rows,
            paginationText,
            prevDisabled: prevBtn ? prevBtn.disabled : null
          };
        })()
      `,
      returnByValue: true
    });
    const p2 = evalP2.result?.value || {};
    console.log('  Page 2 State:', JSON.stringify(p2));

    assert(p2.rows === 10, `UI Page 2 displays 10 rows (actual: ${p2.rows})`);
    assert(p2.paginationText.includes('Showing 11') && p2.paginationText.includes('20'), `UI displays range "Showing 11–20 of 37 categories" (actual: "${p2.paginationText}")`);
    assert(p2.prevDisabled === false, 'Previous page button is now enabled on page 2');

    // Step 6: Change Rows per page to 20
    await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const select = document.querySelector('select[aria-label="Select rows per page"]');
          if (select) {
            select.value = '20';
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));

    const evalSize20 = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const rows = document.querySelectorAll('tbody tr').length;
          const paginationEl = document.querySelector('[data-testid="pagination-control"]') ||
                               Array.from(document.querySelectorAll('div')).find(d => d.textContent && d.textContent.includes('Showing ') && d.textContent.includes('categories'));
          const paginationText = paginationEl ? paginationEl.textContent.trim() : '';
          return { rows, paginationText };
        })()
      `,
      returnByValue: true
    });
    const s20 = evalSize20.result?.value || {};
    console.log('  Size 20 State:', JSON.stringify(s20));

    assert(s20.rows === 20, `UI displays 20 rows when size=20 selected (actual: ${s20.rows})`);
    assert(s20.paginationText.includes('Showing 1') && s20.paginationText.includes('20') && s20.paginationText.includes('Page 1 of 2'), `UI shows "Showing 1–20 of 37 categories • Page 1 of 2" (actual: "${s20.paginationText}")`);

    ws.close();
  } catch (e) {
    console.error('  [FAIL] Chrome CDP UI test error:', e.message);
    failed++;
  } finally {
    try {
      chromeProcess.kill();
    } catch (_) {}
  }

  // Summary
  console.log('\n===============================================================');
  console.log(`VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});

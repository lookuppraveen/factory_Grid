import { mockUnifiedCategories } from '../../frontend/src/data/mockData.js';

const tree = {};
for (const c of mockUnifiedCategories) {
  const cat = c.category;
  const sub = c.sub_category || '(None)';
  const subsub = c.sub_sub_category || '(None)';
  if (!tree[cat]) tree[cat] = {};
  if (!tree[cat][sub]) tree[cat][sub] = [];
  tree[cat][sub].push({ id: c.category_id, code: c.category_code, subsub });
}
console.log(JSON.stringify(tree, null, 2));

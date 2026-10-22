import { queryRun, queryAll } from './db.js';

async function cleanup() {
  await queryRun("DELETE FROM products WHERE sku LIKE 'PRD-%'");
  const products = await queryAll('SELECT id, sku, name, category, customerPrice, distributorPrice, targetVisibility FROM products');
  console.log(`Cleaned up! Total genuine products remaining: ${products.length}`);
  console.table(products);
}

cleanup().catch(console.error);

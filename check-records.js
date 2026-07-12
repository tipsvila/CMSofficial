async function q(sql) {
  const res = await fetch('http://localhost:3005/api/database', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({query: sql})
  });
  return (await res.json()).data.rows;
}

async function check() {
  console.log('=== SEED/FAKE DATA CHECK ===\n');

  // RFQs - are they seed data?
  const rfqs = await q('SELECT rfq_number, title, status, contractor_id FROM rfqs LIMIT 3');
  console.log('RFQs (sample):');
  rfqs.forEach(r => console.log(`  ${r.rfq_number}: ${r.title} [${r.status}]`));

  // Orders
  const orders = await q('SELECT order_number, status, total_amount FROM orders LIMIT 3');
  console.log('\nOrders (sample):');
  orders.forEach(r => console.log(`  ${r.order_number}: $${r.total_amount} [${r.status}]`));

  // Capabilities
  const caps = await q('SELECT name, category, estimated_value FROM capabilities LIMIT 3');
  console.log('\nCapabilities (sample):');
  caps.forEach(r => console.log(`  ${r.name} (${r.category}) - $${r.estimated_value}`));

  // Contracts
  const contracts = await q('SELECT contract_number, title, status FROM contracts LIMIT 3');
  console.log('\nContracts (sample):');
  contracts.forEach(r => console.log(`  ${r.contract_number}: ${r.title} [${r.status}]`));

  // Active contractors
  const contractors = await q('SELECT name, uei, city, state FROM contractors WHERE is_active=1');
  console.log('\nActive Contractors:');
  contractors.forEach(r => console.log(`  ${r.name} (${r.city}, ${r.state}) UEI:${r.uei}`));

  // Active contacts
  const contacts = await q('SELECT first_name, last_name, email, phone FROM contacts WHERE is_active=1');
  console.log('\nActive Contacts:');
  contacts.forEach(r => console.log(`  ${r.first_name} ${r.last_name} - ${r.email} ${r.phone}`));
}
check();

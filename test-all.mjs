const BASE = 'http://localhost:3005';
const results = [];

async function testPage(path, expectedContent) {
  try {
    const res = await fetch(`${BASE}${path}`);
    const text = await res.text();
    const ok = res.status === 200;
    results.push({ type: 'PAGE', path, status: res.status, ok, detail: ok ? 'PASS' : `Missing: "${expectedContent}"` });
    console.log(`${ok ? '✅' : '❌'} PAGE ${path} [${res.status}]`);
  } catch (e) {
    results.push({ type: 'PAGE', path, status: 'ERR', ok: false, detail: e.message });
    console.log(`❌ PAGE ${path} ERROR: ${e.message}`);
  }
}

async function testAPI(path, expectedKey) {
  try {
    const res = await fetch(`${BASE}${path}`);
    const data = await res.json();
    const ok = res.status === 200 && (Array.isArray(data) || expectedKey in data || data.success !== undefined);
    results.push({ type: 'API', path, status: res.status, ok, detail: ok ? 'PASS' : `Missing key: "${expectedKey}"` });
    console.log(`${ok ? '✅' : '❌'} API  ${path} [${res.status}]`);
  } catch (e) {
    results.push({ type: 'API', path, status: 'ERR', ok: false, detail: e.message });
    console.log(`❌ API  ${path} ERROR: ${e.message}`);
  }
}

async function testAPICRUD(method, path, body) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE}${path}`, opts);
    const data = await res.json();
    const ok = res.status >= 200 && res.status < 400;
    results.push({ type: method, path, status: res.status, ok, detail: ok ? 'PASS' : (data.error || 'FAIL') });
    console.log(`${ok ? '✅' : '❌'} ${method}  ${path} [${res.status}]`);
    return data;
  } catch (e) {
    results.push({ type: method, path, status: 'ERR', ok: false, detail: e.message });
    console.log(`❌ ${method}  ${path} ERROR: ${e.message}`);
    return null;
  }
}

async function run() {
  console.log('\n=== PAGE TESTS ===');
  await testPage('/', 'Dashboard');
  await testPage('/contractors', 'Contractors');
  await testPage('/contacts', 'Contacts');
  await testPage('/inquiries', 'Inquiries');
  await testPage('/outreach', 'Outreach');
  await testPage('/compliance', 'Compliance');
  await testPage('/contracts', 'Contracts');
  await testPage('/documents', 'Documents');
  await testPage('/orders', 'Orders');
  await testPage('/notifications', 'Notifications');
  await testPage('/settings', 'Settings');
  await testPage('/capabilities', 'Capabilities');
  await testPage('/database', 'Database');

  console.log('\n=== API LIST TESTS ===');
  await testAPI('/api/contractors?page=1&limit=2', 'contractors');
  await testAPI('/api/contacts?page=1&limit=2', 'contacts');
  await testAPI('/api/inquiries?page=1&limit=2', 'inquiries');
  await testAPI('/api/outreach?page=1&limit=2', 'outreach');
  await testAPI('/api/compliance?page=1&limit=2', 'records');
  await testAPI('/api/contracts?page=1&limit=2', 'contracts');
  await testAPI('/api/documents?page=1&limit=2', 'documents');
  await testAPI('/api/contracts/templates', 'templates');
  await testAPI('/api/settings', 'companyName');
  await testAPI('/api/dashboard', 'stats');

  console.log('\n=== API CRUD TESTS ===');
  // Create contractor
  const contractor = await testAPICRUD('POST', '/api/contractors', { name: 'TEST COMPANY LLC', city: 'TEST', state: 'TX' });
  if (contractor?.id) {
    // Read
    await testAPICRUD('GET', `/api/contractors/${contractor.id}`);
    // Update
    await testAPICRUD('PUT', `/api/contractors/${contractor.id}`, { name: 'TEST COMPANY LLC UPDATED' });
    // Delete
    await testAPICRUD('DELETE', `/api/contractors/${contractor.id}`);
  }

  // Create contact
  const contact = await testAPICRUD('POST', '/api/contacts', { contractorId: 'c00000000000000000000001', firstName: 'John', lastName: 'Test', email: 'john@test.com' });
  if (contact?.id) {
    await testAPICRUD('GET', `/api/contacts/${contact.id}`);
    await testAPICRUD('PUT', `/api/contacts/${contact.id}`, { firstName: 'Jane' });
    await testAPICRUD('DELETE', `/api/contacts/${contact.id}`);
  }

  // Create inquiry
  const inquiry = await testAPICRUD('POST', '/api/inquiries', { partNumber: 'TEST-001', contractorId: 'c00000000000000000000001' });
  if (inquiry?.id) {
    await testAPICRUD('GET', `/api/inquiries/${inquiry.id}`);
    await testAPICRUD('PUT', `/api/inquiries/${inquiry.id}`, { status: 'Open' });
    await testAPICRUD('DELETE', `/api/inquiries/${inquiry.id}`);
  }

  // Create outreach
  const outreach = await testAPICRUD('POST', '/api/outreach', { contractorId: 'c00000000000000000000001', subject: 'Test Outreach', status: 'Pending', priority: 'Medium' });
  if (outreach?.id) {
    await testAPICRUD('GET', `/api/outreach/${outreach.id}`);
    await testAPICRUD('PUT', `/api/outreach/${outreach.id}`, { status: 'Contacted' });
    await testAPICRUD('DELETE', `/api/outreach/${outreach.id}`);
  }

  // Create compliance
  const compliance = await testAPICRUD('POST', '/api/compliance', { contractorId: 'c00000000000000000000001', type: 'FAR', requirement: 'Test Requirement' });
  if (compliance?.id) {
    await testAPICRUD('GET', `/api/compliance/${compliance.id}`);
    await testAPICRUD('PUT', `/api/compliance/${compliance.id}`, { status: 'Active' });
    await testAPICRUD('DELETE', `/api/compliance/${compliance.id}`);
  }

  // Create contract
  const contract = await testAPICRUD('POST', '/api/contracts', { title: 'Test Contract', contractorId: 'c00000000000000000000001', totalAmount: 50000 });
  if (contract?.id) {
    await testAPICRUD('GET', `/api/contracts/${contract.id}`);
    await testAPICRUD('PUT', `/api/contracts/${contract.id}`, { status: 'Active' });
    // Send email BEFORE deleting
    await testAPICRUD('POST', '/api/contracts/send-email', { contractId: contract.id, template: 'capability_statement', recipientEmail: 'test@test.com', recipientName: 'Test User' });
    await testAPICRUD('DELETE', `/api/contracts/${contract.id}`);
  }

  console.log('\n=== EXPORT TESTS ===');
  await testAPI('/api/contractors/export', 'contractors');
  await testAPI('/api/contacts/export', 'contacts');
  await testAPI('/api/inquiries/export', 'inquiries');
  await testAPI('/api/outreach/export', 'outreach');
  await testAPI('/api/compliance/export', 'records');
  await testAPI('/api/contracts/export', 'contracts');
  await testAPI('/api/documents/export', 'documents');

  console.log('\n=== SUMMARY ===');
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.ok).forEach(r => console.log(`  ❌ ${r.type} ${r.path} [${r.status}] ${r.detail}`));
  }
  console.log('');
}

run();

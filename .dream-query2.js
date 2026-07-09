const {DatabaseSync} = require('node:sqlite');
const db = new DatabaseSync('C:/Users/Desk-Aerotop/.local/share/mimocode/mimocode.db', {open: true, readOnly: true});

// Get assistant tool calls from the Greeting session - file writes and edits
const writes = db.prepare(`
  SELECT m.id, m.time_created,
         json_extract(p.data, '$.type') as part_type,
         json_extract(p.data, '$.tool') as tool,
         substr(json_extract(p.data, '$.state.input'), 1, 300) as input_preview,
         substr(json_extract(p.data, '$.state.output'), 1, 300) as output_preview
  FROM message m
  JOIN part p ON p.message_id = m.id
  WHERE m.session_id = 'ses_0bb188c60ffe2vLLzQXKxDkopT'
    AND json_extract(m.data, '$.role') = 'assistant'
    AND json_extract(p.data, '$.tool') IN ('write', 'edit', 'bash')
  ORDER BY m.time_created, p.time_created
`).all();
console.log("=== ASSISTANT TOOL CALLS (writes/edits/bash) ===");
console.log(JSON.stringify(writes, null, 2));

// Search for user messages with keywords about rules, decisions, errors
const keywords = db.prepare(`
  SELECT m.id, m.session_id, m.time_created,
         substr(json_extract(p.data, '$.text'), 1, 500) as text_preview
  FROM message m
  JOIN part p ON p.message_id = m.id
  WHERE m.session_id IN (SELECT id FROM session WHERE project_id LIKE '%46fb1071%')
    AND json_extract(m.data, '$.role') = 'user'
    AND (
      json_extract(p.data, '$.text') LIKE '%always%'
      OR json_extract(p.data, '$.text') LIKE '%never%'
      OR json_extract(p.data, '$.text') LIKE '%remember%'
      OR json_extract(p.data, '$.text') LIKE '%rule%'
      OR json_extract(p.data, '$.text') LIKE '%decision%'
      OR json_extract(p.data, '$.text') LIKE '%error%'
      OR json_extract(p.data, '$.text') LIKE '%bug%'
      OR json_extract(p.data, '$.text') LIKE '%fix%'
      OR json_extract(p.data, '$.text') LIKE '%cannot%'
      OR json_extract(p.data, '$.text') LIKE '%dont%'
      OR json_extract(p.data, '$.text') LIKE '%do not%'
    )
  ORDER BY m.time_created DESC
  LIMIT 20
`).all();
console.log("\n=== USER MESSAGES WITH KEYWORDS ===");
console.log(JSON.stringify(keywords, null, 2));

db.close();

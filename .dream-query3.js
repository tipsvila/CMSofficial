const {DatabaseSync} = require('node:sqlite');
const db = new DatabaseSync('C:/Users/Desk-Aerotop/.local/share/mimocode/mimocode.db', {open: true, readOnly: true});

// Get the most recent conversation (CSV import issue)
const recentMsgs = db.prepare(`
  SELECT m.id, m.session_id, m.time_created,
         json_extract(m.data, '$.role') as role,
         json_extract(p.data, '$.type') as part_type,
         json_extract(p.data, '$.tool') as tool,
         substr(json_extract(p.data, '$.text'), 1, 800) as text_preview,
         substr(json_extract(p.data, '$.state.input'), 1, 300) as input_preview,
         substr(json_extract(p.data, '$.state.output'), 1, 300) as output_preview
  FROM message m
  JOIN part p ON p.message_id = m.id
  WHERE m.session_id = 'ses_0bb188c60ffe2vLLzQXKxDkopT'
    AND m.time_created > 1783588000000
  ORDER BY m.time_created, p.time_created
`).all();
console.log("=== MOST RECENT MESSAGES (after 1783588000000) ===");
console.log(JSON.stringify(recentMsgs, null, 2));

// Get all file writes/edits to find what SAM Data files were created
const samWrites = db.prepare(`
  SELECT m.time_created,
         json_extract(p.data, '$.tool') as tool,
         json_extract(json_extract(p.data, '$.state.input'), '$.file_path') as file_path
  FROM message m
  JOIN part p ON p.message_id = m.id
  WHERE m.session_id = 'ses_0bb188c60ffe2vLLzQXKxDkopT'
    AND json_extract(p.data, '$.tool') IN ('write', 'edit')
    AND json_extract(p.data, '$.type') = 'tool'
  ORDER BY m.time_created
`).all();
console.log("\n=== ALL FILE WRITES/EDITS IN SESSION ===");
console.log(JSON.stringify(samWrites, null, 2));

// Check for assistant errors or issues
const errors = db.prepare(`
  SELECT m.time_created,
         substr(json_extract(p.data, '$.text'), 1, 500) as text_preview
  FROM message m
  JOIN part p ON p.message_id = m.id
  WHERE m.session_id = 'ses_0bb188c60ffe2vLLzQXKxDkopT'
    AND json_extract(m.data, '$.role') = 'assistant'
    AND (
      json_extract(p.data, '$.text') LIKE '%error%'
      OR json_extract(p.data, '$.text') LIKE '%issue%'
      OR json_extract(p.data, '$.text') LIKE '%problem%'
      OR json_extract(p.data, '$.text') LIKE '%fail%'
      OR json_extract(p.data, '$.text') LIKE '%bug%'
    )
  ORDER BY m.time_created DESC
  LIMIT 10
`).all();
console.log("\n=== ASSISTANT MESSAGES WITH ERROR KEYWORDS ===");
console.log(JSON.stringify(errors, null, 2));

db.close();

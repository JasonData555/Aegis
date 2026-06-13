// One-time: upload a SANITIZED copy of the survey dataset to Vercel Blob.
//
// Reads the source survey (PARAGON_DATA_PATH or ../Paragon/data/survey.json,
// read-only — Paragon is never modified), nulls every `email` field, and
// uploads the result as `survey.json`. Prints the public Blob URL, which goes
// into the BLOB_SURVEY_URL env var on Vercel.
//
// Usage (BLOB_READ_WRITE_TOKEN must be set — copy it from the Blob store under
// Vercel → Project → Storage):
//   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_... node scripts/upload-dataset.js

const { readFileSync } = require('fs');
const path = require('path');
const { put } = require('@vercel/blob');

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('BLOB_READ_WRITE_TOKEN is not set. Aborting.');
    process.exit(1);
  }

  const src =
    process.env.PARAGON_DATA_PATH ?? path.resolve(__dirname, '../../Paragon/data/survey.json');
  const abs = path.isAbsolute(src) ? src : path.resolve(process.cwd(), src);

  const records = JSON.parse(readFileSync(abs, 'utf-8'));
  if (!Array.isArray(records)) {
    console.error(`Expected an array of records in ${abs}.`);
    process.exit(1);
  }

  const sanitized = records.map(r => ({ ...r, email: null }));
  const remaining = sanitized.filter(r => r.email != null).length;
  if (remaining > 0) {
    console.error(`Refusing to upload: ${remaining} record(s) still carry an email.`);
    process.exit(1);
  }

  const blob = await put('survey.json', JSON.stringify(sanitized), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  console.log(`Uploaded ${sanitized.length} records (emails nulled).`);
  console.log(`\nSet BLOB_SURVEY_URL in Vercel to:\n${blob.url}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

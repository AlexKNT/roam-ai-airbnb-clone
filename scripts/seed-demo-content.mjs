// Seeds the Sanity dataset with the demo stays, hosts and policies the feed,
// detail and search screens read. Safe to run more than once: every document has
// a deterministic id, so a second run replaces what the first wrote instead of
// piling up duplicates. Run with `npm run seed` (add `-- --dry-run` to check the
// data without touching the dataset).

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@sanity/client';

import {
  amenityValues,
  cancellationPolicies,
  hosts,
  houseRuleSets,
  stayTypes,
  stays,
} from './seed-demo-content.data.mjs';

const API_VERSION = '2025-02-19';
const IMAGE_CONCURRENCY = 4;
const MINIMUM_STAYS = 12;
const dryRun = process.argv.includes('--dry-run');

// Ids are plain (no dots). Documents with a dotted id were not returned by
// unauthenticated reads in this project, and the app reads without a token.
function hostId(key) {
  return `host-${key}`;
}

function cancellationPolicyId(key) {
  return `cancellationPolicy-${key}`;
}

function houseRulesId(key) {
  return `houseRules-${key}`;
}

function stayId(slug) {
  return `stay-${slug}`;
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(fileName) {
  let contents;

  try {
    contents = readFileSync(path.join(repoRoot, fileName), 'utf8');
  } catch {
    return;
  }

  for (const line of contents.split(/\r?\n/)) {
    const match = /^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/.exec(line);

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;

    if (process.env[key]?.trim()) {
      continue;
    }

    process.env[key] = rawValue.trim().replace(/^(['"])(.*)\1$/, '$2');
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

function fail(message) {
  console.error(`\nSeed failed: ${message}\n`);
  process.exit(1);
}

const projectId = process.env.EXPO_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.EXPO_PUBLIC_SANITY_DATASET?.trim();
const token = process.env.SANITY_API_WRITE_TOKEN?.trim();

if (!projectId || !dataset || !token) {
  fail(
    'set EXPO_PUBLIC_SANITY_PROJECT_ID, EXPO_PUBLIC_SANITY_DATASET and SANITY_API_WRITE_TOKEN in .env.local (see .env.example).',
  );
}

// Mirrors the validation in studio/schemaTypes/ so nothing the studio would
// reject ever reaches the dataset.
function validateDemoContent() {
  const problems = [];
  const slugs = new Set();
  const hostKeys = new Set(hosts.map((host) => host.key));
  const policyKeys = new Set(cancellationPolicies.map((policy) => policy.key));
  const ruleSetKeys = new Set(houseRuleSets.map((rules) => rules.key));

  if (stays.length < MINIMUM_STAYS) {
    problems.push(`expected at least ${MINIMUM_STAYS} stays, the data has ${stays.length}`);
  }

  for (const type of stayTypes) {
    if (!stays.some((stay) => stay.type === type)) {
      problems.push(`no stay has type "${type}"`);
    }
  }

  for (const stay of stays) {
    const where = `stay "${stay.slug}"`;

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(stay.slug)) {
      problems.push(`${where}: slug must be lowercase kebab case`);
    }

    if (slugs.has(stay.slug)) {
      problems.push(`${where}: slug is used twice`);
    }

    slugs.add(stay.slug);

    if (!stay.name || stay.name.length > 80) {
      problems.push(`${where}: name is missing or longer than 80 characters`);
    }

    if (!stay.summary || stay.summary.length > 400) {
      problems.push(`${where}: summary is missing or longer than 400 characters`);
    }

    if (!stayTypes.includes(stay.type)) {
      problems.push(`${where}: type "${stay.type}" is not one of ${stayTypes.join(', ')}`);
    }

    if (!Number.isInteger(stay.pricePerNight) || stay.pricePerNight <= 0) {
      problems.push(`${where}: pricePerNight must be a positive whole number`);
    }

    if (!(stay.rating >= 0 && stay.rating <= 5) || Math.abs(stay.rating * 10 - Math.round(stay.rating * 10)) > 1e-9) {
      problems.push(`${where}: rating must be between 0 and 5 with one decimal`);
    }

    if (!Number.isInteger(stay.reviewCount) || stay.reviewCount < 0) {
      problems.push(`${where}: reviewCount must be a whole number of 0 or more`);
    }

    if (!Number.isInteger(stay.guests) || stay.guests < 1) {
      problems.push(`${where}: guests must be a whole number of 1 or more`);
    }

    for (const field of ['bedrooms', 'beds', 'baths']) {
      if (!Number.isInteger(stay[field]) || stay[field] < 0) {
        problems.push(`${where}: ${field} must be a whole number of 0 or more`);
      }
    }

    if (!stay.amenities?.length) {
      problems.push(`${where}: needs at least one amenity`);
    }

    for (const amenity of stay.amenities ?? []) {
      if (!amenityValues.includes(amenity)) {
        problems.push(`${where}: amenity "${amenity}" is not one of ${amenityValues.join(', ')}`);
      }
    }

    if (new Set(stay.amenities).size !== stay.amenities.length) {
      problems.push(`${where}: amenities have a duplicate`);
    }

    if (stay.petsAllowed !== stay.amenities.includes('pet-friendly')) {
      problems.push(`${where}: petsAllowed must match the pet-friendly amenity`);
    }

    if (!stay.gallery?.length) {
      problems.push(`${where}: needs at least one gallery image`);
    }

    if (!hostKeys.has(stay.host)) {
      problems.push(`${where}: host "${stay.host}" is not in the host list`);
    }

    if (!policyKeys.has(stay.cancellationPolicy)) {
      problems.push(`${where}: cancellationPolicy "${stay.cancellationPolicy}" is not in the policy list`);
    }

    if (!ruleSetKeys.has(stay.houseRules)) {
      problems.push(`${where}: houseRules "${stay.houseRules}" is not in the rule set list`);
    }
  }

  for (const host of hosts) {
    if (!host.name || !host.avatarAlt) {
      problems.push(`host "${host.key}": name and avatarAlt are required`);
    }
  }

  return problems;
}

const problems = validateDemoContent();

if (problems.length) {
  fail(`the demo content does not match the schema:\n  - ${problems.join('\n  - ')}`);
}

if (dryRun) {
  const counts = stayTypes.map((type) => `${stays.filter((stay) => stay.type === type).length} ${type}`);
  console.log(`Dry run, nothing written. ${stays.length} stays (${counts.join(', ')}), ${hosts.length} hosts, ` +
    `${cancellationPolicies.length} cancellation policies, ${houseRuleSets.length} house rule sets.`);
  process.exit(0);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: API_VERSION,
  token,
  useCdn: false,
  perspective: 'published',
});

// No token, exactly how the app reads. A document the public read path hides
// (a dotted id did this) would seed "successfully" and still never show a stay.
const publicClient = createClient({
  projectId,
  dataset,
  apiVersion: API_VERSION,
  useCdn: false,
  perspective: 'published',
});

const imageCache = new Map();
let imagesProcessed = 0;
let imageCount = 0;

function imageUrl(seed, width, height) {
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

async function downloadImage(url) {
  let lastError;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`could not download ${url} (${lastError?.message ?? 'unknown error'})`);
}

async function uploadImage({ url, filename, alt }) {
  if (imageCache.has(url)) {
    return imageCache.get(url);
  }

  const body = await downloadImage(url);
  const asset = await client.assets.upload('image', body, { filename, contentType: 'image/jpeg' });
  const image = { _type: 'image', asset: { _type: 'reference', _ref: asset._id }, alt };

  imageCache.set(url, image);
  imagesProcessed += 1;
  process.stdout.write(`\rUploading images ${imagesProcessed}/${imageCount}`);

  return image;
}

async function runWithConcurrency(items, limit, worker) {
  const queue = [...items];

  await Promise.all(
    Array.from({ length: Math.min(limit, queue.length) }, async () => {
      while (queue.length) {
        await worker(queue.shift());
      }
    }),
  );
}

function capitalise(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function referenceTo(_ref) {
  return { _type: 'reference', _ref, _weak: true };
}

function stayImageJob(stay, index) {
  return {
    url: imageUrl(`${stay.slug}-${index + 1}`, 1200, 900),
    filename: `${stay.slug}-${index + 1}.jpg`,
    alt: `${capitalise(stay.gallery[index])} at ${stay.name}`,
  };
}

function hostImageJob(host) {
  return {
    url: imageUrl(host.avatarSeed, 400, 400),
    filename: `${host.avatarSeed}.jpg`,
    alt: host.avatarAlt,
  };
}

// Every image is warmed in parallel first, so the document build below only ever
// reads from the cache. Uploading the same bytes twice returns the same asset,
// so a repeat run does not pile up duplicate files.
async function uploadAllImages() {
  const jobs = [
    ...hosts.map(hostImageJob),
    ...stays.flatMap((stay) => stay.gallery.map((_, index) => stayImageJob(stay, index))),
  ];

  imageCount = jobs.length;
  await runWithConcurrency(jobs, IMAGE_CONCURRENCY, uploadImage);
  process.stdout.write(`\rUploaded or reused ${imagesProcessed} images.        \n`);
}

async function buildDocuments() {
  const documents = [];

  for (const policy of cancellationPolicies) {
    documents.push({
      _id: cancellationPolicyId(policy.key),
      _type: 'cancellationPolicy',
      title: policy.title,
      summary: policy.summary,
      body: policy.body,
    });
  }

  for (const rules of houseRuleSets) {
    documents.push({
      _id: houseRulesId(rules.key),
      _type: 'houseRules',
      name: rules.name,
      rules: rules.rules,
    });
  }

  for (const host of hosts) {
    documents.push({
      _id: hostId(host.key),
      _type: 'host',
      name: host.name,
      superhost: host.superhost,
      avatar: await uploadImage(hostImageJob(host)),
    });
  }

  for (const stay of stays) {
    const gallery = [];

    for (const index of stay.gallery.keys()) {
      const image = await uploadImage(stayImageJob(stay, index));

      gallery.push({
        _type: 'galleryImage',
        _key: `gallery-${index + 1}`,
        image,
        alt: image.alt,
      });
    }

    documents.push({
      _id: stayId(stay.slug),
      _type: 'stay',
      name: stay.name,
      slug: { _type: 'slug', current: stay.slug },
      type: stay.type,
      summary: stay.summary,
      city: stay.city,
      region: stay.region,
      country: 'United States',
      pricePerNight: stay.pricePerNight,
      rating: stay.rating,
      reviewCount: stay.reviewCount,
      guests: stay.guests,
      bedrooms: stay.bedrooms,
      beds: stay.beds,
      baths: stay.baths,
      petsAllowed: stay.petsAllowed,
      amenities: stay.amenities,
      gallery,
      checkInTime: stay.checkInTime,
      checkOutTime: stay.checkOutTime,
      host: referenceTo(hostId(stay.host)),
      cancellationPolicy: referenceTo(cancellationPolicyId(stay.cancellationPolicy)),
      houseRules: referenceTo(houseRulesId(stay.houseRules)),
    });
  }

  return documents;
}

// Reads the seeded stays back through references, the way the feed and detail
// queries in src/sanity/groq.ts do, so a broken reference or a missing field
// shows up here instead of as an empty screen.
async function verifySeed(documents) {
  const ids = documents.map((document) => document._id);
  const rows = await client.fetch(
    `*[_id in $ids]{
      _id,
      _type,
      type,
      name,
      "slug": slug.current,
      "hostName": host->name,
      "cancellationPolicyTitle": cancellationPolicy->title,
      "houseRuleSetName": houseRules->name,
      "galleryCount": count(gallery[]),
      "amenityCount": count(amenities)
    }`,
    { ids },
  );
  const byId = new Map(rows.map((row) => [row._id, row]));
  const failures = [];

  const publicIds = new Set(
    await publicClient.fetch(`*[_id in $ids]._id`, { ids }),
  );

  for (const id of ids) {
    if (!byId.has(id)) {
      failures.push(`${id} was not found after writing`);
    }

    if (!publicIds.has(id)) {
      failures.push(`${id} is not readable without a token, so the app cannot load it`);
    }
  }

  for (const stay of stays) {
    const row = byId.get(stayId(stay.slug));

    if (!row) {
      continue;
    }

    if (row.slug !== stay.slug) {
      failures.push(`${row._id}: slug reads back as "${row.slug}"`);
    }

    if (!row.hostName) {
      failures.push(`${row._id}: host reference does not resolve`);
    }

    if (!row.cancellationPolicyTitle) {
      failures.push(`${row._id}: cancellation policy reference does not resolve`);
    }

    if (!row.houseRuleSetName) {
      failures.push(`${row._id}: house rules reference does not resolve`);
    }

    if (row.galleryCount < 1) {
      failures.push(`${row._id}: gallery is empty`);
    }

    if (row.amenityCount < 1) {
      failures.push(`${row._id}: amenities are empty`);
    }
  }

  return failures;
}

async function main() {
  await uploadAllImages();

  const documents = await buildDocuments();

  let transaction = client.transaction();

  for (const document of documents) {
    transaction = transaction.createOrReplace(document);
  }

  await transaction.commit({ visibility: 'sync' });

  const failures = await verifySeed(documents);

  if (failures.length) {
    fail(`the documents were written but did not read back cleanly:\n  - ${failures.join('\n  - ')}`);
  }

  const counts = stayTypes.map(
    (type) => `${stays.filter((stay) => stay.type === type).length} ${type}`,
  );

  console.log(
    `Seeded ${stays.length} stays (${counts.join(', ')}), ${hosts.length} hosts, ` +
      `${cancellationPolicies.length} cancellation policies and ${houseRuleSets.length} house rule sets ` +
      `into ${projectId}/${dataset}. Every stay reads back with its host, cancellation policy, ` +
      `house rules, gallery and amenities.`,
  );
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});

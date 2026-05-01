#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const registryPath = path.join(rootDir, "lib", "staticContentRegistry.ts");
const outputSqlPath = path.join(rootDir, "worker-api", "scripts", "seed-static-content.sql");

const pageFileMap = {
  home: path.join(rootDir, "index.html"),
  about: path.join(rootDir, "about.html"),
  services: path.join(rootDir, "services.html"),
  contact: path.join(rootDir, "contact.html"),
  portfolio: path.join(rootDir, "portfolio.html"),
};

function decodeHtmlEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normalizeText(value) {
  return decodeHtmlEntities(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+\n/g, "\n")
      .replace(/\n\s+/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim()
  );
}

function escapeSql(value) {
  return value.replace(/'/g, "''");
}

function extractRegistryEntries(registrySource) {
  const entryRegex =
    /entry\(\{\s*key:\s*"([^"]+)",\s*pageId:\s*"([^"]+)",\s*scope:\s*"([^"]+)",\s*fieldType:\s*"([^"]+)"/g;
  const entries = [];
  let match;
  while ((match = entryRegex.exec(registrySource)) !== null) {
    entries.push({
      key: match[1],
      pageId: match[2],
      scope: match[3],
      fieldType: match[4],
    });
  }
  return entries;
}

function getNodeMarkupByKey(html, contentKey) {
  const key = contentKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pairedRegex = new RegExp(
    `<([a-zA-Z0-9]+)([^>]*?\\bdata-content-key="${key}"[^>]*)>([\\s\\S]*?)<\\/\\1>`,
    "i"
  );
  const pairedMatch = pairedRegex.exec(html);
  if (pairedMatch) {
    return {
      tag: pairedMatch[1].toLowerCase(),
      attrs: pairedMatch[2],
      inner: pairedMatch[3],
      outer: pairedMatch[0],
      isPaired: true,
    };
  }

  const singleRegex = new RegExp(
    `<([a-zA-Z0-9]+)([^>]*?\\bdata-content-key="${key}"[^>]*)\\/>|<([a-zA-Z0-9]+)([^>]*?\\bdata-content-key="${key}"[^>]*)>`,
    "i"
  );
  const singleMatch = singleRegex.exec(html);
  if (singleMatch) {
    const tag = (singleMatch[1] || singleMatch[3] || "").toLowerCase();
    const attrs = singleMatch[2] || singleMatch[4] || "";
    return { tag, attrs, inner: "", outer: singleMatch[0], isPaired: false };
  }

  return null;
}

function getAttr(attrs, attrName) {
  const attrRegex = new RegExp(`${attrName}="([^"]*)"`, "i");
  const match = attrRegex.exec(attrs);
  return match ? decodeHtmlEntities(match[1]) : "";
}

function extractStringListFromContainer(markup) {
  const list = [];
  const itemRegex = /<div[^>]*class="[^"]*service-feature[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  let match;
  while ((match = itemRegex.exec(markup)) !== null) {
    const text = normalizeText(match[1]);
    if (text) list.push(text);
  }
  if (list.length > 0) return list;

  const nextStepsRegex =
    /<div[^>]*font-size:0\.85rem[^>]*>([\s\S]*?)<\/div>/gi;
  while ((match = nextStepsRegex.exec(markup)) !== null) {
    const text = normalizeText(match[1]);
    if (text) list.push(text);
  }
  if (list.length > 0) return list;

  const optionRegex = /<option[^>]*>([\s\S]*?)<\/option>/gi;
  while ((match = optionRegex.exec(markup)) !== null) {
    const text = normalizeText(match[1]);
    if (text) list.push(text);
  }
  return list;
}

function extractFaqItems(markup) {
  const items = [];
  const detailsRegex = /<details[^>]*>[\s\S]*?<\/details>/gi;
  const questionRegex = /<summary[^>]*>([\s\S]*?)<span[^>]*class="faq-icon"[^>]*>\+<\/span><\/summary>/i;
  const answerRegex = /<div[^>]*class="faq-a"[^>]*>([\s\S]*?)<\/div>/i;

  let match;
  while ((match = detailsRegex.exec(markup)) !== null) {
    const details = match[0];
    const questionMatch = questionRegex.exec(details);
    const answerMatch = answerRegex.exec(details);
    const question = questionMatch ? normalizeText(questionMatch[1]) : "";
    const answer = answerMatch ? normalizeText(answerMatch[1]) : "";
    if (question && answer) items.push({ question, answer });
  }
  return items;
}

function extractTeamMembers(markup) {
  const members = [];
  const cardRegex = /<div[^>]*class="team-card[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi;
  let cardMatch;
  let sortOrder = 1;
  while ((cardMatch = cardRegex.exec(markup)) !== null) {
    const card = cardMatch[0];
    const initialsMatch = /<div[^>]*class="team-avatar-initials"[^>]*>([\s\S]*?)<\/div>/i.exec(card);
    const styleMatch = /<div[^>]*class="team-avatar-initials"[^>]*style="([^"]+)"[^>]*>/i.exec(card);
    const nameMatch = /<div[^>]*class="team-name"[^>]*>([\s\S]*?)<\/div>/i.exec(card);
    const roleMatch = /<div[^>]*class="team-role"[^>]*>([\s\S]*?)<\/div>/i.exec(card);
    const bioMatch = /<div[^>]*class="team-bio"[^>]*>([\s\S]*?)<\/div>/i.exec(card);

    const initials = initialsMatch ? normalizeText(initialsMatch[1]) : "";
    const name = nameMatch ? normalizeText(nameMatch[1]) : "";
    const role = roleMatch ? normalizeText(roleMatch[1]) : "";
    const bio = bioMatch ? normalizeText(bioMatch[1]) : "";
    if (!name) continue;

    const id = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    members.push({
      id,
      initials,
      name,
      role,
      bio,
      accentStyle: styleMatch ? decodeHtmlEntities(styleMatch[1]) : "",
      sortOrder,
      isActive: true,
    });
    sortOrder += 1;
  }
  return members;
}

function extractStructuredList(markup) {
  const items = [];
  const itemRegex = /<div[^>]*class="stack-item"[^>]*>\s*<div[^>]*class="stack-category"[^>]*>([\s\S]*?)<\/div>\s*([\s\S]*?)<\/div>/gi;
  let match;
  while ((match = itemRegex.exec(markup)) !== null) {
    const category = normalizeText(match[1]);
    const label = normalizeText(match[2]);
    if (category && label) items.push({ category, label });
  }
  return items;
}

function valueForEntry(entry, htmlByPage) {
  const pageKey = entry.pageId === "global" ? "home" : entry.pageId;
  const html = htmlByPage[pageKey];
  if (!html) return null;
  const markup = getNodeMarkupByKey(html, entry.key);
  if (!markup) return null;

  if (entry.fieldType === "team_members") return extractTeamMembers(markup.outer);
  if (entry.fieldType === "faq_items") return extractFaqItems(markup.outer);
  if (entry.fieldType === "structured_list") return extractStructuredList(markup.outer);

  if (entry.fieldType === "string_list") {
    if (markup.tag === "select") {
      return extractStringListFromContainer(markup.outer);
    }
    return extractStringListFromContainer(markup.outer);
  }

  if (markup.tag === "input" || markup.tag === "textarea") {
    const placeholder = getAttr(markup.attrs, "placeholder");
    return placeholder || normalizeText(markup.inner);
  }

  return normalizeText(markup.inner);
}

async function main() {
  const registrySource = await readFile(registryPath, "utf8");
  const registryEntries = extractRegistryEntries(registrySource);
  if (registryEntries.length === 0) {
    throw new Error("No registry entries found. Cannot seed static content.");
  }

  const htmlByPage = {};
  for (const [pageId, filePath] of Object.entries(pageFileMap)) {
    htmlByPage[pageId] = await readFile(filePath, "utf8");
  }

  const now = new Date().toISOString();
  const sqlLines = [
    "-- Generated by worker-api/scripts/seed-static-content.mjs",
    "PRAGMA foreign_keys = ON;",
  ];

  let seededCount = 0;
  for (const entry of registryEntries) {
    const value = valueForEntry(entry, htmlByPage);
    if (value == null) continue;
    const valueJson = JSON.stringify(value);
    sqlLines.push(
      `INSERT INTO static_content (content_key, page_id, scope, field_type, value_json, created_at, updated_at)
VALUES ('${escapeSql(entry.key)}', '${escapeSql(entry.pageId)}', '${escapeSql(entry.scope)}', '${escapeSql(entry.fieldType)}', '${escapeSql(valueJson)}', '${escapeSql(now)}', '${escapeSql(now)}')
ON CONFLICT(content_key) DO UPDATE SET
  page_id = excluded.page_id,
  scope = excluded.scope,
  field_type = excluded.field_type,
  value_json = excluded.value_json,
  updated_at = excluded.updated_at;`
    );
    seededCount += 1;
  }

  await writeFile(outputSqlPath, `${sqlLines.join("\n\n")}\n`, "utf8");
  console.log(`Generated ${outputSqlPath} with ${seededCount} static-content rows.`);
  console.log("Apply with:");
  console.log("  npx wrangler d1 execute jwd-admin-db --local --file ./scripts/seed-static-content.sql");
  console.log("  npx wrangler d1 execute jwd-admin-db --remote --file ./scripts/seed-static-content.sql");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

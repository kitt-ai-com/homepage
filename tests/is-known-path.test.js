import assert from "node:assert/strict";
import test from "node:test";
import { isKnownPath } from "../lib/is-known-path.js";

test("recognizes the homepage root and real top-level pages", () => {
  assert.equal(isKnownPath("/"), true);
  assert.equal(isKnownPath("/about"), true);
  assert.equal(isKnownPath("/about/"), true);
  assert.equal(isKnownPath("/products/sellkitt/"), true);
  assert.equal(isKnownPath("/faq/"), true);
});

test("recognizes robots.txt, sitemap.xml, and llms.txt as tracked files", () => {
  assert.equal(isKnownPath("/robots.txt"), true);
  assert.equal(isKnownPath("/sitemap.xml"), true);
  assert.equal(isKnownPath("/llms.txt"), true);
});

test("rejects vulnerability-scanner probe paths", () => {
  assert.equal(isKnownPath("/.env"), false);
  assert.equal(isKnownPath("/.git/config"), false);
  assert.equal(isKnownPath("/wp-includes/css/buttons.css"), false);
  assert.equal(isKnownPath("/console/"), false);
  assert.equal(isKnownPath("/telescope/requests"), false);
  assert.equal(isKnownPath("/___proxy_subdomain_whm/login"), false);
  assert.equal(isKnownPath("/open/visitors/info/gets"), false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('continue button keeps a readable default foreground on the paper sheet', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const block = css.match(/\.secondary-button\s*\{([^}]*color:[^}]*)\}/)?.[1] || '';

  assert.match(block, /color:\s*#292b27/);
});

test('continue button keeps its paper-sheet appearance while hovered', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const hoverBlock = css.match(/\.secondary-button:hover\s*\{([^}]*)\}/)?.[1] || '';

  assert.match(hoverBlock, /background:\s*transparent/);
  assert.doesNotMatch(hoverBlock, /#3a2c29/);
});

test('memorial view renders the full-screen desk scene and keeps two-step vermilion approval', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

  assert.match(html, /class="scene-frame"/);
  assert.match(html, /class="scene-base-img"[^>]*study-background\.png/);
  assert.match(html, /class="pending-stack-wrap"/);
  assert.match(html, /class="scroll-options"/);
  assert.match(html, /id="seal-button"/);
  assert.match(html, /id="seal-button"[^>]*>确认票拟/);
  assert.match(css, /\.scene-seal-action\[hidden\][^}]*display:\s*none/);
});

test('memorial layout keeps one resource strip and uses the vertical desk composition', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

  assert.equal((html.match(/summary-resources/g) || []).length, 1);
  assert.doesNotMatch(html, /scene-resources/);
  assert.doesNotMatch(html, /sleeve-left|sleeve-right/);
  assert.match(html, /class="scroll-options"/);
  assert.match(html, /class="scroll-question"/);
  assert.match(html, /id="seal-button"[^>]*>确认票拟/);
  assert.match(css, /writing-mode:\s*vertical-rl/);
  assert.doesNotMatch(css, /jingzhou-hall-reference\.jpg/);
});

test('question and choices belong to the open scroll and the stack thins dynamically', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const app = await readFile(new URL('../app.mjs', import.meta.url), 'utf8');

  assert.match(html, /<article class="open-scroll"[\s\S]*<div class="scroll-options"/);
  assert.match(html, /id="pending-stack"[\s\S]*pending-stack-new\.png/);
  assert.match(html, /memorial-signature-reference\.jpg/);
  assert.match(css, /\.pending-stack-img[\s\S]*--removed/);
  assert.match(css, /clip-path:\s*inset\(/);
  assert.match(app, /count <= 0/);
  assert.match(app, /opacity = '0'/);
});

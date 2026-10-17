import test from 'node:test';
import assert from 'node:assert/strict';
import { HISTORY_NOTES } from '../history-notes.mjs';
import { MAINLINE_IDS, MAINLINE_MEMORIALS } from '../mainline.mjs';
import { readFile } from 'node:fs/promises';

test('each of the seven mainline memorials has a concise historical note and real source links', () => {
  assert.deepEqual(Object.keys(HISTORY_NOTES), MAINLINE_IDS);
  for (const id of MAINLINE_IDS) {
    const note = HISTORY_NOTES[id];
    assert.ok([...note.text].length >= 60 && [...note.text].length <= 100, id);
    assert.match(note.text, /推演|游戏|本题/);
    assert.ok(note.sources.length > 0);
    for (const source of note.sources) {
      assert.ok(source.title);
      const url = new URL(source.url);
      assert.equal(url.protocol, 'https:');
      assert.ok(['www.dpm.org.cn', 'www.chnmuseum.cn', 'www.lhp.sdu.edu.cn', 'zh.wikisource.org'].includes(url.hostname));
    }
  }
});

test('mainline and shared UI use proposed opinions rather than imperial approval', async () => {
  const text = MAINLINE_MEMORIALS.map(m => [m.era, m.scene, m.context].join(' ')).join('\n');
  assert.doesNotMatch(text, /批红|朱批|落印|终局批示|先帝遗诏|边镇告急|水旱相继/);
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /批红|朱批|落印|奏折/);
  assert.match(html, /<details class="history-details" id="history-details">/);
  assert.match(html, /了解历史 · 史实小笺/);
  assert.match(html, /资料来源/);
  const mourning = MAINLINE_MEMORIALS.find(m => m.id === 'mourning');
  assert.match(mourning.context, /父亲去世/);
  assert.match(mourning.context, /是否夺情由皇帝决定/);
});

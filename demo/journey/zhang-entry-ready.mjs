// Same-origin first-screen readiness, separate from the protocol handshake.
// Opacity-hidden frames still lay out; no changes to the child game's flow.
export async function waitForZhangIntro(frame, { signal, onStage = () => {} } = {}) {
  const doc = frame.contentDocument;
  const view = frame.contentWindow;
  if (!doc || !view || doc.body?.dataset.screen !== 'intro') throw new Error('小游戏开始页未就绪');
  let rejectAbort;
  const aborted = new Promise((_, reject) => { rejectAbort = reject; });
  const abort = () => rejectAbort(new DOMException('Entry cancelled', 'AbortError'));
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  let raf;
  const check = () => { if (signal?.aborted) throw new DOMException('Entry cancelled', 'AbortError'); };
  try {
    const prepare = async () => {
      const portrait = doc.querySelector('.intro-character img');
      const backdrop = doc.querySelector('.scene-backdrop');
      if (!portrait || !backdrop) throw new Error('缺少首屏素材');
      const urls = [...view.getComputedStyle(backdrop).backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(match => match[1]);
      if (!urls.length) throw new Error('缺少首屏背景');
      const backgrounds = urls.map(url => { const image = new view.Image(); image.src = new URL(url, doc.baseURI).href; return image; });
      await Promise.all([portrait, ...backgrounds].map(async image => {
        await image.decode();
        if (!image.naturalWidth || !image.naturalHeight) throw new Error('首屏图片损坏');
      }));
      check(); onStage('imagesDecoded');
      await doc.fonts.ready;
      check(); onStage('fontsReady');
      // Two consecutive equal layouts, in real frame dimensions, rather than a fixed delay.
      const targets = [portrait, doc.querySelector('#intro-title'), doc.querySelector('#start-button')];
      if (targets.some(node => !node)) throw new Error('缺少首屏内容');
      await new Promise((resolve, reject) => {
        let previous = '';
        const sample = () => {
          try {
            check();
            const rects = targets.map(node => node.getBoundingClientRect());
            if (rects.some(rect => !rect.width || !rect.height)) throw new Error('开始页布局尚未展开');
            const current = JSON.stringify(rects.map(({ x, y, width, height }) => [x, y, width, height]));
            if (current === previous) { resolve(); return; }
            previous = current; raf = requestAnimationFrame(sample);
          } catch (error) { reject(error); }
        };
        raf = requestAnimationFrame(sample);
      });
      check(); onStage('layoutReady');
    };
    await Promise.race([prepare(), aborted]);
  } finally {
    cancelAnimationFrame(raf);
    signal?.removeEventListener('abort', abort);
  }
}

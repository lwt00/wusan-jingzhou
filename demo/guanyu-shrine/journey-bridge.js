/* Optional bridge: standalone play never reads or writes journey progress. */
(() => {
  const query = new URLSearchParams(location.search);
  if (query.get('embed') !== '1' || parent === window) return;
  const session = query.get('session');
  if (!session) return;
  document.querySelector('.brand').href = location.href;
  let sent = false;
  let completed = false;
  const send = action => {
    if (sent) return;
    sent = true;
    parent.postMessage({ channel: 'wusan-guanyu', session, action }, location.origin);
  };
  const nav = document.querySelector('.site-header nav');
  const back = document.createElement('button');
  back.textContent = '返回关羽祠';
  back.addEventListener('click', () => send(completed ? 'complete' : 'cancel'));
  nav.prepend(back);
  window.addEventListener('huarong:complete', () => {
    completed = true;
    const button = document.createElement('button');
    button.className = 'primary-button';
    button.id = 'return-journey';
    button.textContent = '收下印记，返回长卷 →';
    button.addEventListener('click', () => send('complete'));
    document.getElementById('dialog-content').append(button);
    // The return action remains available after closing the culture card.
    back.textContent = '收下印记，返回长卷';
    document.getElementById('play-again').remove();
  }, { once: true });
})();

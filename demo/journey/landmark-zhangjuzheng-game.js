/* Owns only the Zhang iframe. Progress always goes through the existing host. */
(() => {
  window.WusanLandmarkGames.register('zhangjuzheng-memorial', {
    async mount(context) {
      const { mountZhangGame } = await import('./zhangjuzheng-host.mjs');
      if (context.isActive && !context.isActive()) return () => {};
      return mountZhangGame(context);
    }
  });
})();

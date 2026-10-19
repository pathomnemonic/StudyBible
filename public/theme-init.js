// Applies the saved theme before first paint (dark by default) so there is no flash of the wrong colours.
(function () {
  try {
    var t = 'dark';
    var raw = localStorage.getItem('studybible.settings.v1');
    if (raw) t = JSON.parse(raw).theme || 'dark';
    if (t === 'system') t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.dataset.theme = t;
  } catch (e) {
    document.documentElement.dataset.theme = 'dark';
  }
})();

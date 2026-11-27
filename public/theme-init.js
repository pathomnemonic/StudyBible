// Applies the saved theme before first paint (the season theme by default, matching
// DEFAULTS.theme in src/lib/store.ts) so there is no flash of the wrong colours.
(function () {
  // The liturgical season for today, mirroring src/lib/season.ts over src/liturgy/compute.ts
  // (universal calendar), so a 'season' setting resolves before first paint to the same
  // theme the app itself applies on load. The Triduum keeps Lent's look, as in the app.
  function seasonTheme() {
    var DAY = 86400000;
    var now = new Date();
    var y = now.getFullYear();
    var today = Date.UTC(y, now.getMonth(), now.getDate());
    // Gregorian Easter Sunday (Meeus/Jones/Butcher), as in src/liturgy/compute.ts
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    var f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
    var l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    var easter = Date.UTC(y, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1);
    var ash = easter - 46 * DAY; // Ash Wednesday; Lent runs to Easter eve (Triduum included)
    var pentecost = easter + 49 * DAY;
    var jan6 = Date.UTC(y, 0, 6);
    var baptism = jan6 + (7 - new Date(jan6).getUTCDay()) * DAY; // Baptism of the Lord: the Sunday after Jan 6
    var xmas = Date.UTC(y, 11, 25);
    var xmasDow = new Date(xmas).getUTCDay();
    var advent = xmas - (((xmasDow + 7) % 7 || 7) + 21) * DAY; // the fourth Sunday before Christmas
    var s;
    if (today >= xmas || today <= baptism) s = 'christmas';
    else if (today >= advent) s = 'advent';
    else if (today >= ash && today < easter) s = 'lent';
    else if (today >= easter && today <= pentecost) s = 'easter';
    else s = 'ordinary';
    return 'season-' + s;
  }
  try {
    var t = 'season';
    var raw = localStorage.getItem('studybible.settings.v1');
    if (raw) t = JSON.parse(raw).theme || 'season';
    if (t === 'system') {
      var dark = matchMedia('(prefers-color-scheme: dark)').matches;
      var more = matchMedia('(prefers-contrast: more)').matches;
      t = more ? (dark ? 'contrast-dark' : 'contrast') : dark ? 'twilight' : 'dawn';
    }
    if (t === 'season') t = seasonTheme();
    document.documentElement.dataset.theme = t;
  } catch (e) {
    try {
      document.documentElement.dataset.theme = seasonTheme();
    } catch (e2) {
      document.documentElement.dataset.theme = 'twilight';
    }
  }
})();

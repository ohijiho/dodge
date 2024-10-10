const tickRate = 100;

const localStorageScoreBackend = {
  _key: "score/v0.1",
  _cache: null,
  _max: 10,
  _parse(raw) {
    if (!raw) {
      return [];
    }

    try {
      const obj = JSON.parse(raw);
      if (Array.isArray(obj)) {
        const filtered = obj.filter((x) => Number.isFinite(x));
        if (filtered.length !== obj.length) {
          console.warn("invalid values filtered out", obj);
        }
        return filtered;
      }
    } catch (e) {
      console.warn("error while parsing score", e);
    }
    console.warn(`invalid score data: ${raw}`);
    return [];
  },
  _fetch(force = false) {
    if (!force && this._cache) return;

    const raw = localStorage.getItem(this._key);
    this._cache = this._parse(raw);
  },
  _write() {
    localStorage.setItem(this._key, JSON.stringify(this._cache));
  },
  get list() {
    this._fetch();
    return this._cache.slice();
  },
  get highest() {
    this._fetch();
    return this._cache[0] ?? 0;
  },
  record(score) {
    this._fetch();
    this._cache.push(score);
    this._cache.sort((a, b) => b - a);
    this._cache.splice(this._max, 1);
    this._write();
  },
};

const game = new Game(tickRate, localStorageScoreBackend);

game.canvas.style.display = "block";
game.canvas.style.background = "grey";

function resizeCanvas() {
  const canvas = game.canvas;
  const vw = Math.max(
    document.documentElement.clientWidth || 0,
    window.innerWidth || 0,
  );
  const vh = Math.max(
    document.documentElement.clientHeight || 0,
    window.innerHeight || 0,
  );
  canvas.width = vw;
  canvas.height = vh;
}
addEventListener("resize", resizeCanvas);

addEventListener("load", () => {
  document.body.addEventListener("keydown", (e) => {
    if (e.code === "KeyF") {
      if (document.fullscreenElement) document.exitFullscreen();
      else game.canvas.requestFullscreen();
      return;
    }
    game.input("keydown", e);
  });
  for (const type of ["keyup"]) {
    document.body.addEventListener(type, (e) => {
      game.input(type, e);
    });
  }
  for (const type of [
    "mousedown",
    "mouseup",
    "mousemove",
    "touchstart",
    "touchmove",
    "touchend",
  ]) {
    game.canvas.addEventListener(type, (e) => {
      e.preventDefault();
      game.input(type, e);
    });
  }

  document.getElementById("game_container").appendChild(game.canvas);

  setInterval(() => {
    game.tick();
  }, 1000 / tickRate);
  setInterval(() => {
    game.redraw();
  }, 1000 / 60);

  setTimeout(() => {
    resizeCanvas();
    game.redraw();
  }, 0);
});

/* 数据监控平台 · 演示版（纯前端，模拟数据） */
(function () {
  "use strict";

  /* ---------- 顶部时钟 ---------- */
  var clock = document.getElementById("clock");
  function tick() {
    var d = new Date();
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    clock.textContent = p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  }
  tick(); setInterval(tick, 1000);

  /* ---------- KPI 数字滚动 ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var div = parseFloat(el.getAttribute("data-div") || "1");
    var suffix = el.getAttribute("data-suffix") || "";
    var start = 0, dur = 1400, t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = start + (target - start) * eased;
      el.textContent = (val / div).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = (target / div).toFixed(dec) + suffix;
    }
    requestAnimationFrame(step);
  }
  Array.prototype.forEach.call(document.querySelectorAll(".kpi__value"), animateCount);
})();

/* 自动化运维平台 · 演示版（纯前端，模拟数据） */
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
    var start = 0, dur = 1400, t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var pr = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - pr, 3);
      var val = start + (target - start) * eased;
      el.textContent = (val / div).toFixed(dec);
      if (pr < 1) requestAnimationFrame(step);
      else el.textContent = (target / div).toFixed(dec);
    }
    requestAnimationFrame(step);
  }
  Array.prototype.forEach.call(document.querySelectorAll(".kpi__value"), animateCount);

  /* ---------- ECharts 看板（暗色 + 点击钻取） ---------- */
  var pie = null, bar = null;
  var INK = "#e6ecf7", MUTED = "#8b97b8", LINE = "#243150";
  var pieData = [
    { name: "人员管理", value: 35 },
    { name: "风险监控", value: 25 },
    { name: "评论监控", value: 20 },
    { name: "服务管理", value: 20 }
  ];
  var drill = {
    "人员管理": [12, 15, 13, 18, 20, 17, 16],
    "风险监控": [8, 9, 7, 11, 10, 12, 9],
    "评论监控": [6, 7, 5, 8, 9, 7, 6],
    "服务管理": [7, 8, 6, 9, 10, 8, 7]
  };
  var days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

  function renderBar(name) {
    if (!bar) return;
    bar.setOption({
      title: { text: name + " · 近 7 日趋势", left: "center", textStyle: { color: INK, fontSize: 14 } },
      tooltip: { trigger: "axis" },
      grid: { left: 44, right: 16, top: 34, bottom: 26 },
      xAxis: { type: "category", data: days, axisLine: { lineStyle: { color: LINE } }, axisLabel: { color: MUTED } },
      yAxis: { type: "value", axisLine: { lineStyle: { color: LINE } }, axisLabel: { color: MUTED }, splitLine: { lineStyle: { color: "rgba(36,49,80,0.6)" } } },
      series: [{ type: "bar", data: drill[name], itemStyle: { color: "#3b82f6", borderRadius: [4, 4, 0, 0] }, barWidth: "46%" }]
    }, true);
  }

  function initChart() {
    if (!window.echarts || pie) return;
    try {
      pie = echarts.init(document.getElementById("opsPie"));
      bar = echarts.init(document.getElementById("opsBar"));
      pie.setOption({
        title: { text: "系统模块分布", left: "center", textStyle: { color: INK, fontSize: 14 } },
        tooltip: { trigger: "item" },
        legend: { bottom: 0, textStyle: { color: MUTED } },
        series: [{
          type: "pie", radius: ["38%", "62%"], center: ["50%", "45%"], data: pieData,
          label: { color: INK },
          color: ["#3b82f6", "#22d3ee", "#34d399", "#fbbf24"]
        }]
      });
      renderBar("人员管理");
      pie.on("click", function (p) { if (p && p.name) renderBar(p.name); });
    } catch (e) { console.error("initChart error", e); }
  }

  function ensureChart() {
    if (pie) { pie.resize(); bar.resize(); }
    else { initChart(); if (pie) { pie.resize(); bar.resize(); } }
  }

  window.addEventListener("resize", function () {
    if (pie) pie.resize();
    if (bar) bar.resize();
  });

  /* ---------- Vue 导航 ---------- */
  new Vue({
    el: "#app",
    data: { active: "background" },
    methods: {
      onSelect: function (index) {
        this.active = index;
        if (index === "dashboard") {
          var self = this;
          this.$nextTick(function () { ensureChart(); });
        }
      }
    }
  });
})();

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
    { name: "入场离场", value: 30 },
    { name: "服务管理", value: 25 },
    { name: "建单告警", value: 25 },
    { name: "风险管理", value: 20 }
  ];
  var drill = {
    "入场离场": [18, 20, 19, 22, 21, 17, 20],
    "服务管理": [14, 16, 15, 17, 16, 18, 15],
    "建单告警": [9, 11, 8, 12, 10, 9, 11],
    "风险管理": [6, 7, 5, 8, 7, 6, 7]
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
        title: { text: "各模块事件分布", left: "center", textStyle: { color: INK, fontSize: 14 } },
        tooltip: { trigger: "item" },
        legend: { bottom: 0, textStyle: { color: MUTED } },
        series: [{
          type: "pie", radius: ["38%", "62%"], center: ["50%", "45%"], data: pieData,
          label: { color: INK },
          color: ["#3b82f6", "#22d3ee", "#34d399", "#fbbf24"]
        }]
      });
      renderBar("入场离场");
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

  /* ---------- Vue 导航（5 个模块标签） ---------- */
  new Vue({
    el: "#app",
    data: {
      active: "entry",
      entryRows: [
        { name: "张伟", role: "后端开发", in: "08:55", out: "18:30", online: false },
        { name: "李娜", role: "前端开发", in: "09:10", out: "—", online: true },
        { name: "王强", role: "测试", in: "09:02", out: "18:15", online: false },
        { name: "赵敏", role: "运维", in: "08:40", out: "—", online: true },
        { name: "陈杰", role: "算法", in: "09:20", out: "18:40", online: false }
      ],
      serviceRows: [
        { svc: "user-service", type: "微服务", inst: 4, status: "运行中", health: 98 },
        { svc: "order-service", type: "微服务", inst: 3, status: "运行中", health: 99 },
        { svc: "gateway", type: "网关", inst: 2, status: "运行中", health: 100 },
        { svc: "risk-engine", type: "引擎", inst: 2, status: "异常", health: 76 },
        { svc: "notify-service", type: "微服务", inst: 2, status: "运行中", health: 97 }
      ],
      ticketRows: [
        { no: "WD-2041", src: "监控告警", level: "高", status: "已闭环", time: "10-26 09:12" },
        { no: "WD-2042", src: "人工上报", level: "中", status: "处理中", time: "10-26 10:05" },
        { no: "WD-2043", src: "监控告警", level: "低", status: "待处理", time: "10-26 11:20" },
        { no: "WD-2044", src: "日志分析", level: "中", status: "已闭环", time: "10-26 13:40" }
      ],
      riskRows: [
        { item: "数据库主从延迟", level: "高", owner: "王强", status: "处置中", found: "10-25 14:00" },
        { item: "接口超时率升高", level: "中", owner: "李娜", status: "监控中", found: "10-26 09:30" },
        { item: "证书即将过期", level: "中", owner: "赵敏", status: "已闭环", found: "10-24 16:20" },
        { item: "权限越权风险", level: "高", owner: "王强", status: "处置中", found: "10-26 11:00" }
      ]
    },
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

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

  /* ---------- Chart.js 图表（工程表执行打卡） ---------- */
  if (typeof Chart !== "undefined") {
    Chart.defaults.color = "#8b97b8";
    Chart.defaults.font.family = '"PingFang SC","Microsoft YaHei",sans-serif';
    Chart.defaults.borderColor = "rgba(36,49,80,0.6)";
    var gridColor = "rgba(36,49,80,0.6)";

    var barCtx = document.getElementById("chartBar").getContext("2d");
    new Chart(barCtx, {
      type: "bar",
      data: {
        labels: ["月基线切板", "数据库初始化", "日常Bug", "Tomcat部署", "ZooKeeper", "Eureka配置", "停车场入库"],
        datasets: [{
          label: "执行打卡人次",
          data: [42, 38, 65, 30, 28, 22, 17],
          backgroundColor: ["#3b82f6", "#22d3ee", "#34d399", "#fbbf24", "#a78bfa", "#f472b6", "#8b97b8"]
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { color: gridColor } }, y: { grid: { color: gridColor }, beginAtZero: true } }
      }
    });

    var lineCtx = document.getElementById("chartLine").getContext("2d");
    new Chart(lineCtx, {
      type: "line",
      data: {
        labels: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
        datasets: [{
          label: "执行打卡(人次)",
          data: [58, 63, 60, 71, 68, 75, 72],
          borderColor: "#22d3ee",
          backgroundColor: "rgba(34,211,238,0.12)",
          fill: true, tension: 0.35, pointBackgroundColor: "#22d3ee"
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { color: gridColor } }, y: { grid: { color: gridColor }, beginAtZero: true } }
      }
    });

    var donutCtx = document.getElementById("chartDonut").getContext("2d");
    new Chart(donutCtx, {
      type: "doughnut",
      data: {
        labels: ["已打卡执行", "执行中", "待打卡"],
        datasets: [{
          data: [78, 15, 7],
          backgroundColor: ["#34d399", "#22d3ee", "#fbbf24"],
          borderColor: "#141d33", borderWidth: 2
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: "62%", plugins: { legend: { position: "bottom" } } }
    });
  }
})();

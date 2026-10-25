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

  /* ---------- 全国地图数据监控：大区库 / 母库 运维执行前后核对 ---------- */
  var THRESHOLD = 2; // 偏差阈值（%）
  var master = { n: "母库", x: 400, y: 245, before: 23750, after: 23793, unit: "万", s: "ok" };
  var regions = [
    { n: "华北大区库", x: 430, y: 150, before: 3860, after: 3862, unit: "万", s: "ok" },
    { n: "东北大区库", x: 560, y: 110, before: 2140, after: 2138, unit: "万", s: "ok" },
    { n: "华东大区库", x: 600, y: 300, before: 5210, after: 5215, unit: "万", s: "ok" },
    { n: "华南大区库", x: 470, y: 440, before: 4680, after: 4820, unit: "万", s: "warn" },
    { n: "西南大区库", x: 300, y: 360, before: 3120, after: 3121, unit: "万", s: "ok" },
    { n: "西北大区库", x: 250, y: 230, before: 1980, after: 1975, unit: "万", s: "ok" },
    { n: "华中大区库", x: 480, y: 315, before: 2760, after: 2762, unit: "万", s: "ok" }
  ];
  var stText = { ok: "正常", warn: "风险预警" };
  var stCls = { ok: "st--ok", warn: "st--warn" };

  // 连线：母库为中枢，连接各大区库（虚线，表示从属/同步关系）
  var linkSvg = "", nodeSvg = "";
  regions.forEach(function (r) {
    linkSvg += '<line x1="' + master.x + '" y1="' + master.y + '" x2="' + r.x + '" y2="' + r.y +
      '" stroke="rgba(59,130,246,0.30)" stroke-width="1.2" stroke-dasharray="4 4" />';
  });
  [master].concat(regions).forEach(function (c) {
    var isMaster = c === master;
    var nodeCls = c.s === "warn" ? " map__node--warn" : (isMaster ? " map__node--master" : "");
    var r0 = isMaster ? 8 : 5;
    var r1 = isMaster ? 26 : 20;
    nodeSvg +=
      '<g class="map__node' + nodeCls + '">' +
      '<circle class="pulse" cx="' + c.x + '" cy="' + c.y + '" r="' + r0 + '">' +
      '<animate attributeName="r" from="' + r0 + '" to="' + r1 + '" dur="2.2s" repeatCount="indefinite"/>' +
      '<animate attributeName="opacity" from="0.5" to="0" dur="2.2s" repeatCount="indefinite"/>' +
      '</circle>' +
      '<circle class="dot" cx="' + c.x + '" cy="' + c.y + '" r="' + r0 + '"/>' +
      '<text x="' + (c.x + (isMaster ? 12 : 9)) + '" y="' + (c.y + 4) + '">' + c.n + '</text>' +
      '</g>';
  });
  document.getElementById("mapLinks").innerHTML = linkSvg;
  document.getElementById("mapNodes").innerHTML = nodeSvg;

  // 侧栏：大区库 / 母库 执行前后核对卡片
  var all = [master].concat(regions);
  document.getElementById("regionList").innerHTML = all.map(function (c) {
    var d = ((c.after - c.before) / c.before) * 100;
    var sign = d >= 0 ? "+" : "";
    return '<li>' +
      '<div class="rc__top"><span>' + c.n + '</span>' +
      '<span class="st ' + stCls[c.s] + '">' + stText[c.s] + '</span></div>' +
      '<div class="rc__num">' + c.before + ' → ' + c.after + ' ' + c.unit +
      ' · Δ ' + sign + d.toFixed(2) + '%</div>' +
      '</li>';
  }).join("");

  /* ---------- 执行监控事件流（运维执行前后核对） ---------- */
  var feed = document.getElementById("eventFeed");
  var events = [
    ["华东大区库", "运维执行完成，前后数量核对一致（5210→5215 万）"],
    ["华南大区库", "执行后偏差 +2.99%，超 " + THRESHOLD + "% 阈值，触发风险预警"],
    ["母库", "增量同步完成，总量 " + (master.after / 10000).toFixed(3) + " 亿，一致率 98.7%"],
    ["华北大区库", "月基线切板预热完成，等待运维执行"],
    ["西北大区库", "执行后数量 -0.25%，阈值内，正常"],
    ["西南大区库", "初始化校验通过，无风险"],
    ["华中大区库", "批处理执行中，已入库 2762 万"],
    ["东北大区库", "执行前后偏差 -0.09%，巡检通过"]
  ];
  var ei = 0;
  function pushEvent() {
    var e = events[ei % events.length]; ei++;
    var li = document.createElement("li");
    li.innerHTML = '<b>' + e[0] + '</b> · ' + e[1];
    feed.insertBefore(li, feed.firstChild);
    while (feed.children.length > 7) feed.removeChild(feed.lastChild);
  }
  for (var k = 0; k < 5; k++) pushEvent();
  setInterval(pushEvent, 2600);

  /* ---------- Chart.js 图表 ---------- */
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

  /* ---------- 停车场数据自动入库 ---------- */
  var plates = ["京A", "沪B", "粤C", "渝D", "川E", "苏F", "浙G", "陕H"];
  var parks = ["世纪城 P1", "滨江枢纽", "环球中心", "高新 A 区", "机场 T3", "万达广场", "科技园 B2"];
  var stages = ["采集中", "解析中", "校验中", "已入库"];
  var stageTag = ["tag--coll", "tag--parse", "tag--check", "tag--done"];
  var rows = [];
  var ingestCount = 0;
  var rowsEl = document.getElementById("ingestRows");
  var countEl = document.getElementById("ingestCount");

  function rand(a) { return a[Math.floor(Math.random() * a.length)]; }
  function nowTime() {
    var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; };
    return p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  }
  function addRecord() {
    rows.unshift({
      plate: rand(plates) + "·" + (10000 + Math.floor(Math.random() * 89999)),
      park: rand(parks), time: nowTime(), stage: 0
    });
    if (rows.length > 8) rows.pop();
  }
  function renderRows() {
    rowsEl.innerHTML = rows.map(function (r) {
      var i = r.stage;
      return '<div class="row"><span>' + r.plate + '</span><span>' + r.park +
        '</span><span>' + r.time + '</span><span><span class="tag ' + stageTag[i] + '">' +
        stages[i] + '</span></span></div>';
    }).join("");
  }
  addRecord(); renderRows();
  setInterval(function () {
    // 推进所有记录状态
    rows.forEach(function (r) {
      if (r.stage < 3) {
        r.stage++;
        if (r.stage === 3) { ingestCount++; countEl.textContent = ingestCount; }
      }
    });
    addRecord();
    renderRows();
  }, 1100);

  /* 流水线高亮流动 */
  var stageEls = document.querySelectorAll("#pipeline .stage");
  var si = 0;
  setInterval(function () {
    stageEls.forEach(function (el) { el.classList.remove("is-active"); });
    if (stageEls[si]) stageEls[si].classList.add("is-active");
    si = (si + 1) % stageEls.length;
  }, 1000);
})();

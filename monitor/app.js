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

  /* ---------- 全国地图监测网络 ---------- */
  var cities = [
    { n: "北京", x: 430, y: 170, s: "ok" },
    { n: "哈尔滨", x: 565, y: 80, s: "ok" },
    { n: "沈阳", x: 545, y: 140, s: "ok" },
    { n: "乌鲁木齐", x: 150, y: 190, s: "warn" },
    { n: "拉萨", x: 225, y: 330, s: "ok" },
    { n: "成都", x: 320, y: 320, s: "ok" },
    { n: "西安", x: 370, y: 260, s: "ok" },
    { n: "武汉", x: 470, y: 300, s: "ok" },
    { n: "上海", x: 585, y: 290, s: "ok" },
    { n: "广州", x: 480, y: 425, s: "warn" },
    { n: "昆明", x: 350, y: 415, s: "coll" },
    { n: "重庆", x: 385, y: 345, s: "ok" }
  ];
  var links = [
    [0, 8], [0, 9], [0, 5], [0, 3], [8, 7], [9, 10], [6, 0], [1, 2]
  ];
  var cls = { ok: "", warn: " map__node--warn", coll: " map__node--coll" };

  var linkSvg = "", nodeSvg = "";
  links.forEach(function (l) {
    var a = cities[l[0]], b = cities[l[1]];
    linkSvg += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y +
      '" stroke="rgba(59,130,246,0.35)" stroke-width="1.2" />';
  });
  cities.forEach(function (c) {
    var stCls = cls[c.s] || "";
    nodeSvg +=
      '<g class="map__node' + stCls + '">' +
      '<circle class="pulse" cx="' + c.x + '" cy="' + c.y + '" r="5">' +
      '<animate attributeName="r" from="5" to="20" dur="2.2s" repeatCount="indefinite"/>' +
      '<animate attributeName="opacity" from="0.5" to="0" dur="2.2s" repeatCount="indefinite"/>' +
      '</circle>' +
      '<circle class="dot" cx="' + c.x + '" cy="' + c.y + '" r="4.5"/>' +
      '<text x="' + (c.x + 9) + '" y="' + (c.y + 4) + '">' + c.n + '</text>' +
      '</g>';
  });
  document.getElementById("mapLinks").innerHTML = linkSvg;
  document.getElementById("mapNodes").innerHTML = nodeSvg;

  /* ---------- 区域状态 ---------- */
  var regions = [
    { n: "京津冀", s: "ok" }, { n: "长三角", s: "ok" },
    { n: "珠三角", s: "warn" }, { n: "成渝", s: "ok" },
    { n: "西北", s: "warn" }, { n: "西南", s: "coll" }
  ];
  var stText = { ok: "正常", warn: "预警", coll: "采集中" };
  var stCls = { ok: "st--ok", warn: "st--warn", coll: "st--coll" };
  document.getElementById("regionList").innerHTML = regions.map(function (r) {
    return '<li><span>' + r.n + '</span><span class="st ' + stCls[r.s] + '">' + stText[r.s] + '</span></li>';
  }).join("");

  /* ---------- 实时事件流 ---------- */
  var feed = document.getElementById("eventFeed");
  var events = [
    ["北京", "点位心跳正常，数据上报延迟 38ms"],
    ["广州", "识别到数据洪峰，已自动限流"],
    ["乌鲁木齐", "链路抖动，正在重连采集代理"],
    ["西南", "新停车场接入，开始历史数据回补"],
    ["上海", "打卡峰值 1.2 万/分钟，服务稳定"],
    ["成都", "数据校验规则更新，生效中"],
    ["武汉", "异常点位已自动隔离并告警"],
    ["西安", "夜间批处理完成，入库 9.6 万条"]
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
        labels: ["京津冀", "长三角", "珠三角", "成渝", "其他"],
        datasets: [{
          label: "打卡人数",
          data: [320, 410, 380, 210, 150],
          backgroundColor: ["#3b82f6", "#22d3ee", "#34d399", "#fbbf24", "#8b97b8"]
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
          label: "打卡(百人)",
          data: [28, 31, 29, 34, 33, 37, 35],
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
        labels: ["正常", "迟到", "缺卡"],
        datasets: [{
          data: [82, 12, 6],
          backgroundColor: ["#34d399", "#fbbf24", "#f87171"],
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

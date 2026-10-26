/* 数据监控平台 · 演示版 —— 左栏导航 + 三大模块视图（Vue + Element UI） */
(function () {
  "use strict";
  if (typeof Vue === "undefined" || typeof ELEMENT === "undefined") return;
  Vue.use(ELEMENT);

  /* ---------- 模块一：全国地图数据监控（大区库/母库 执行前后核对 + 风险预警） ---------- */
  var THRESHOLD = 2; // 偏差阈值（%）
  var master = { name: "母库", type: "母库", before: 23750, after: 23793 };
  var regions = [
    { name: "华北大区库", type: "大区库", before: 3860, after: 3862 },
    { name: "东北大区库", type: "大区库", before: 2140, after: 2138 },
    { name: "华东大区库", type: "大区库", before: 5210, after: 5215 },
    { name: "华南大区库", type: "大区库", before: 4680, after: 4820 },
    { name: "西南大区库", type: "大区库", before: 3120, after: 3121 },
    { name: "西北大区库", type: "大区库", before: 1980, after: 1975 },
    { name: "华中大区库", type: "大区库", before: 2760, after: 2762 }
  ];
  var mapRows = [master].concat(regions).map(function (c) {
    var d = ((c.after - c.before) / c.before) * 100;
    return {
      name: c.name, type: c.type,
      before: c.before, after: c.after,
      delta: d.toFixed(2),
      warn: Math.abs(d) > THRESHOLD
    };
  });

  /* ---------- 模块二：工程表执行打卡实例 ---------- */
  var clockRows = [
    { time: "02:00-03:00", who: "小明", task: "执行母库批处理 SQL", status: "已打卡" },
    { time: "03:00-04:00", who: "小红", task: "执行 Redis 初始化", status: "已打卡" },
    { time: "04:00-05:00", who: "小王", task: "执行服务器重启", status: "已打卡" },
    { time: "05:00-06:00", who: "小李", task: "执行 Tomcat 部署", status: "已打卡" },
    { time: "06:00-07:00", who: "小张", task: "执行 Eureka 配置", status: "已打卡" },
    { time: "01:00-02:00", who: "小赵", task: "执行数据库备份", status: "已打卡" }
  ];

  /* ---------- 模块三：停车场数据自动入库（含全部入库状态枚举） ---------- */
  var STATUS_CLASS = {
    "采集中": "st-coll", "归档中": "st-arch", "下载中": "st-dl", "解压中": "st-unzip",
    "入库中": "st-ing", "入库完成": "st-done", "下载失败": "st-dlfail",
    "解压失败": "st-unzfail", "入库失败": "st-infail"
  };
  var parkRows = [
    { plate: "京A·12883", park: "世纪城 P1", time: "08:12", status: "入库完成" },
    { plate: "沪B·45217", park: "滨江枢纽", time: "08:15", status: "入库中" },
    { plate: "粤C·77802", park: "环球中心", time: "08:18", status: "下载中" },
    { plate: "渝D·33019", park: "高新 A 区", time: "08:21", status: "解压中" },
    { plate: "川E·66124", park: "机场 T3", time: "08:24", status: "采集中" },
    { plate: "苏F·90543", park: "万达广场", time: "08:27", status: "归档中" },
    { plate: "浙G·21765", park: "科技园 B2", time: "08:30", status: "入库完成" },
    { plate: "陕H·38452", park: "世纪城 P2", time: "08:33", status: "下载失败" },
    { plate: "京A·55631", park: "滨江枢纽", time: "08:36", status: "解压失败" },
    { plate: "沪B·14908", park: "环球中心", time: "08:39", status: "入库失败" }
  ];

  new Vue({
    el: "#app",
    data: {
      active: "map",
      mapRows: mapRows,
      clockRows: clockRows,
      parkRows: parkRows,
      dialogVisible: false,
      importText: "",
      evidenceVisible: false,
      evidenceRow: null,
      evidenceTime: ""
    },
    computed: {
      parkDone: function () {
        return this.parkRows.filter(function (p) { return p.status === "入库完成"; }).length;
      }
    },
    methods: {
      onSelect: function (index) { this.active = index; },
      rowClass: function (scope) { return scope.row.warn ? "row-warn" : ""; },
      viewEvidence: function (row) {
        this.evidenceRow = row;
        var d = new Date();
        var p = function (n) { return (n < 10 ? "0" : "") + n; };
        this.evidenceTime = d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) +
          " " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
        this.evidenceVisible = true;
      },
      statusClass: function (s) { return STATUS_CLASS[s] || ""; },
      importData: function () {
        var text = (this.importText || "").trim();
        if (!text) return;
        var self = this;
        text.split(/\r?\n/).forEach(function (line) {
          var parts = line.split(/[,，\t]/).map(function (x) { return x.trim(); });
          if (parts.length >= 2 && parts[0]) {
            self.clockRows.push({
              time: parts[0],
              who: parts[1] || "—",
              task: (parts.slice(2).join(" ") || "—"),
              status: "已打卡"
            });
          }
        });
        this.importText = "";
        this.dialogVisible = false;
      },
      handleFile: function (e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        var self = this;
        var reader = new FileReader();
        reader.onload = function () { self.importText = String(reader.result || ""); };
        reader.readAsText(file, "utf-8");
        e.target.value = "";
      },
      downloadTemplate: function () {
        var content = "时间段,执行人,执行内容\n" +
          "02:00-03:00,小明,执行母库批处理 SQL\n" +
          "03:00-04:00,小红,执行 Redis 初始化\n" +
          "04:00-05:00,小王,执行服务器重启\n";
        var blob = new Blob([content], { type: "text/csv;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url; a.download = "工程表模板.csv";
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
      }
    }
  });
})();

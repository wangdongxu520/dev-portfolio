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
    var start = 0, dur = 1400, t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var pr = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - pr, 3);
      var val = start + (target - start) * eased;
      el.textContent = val.toFixed(dec);
      if (pr < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(dec);
    }
    requestAnimationFrame(step);
  }
  Array.prototype.forEach.call(document.querySelectorAll(".kpi__value"), animateCount);

  /* ---------- 图表 ---------- */
  var orgBar = null, sentPie = null, trendLine = null;
  var INK = "#e6ecf7", MUTED = "#8b97b8", LINE = "#243150";

  var days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

  function initOrgBar(chart, orgRows, onPick) {
    chart.setOption({
      title: { text: "各机构评论量（点击下钻）", left: "center", textStyle: { color: INK, fontSize: 14 } },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { left: 56, right: 20, top: 36, bottom: 46 },
      xAxis: {
        type: "category",
        data: orgRows.map(function (r) { return r.org; }),
        axisLine: { lineStyle: { color: LINE } },
        axisLabel: { color: MUTED, rotate: 32, fontSize: 11 }
      },
      yAxis: {
        type: "value",
        name: "条",
        nameTextStyle: { color: MUTED },
        axisLine: { lineStyle: { color: LINE } },
        axisLabel: { color: MUTED },
        splitLine: { lineStyle: { color: "rgba(36,49,80,0.6)" } }
      },
      series: [{
        type: "bar",
        data: orgRows.map(function (r) { return r.total; }),
        itemStyle: { color: "#3b82f6", borderRadius: [4, 4, 0, 0] },
        barWidth: "52%"
      }]
    });
    chart.off("click");
    chart.on("click", function (p) {
      if (p && p.name && onPick) onPick(p.name);
    });
  }

  function initSentPie(chart, rows) {
    var sum = function (k) {
      return rows.reduce(function (a, r) { return a + r[k]; }, 0);
    };
    chart.setOption({
      title: { text: "评论情感倾向分布", left: "center", textStyle: { color: INK, fontSize: 14 } },
      tooltip: { trigger: "item", formatter: "{b}：{c} 条（{d}%）" },
      legend: { bottom: 0, textStyle: { color: MUTED } },
      series: [{
        type: "pie",
        radius: ["40%", "64%"],
        center: ["50%", "46%"],
        data: [
          { name: "正面", value: sum("pos") },
          { name: "中性", value: sum("neu") },
          { name: "负面", value: sum("neg") }
        ],
        label: { color: INK, formatter: "{b}\n{c}" },
        color: ["#34d399", "#3b82f6", "#f87171"]
      }]
    });
  }

  function initTrendLine(chart) {
    chart.setOption({
      title: { text: "近 7 日评论量与待处理量", left: "center", textStyle: { color: INK, fontSize: 14 } },
      tooltip: { trigger: "axis" },
      legend: { bottom: 0, textStyle: { color: MUTED } },
      grid: { left: 52, right: 52, top: 36, bottom: 40 },
      xAxis: { type: "category", data: days, axisLine: { lineStyle: { color: LINE } }, axisLabel: { color: MUTED } },
      yAxis: [
        { type: "value", name: "评论量", nameTextStyle: { color: MUTED }, axisLine: { lineStyle: { color: LINE } }, axisLabel: { color: MUTED }, splitLine: { lineStyle: { color: "rgba(36,49,80,0.6)" } } },
        { type: "value", name: "待处理", nameTextStyle: { color: MUTED }, axisLine: { lineStyle: { color: LINE } }, axisLabel: { color: MUTED }, splitLine: { show: false } }
      ],
      series: [
        { name: "评论量", type: "bar", data: [412, 388, 456, 501, 479, 336, 298], itemStyle: { color: "#3b82f6", borderRadius: [4, 4, 0, 0] }, barWidth: "44%" },
        { name: "待处理", type: "line", yAxisIndex: 1, data: [31, 27, 35, 42, 38, 24, 21], smooth: true, symbolSize: 6, lineStyle: { width: 2, color: "#fbbf24" }, itemStyle: { color: "#fbbf24" } }
      ]
    });
  }

  function initCharts(vm) {
    if (!window.echarts || orgBar) return;
    try {
      orgBar = echarts.init(document.getElementById("orgBar"));
      sentPie = echarts.init(document.getElementById("sentPie"));
      trendLine = echarts.init(document.getElementById("trendLine"));
      initOrgBar(orgBar, vm.orgRows, function (name) { vm.drillOrg = name; });
      initSentPie(sentPie, vm.orgRows);
      initTrendLine(trendLine);
    } catch (e) { console.error("initCharts error", e); }
  }

  function ensureCharts(vm) {
    if (orgBar) { orgBar.resize(); sentPie.resize(); trendLine.resize(); }
    else initCharts(vm);
  }

  window.addEventListener("resize", function () {
    if (orgBar) { orgBar.resize(); sentPie.resize(); trendLine.resize(); }
  });

  /* ---------- Vue ---------- */
  new Vue({
    el: "#app",
    data: {
      active: "entry",
      drillOrg: "",

      /* 入场离场：人员入职 / 离职 */
      entryRows: [
        { id: "P10238", name: "陈思远", dept: "信息技术部 · 运维工程师", in: "2026-10-27", out: "—", state: "待开通", action: "开通 6 项权限：域账号 / 堡垒机 / 只读库 / 代码仓库 / VPN / 邮箱" },
        { id: "P10237", name: "郑亦凡", dept: "电销中心 · 培训专员", in: "2026-10-27", out: "—", state: "待开通", action: "开通 4 项权限：域账号 / 堡垒机 / 培训系统 / 邮箱" },
        { id: "P10240", name: "黄子昂", dept: "信息技术部 · 数据工程师", in: "2026-10-26", out: "—", state: "已生效", action: "已开通 8 项权限，含数据平台只读角色" },
        { id: "P10235", name: "林晓岚", dept: "车险部 · 电销运营", in: "2026-10-25", out: "—", state: "已生效", action: "已开通 5 项权限，含电销工作台账号" },
        { id: "P10180", name: "何静雯", dept: "信息技术部 · 安全工程师", in: "2022-09-15", out: "2026-10-25", state: "待回收", action: "待回收 8 项权限，账号已临时锁定" },
        { id: "P10188", name: "周海涛", dept: "电销中心 · 坐席主管", in: "2023-04-11", out: "2026-10-24", state: "待回收", action: "待回收 9 项权限，含录音调阅权限" },
        { id: "P10192", name: "许静怡", dept: "客户服务部 · 客服专员", in: "2023-06-02", out: "2026-10-23", state: "已回收", action: "已回收 7 项权限，邮箱与 VPN 已注销" },
        { id: "P10176", name: "马雪松", dept: "理赔部 · 系统管理", in: "2022-11-08", out: "2026-10-22", state: "已回收", action: "已回收 11 项权限，数据库账号已停用" }
      ],

      /* 服务管理：启动 / 停止 */
      serviceRows: [
        { svc: "call-center-core", type: "呼叫平台", sys: "电销系统", inst: 6, state: "运行中", last: "启动 09:12", op: "张启明" },
        { svc: "seat-desktop", type: "坐席工作台", sys: "电销系统", inst: 12, state: "运行中", last: "启动 08:55", op: "张启明" },
        { svc: "outbound-task", type: "外呼调度", sys: "电销系统", inst: 4, state: "停止中", last: "停止 17:40", op: "李沐阳" },
        { svc: "voice-record", type: "录音存储", sys: "电销系统", inst: 8, state: "运行中", last: "启动 09:05", op: "李沐阳" },
        { svc: "crm-core", type: "客户资料中心", sys: "核心业务", inst: 5, state: "运行中", last: "启动 08:40", op: "王思远" },
        { svc: "policy-service", type: "保单服务", sys: "核心业务", inst: 6, state: "运行中", last: "启动 08:45", op: "王思远" },
        { svc: "claim-verify", type: "理赔核验", sys: "核心业务", inst: 3, state: "已停止", last: "停止 16:20", op: "张启明" },
        { svc: "etl-comment", type: "数据入湖任务", sys: "数据平台", inst: 4, state: "运行中", last: "重启 14:05", op: "赵启明" },
        { svc: "batch-report", type: "批量报表任务", sys: "数据平台", inst: 1, state: "已停止", last: "停止 02:00", op: "系统调度" }
      ],
      opRows: [
        { time: "17:42", act: "停止", svc: "outbound-task", way: "自动化编排", res: "成功", cost: "42s", op: "李沐阳" },
        { time: "16:20", act: "停止", svc: "claim-verify", way: "人工审批", res: "成功", cost: "1m12s", op: "张启明" },
        { time: "14:05", act: "重启", svc: "etl-comment", way: "自动化编排", res: "成功", cost: "58s", op: "赵启明" },
        { time: "11:30", act: "启动", svc: "batch-report", way: "定时触发", res: "成功", cost: "26s", op: "系统调度" },
        { time: "09:12", act: "启动", svc: "call-center-core", way: "自动化编排", res: "成功", cost: "1m05s", op: "张启明" }
      ],

      /* 建单告警：人保电销运维 */
      ticketRows: [
        { no: "DX-20261027-014", src: "监控告警", content: "外呼并发数达到阈值 92%", obj: "浙江分公司 · 电销中心", level: "高", state: "处理中", time: "17:22", cost: "—" },
        { no: "DX-20261027-013", src: "监控告警", content: "录音上传失败率升至 3.7%", obj: "广东分公司 · 呼叫平台", level: "高", state: "待派单", time: "17:05", cost: "—" },
        { no: "DX-20261027-011", src: "业务核验", content: "客户资料同步任务缺失记录", obj: "江苏分公司 · 客户中心", level: "中", state: "待验证", time: "16:48", cost: "—" },
        { no: "DX-20261026-088", src: "日志分析", content: "坐席外呼平均超时升高", obj: "山东分公司 · 坐席工作台", level: "中", state: "已闭环", time: "昨日 15:40", cost: "26m" },
        { no: "DX-20261026-076", src: "监控告警", content: "外呼号码资源占用率 78%", obj: "四川分公司 · 外呼平台", level: "低", state: "已闭环", time: "昨日 09:30", cost: "18m" },
        { no: "DX-20261025-061", src: "用户反馈", content: "客户投诉录音无法调阅", obj: "上海分公司 · 客服中心", level: "高", state: "已闭环", time: "前日 20:15", cost: "1h12m" },
        { no: "DX-20261025-054", src: "监控告警", content: "数据库连接池接近上限", obj: "总部 · 核心业务", level: "高", state: "已闭环", time: "前日 16:48", cost: "12m" },
        { no: "DX-20261024-047", src: "业务核验", content: "续期名单推送延迟 40 分钟", obj: "河南分公司 · 业务支持", level: "中", state: "已闭环", time: "前日 10:22", cost: "35m" }
      ],

      /* 风险管理 */
      riskRows: [
        { no: "RK-2026-041", cat: "变更风险", desc: "核心系统停机变更未走审批流即执行", level: "高", impact: "全国", owner: "张启明", state: "处置中", found: "10-26 14:20" },
        { no: "RK-2026-040", cat: "权限风险", desc: "离职人员共享账号未随工单回收", level: "高", impact: "分公司", owner: "王思远", state: "处置中", found: "10-26 10:05" },
        { no: "RK-2026-039", cat: "脚本风险", desc: "批量清理脚本缺少灰度与回滚预案", level: "中", impact: "数据平台", owner: "李沐阳", state: "监控中", found: "10-25 16:42" },
        { no: "RK-2026-038", cat: "数据风险", desc: "评论数据湖缺少分级备份与恢复演练", level: "中", impact: "数据平台", owner: "赵启明", state: "处置中", found: "10-25 09:18" },
        { no: "RK-2026-037", cat: "服务风险", desc: "外呼调度强依赖坐席工作台，缺少降级方案", level: "中", impact: "电销系统", owner: "张启明", state: "监控中", found: "10-24 20:30" },
        { no: "RK-2026-036", cat: "合规风险", desc: "部分运维操作留痕不完整，无法审计追溯", level: "低", impact: "全平台", owner: "何静雯", state: "已闭环", found: "10-23 11:05" },
        { no: "RK-2026-035", cat: "容量风险", desc: "评论采集队列在高峰时段存在积压", level: "低", impact: "数据平台", owner: "赵启明", state: "已闭环", found: "10-22 15:33" }
      ],

      /* 数据看板：全国人保评论数据管理 */
      orgRows: [
        { org: "河北分公司", total: 5826, today: 42, pos: 3980, neu: 1204, neg: 642, todo: 3, rate: "98.1%" },
        { org: "山东分公司", total: 5214, today: 38, pos: 3410, neu: 1180, neg: 624, todo: 2, rate: "97.6%" },
        { org: "江苏分公司", total: 4930, today: 51, pos: 3385, neu: 1024, neg: 521, todo: 5, rate: "96.9%" },
        { org: "广东分公司", total: 4786, today: 47, pos: 3102, neu: 1120, neg: 564, todo: 6, rate: "95.8%" },
        { org: "浙江分公司", total: 4502, today: 44, pos: 3128, neu: 928, neg: 446, todo: 4, rate: "97.2%" },
        { org: "四川分公司", total: 3980, today: 33, pos: 2602, neu: 902, neg: 476, todo: 3, rate: "98.5%" },
        { org: "河南分公司", total: 3604, today: 29, pos: 2410, neu: 802, neg: 392, todo: 2, rate: "98.8%" },
        { org: "上海分公司", total: 3420, today: 31, pos: 2394, neu: 686, neg: 340, todo: 1, rate: "99.2%" },
        { org: "北京总部", total: 2580, today: 25, pos: 1920, neu: 448, neg: 212, todo: 1, rate: "99.6%" }
      ],
      commentDetails: [
        { org: "浙江分公司", ch: "微信小程序", time: "17:12", txt: "理赔进度查询很方便，但影像材料上传偶尔失败", sen: "中性", state: "待回复", owner: "—" },
        { org: "浙江分公司", ch: "电话回访", time: "16:48", txt: "坐席解释清楚，认可我们的处理方案", sen: "正面", state: "已回复", owner: "沈梦洁" },
        { org: "广东分公司", ch: "微信小程序", time: "17:05", txt: "保费扣款成功但保单迟迟未出，需尽快核实", sen: "负面", state: "处理中", owner: "梁家豪" },
        { org: "广东分公司", ch: "APP 评论", time: "15:33", txt: "车险续保比价很方便，客服响应及时", sen: "正面", state: "已回复", owner: "梁家豪" },
        { org: "江苏分公司", ch: "企微客服", time: "16:52", txt: "商业险报价流程步骤略多，建议精简", sen: "中性", state: "处理中", owner: "戴思远" },
        { org: "江苏分公司", ch: "APP 评论", time: "14:20", txt: "一次险理赔时效快，材料线上提交很方便", sen: "正面", state: "已回复", owner: "戴思远" },
        { org: "河北分公司", ch: "电话回访", time: "16:30", txt: "等待回复时间长，客服未一次说清流程", sen: "负面", state: "待回复", owner: "—" },
        { org: "山东分公司", ch: "企微客服", time: "15:47", txt: "业务解释专业，附加服务超出预期", sen: "正面", state: "已回复", owner: "于安然" },
        { org: "上海分公司", ch: "微信小程序", time: "16:10", txt: "人保 APP 的自助理赔入口很好找", sen: "正面", state: "已回复", owner: "秦语桐" },
        { org: "北京总部", ch: "电话回访", time: "11:26", txt: "建议增加电子保单批量下载功能", sen: "中性", state: "处理中", owner: "唐可欣" }
      ]
    },
    computed: {
      detailRows: function () {
        var org = this.drillOrg;
        if (!org) return this.commentDetails;
        return this.commentDetails.filter(function (r) { return r.org === org; });
      }
    },
    methods: {
      onSelect: function (index) {
        this.active = index;
        if (index === "dashboard") {
          var self = this;
          this.$nextTick(function () { ensureCharts(self); });
        }
      }
    }
  });
})();

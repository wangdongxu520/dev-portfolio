/* CI 自动化平台 · 演示版（纯前端，模拟数据） */
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

  /* ---------- 解析 YAML 文本：拆出缩进、键、值 ---------- */
  function parseYaml(raw) {
    var lines = raw.replace(/\r/g, "").split("\n");
    var out = [];
    lines.forEach(function (text, i) {
      var m = /^(\s*)(.*)$/.exec(text);
      var indent = m[1];
      var rest = m[2];
      var item = {
        no: i + 1,
        indent: indent,
        depth: Math.floor(indent.length / 2),
        key: "",
        val: null,
        comment: ""
      };
      if (rest.charAt(0) === "#") {
        item.comment = rest;
      } else {
        var ci = rest.indexOf(":");
        if (ci >= 0) {
          item.key = rest.slice(0, ci);
          item.val = rest.slice(ci + 1).replace(/^\s+/, "");
        } else {
          item.val = rest;
        }
      }
      out.push(item);
    });
    return out;
  }

  var YAML_SRC = [
    "# ci/build.yaml —— 编译任务编排配置",
    "build:",
    "  target: hw-13.0.0",
    "  nodes: 32",
    "  stages:",
    "    - name: baseline",
    "      parallel: true",
    "      jobs:",
    "        - id: chipset",
    "          repo: device/huawei/hw13/chipset",
    "          modules: [soc, radio, camera, modem]",
    "          outputs: [vendor.img]",
    "        - id: custom",
    "          repo: device/huawei/hw13/custom",
    "          modules: [custom-prebuilt, custom-config]",
    "          outputs: [product-overlay]",
    "        - id: bootloader",
    "          repo: device/huawei/bootloader",
    "          modules: [lk, kernel]",
    "          outputs: [fastboot.img]",
    "        - id: base",
    "          repo: platform/frameworks/base",
    "          modules: [framework, art]",
    "          outputs: [system-base]",
    "    - name: system",
    "      parallel: true",
    "      jobs:",
    "        - id: system",
    "          repo: build/soong",
    "          modules: [system-app, priv-app]",
    "          outputs: [system.img]",
    "        - id: product",
    "          repo: device/huawei/hw13/product",
    "          modules: [product-overlay]",
    "          outputs: [product.img]",
    "        - id: vendor",
    "          repo: vendor/huawei",
    "          modules: [prebuilt]",
    "          outputs: [vendor.img]",
    "    - name: pack",
    "      parallel: false",
    "      jobs:",
    "        - id: integrate",
    "          outputs: [super.img]",
    "        - id: sign",
    "          outputs: [signed-images]",
    "        - id: pack",
    "          outputs: [fastboot.img, sdcard.img]"
  ].join("\n");

  new Vue({
    el: "#app",
    data: {
      active: "build",
      detail: null,
      step: 0,
      running: false,
      timer: null,
      yamlLines: parseYaml(YAML_SRC),

      /* 自动编译：ci/build.yaml 缩进结构 → el-tree */
      treeData: [
        {
          id: "build", label: "build · 编译编排", state: "ok", icon: "el-icon-s-platform",
          kind: "根配置", repo: "ci/build.yaml", cost: "38m12s", node: "ci-node-08",
          line: 2, lineEnd: 48,
          logs: [
            "$ ci/build.sh -p hw13 -l hw13-userdebug",
            "[config] ci/build.yaml loaded, 3 stages / 10 jobs",
            "[stage] baseline: 4 jobs dispatched in parallel",
            "[stage] system : 3 jobs dispatched in parallel",
            "[stage] pack   : 3 jobs executed in sequence",
            "[done] build finished in 38m12s, 0 failed"
          ],
          children: [
            {
              id: "stages", label: "stages · 阶段列表", state: "ok", icon: "el-icon-files",
              kind: "配置节点", repo: "ci/build.yaml", cost: "—", node: "—",
              line: 5, lineEnd: 48,
              logs: ["stages: baseline / system / pack"],
              children: []
            }
          ]
        }
      ],
      stageData: [
        {
          id: "st_baseline", label: "baseline · 基线预编译", state: "ok", icon: "el-icon-s-opportunity",
          kind: "阶段", repo: "ci/build.yaml", cost: "12m26s", node: "18 节点",
          line: 6, lineEnd: 24,
          logs: ["- name: baseline", "  parallel: true", "  jobs: chipset / custom / bootloader / base"],
          children: [
            { id: "j_chipset", label: "chipset · 芯片平台", state: "ok", icon: "el-icon-cpu", kind: "job", repo: "vendor.img", cost: "6m02s", node: "ci-node-11", line: 9, lineEnd: 12, logs: ["- id: chipset", "  repo: device/huawei/hw13/chipset", "  modules: [soc, radio, camera, modem]", "  outputs: [vendor.img]"] },
            { id: "j_custom", label: "custom · 定制预编译", state: "ok", icon: "el-icon-s-goods", kind: "job", repo: "product-overlay", cost: "4m38s", node: "ci-node-14", line: 13, lineEnd: 16, logs: ["- id: custom", "  repo: device/huawei/hw13/custom", "  modules: [custom-prebuilt, custom-config]", "  outputs: [product-overlay]"] },
            { id: "j_bootloader", label: "bootloader · 引导", state: "ok", icon: "el-icon-cpu", kind: "job", repo: "fastboot.img", cost: "6m04s", node: "ci-node-03", line: 17, lineEnd: 20, logs: ["- id: bootloader", "  repo: device/huawei/bootloader", "  modules: [lk, kernel]", "  outputs: [fastboot.img]"] },
            { id: "j_base", label: "base · 基础框架", state: "ok", icon: "el-icon-s-home", kind: "job", repo: "system-base", cost: "5m30s", node: "ci-node-21", line: 21, lineEnd: 24, logs: ["- id: base", "  repo: platform/frameworks/base", "  modules: [framework, art]", "  outputs: [system-base]"] }
          ]
        },
        {
          id: "st_system", label: "system · 系统构建", state: "ok", icon: "el-icon-s-opportunity",
          kind: "阶段", repo: "ci/build.yaml", cost: "17m05s", node: "12 节点",
          line: 25, lineEnd: 39,
          logs: ["- name: system", "  parallel: true", "  jobs: system / product / vendor"],
          children: [
            { id: "j_system", label: "system · 系统分区", state: "ok", icon: "el-icon-folder", kind: "job", repo: "system.img", cost: "7m12s", node: "ci-node-22", line: 28, lineEnd: 31, logs: ["- id: system", "  repo: build/soong", "  modules: [system-app, priv-app]", "  outputs: [system.img]"] },
            { id: "j_product", label: "product · 产品定制", state: "ok", icon: "el-icon-folder", kind: "job", repo: "product.img", cost: "4m02s", node: "ci-node-24", line: 32, lineEnd: 35, logs: ["- id: product", "  repo: device/huawei/hw13/product", "  modules: [product-overlay]", "  outputs: [product.img]"] },
            { id: "j_vendor", label: "vendor · 厂商组件", state: "ok", icon: "el-icon-folder", kind: "job", repo: "vendor.img", cost: "4m18s", node: "ci-node-14", line: 36, lineEnd: 39, logs: ["- id: vendor", "  repo: vendor/huawei", "  modules: [prebuilt]", "  outputs: [vendor.img]"] }
          ]
        },
        {
          id: "st_pack", label: "pack · 集成打包", state: "ok", icon: "el-icon-s-tools",
          kind: "阶段", repo: "ci/build.yaml", cost: "4m31s", node: "单节点",
          line: 40, lineEnd: 48,
          logs: ["- name: pack", "  parallel: false", "  jobs: integrate / sign / pack"],
          children: [
            { id: "j_integrate", label: "integrate · 整机集成", state: "ok", icon: "el-icon-s-operation", kind: "job", repo: "super.img", cost: "1m51s", node: "ci-node-08", line: 43, lineEnd: 44, logs: ["- id: integrate", "  outputs: [super.img]"] },
            { id: "j_sign", label: "sign · 镜像签名", state: "ok", icon: "el-icon-s-check", kind: "job", repo: "signed-images", cost: "1m04s", node: "ci-node-08", line: 45, lineEnd: 46, logs: ["- id: sign", "  outputs: [signed-images]"] },
            { id: "j_pack", label: "pack · 整机打包", state: "ok", icon: "el-icon-s-goods", kind: "job", repo: "fastboot.img / sdcard.img", cost: "1m36s", node: "ci-node-08", line: 47, lineEnd: 48, logs: ["- id: pack", "  outputs: [fastboot.img, sdcard.img]"] }
          ]
        }
      ],

      /* 构建产物清单 */
      artifactRows: [
        { name: "fastboot.img", type: "镜像", partition: "bootloader", size: "8.4 MB", md5: "9f2c1a7d4e6b8c02…", use: "引导分区烧录 / bootloader 升级", state: "已生成" },
        { name: "boot.img", type: "镜像", partition: "boot", size: "64.2 MB", md5: "5c81b39e0a7d2f44…", use: "内核 + ramdisk 启动镜像", state: "已生成" },
        { name: "system.img", type: "镜像", partition: "system", size: "2.1 GB", md5: "a07c4e19bb35d802…", use: "Android 系统分区", state: "已生成" },
        { name: "vendor.img", type: "镜像", partition: "vendor", size: "860 MB", md5: "7d2e9014cc85ba31…", use: "厂商预编译组件", state: "已生成" },
        { name: "product.img", type: "镜像", partition: "product", size: "312 MB", md5: "c14f8a02e7d5b93c…", use: "产品定制 overlay", state: "已生成" },
        { name: "super.img", type: "镜像", partition: "super", size: "3.4 GB", md5: "2b90ce4718d3a5f6…", use: "动态分区组合镜像", state: "已生成" },
        { name: "sdcard.img", type: "刷机包", partition: "全量刷机", size: "6.8 GB", md5: "3ab77e1c04d92f85…", use: "工厂 / 渠道整机烧录、OTA 底包", state: "已生成" },
        { name: "MTP_AP_SGT.zip", type: "升级包", partition: "—", size: "7.1 GB", md5: "—", use: "分区升级包（MTP 分发）", state: "生成中" }
      ],

      /* 打补丁：Gerrit 自动化流水线 */
      patchSteps: [
        {
          id: 1, title: "同步代码库",
          cmd: "repo init -u ssh://git@gerrit.hw.com:platform/manifest.git -b hw-13.0.0-release && repo sync -c -j8",
          logs: [
            "$ repo init -u ssh://git@gerrit.hw.com:platform/manifest.git -b hw-13.0.0-release",
            "[manifest] fetching manifest_hw13 ... done",
            "$ repo sync -c -j8 --no-clone-bundle",
            "[  1/168] platform/frameworks/base ...",
            "[ 92/168] device/huawei/hw13 ...",
            "sync finished: 168 projects, 6m12s"
          ]
        },
        {
          id: 2, title: "切换目标仓库分支",
          cmd: "cd device/huawei/hw13 && git checkout hw-13.0.0-release && git pull --rebase",
          logs: [
            "$ cd device/huawei/hw13",
            "$ git checkout hw-13.0.0-release",
            "Switched to branch 'hw-13.0.0-release'",
            "$ git pull --rebase",
            "Already up to date. HEAD = 4a91c2f (device/huawei/hw13)"
          ]
        },
        {
          id: 3, title: "拉取 Gerrit Change",
          cmd: "git fetch origin refs/changes/42/28471/3 && git cherry-pick FETCH_HEAD",
          logs: [
            "$ git fetch origin refs/changes/42/28471/3",
            "From ssh://git@gerrit.hw.com:platform/frameworks/base",
            " * branch            refs/changes/42/28471/3 -> FETCH_HEAD",
            "$ git cherry-pick FETCH_HEAD",
            "[device/huawei/hw13 8f3c1d2] [Bugfix] 修复 Wi-Fi 断连后无法自动恢复",
            " 1 file changed, 12 insertions(+), 4 deletions(-)"
          ]
        },
        {
          id: 4, title: "冲突自动处理",
          cmd: "git rerere && git add -A && git cherry-pick --continue",
          logs: [
            "$ git cherry-pick --continue",
            "CONFLICT (content): frameworks/base/.../WifiService.java",
            "$ git rerere",
            "rerere: hit recorded resolution for WifiService.java",
            "$ git add -A && git cherry-pick --continue",
            "[device/huawei/hw13 9a71b40] [Bugfix] 修复 Wi-Fi 断连后无法自动恢复",
            "conflict resolved automatically by rerere"
          ]
        },
        {
          id: 5, title: "编译验证",
          cmd: "./ci/build.sh -p hw13 -l hw13-userdebug",
          logs: [
            "$ ./ci/build.sh -p hw13 -l hw13-userdebug",
            "[config] ci/build.yaml → baseline / system / pack",
            "[baseline] 4 jobs dispatched in parallel",
            "[system] 3 jobs dispatched in parallel",
            "[pack] integrate → sign → pack, executed in sequence",
            "[168/168] all modules built",
            "build finished in 38m12s, 0 failed",
            "artifact: sdcard.img 6.8 GB"
          ]
        },
        {
          id: 6, title: "提交 Gerrit 发起 Review",
          cmd: "repo upload -t -n \"[Bugfix] 修复 Wi-Fi 断连后无法自动恢复\" && git push origin HEAD:refs/for/hw-13.0.0-release",
          logs: [
            "$ repo upload -t -n \"[Bugfix] 修复 Wi-Fi 断连后无法自动恢复\"",
            "  1 project changed: device/huawei/hw13",
            "$ git push origin HEAD:refs/for/hw-13.0.0-release",
            "remote: New change #28471 created",
            "remote: Change-Id: I8f2c4b71a3d5e609",
            "To ssh://git@gerrit.hw.com:platform/frameworks/base"
          ]
        },
        {
          id: 7, title: "结果回写与跟踪",
          cmd: "gerrit query --current-patch-set --files --format=JSON change:28471",
          logs: [
            "$ gerrit query --current-patch-set --files --format=JSON change:28471",
            "{\"project\":\"device/huawei/hw13\",\"branch\":\"hw-13.0.0-release\"}",
            "{\"subject\":\"[Bugfix] 修复 Wi-Fi 断连后无法自动恢复\"}",
            "{\"status\":\"NEW\",\"reviewer\":\"业务主管 → 提需求人验证\"}",
            "pipeline finished, change sent to review"
          ]
        }
      ],

      /* 补丁清单 */
      patchRows: [
        { change: "I8f2c4b71a3d5e609", repo: "device/huawei/hw13", subject: "[Bugfix] 修复 Wi-Fi 断连后无法自动恢复", owner: "我", level: "高", state: "已提交", review: "待验证" },
        { change: "I4c70d3e91b2a5f8", repo: "platform/frameworks/base", subject: "[Feature] 新增省电模式下后台任务冻结策略", owner: "我", level: "中", state: "已合入", review: "Approved+1" },
        { change: "I1d92ba70c5e3f61", repo: "device/huawei/hw13/system", subject: "[Bugfix] 修复开机阶段偶现卡在开机动画", owner: "我", level: "高", state: "已合入", review: "Approved+2" },
        { change: "I6e05a9b2d7c814f", repo: "kernel/huawei", subject: "[Bugfix] 修复温控策略在低温下误触发降频", owner: "华为终端开发", level: "中", state: "待合入", review: "— " },
        { change: "I9a3f70b1c8d24e5", repo: "vendor/huawei", subject: "[Patch] 同步芯片基带补丁到主线版本", owner: "华为终端开发", level: "低", state: "待合入", review: "— " },
        { change: "I2b64d80e5f9c731", repo: "device/huawei/hw13/product", subject: "[Conflict] 解决 product overlay 与主线配置冲突", owner: "我", level: "中", state: "冲突", review: "待人工" }
      ]
    },
    computed: {
      logs: function () {
        var out = [];
        for (var i = 0; i < this.step && i < this.patchSteps.length; i++) {
          out = out.concat(this.patchSteps[i].logs);
        }
        return out;
      }
    },
    created: function () {
      // stages 下的缩进块挂到 stages 节点，形成与 YAML 缩进层级一致的树
      this.$set(this.treeData[0].children[0], "children", this.stageData);
    },
    methods: {
      stateText: function (s) {
        return { ok: "成功", warn: "告警", run: "进行中", fail: "失败" }[s] || s;
      },
      depthColor: function (d) {
        var palette = [
          "rgba(59,130,246,0.55)",
          "rgba(34,211,238,0.5)",
          "rgba(52,211,153,0.45)",
          "rgba(251,191,36,0.4)",
          "rgba(244,114,182,0.38)"
        ];
        return palette[Math.min(d, palette.length - 1)];
      },
      onSelect: function (index) {
        this.active = index;
      },
      onNodeClick: function (data) {
        this.detail = data;
        var self = this;
        this.$nextTick(function () {
          var box = self.$refs.yamlBox;
          if (!box) return;
          var line = box.querySelector(".yml__line.is-on");
          if (line && line.scrollIntoView) {
            line.scrollIntoView({ block: "center" });
          }
        });
      },
      runAll: function () {
        var self = this;
        if (this.running) {
          clearInterval(this.timer);
          this.timer = null;
          this.running = false;
          return;
        }
        this.step = 0;
        this.running = true;
        this.timer = setInterval(function () {
          self.step += 1;
          if (self.step >= self.patchSteps.length) {
            clearInterval(self.timer);
            self.timer = null;
            self.running = false;
          }
        }, 900);
      }
    }
  });
})();

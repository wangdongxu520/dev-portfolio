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

  new Vue({
    el: "#app",
    data: {
      active: "build",
      detail: null,
      step: 0,
      running: false,
      timer: null,

      /* 自动编译：整机编译任务树 */
      treeData: [
        {
          id: "root", label: "hw-13.0.0 整机编译", state: "ok", icon: "el-icon-s-platform",
          kind: "构建任务", repo: "manifest@manifest_hw13", partition: "全量", cost: "38m12s",
          size: "—", node: "ci-node-08", logs: [
            "$ ci/build.sh -p hw13 -l hw13-userdebug",
            "[manifest] 168 repositories detected",
            "[schedule] 18 parallel jobs, queue 12",
            "[done] build finished in 38m12s, 0 failed"
          ],
          children: [
            {
              id: "bootloader", label: "bootloader 引导分区", state: "ok", icon: "el-icon-cpu",
              kind: "分区目录", repo: "device/huawei/bootloader", partition: "bootloader", cost: "6m04s",
              size: "—", node: "ci-node-03", logs: [
                "$ build bootloaders",
                "[1/4] lk ... ok",
                "[2/4] xbl ... ok",
                "[3/4] kernel ... ok",
                "[4/4] fastboot ... ok"
              ],
              children: [
                { id: "lk", label: "lk · 引导内核", state: "ok", kind: "组件", repo: "device/huawei/bootloader/lk", partition: "bootloader", cost: "1m12s", size: "—", node: "ci-node-03", logs: ["$ make lk", "CC oblate/lk_main.o", "LD lk.elf", "done (72s)"] },
                { id: "xbl", label: "xbl · 最小引导", state: "ok", kind: "组件", repo: "device/huawei/bootloader/xbl", partition: "bootloader", cost: "46s", size: "—", node: "ci-node-03", logs: ["$ make xbl", "LD xbl.elf", "done (46s)"] },
                { id: "kernel", label: "kernel · 内核", state: "ok", kind: "组件", repo: "kernel/huawei", partition: "boot", cost: "4m38s", size: "—", node: "ci-node-05", logs: ["$ make hw13_defconfig", "CC drivers/net/wifi ... 412 files", "Image: 48.2 MB", "done (278s)"] },
                { id: "fastboot", label: "fastboot.img", state: "ok", icon: "el-icon-document", kind: "产物", repo: "device/huawei/bootloader", partition: "bootloader", cost: "生成于 38m09s", size: "8.4 MB", node: "ci-node-08", logs: ["$ mkbootimg ...", "creating fastboot.img ... 100%", "fastboot.img  8.4 MB  (md5 9f2c1a...)"] }
              ]
            },
            {
              id: "chipset", label: "chipset 芯片平台", state: "ok", icon: "el-icon-cpu",
              kind: "分区目录", repo: "device/huawei/hw13/chipset", partition: "vendor", cost: "12m26s",
              size: "—", node: "ci-node-11", logs: [
                "$ build chipset",
                "[1/4] soc ... ok",
                "[2/4] radio ... ok",
                "[3/4] modem ... warning (2 files skipped)",
                "[4/4] camera ... ok"
              ],
              children: [
                { id: "soc", label: "soc · SoC 平台", state: "ok", kind: "组件", repo: "device/huawei/hw13/chipset/soc", partition: "vendor", cost: "6m02s", size: "—", node: "ci-node-11", logs: ["$ make soc", "GEN soc.dts", "LD soc.so", "done (362s)"] },
                { id: "radio", label: "radio · 基带", state: "ok", kind: "组件", repo: "device/huawei/hw13/chipset/radio", partition: "modem", cost: "3m25s", size: "—", node: "ci-node-12", logs: ["$ make radio", "CP start done", "done (205s)"] },
                { id: "modem", label: "modem · 调制解调", state: "warn", kind: "组件", repo: "device/huawei/hw13/chipset/modem", partition: "modem", cost: "2m48s", size: "—", node: "ci-node-12", logs: ["$ make modem", "warning: 2 个 patch 未匹配主线，已跳过", "done (168s)"] },
                { id: "camera", label: "camera · 影像 HAL", state: "ok", kind: "组件", repo: "device/huawei/hw13/chipset/camera", partition: "vendor", cost: "2m11s", size: "—", node: "ci-node-13", logs: ["$ make camera", "SO libcamera_hal.so", "done (131s)"] }
              ]
            },
            {
              id: "system", label: "system 系统分区", state: "ok", icon: "el-icon-folder",
              kind: "分区目录", repo: "build/soong", partition: "system", cost: "17m05s",
              size: "—", node: "ci-node-21", logs: [
                "$ build system",
                "[1/5] framework ... ok",
                "[2/5] app ... ok",
                "[3/5] priv-app ... ok",
                "[4/5] etc ... ok",
                "[5/5] system image ... ok"
              ],
              children: [
                { id: "framework", label: "framework · 核心框架", state: "ok", kind: "组件", repo: "platform/frameworks/base", partition: "system", cost: "5m30s", size: "—", node: "ci-node-21", logs: ["$ m framework", "JACK 486 modules", "done (330s)"] },
                { id: "app", label: "app · 预装应用", state: "ok", kind: "组件", repo: "apps/PrebuiltApp", partition: "system", cost: "7m12s", size: "—", node: "ci-node-22", logs: ["$ m PrebuiltApp", "copy 168 apk", "done (432s)"] },
                { id: "privapp", label: "priv-app · 特权应用", state: "ok", kind: "组件", repo: "apps/PrivApp", partition: "system", cost: "3m08s", size: "—", node: "ci-node-23", logs: ["$ m PrivApp", "copy 42 apk", "done (188s)"] },
                { id: "etc", label: "etc · 系统配置", state: "ok", kind: "组件", repo: "build/make/target/product", partition: "system", cost: "52s", size: "—", node: "ci-node-24", logs: ["$ m product_config", "gen build.prop", "done (52s)"] },
                { id: "systemimg", label: "system.img", state: "ok", icon: "el-icon-document", kind: "产物", repo: "build/make", partition: "system", cost: "生成于 38m06s", size: "2.1 GB", node: "ci-node-08", logs: ["$ mkuserimg system ...", "creating system.img ... 100%", "system.img  2.1 GB"] }
              ]
            },
            {
              id: "vendor", label: "vendor 厂商预编译", state: "ok", icon: "el-icon-folder",
              kind: "分区目录", repo: "vendor/huawei", partition: "vendor", cost: "4m18s",
              size: "—", node: "ci-node-14", logs: ["$ build vendor", "copy prebuilt blobs", "done (258s)"],
              children: [
                { id: "vendorimg", label: "vendor.img", state: "ok", icon: "el-icon-document", kind: "产物", repo: "vendor/huawei", partition: "vendor", cost: "生成于 38m08s", size: "860 MB", node: "ci-node-08", logs: ["$ mkuserimg vendor ...", "vendor.img  860 MB"] }
              ]
            },
            {
              id: "product", label: "product 产品定制", state: "ok", icon: "el-icon-folder",
              kind: "分区目录", repo: "device/huawei/hw13/product", partition: "product", cost: "2m47s",
              size: "—", node: "ci-node-15", logs: ["$ build product", "overlay 96 files", "done (167s)"],
              children: [
                { id: "productimg", label: "product.img", state: "ok", icon: "el-icon-document", kind: "产物", repo: "device/huawei/hw13/product", partition: "product", cost: "生成于 38m08s", size: "312 MB", node: "ci-node-08", logs: ["$ mkuserimg product ...", "product.img  312 MB"] }
              ]
            },
            {
              id: "tools", label: "tools 打包与签名", state: "ok", icon: "el-icon-s-tools",
              kind: "阶段目录", repo: "build/soong/tools", partition: "全量", cost: "4m31s",
              size: "—", node: "ci-node-08", logs: [
                "$ ci/pack.sh -p hw13",
                "[1/3] sign images ... ok",
                "[2/3] pack super ... ok",
                "[3/3] pack sdcard ... ok"
              ],
              children: [
                { id: "sign", label: "sign · 镜像签名", state: "ok", kind: "阶段", repo: "build/soong/tools/sign", partition: "—", cost: "1m04s", size: "—", node: "ci-node-08", logs: ["$ sign_target_files", "signing 9 images", "done (64s)"] },
                { id: "pack", label: "pack · 动态分区打包", state: "ok", kind: "阶段", repo: "build/soong/tools/releasetools", partition: "super", cost: "2m36s", size: "3.4 GB", node: "ci-node-08", logs: ["$ mke2fs + lpmake", "super.img  3.4 GB", "done (156s)"] },
                { id: "sdcard", label: "sdcard.img · 刷机包", state: "ok", icon: "el-icon-document", kind: "产物", repo: "device/huawei/hw13", partition: "全量刷机", cost: "生成于 38m11s", size: "6.8 GB", node: "ci-node-08", logs: ["$ ci/pack.sh --sdcard", "creating sdcard.img ... 100%", "sdcard.img  6.8 GB  (md5 3ab77e...)"] }
              ]
            }
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
            "[schedule] 18 parallel jobs",
            "[  84/168] platform/frameworks/base ... ok",
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
    methods: {
      stateText: function (s) {
        return { ok: "成功", warn: "告警", run: "进行中", fail: "失败" }[s] || s;
      },
      onSelect: function (index) {
        this.active = index;
      },
      onNodeClick: function (data) {
        this.detail = data;
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

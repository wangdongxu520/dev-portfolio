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

      /* 自动编译：整机编译任务树（串行主线 + 阶段内并行） */
      treeData: [
        {
          id: "root", label: "hw-13.0.0 整机编译", mode: "serial", state: "ok", icon: "el-icon-s-platform",
          kind: "构建任务", repo: "manifest@manifest_hw13", partition: "全量", cost: "38m12s",
          size: "—", node: "ci-node-08", concurrency: "18 并发",
          deps: "串行主线：Stage 1 → Stage 2 → Stage 3 逐级触发",
          logs: [
            "$ ci/build.sh -p hw13 -l hw13-userdebug",
            "[manifest] 168 repositories detected",
            "[stage] Stage 1 基线预编译 · 4 组并行 / 18 节点",
            "[stage] Stage 2 系统构建 · 3 组并行（依赖 Stage 1 产物）",
            "[stage] Stage 3 集成打包 · 严格串行",
            "[done] build finished in 38m12s, 0 failed"
          ],
          children: [
            {
              id: "s1", label: "Stage 1 · 基线预编译", mode: "phase", state: "ok", icon: "el-icon-files",
              kind: "阶段", repo: "—", partition: "—", cost: "12m26s", size: "—", node: "ci-node-11",
              concurrency: "4 组并行 · 18 节点",
              deps: "无（构建起点，可立即开始）",
              logs: [
                "$ ci/build.sh --stage baseline",
                "[parallel] chipset / custom / bootloader / base 同时下发",
                "[parallel] 4 组全部完成，产物就绪",
                "[done] stage 1 finished in 12m26s"
              ],
              children: [
                {
                  id: "chipset", label: "chipset 芯片平台", mode: "parallel", state: "ok", icon: "el-icon-cpu",
                  kind: "组件组", repo: "device/huawei/hw13/chipset", partition: "vendor", cost: "6m02s",
                  size: "—", node: "ci-node-11", concurrency: "soc / radio / camera / modem 并行",
                  deps: "无（与 custom、bootloader、base 互不依赖）",
                  logs: [
                    "$ build chipset",
                    "[parallel] soc ... ok",
                    "[parallel] radio ... ok",
                    "[parallel] camera ... ok",
                    "[parallel] modem ... warning (2 files skipped)"
                  ],
                  children: [
                    { id: "soc", label: "soc · SoC 平台", mode: "parallel", state: "ok", kind: "组件", repo: "device/huawei/hw13/chipset/soc", partition: "vendor", cost: "6m02s", size: "—", node: "ci-node-11", concurrency: "独占 4 节点", deps: "无", logs: ["$ make soc", "GEN soc.dts", "LD soc.so", "done (362s)"] },
                    { id: "radio", label: "radio · 基带", mode: "parallel", state: "ok", kind: "组件", repo: "device/huawei/hw13/chipset/radio", partition: "modem", cost: "3m25s", size: "—", node: "ci-node-12", concurrency: "独占 3 节点", deps: "无", logs: ["$ make radio", "CP start done", "done (205s)"] },
                    { id: "camera", label: "camera · 影像 HAL", mode: "parallel", state: "ok", kind: "组件", repo: "device/huawei/hw13/chipset/camera", partition: "vendor", cost: "2m11s", size: "—", node: "ci-node-13", concurrency: "独占 2 节点", deps: "无", logs: ["$ make camera", "SO libcamera_hal.so", "done (131s)"] },
                    { id: "modem", label: "modem · 调制解调", mode: "parallel", state: "warn", kind: "组件", repo: "device/huawei/hw13/chipset/modem", partition: "modem", cost: "2m48s", size: "—", node: "ci-node-12", concurrency: "独占 2 节点", deps: "无", logs: ["$ make modem", "warning: 2 个 patch 未匹配主线，已跳过", "done (168s)"] }
                  ]
                },
                {
                  id: "custom", label: "custom 定制预编译", mode: "parallel", state: "ok", icon: "el-icon-s-goods",
                  kind: "组件组", repo: "device/huawei/hw13/custom", partition: "product", cost: "4m38s",
                  size: "—", node: "ci-node-14", concurrency: "prebuilt / config 并行",
                  deps: "无（与 chipset、bootloader、base 互不依赖）",
                  logs: [
                    "$ build custom",
                    "[parallel] custom-prebuilt ... ok",
                    "[parallel] custom-config ... ok",
                    "[done] 4m38s"
                  ],
                  children: [
                    { id: "customPrebuilt", label: "custom-prebuilt · 定制预编译包", mode: "parallel", state: "ok", kind: "组件", repo: "device/huawei/hw13/custom/prebuilt", partition: "product", cost: "3m06s", size: "—", node: "ci-node-14", concurrency: "独占 3 节点", deps: "无", logs: ["$ make prebuilt", "copy 64 so / apk", "done (186s)"] },
                    { id: "customConfig", label: "custom-config · 定制配置", mode: "parallel", state: "ok", kind: "组件", repo: "device/huawei/hw13/custom/config", partition: "product", cost: "1m32s", size: "—", node: "ci-node-15", concurrency: "独占 1 节点", deps: "无", logs: ["$ make custom_config", "gen custom.prop", "done (92s)"] }
                  ]
                },
                {
                  id: "bootloader", label: "bootloader 引导", mode: "parallel", state: "ok", icon: "el-icon-cpu",
                  kind: "组件组", repo: "device/huawei/bootloader", partition: "bootloader", cost: "6m04s",
                  size: "—", node: "ci-node-03", concurrency: "lk / kernel 并行",
                  deps: "无（与 chipset、custom、base 互不依赖）",
                  logs: ["$ build bootloaders", "[parallel] lk ... ok", "[parallel] kernel ... ok", "[done] 6m04s"],
                  children: [
                    { id: "lk", label: "lk · 引导内核", mode: "parallel", state: "ok", kind: "组件", repo: "device/huawei/bootloader/lk", partition: "bootloader", cost: "1m12s", size: "—", node: "ci-node-03", concurrency: "独占 1 节点", deps: "无", logs: ["$ make lk", "CC oblate/lk_main.o", "LD lk.elf", "done (72s)"] },
                    { id: "kernel", label: "kernel · 内核", mode: "parallel", state: "ok", kind: "组件", repo: "kernel/huawei", partition: "boot", cost: "4m38s", size: "—", node: "ci-node-05", concurrency: "独占 4 节点", deps: "无", logs: ["$ make hw13_defconfig", "CC drivers/net/wifi ... 412 files", "Image: 48.2 MB", "done (278s)"] }
                  ]
                },
                {
                  id: "base", label: "base 基础框架", mode: "parallel", state: "ok", icon: "el-icon-s-home",
                  kind: "组件组", repo: "platform/frameworks/base", partition: "system", cost: "5m30s",
                  size: "—", node: "ci-node-21", concurrency: "framework / art 并行",
                  deps: "无（与 chipset、custom、bootloader 互不依赖）",
                  logs: ["$ build base", "[parallel] framework ... ok", "[parallel] art ... ok", "[done] 5m30s"],
                  children: [
                    { id: "framework", label: "framework · 核心框架", mode: "parallel", state: "ok", kind: "组件", repo: "platform/frameworks/base", partition: "system", cost: "5m30s", size: "—", node: "ci-node-21", concurrency: "独占 5 节点", deps: "无", logs: ["$ m framework", "JACK 486 modules", "done (330s)"] },
                    { id: "art", label: "art · 运行时", mode: "parallel", state: "ok", kind: "组件", repo: "art/libart", partition: "system", cost: "2m08s", size: "—", node: "ci-node-22", concurrency: "独占 2 节点", deps: "无", logs: ["$ m art", "SO libart.so", "done (128s)"] }
                  ]
                }
              ]
            },
            {
              id: "s2", label: "Stage 2 · 系统构建", mode: "phase", state: "ok", icon: "el-icon-files",
              kind: "阶段", repo: "—", partition: "—", cost: "17m05s", size: "—", node: "ci-node-21",
              concurrency: "3 组并行 · 12 节点",
              deps: "依赖 Stage 1 全部产物就绪（chipset / custom / bootloader / base）",
              logs: [
                "$ ci/build.sh --stage system",
                "[wait] 等待 Stage 1 产物校验通过",
                "[parallel] system / product / vendor 同时下发",
                "[done] stage 2 finished in 17m05s"
              ],
              children: [
                {
                  id: "system", label: "system 系统分区", mode: "parallel", state: "ok", icon: "el-icon-folder",
                  kind: "组件组", repo: "build/soong", partition: "system", cost: "7m12s",
                  size: "—", node: "ci-node-22", concurrency: "app / priv-app / image 并行",
                  deps: "依赖 base、chipset（vendor 侧镜像）产物",
                  logs: ["$ build system", "[parallel] system-app ... ok", "[parallel] priv-app ... ok", "[parallel] system image ... ok"],
                  children: [
                    { id: "systemApp", label: "system-app · 预装应用", mode: "parallel", state: "ok", kind: "组件", repo: "apps/SystemApp", partition: "system", cost: "4m10s", size: "—", node: "ci-node-22", concurrency: "独占 4 节点", deps: "无", logs: ["$ m SystemApp", "copy 168 apk", "done (250s)"] },
                    { id: "privApp", label: "priv-app · 特权应用", mode: "parallel", state: "ok", kind: "组件", repo: "apps/PrivApp", partition: "system", cost: "3m08s", size: "—", node: "ci-node-23", concurrency: "独占 3 节点", deps: "无", logs: ["$ m PrivApp", "copy 42 apk", "done (188s)"] },
                    { id: "systemImage", label: "system.img", mode: "parallel", state: "ok", icon: "el-icon-document", kind: "产物", repo: "build/make", partition: "system", cost: "生成于 29m18s", size: "2.1 GB", node: "ci-node-08", concurrency: "收尾任务", deps: "依赖 system-app / priv-app 完成", logs: ["$ mkuserimg system ...", "creating system.img ... 100%", "system.img  2.1 GB"] }
                  ]
                },
                {
                  id: "product", label: "product 产品定制", mode: "parallel", state: "ok", icon: "el-icon-folder",
                  kind: "组件组", repo: "device/huawei/hw13/product", partition: "product", cost: "4m02s",
                  size: "—", node: "ci-node-24", concurrency: "overlay / image 并行",
                  deps: "依赖 custom 定制配置产物",
                  logs: ["$ build product", "[parallel] product overlay ... ok", "[parallel] product image ... ok"],
                  children: [
                    { id: "productOverlay", label: "product-overlay · 定制 overlay", mode: "parallel", state: "ok", kind: "组件", repo: "device/huawei/hw13/product", partition: "product", cost: "1m26s", size: "—", node: "ci-node-24", concurrency: "独占 1 节点", deps: "依赖 custom-config", logs: ["$ m product_config", "overlay 96 files", "done (86s)"] },
                    { id: "productImage", label: "product.img", mode: "parallel", state: "ok", icon: "el-icon-document", kind: "产物", repo: "device/huawei/hw13/product", partition: "product", cost: "生成于 29m16s", size: "312 MB", node: "ci-node-08", concurrency: "收尾任务", deps: "依赖 product-overlay 完成", logs: ["$ mkuserimg product ...", "product.img  312 MB"] }
                  ]
                },
                {
                  id: "vendor", label: "vendor 厂商组件", mode: "parallel", state: "ok", icon: "el-icon-folder",
                  kind: "组件组", repo: "vendor/huawei", partition: "vendor", cost: "4m18s",
                  size: "—", node: "ci-node-14", concurrency: "prebuilt / image 并行",
                  deps: "依赖 chipset 编译产物",
                  logs: ["$ build vendor", "[parallel] prebuilt blobs ... ok", "[parallel] vendor image ... ok"],
                  children: [
                    { id: "vendorPrebuilt", label: "vendor-prebuilt · 预编译库", mode: "parallel", state: "ok", kind: "组件", repo: "vendor/huawei/prebuilt", partition: "vendor", cost: "2m36s", size: "—", node: "ci-node-14", concurrency: "独占 3 节点", deps: "依赖 chipset", logs: ["$ make prebuilt", "copy 218 blobs", "done (156s)"] },
                    { id: "vendorImage", label: "vendor.img", mode: "parallel", state: "ok", icon: "el-icon-document", kind: "产物", repo: "vendor/huawei", partition: "vendor", cost: "生成于 29m14s", size: "860 MB", node: "ci-node-08", concurrency: "收尾任务", deps: "依赖 vendor-prebuilt 完成", logs: ["$ mkuserimg vendor ...", "vendor.img  860 MB"] }
                  ]
                }
              ]
            },
            {
              id: "s3", label: "Stage 3 · 集成打包", mode: "serial", state: "ok", icon: "el-icon-s-tools",
              kind: "阶段", repo: "build/soong/tools", partition: "全量", cost: "4m31s",
              size: "—", node: "ci-node-08", concurrency: "严格串行 · 单任务",
              deps: "依赖 Stage 2 全部产物就绪（system.img / vendor.img / product.img）",
              logs: [
                "$ ci/build.sh --stage pack",
                "[serial] integrate ... ok",
                "[serial] sign ... ok",
                "[serial] pack ... ok",
                "[done] stage 3 finished in 4m31s"
              ],
              children: [
                {
                  id: "integrate", label: "integrate · 整机集成", mode: "serial", state: "ok", icon: "el-icon-s-operation",
                  kind: "阶段任务", repo: "build/soong/tools/releasetools", partition: "super", cost: "1m51s",
                  size: "—", node: "ci-node-08", concurrency: "独占 1 节点",
                  deps: "依赖 system.img / vendor.img / product.img 就绪",
                  logs: ["$ mke2fs + lpmake", "super.img  3.4 GB", "done (111s)"]
                },
                {
                  id: "sign", label: "sign · 镜像签名", mode: "serial", state: "ok", icon: "el-icon-s-check",
                  kind: "阶段任务", repo: "build/soong/tools/sign", partition: "—", cost: "1m04s",
                  size: "—", node: "ci-node-08", concurrency: "独占 1 节点",
                  deps: "依赖 integrate 完成",
                  logs: ["$ sign_target_files", "signing 9 images", "done (64s)"]
                },
                {
                  id: "pack", label: "pack · 整机打包", mode: "serial", state: "ok", icon: "el-icon-s-goods",
                  kind: "阶段任务", repo: "device/huawei/hw13", partition: "全量刷机", cost: "1m36s",
                  size: "—", node: "ci-node-08", concurrency: "独占 1 节点",
                  deps: "依赖 sign 完成",
                  logs: ["$ ci/pack.sh --sdcard", "creating sdcard.img ... 100%", "sdcard.img  6.8 GB  (md5 3ab77e...)"],
                  children: [
                    { id: "fastboot", label: "fastboot.img", mode: "serial", state: "ok", icon: "el-icon-document", kind: "产物", repo: "device/huawei/bootloader", partition: "bootloader", cost: "生成于 38m06s", size: "8.4 MB", node: "ci-node-08", concurrency: "收尾任务", deps: "依赖 sign 完成", logs: ["$ mkbootimg ...", "creating fastboot.img ... 100%", "fastboot.img  8.4 MB  (md5 9f2c1a...)"] },
                    { id: "sdcard", label: "sdcard.img · 刷机包", mode: "serial", state: "ok", icon: "el-icon-document", kind: "产物", repo: "device/huawei/hw13", partition: "全量刷机", cost: "生成于 38m11s", size: "6.8 GB", node: "ci-node-08", concurrency: "收尾任务", deps: "依赖 sign 完成", logs: ["$ ci/pack.sh --sdcard", "creating sdcard.img ... 100%", "sdcard.img  6.8 GB  (md5 3ab77e...)"] }
                  ]
                }
              ]
            }
          ]
        }
      ],

      /* 串并调度视图 */
      laneRows: [
        {
          stage: "Stage 1 · 基线预编译", type: "parallel",
          tasks: ["chipset 芯片平台", "custom 定制预编译", "bootloader 引导", "base 基础框架"],
          note: "4 组互不依赖，同步下发，18 节点并发"
        },
        {
          stage: "Stage 2 · 系统构建", type: "parallel",
          tasks: ["system 系统分区", "product 产品定制", "vendor 厂商组件"],
          note: "3 组并行，各自依赖 Stage 1 的不同产物"
        },
        {
          stage: "Stage 3 · 集成打包", type: "serial",
          tasks: ["integrate 集成", "sign 签名", "pack 打包"],
          note: "严格串行，产出 fastboot.img 与 sdcard.img"
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
            "[stage 1] 4 组并行 / 18 节点",
            "[stage 2] 3 组并行，依赖 stage 1 产物",
            "[stage 3] 串行：integrate → sign → pack",
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
      modeText: function (m) {
        return { serial: "串行", parallel: "并行", phase: "阶段" }[m] || "";
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

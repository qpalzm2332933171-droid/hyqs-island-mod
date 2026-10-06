# MOD 源码说明

```
mod/
├── js/
│   ├── mod_native.js      ★ 当前版本(v2.1.0, 原生菜单) —— 被追加到游戏逻辑末尾
│   ├── mod_core.js        早期版本的核心逻辑(参考)
│   ├── mod_cal.js         早期版本的签名/工具函数(参考)
│   └── mod_ui.js          早期 Canvas 绘制菜单(已弃用, 保留作对比)
├── java/com/hymod/
│   ├── ModBridge.java     JS <-> Java 的静态桥(setMenu / setStatus / openItemPicker / callJS)
│   ├── ModMenu.java       原生 UI: 悬浮球 + 可拖动面板 + 标签页 + 输入框/开关/物品选择器
│   └── ModProvider.java   空 ContentProvider: 进程启动时注入 + 覆盖热更 jsc
└── tools/                 构建、邮件、解封 全套脚本
```

## JS <-> Java 通信

```js
// JS -> Java
jsb.reflection.callStaticMethod("com/hymod/ModBridge", "setMenu", "(Ljava/lang/String;)V", menuJson);
jsb.reflection.callStaticMethod("com/hymod/ModBridge", "setStatus", "(Ljava/lang/String;)V", "已加载");

// Java -> JS
// 点击按钮 / 拖动滑块 -> 调用 window.HYMOD_ON(id, value)
// 物品选择器确认   -> 调用 window.HYMOD_PICK(json)
// 菜单 UI 就绪     -> 调用 window.HYMOD_UI_READY()
```

## 菜单数据结构

```js
{
  title: "荒野日记 MOD",
  tabs: [
    { title: "物品", items: [
      { type: "picker", id: "open_picker", title: "物品发放选择器", desc: "..." },
      { type: "input",  id: "all_cnt", title: "数量", val: "99" },
      { type: "slider", id: "lifeMul", title: "生命倍率", min: 1, max: 50, val: 1 },
      { type: "switch", id: "godMode", title: "无敌", val: false },
      { type: "button", id: "coin_add", title: "贝壳 +88888" },
      { type: "text",   title: "--- 分组标题 ---" }
    ]}
  ]
}
```

- 控件状态自动持久化(`cc.sys.localStorage["hymod_vals2"]`), 重启后由 `applyState()` 恢复;
- 所有交互统一走 `window.HYMOD_ON(id, val)` -> `dispatch()`。

## 构建

见 [../docs/05-构建与打包指南.md](../docs/05-构建与打包指南.md)。

# 知账手机版（安卓离线版）

独立的纯前端手机学习工具，蓝白界面，所有样式和脚本打包到一个 HTML 文件。运行时无需后端、联网或登录。

将 `dist/知账手机版.html` 传到安卓手机，在文件管理器中选择支持本地 HTML 脚本的浏览器打开。也提供包含操作说明的 ZIP。不同安卓浏览器对本地 HTML 支持不同，聊天软件预览不代表完整浏览器执行环境；未在实体安卓设备上验证。

保留 14 个场景、往来科目速查、8 道练习、分录解释、核销余额校验。增加案例备份导入、文件模式下的存储提示、手动复制后备方案，以及本地练习进度。

本地文件的 localStorage 行为因浏览器而异。浏览器、路径或文件名改变后可能无法读取原数据，请导出备份。[MDN 说明](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)。外部来源链接仅在用户点击时打开，不参与应用运行。

## 构建与校验

```sh
python build.py
node --test engine.test.cjs portable.test.cjs
python verify.py
```

源文件在 `src/`，单文件 HTML、使用说明和 ZIP 在 `dist/`。使用时只需要 HTML。编译仅使用 Python 标准库；财务规则测试使用 Node.js，无 npm 依赖。

案例使用独立的 `zhizhang-mobile-cases-v1` 存储键，不覆盖原电脑版数据。支持导入原版 version=1 的 JSON 案例备份，最多 500 条、文件大小最多 2 MB，整体校验后再合并，导入内容按文本展示。

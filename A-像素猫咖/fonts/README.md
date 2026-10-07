# 像素字体

店里的字（界面、对话框、名牌、画面上的中文招牌）用的是**缝合像素字体**（Fusion Pixel Font）12px 比例宽度的简体中文版，裁剪过：只留店里用到的字、3755 个一级常用字和常用标点、符号。

- 来源：https://github.com/TakWolf/fusion-pixel-font ，版本 2026.09.25，文件 `fusion-pixel-12px-proportional-zh_hans.ttf`
- 授权：SIL Open Font License 1.1，见 `OFL.txt`。字体里拼进来的方舟像素字体、俐方体 11 号、Galmuri 的授权在 `LICENSES/` 里。按授权，字体可以裁剪、随网页一起发，不能单独卖。
- 文件：`fusion-pixel-12.woff2`（约 130 KB）。网页里的字体名是 `FusionPixel`。

## 重新裁剪

店里加了新的字（新房间、新对话）以后，在 `A-像素猫咖` 目录里跑：

```
python3 fonts/subset.py
```

要 `fontTools` 和 `brotli`（`pip3 install fonttools brotli`）。原字体第一次会下载到 `~/.cache/fusion-pixel-font/`（不进仓库）。跑完会打印"字体里没有的字"：这些字在页面上落回系统字体，能换写法就换掉（比如鱼谱里的"鳜鱼"改成"桂鱼"）。

## 字号

像素字只在 12 像素的整数倍上清楚。页面按屏幕的像素密度挑最近的整数倍（见 `docs/店内设计.md` 第十三节"字体和窗框"），不要随手写 13px、15px 这种字号。

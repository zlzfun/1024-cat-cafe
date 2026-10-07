#!/usr/bin/env python3
"""裁剪像素字体：只留店里用到的字 + 3755 个一级常用字 + 常用标点和符号，输出 fonts/fusion-pixel-12.woff2。

字体：缝合像素字体（Fusion Pixel Font）12px 比例宽度 简体中文，SIL OFL 1.1，https://github.com/TakWolf/fusion-pixel-font
用法（在 A-像素猫咖 目录里）：python3 fonts/subset.py
  需要 fontTools 和 brotli（pip3 install fonttools brotli）。原字体第一次会下载到 ~/.cache/fusion-pixel-font（约 50 MB 的压缩包），不进仓库。
  店里的字有改动（新加了房间、对话）以后跑一次；最后会打印字体里没有的字（落回系统字体显示），尽量换成字体里有的写法。"""
import glob, os, subprocess, sys, urllib.request, zipfile
VER = '2026.09.25'
ZIP = f'https://github.com/TakWolf/fusion-pixel-font/releases/download/{VER}/fusion-pixel-font-12px-proportional-ttf-v{VER}.zip'
TTF = 'fusion-pixel-12px-proportional-zh_hans.ttf'
HERE = os.path.dirname(os.path.abspath(__file__)); APP = os.path.dirname(HERE)
CACHE = os.path.expanduser('~/.cache/fusion-pixel-font/' + VER)

def source():
    p = os.path.join(CACHE, TTF)
    if not os.path.exists(p):
        os.makedirs(CACHE, exist_ok=True); print('下载', ZIP)
        zp = os.path.join(CACHE, 'font.zip')
        try: subprocess.run(['curl', '-fsSL', '-o', zp, ZIP], check=True)   # 有的 Python 没装根证书，用 curl 下
        except (OSError, subprocess.CalledProcessError): open(zp, 'wb').write(urllib.request.urlopen(ZIP, timeout=300).read())
        with zipfile.ZipFile(zp) as z: z.extract(TTF, CACHE)
    return p

def chars():
    s = set(chr(i) for i in range(32, 127))
    files = glob.glob(os.path.join(APP, 'js', '*.js')) + glob.glob(os.path.join(APP, 'server', '*.js')) + [os.path.join(APP, f) for f in ('index.html', 'admin.html', 'config.example.js')]
    for f in files:
        if os.path.exists(f):
            s |= {c for c in open(f, encoding='utf-8').read() if ord(c) >= 32}
    for b1 in range(0xB0, 0xD8):            # GB2312 一级字 3755 个
        for b2 in range(0xA1, 0xFF):
            try: s.add(bytes([b1, b2]).decode('gb2312'))
            except UnicodeDecodeError: pass
    s |= set('　、。·…—～‘’“”〔〕〈〉《》「」『』【】！（），：；？％＋－＝＜＞＠＃＆＊／０１２３４５６７８９'
             '▶▸◀◂★☆♥♡●○◆◇■□▲△▼▽←→↑↓↗↘↙↖×※♪♫☀☁☺♨⏎↵')
    return s

def main():
    from fontTools.ttLib import TTFont
    src = source(); cm = TTFont(src).getBestCmap(); S = chars()
    txt = os.path.join(CACHE, 'chars.txt'); open(txt, 'w', encoding='utf-8').write(''.join(sorted(S)))
    out = os.path.join(HERE, 'fusion-pixel-12.woff2')
    subprocess.run([sys.executable, '-m', 'fontTools.subset', src, '--text-file=' + txt, '--flavor=woff2', '--output-file=' + out,
                    '--layout-features=*', '--no-hinting', '--desubroutinize', '--name-IDs=*', '--name-languages=*'], check=True)
    used = set()
    for f in glob.glob(os.path.join(APP, 'js', '*.js')) + [os.path.join(APP, 'index.html')]:
        used |= {c for c in open(f, encoding='utf-8').read() if ord(c) > 127}
    miss = ''.join(sorted(c for c in used if ord(c) not in cm and not c.isspace() and c not in '﻿̇'))
    print('写好了', out, os.path.getsize(out) // 1024, 'KB；', len(S), '个字')
    print('字体里没有、会落回系统字体的字：', miss or '（没有）')

if __name__ == '__main__': main()

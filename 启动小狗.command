#!/bin/bash
set -eu
cd -- "$(dirname -- "$0")"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
echo "正在准备你的桌面小狗……"
if ! command -v npm >/dev/null 2>&1; then
  echo "还没找到 Node.js。请安装 Node.js LTS 后，关闭此窗口并重新双击启动。"
  read -r -p "按回车关闭窗口。" _answer
  exit 1
fi
if [ ! -f node_modules/electron/dist/Electron.app/Contents/MacOS/Electron ]; then
  echo "首次启动需要下载依赖，请保持联网并等待。"
  if ! npm ci --no-audit --no-fund; then
    echo "安装没有完成，请把上面的错误信息发给我。"
    read -r -p "按回车关闭窗口。" _answer
    exit 1
  fi
fi
echo "小狗正在启动。退出时请点击小狗下方的 ×。"
if ! npm start; then
  echo "启动没有完成，请把上面的错误信息发给我。"
  read -r -p "按回车关闭窗口。" _answer
  exit 1
fi

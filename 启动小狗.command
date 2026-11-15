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
if [ ! -f node_modules/electron/install.js ]; then
  echo "首次启动需要下载依赖，请保持联网并等待。"
  if ! npm ci --no-audit --no-fund; then
    echo "安装没有完成，请把上面的错误信息发给我。"
    read -r -p "按回车关闭窗口。" _answer
    exit 1
  fi
fi
# npm may skip dependency lifecycle scripts; run Electron's own verified installer explicitly.
if ! node -e 'const fs = require("node:fs"); if (!fs.existsSync(require("electron"))) process.exit(1)' >/dev/null 2>&1; then
  echo "正在补装 Electron 启动组件，请保持联网并等待……"
  if ! ELECTRON_SKIP_BINARY_DOWNLOAD= node node_modules/electron/install.js; then
    echo "默认安装器未完成，准备使用 macOS 下载工具修复。"
  fi
fi
if ! node -e 'const fs = require("node:fs"); if (!fs.existsSync(require("electron"))) process.exit(1)'; then
  if ! node repair-electron.cjs; then
    read -r -p "修复未完成，请把上面的错误发来。按回车关闭窗口。" _answer
    exit 1
  fi
fi
echo "小狗正在启动。退出时请点击小狗下方的 ×。"
if ! npm start; then
  echo "启动没有完成，请把上面的错误信息发给我。"
  read -r -p "按回车关闭窗口。" _answer
  exit 1
fi

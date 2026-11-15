const { app, BrowserWindow, ipcMain, screen, Menu } = require('electron');
const path = require('node:path');
const { step } = require('./motion.cjs');
let win;
const single = app.requestSingleInstanceLock();
if (!single) app.quit();
else {
  app.whenReady().then(() => {
    const area = screen.getPrimaryDisplay().workArea;
    win = new BrowserWindow({ width: 380, height: 420, x: area.x + area.width - 400, y: area.y + area.height - 440,
      transparent: true, frame: false, resizable: false, alwaysOnTop: true, hasShadow: false,
      webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.loadFile('index.html');
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    win.webContents.on('will-navigate', event => event.preventDefault());
    Menu.setApplicationMenu(Menu.buildFromTemplate([{ label: '桌面小狗', submenu: [
      { label: '召回小狗', click: () => { const a = screen.getPrimaryDisplay().workArea; win.setPosition(a.x + a.width - 400, a.y + a.height - 440); win.show(); } },
      { role: 'quit', label: '退出' }
    ] }]));
    let drag, following = false, sleeping = false, hovered = false;
    ipcMain.on('pet-state', (_event, state) => {
      if (!state || typeof state !== 'object') return;
      following = state.following === true;
      sleeping = state.sleeping === true;
      hovered = state.hovered === true;
    });
    // Poll only cursor coordinates, locally. Pause while hovering controls or dragging.
    const ticker = setInterval(() => {
      if (!win || win.isDestroyed()) return;
      const bounds = win.getBounds();
      const cursor = screen.getCursorScreenPoint();
      const area = screen.getDisplayMatching(bounds).workArea;
      const state = step(bounds, cursor, area, 0.04, following && !sleeping && !drag && !hovered);
      if (state.walking) win.setPosition(state.x, state.y);
      win.webContents.send('cursor-state', { ...state, x: cursor.x - bounds.x, y: cursor.y - bounds.y });
    }, 40);
    win.on('closed', () => clearInterval(ticker));
    ipcMain.on('drag-start', () => { drag = { cursor: screen.getCursorScreenPoint(), bounds: win.getBounds() }; });
    ipcMain.on('drag-move', () => {
      if (!drag) return;
      const p = screen.getCursorScreenPoint();
      const a = screen.getDisplayNearestPoint(p).workArea;
      win.setPosition(Math.round(Math.max(a.x, Math.min(a.x + a.width - 380, drag.bounds.x + p.x - drag.cursor.x))),
        Math.round(Math.max(a.y, Math.min(a.y + a.height - 420, drag.bounds.y + p.y - drag.cursor.y))));
    });
    ipcMain.on('drag-end', () => { drag = null; });
    ipcMain.on('quit', () => app.quit());
  });
  app.on('window-all-closed', () => app.quit());
  app.on('second-instance', () => { if (win) win.show(); });
}

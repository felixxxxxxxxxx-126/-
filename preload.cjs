const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktopDog', {
  setState: state => ipcRenderer.send('pet-state', state),
  onCursor: callback => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('cursor-state', listener);
    return () => ipcRenderer.removeListener('cursor-state', listener);
  },
  startDrag: () => ipcRenderer.send('drag-start'),
  moveDrag: () => ipcRenderer.send('drag-move'),
  endDrag: () => ipcRenderer.send('drag-end'),
  quit: () => ipcRenderer.send('quit')
});

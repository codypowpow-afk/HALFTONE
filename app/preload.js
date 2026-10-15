const { contextBridge, ipcRenderer } = require("electron");

// The only things the page can ask of the computer: save files where the user chooses.
contextBridge.exposeInMainWorld("desktop", {
  saveFile: (filename, bytes) => ipcRenderer.invoke("save-file", { filename, bytes }),
  pickFolder: () => ipcRenderer.invoke("pick-folder"),
  writeToFolder: (folder, filename, bytes) => ipcRenderer.invoke("write-to-folder", { folder, filename, bytes }),
  showInFolder: (filePath) => ipcRenderer.invoke("show-in-folder", filePath),
});

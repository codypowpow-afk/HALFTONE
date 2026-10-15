const { app, BrowserWindow, dialog, ipcMain, Menu, session, shell } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");

const SAVE_TYPES = {
  png: { name: "PNG image", extensions: ["png"] },
  jpg: { name: "JPEG image", extensions: ["jpg", "jpeg"] },
};

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1360,
    height: 920,
    minWidth: 480,
    minHeight: 480,
    title: "Halftone Press",
    backgroundColor: "#eef0f3",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // The app is fully local: never navigate away or open new windows inside it.
  win.webContents.on("will-navigate", (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });

  win.loadFile(path.join(__dirname, "index.html"));
}

function safeName(name) {
  return path.basename(String(name)).replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_") || "image.png";
}

function toBuffer(bytes) {
  return Buffer.from(bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes);
}

// Save one file through the standard Save dialog.
ipcMain.handle("save-file", async (_e, { filename, bytes }) => {
  const name = safeName(filename);
  const ext = path.extname(name).slice(1).toLowerCase();
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: "Save halftone image",
    defaultPath: path.join(app.getPath("pictures"), name),
    filters: [SAVE_TYPES[ext === "jpeg" ? "jpg" : ext] || SAVE_TYPES.png],
  });
  if (canceled || !filePath) return { status: "cancelled" };
  await fs.writeFile(filePath, toBuffer(bytes));
  return { status: "saved", path: filePath };
});

// Pick a folder once for "Save all".
ipcMain.handle("pick-folder", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: "Choose a folder for the halftone images",
    defaultPath: app.getPath("pictures"),
    properties: ["openDirectory", "createDirectory"],
  });
  return canceled || !filePaths[0] ? null : filePaths[0];
});

// Write into the folder the user picked; never overwrite an existing file.
ipcMain.handle("write-to-folder", async (_e, { folder, filename, bytes }) => {
  const name = safeName(filename);
  const ext = path.extname(name);
  const stem = name.slice(0, name.length - ext.length);
  let target = path.join(folder, name);
  for (let i = 2; ; i++) {
    try { await fs.access(target); target = path.join(folder, `${stem} (${i})${ext}`); }
    catch { break; }
  }
  await fs.writeFile(target, toBuffer(bytes));
  return { status: "saved", path: target };
});

ipcMain.handle("show-in-folder", (_e, filePath) => shell.showItemInFolder(String(filePath)));

app.whenReady().then(() => {
  // Block every network request: the app only loads its own files.
  session.defaultSession.webRequest.onBeforeRequest((details, cb) => {
    cb({ cancel: !/^(file|data|blob|devtools):/.test(details.url) });
  });
  Menu.setApplicationMenu(null);
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });

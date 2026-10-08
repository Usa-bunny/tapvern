const { app, BrowserWindow, Menu } = require("electron");
const { spawn, execSync } = require("child_process");
const http = require("http");
const path = require("path");

// Cek apakah aplikasi berjalan dari paket terinstall (Production) atau via terminal (Dev)
const isDev = !app.isPackaged;
const PRODUCTION_URL = "https://tapvern.vercel.app/";
const DEV_URL = "http://localhost:3000";

let nextProcess;
let mainWindow;

function startNextServer() {
  nextProcess = spawn("npm", ["run", "dev"], {
    shell: true,
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
    detached: true,
  });
}

function waitForNextServer() {
  return new Promise((resolve) => {
    const check = () => {
      const request = http.get(DEV_URL, (response) => {
        response.resume();
        resolve();
      });

      request.on("error", () => {
        setTimeout(check, 500);
      });
    };

    check();
  });
}

function killNextServer() {
  if (nextProcess && nextProcess.pid) {
    try {
      if (process.platform === "win32") {
        execSync(`taskkill /pid ${nextProcess.pid} /f /t`);
      } else {
        process.kill(-nextProcess.pid, "SIGKILL");
      }
      console.log("Next.js dev server terminated.");
    } catch (e) {
      console.error("Failed to kill Next.js server:", e.message);
    }
  }
}

function createWindow() {
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "Tapvern",
    icon: path.join(__dirname, "../src/app/icon.png"),
  });

  // Load URL berdasarkan environment
  const targetURL = isDev ? DEV_URL : PRODUCTION_URL;
  mainWindow.loadURL(targetURL);
}

app.whenReady().then(async () => {
  if (isDev) {
    startNextServer();
    console.log("Waiting for Next.js dev server...");
    await waitForNextServer();
    console.log("Next.js is ready!");
  }

  createWindow();
});

app.on("before-quit", () => {
  if (isDev) killNextServer();
});

app.on("window-all-closed", () => {
  if (isDev) killNextServer();

  if (process.platform !== "darwin") {
    app.quit();
  }
});
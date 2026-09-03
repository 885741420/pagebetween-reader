const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const projectRoot = path.resolve(__dirname, '..');
const outputDirectory = path.join(projectRoot, 'release', 'edge-extension', 'screenshots');

async function capturePage(window, relativePath, outputName) {
  await window.loadFile(path.join(projectRoot, relativePath));
  await new Promise((resolve) => setTimeout(resolve, 250));
  const image = await window.webContents.capturePage({ x: 0, y: 0, width: 1280, height: 800 });
  fs.writeFileSync(path.join(outputDirectory, outputName), image.toPNG());
}

app.whenReady().then(async () => {
  fs.mkdirSync(outputDirectory, { recursive: true });
  const window = new BrowserWindow({
    show: false,
    width: 1280,
    height: 800,
    useContentSize: true,
    webPreferences: { offscreen: true }
  });
  try {
    await capturePage(window, 'index.html', '00-reader.png');
    await capturePage(window, 'store-demo/index.html', '01-directory.png');
    await capturePage(window, 'store-demo/chapter-1.html', '02-chapter.png');
    await capturePage(window, 'store-demo/chapter-2.html', '03-next-chapter.png');
  } finally {
    window.destroy();
    app.quit();
  }
});

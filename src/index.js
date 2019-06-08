const { app, BrowserWindow, ipcMain } = require('electron');
const util = require('util')
const path = require('path')
const fs = require('fs')
const fse = require('fse')
const request = require('request')
const {download} = require('electron-dl');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

async function getFiles(dirname, recursive = true, filterExt = null) {
  let items = []

  let stat = await fse.lstat(dirname)
  if (stat.isDirectory()) {
    let files = await fse.readdir(dirname)
    await Promise.all(files.map(async fileName => {
      let pathFile = path.join(dirname, fileName)
      let statFile = await fse.stat(pathFile)
      if (statFile.isFile()) {
        let extFile = path.extname(fileName)
        if (filterExt === null || filterExt.indexOf(extFile) !== -1) {
          items.push(pathFile)
        }
      }
      if (recursive) {
        let filesInDir = await getFiles(pathFile, recursive, filterExt)
        items = items.concat(filesInDir)
      }
    }));
  } else {
    let extFile = path.extname(dirname)
    if (filterExt === null || filterExt.indexOf(extFile) !== -1) {
      items.push(dirname)
    }
  }

  return items
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
// listen for files event by browser process
ipcMain.on('files', async (event, filesArr) => {
  const win = BrowserWindow.getFocusedWindow();
  const extensions = ['.jpg', '.png', '.jpeg'];
  const url = 'http://api.resmush.it/ws.php';

  try {
    images = []
    for (const filePath of filesArr) {
      let files = await getFiles(filePath, true, extensions)
      images = images.concat(files)
    }

    images.forEach( filePath => {
      formData = {
        files: fs.createReadStream(filePath),
      };

      request.post({
        url: url,
        formData: formData
      }, (err, httpResponse, body) => {
        if (err) {
          console.error('upload failed:', err)
        }
        json = JSON.parse(body)
        json['file'] = filePath
        mainWindow.webContents.send('metadata', json)
        if (json['dest']) {
          download(win, json['dest'], {directory: path.dirname(filePath), allowOverwrite: true})
        }
      })
    })

  //mainWindow.webContents.send('metadata', data)
  } catch (error) {
    // send an error event if something goes wrong
    mainWindow.webContents.send('metadata:error', error)
  }
})

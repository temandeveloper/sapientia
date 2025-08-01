import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  Notification,
} from 'electron'
import path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { fileURLToPath } from 'url'
import {
  getLlama,
  LlamaChatSession,
  createModelDownloader,
  combineModelDownloaders,
  Llama3_1ChatWrapper
} from 'node-llama-cpp'
import fs from 'fs'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
var LlmEngine = {}
var sessionChat = {}
var modelStart = {}
var grammar = {}
var mainWindow = {}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    minWidth: 1180,
    minHeight: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

//=========================== section download model ===========================

ipcMain.on('download-model', async (event, data) => {
  try {

    console.log('start download model',data.modelUri)
    const modelPath = path.join(app.getPath('userData'), 'gemma-2-2b-it-Q4_K_M.gguf')
    if (fs.existsSync(modelPath)) {
      fs.rmSync(modelPath, { recursive: true })
      console.log('remove existing directory:', modelPath)
    }

    const downloaders = [
      createModelDownloader({
        modelUri: data.modelUri,
        dirPath: path.join(app.getPath('userData'), 'gemma-2-2b-it-Q4_K_M.gguf')
      })
    ]

    const combinedDownloader = await combineModelDownloaders(downloaders, {
      skipExisting: true,
      deleteTempFileOnCancel: true,
      onProgress: (progress) => {
        const downloaded = formatBytes(progress.downloadedSize)
        const total = formatBytes(progress.totalSize)
        const percentage = calculateProgress(progress.downloadedSize, progress.totalSize)
        event.sender.send('download-progress', {
          path: "", //complete download path
          downloaded: downloaded,
          total: total,
          percentage: percentage,
          metadata: data.metadata,
          settingName: data.settingName
        })
      }
    })

    console.log(
      'download path start : ',
      path.join(app.getPath('userData'), 'gemma-2-2b-it-Q4_K_M.gguf')
    )

    const [model1Path] = await combinedDownloader.download()

    event.sender.send('download-progress', {
      path: model1Path,
      downloaded: 0,
      total: 0,
      percentage: 0,
      metadata: data.metadata,
      settingName: data.settingName
    })

    console.log('downloaded model : ', model1Path)
  } catch (error) {
    console.error('Failed to download model:', error)
    // Remove partially downloaded file if download fails
    const modelPath = path.join(app.getPath('userData'), 'gemma-2-2b-it-Q4_K_M.gguf')
    if (fs.existsSync(modelPath)) {
      fs.rmSync(modelPath, { recursive: true })
      console.log('remove existing directory:', modelPath)
    }
  }
})

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

const calculateProgress = (downloadedSize, totalSize) => {
  return ((downloadedSize / totalSize) * 100).toFixed(2)
}

//=========================== end section download model ===========================


//=========================== section chat model ===========================
ipcMain.handle('init-chat', async (event, data) => {
  try {
    // ini chatbot
    console.log(
      'path model',
      fs.existsSync(path.join(app.getPath('userData'), 'gemma-2-2b-it-Q4_K_M.gguf'))
    )
    if (fs.existsSync(path.join(app.getPath('userData'), 'gemma-2-2b-it-Q4_K_M.gguf'))) {
      await initializeAiChat(data)
      await openContextModel(data.config)
      return {
        status: 200
      }
    } else {
      console.warn(
        'Model file does not exist:',
        path.join(app.getPath('userData'), 'gemma-2-2b-it-Q4_K_M.gguf')
      )
      return {
        status: 400
      }
    }
  } catch (err) {
    console.warn('run-test error : ', err)
    return {
      status: 500
    }
  }
})


async function initializeAiChat(data) {
  try {
    LlmEngine = await getLlama()
    console.log("initializeAiChat path :",data.path)
    console.log('GPU type:', LlmEngine.gpu)
    modelStart = await LlmEngine.loadModel({
      modelPath: data.path
    })

    console.log('load model')
  } catch (error) {
    console.error('Failed to initialize LlmEngine:', error)
  }
}

async function openContextModel(dataConfig){
  try {
    console.log(JSON.parse(dataConfig.output_schema),dataConfig.system_prompt)
    grammar = await LlmEngine.createGrammarForJsonSchema(JSON.parse(dataConfig.output_schema));
    const context = await modelStart.createContext()
    sessionChat   = new LlamaChatSession({
      contextSequence: context.getSequence(),
      chatWrapper: new Llama3_1ChatWrapper(),
      systemPrompt: dataConfig.system_prompt // line ini menyebabkan error
    })
    console.log('chat start')
  } catch (error) {
    console.error('Failed to open context:', error)
  }
  
}

ipcMain.on('send-chat', async (event, data) => {
  let response = await sessionChat.prompt(data.text, {
    grammar: grammar,
    onTextChunk(chunk) {
      mainWindow.webContents.send('response-chat', {
        response: chunk,
        id: data.id,
        status: 'render'
      })
    }
  })
  
  console.log(response)
  mainWindow.webContents.send('response-chat', {
    response: response,
    id: data.id,
    status: 'end'
  })
})

//=========================== end of section chat model ===========================

ipcMain.on('notification', (event, data) => {
  new Notification(data).show()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

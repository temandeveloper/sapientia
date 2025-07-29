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
var sessionChat = {}
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
      await initializeAiChat()
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


async function initializeAiChat() {
  try {
    const llama = await getLlama()
    console.log('GPU type:', llama.gpu)
    const model = await llama.loadModel({
      modelPath: path.join(
        app.getPath('userData'),
        'gemma-2-2b-it-Q4_K_M.gguf',
        'hf_AhmadFadil_gemma-2-2b-it-Q4_K_M.gguf'
      )
    })

    const context = await model.createContext()
    sessionChat = new LlamaChatSession({
      contextSequence: context.getSequence(),
      chatWrapper: new Llama3_1ChatWrapper(),
      systemPrompt: `You are is a RabBit Companion build with Gemma-2 large language model trained by Google, a friendly and knowledgeable assistant to do anything and help answer anything question even about RabBit Application with clearly and in a friendly tone but remain polite and helpful, If you don't know the answer to a question, don't share false information. 
                    RabBit is an advanced tool that automates web-based tasks and tests web front-ends using Puppeteer, a library developed by Google. Puppeteer allows you to interact with Chrome or Chromium browsers programmatically, enabling RabBit to: Navigate websites, Fill forms, Click buttons, Extract data, Interact with browser elements.
                    RabBit is user-friendly and built on Puppeteer library, which is supported by a large community and extensive resources, making it easy to learn and extend.

                    Your Role:
                    - Here is the format you will use to provide your solution only if users input questions context about RabBit, Puppeteer or context to create automation browser, your goal is to provide a RabBit Code Solution with Puppeteer code: 
                      ---

                      ## Problem Description
                      $problem_description

                      ## Existing Puppeteer Object Already Defined
                      - Browser instance: \`openBrowser\`
                      - Page instance: \`$\`

                      ## RabBit Code Solution
                      $RabBit_code_solution

                      ## Explanation
                      $explanation

                      ## How To Implement Into RabBit
                      - Copy the code solution without any javascript \`require\`, \`import\` or Puppeteer Browser instance \`puppeteer.launch()\` or Puppeteer Page instance \`browser.newPage()\` because RabBit is already handle that. 
                      - Paste the code solution into RabBit Action Table or Module, and replace \`page.\` instance with \`$.\` instance. exampel: \`page.goto('https://targeturl.com/')\` to \`$.goto('https://targeturl.com/')\`

                      ---
                    `
    })
    console.log('chat start')
  } catch (error) {
    console.error('Failed to initialize Llama:', error)
  }
}

ipcMain.on('send-chat', async (event, data) => {
  let response = await sessionChat.prompt(data.text, {
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

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
  JinjaTemplateChatWrapper
} from 'node-llama-cpp'
import fs from 'fs'

// Configuration and Constants
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MODELS_DIR = "Models"

// Application State
class AppState {
  constructor() {
    this.llmEngine = null
    this.sessionChat = null
    this.modelStart = null
    this.grammar = null
    this.mainWindow = null
  }

  setMainWindow(window) {
    this.mainWindow = window
  }

  setLlmEngine(engine) {
    this.llmEngine = engine
  }

  setSessionChat(session) {
    this.sessionChat = session
  }

  setModelStart(model) {
    this.modelStart = model
  }

  setGrammar(grammar) {
    this.grammar = grammar
  }
}

const appState = new AppState()

// Window Management
class WindowManager {
  static createWindow() {
    const window = new BrowserWindow({
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

    window.on('ready-to-show', () => {
      window.show()
    })

    window.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    // Load appropriate content based on environment
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      window.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      window.loadFile(path.join(__dirname, '../renderer/index.html'))
    }

    appState.setMainWindow(window)
    return window
  }
}

// Utility Functions
class Utils {
  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  static calculateProgress(downloadedSize, totalSize) {
    return ((downloadedSize / totalSize) * 100).toFixed(2)
  }

  static getModelPath() {
    return path.join(app.getPath('userData'), MODELS_DIR)
  }

  static removeExistingModel() {
    const modelPath = this.getModelPath()
    if (fs.existsSync(modelPath)) {
      fs.rmSync(modelPath, { recursive: true })
      console.log('Removed existing directory:', modelPath)
    }
  }

  static modelExists() {
    return fs.existsSync(this.getModelPath())
  }
}

// Model Download Management
class ModelDownloader {
  static async downloadModel(event, data) {
    try {
      console.log('Starting model download:', data.modelUri)
      
      // Clean up existing model
      Utils.removeExistingModel()

      const downloaders = [
        createModelDownloader({
          modelUri: data.modelUri,
          dirPath: Utils.getModelPath()
        })
      ]

      const combinedDownloader = await combineModelDownloaders(downloaders, {
        skipExisting: true,
        deleteTempFileOnCancel: true,
        onProgress: (progress) => {
          const downloaded = Utils.formatBytes(progress.downloadedSize)
          const total = Utils.formatBytes(progress.totalSize)
          const percentage = Utils.calculateProgress(progress.downloadedSize, progress.totalSize)
          
          event.sender.send('download-progress', {
            path: "",
            downloaded: downloaded,
            total: total,
            percentage: percentage,
            metadata: data.metadata,
            settingName: data.settingName
          })
        }
      })

      console.log('Download path:', Utils.getModelPath())

      const [modelPath] = await combinedDownloader.download()

      // Send completion notification
      event.sender.send('download-progress', {
        path: modelPath,
        downloaded: 0,
        total: 0,
        percentage: 0,
        metadata: data.metadata,
        settingName: data.settingName
      })

      console.log('Model downloaded successfully:', modelPath)
    } catch (error) {
      console.error('Failed to download model:', error)
      Utils.removeExistingModel()
      throw error
    }
  }
}

// Chat Management
class ChatManager {
  static async initializeChat(data) {
    try {
      if (!Utils.modelExists()) {
        console.warn('Model file does not exist:', Utils.getModelPath())
        return { status: 400 }
      }

      await this.initializeAiEngine(data)
      await this.openContextModel(data.config)
      
      return { status: 200 }
    } catch (error) {
      console.error('Failed to initialize chat:', error)
      return { status: 500 }
    }
  }

  static async initializeAiEngine(data) {
    try {
      const llmEngine = await getLlama({
          gpu: {
              type: "auto",
              exclude: ["vulkan"] //kecuali vulkan
          }
      })
      
      console.log("Initialize AI Chat path:", data.path)
      console.log('GPU type:', llmEngine.gpu)
      
      const modelStart = await llmEngine.loadModel({
        modelPath: data.path,
      })

      appState.setLlmEngine(llmEngine)
      appState.setModelStart(modelStart)
      
      console.log('Model loaded successfully')
    } catch (error) {
      console.error('Failed to initialize LLM engine:', error)
      throw error
    }
  }

  static async openContextModel(dataConfig) {
    try {
      
      const grammar = await appState.llmEngine.createGrammarForJsonSchema(
        JSON.parse(dataConfig.output_schema)
      )

      const chatWrapper = new JinjaTemplateChatWrapper({
        template: this.getChatTemplate()
      })

      const context = await appState.modelStart.createContext()
      const sessionChat = new LlamaChatSession({
        contextSequence: context.getSequence(),
        chatWrapper: chatWrapper,
        systemPrompt: dataConfig.system_prompt
      })

      appState.setGrammar(grammar)
      appState.setSessionChat(sessionChat)
      
      console.log('Chat context opened successfully')
    } catch (error) {
      console.error('Failed to open context:', error)
      throw error
    }
  }

  static getChatTemplate() {
    return "{{ bos_token }}\n" +
           "{%- if messages[0]['role'] == 'system' -%}\n" +
           "    {%- if messages[0]['content'] is string -%}\n" +
           "        {%- set first_user_prefix = messages[0]['content'] + '\n\n' -%}\n" +
           "    {%- else -%}\n" +
           "        {%- set first_user_prefix = messages[0]['content'][0]['text'] + '\n\n' -%}\n" +
           "    {%- endif -%}\n" +
           "    {%- set loop_messages = messages[1:] -%}\n" +
           "{%- else -%}\n" +
           "    {%- set first_user_prefix = \"\" -%}\n" +
           "    {%- set loop_messages = messages -%}\n" +
           "{%- endif -%}\n" +
           "{%- for message in loop_messages -%}\n" +
           "    {%- if (message['role'] == 'user') != (loop.index0 % 2 == 0) -%}\n" +
           "        {{ raise_exception(\"Conversation roles must alternate user/assistant/user/assistant/...\") }}\n" +
           "    {%- endif -%}\n" +
           "    {%- if (message['role'] == 'assistant') -%}\n" +
           "        {%- set role = \"model\" -%}\n" +
           "    {%- else -%}\n" +
           "        {%- set role = message['role'] -%}\n" +
           "    {%- endif -%}\n" +
           "    {{ '<start_of_turn>' + role + '\n' + (first_user_prefix if loop.first else \"\") }}\n" +
           "    {%- if message['content'] is string -%}\n" +
           "        {{ message['content'] | trim }}\n" +
           "    {%- elif message['content'] is iterable -%}\n" +
           "        {%- for item in message['content'] -%}\n" +
           "            {%- if item['type'] == 'audio' -%}\n" +
           "                {{ '<audio_soft_token>' }}\n" +
           "            {%- elif item['type'] == 'image' -%}\n" +
           "                {{ '<image_soft_token>' }}\n" +
           "            {%- elif item['type'] == 'text' -%}\n" +
           "                {{ item['text'] | trim }}\n" +
           "            {%- endif -%}\n" +
           "        {%- endfor -%}\n" +
           "    {%- else -%}\n" +
           "        {{ raise_exception(\"Invalid content type\") }}\n" +
           "    {%- endif -%}\n" +
           "    {{ '<end_of_turn>\n' }}\n" +
           "{%- endfor -%}\n" +
           "{%- if add_generation_prompt -%}\n" +
           "    {{'<start_of_turn>model\n'}}\n" +
           "{%- endif -%}\n"
  }

  static async sendChat(event, data) {
    try {
      console.log("send chat",{
          temperature: data.config.temperature,
          topK: data.config.top_k,
          topP: data.config.top_p,
      });
      const response = await appState.sessionChat.prompt(data.text, {
        grammar: appState.grammar,
        onTextChunk(chunk) {
          appState.mainWindow.webContents.send('response-chat', {
            response: chunk,
            id: data.id,
            status: 'render'
          })
        },
          temperature: data.config.temperature,
          topK: data.config.top_k,
          topP: data.config.top_p,
      })
      
      console.log('Chat response:', response)
      
      appState.mainWindow.webContents.send('response-chat', {
        response: response,
        id: data.id,
        status: 'end'
      })
    } catch (error) {
      console.error('Failed to send chat:', error)
      
      appState.mainWindow.webContents.send('response-chat', {
        response: 'Error: Failed to generate response',
        id: data.id,
        status: 'error'
      })
    }
  }
}

// Notification Manager
class NotificationManager {
  static showNotification(event, data) {
    try {
      new Notification(data).show()
    } catch (error) {
      console.error('Failed to show notification:', error)
    }
  }
}

// IPC Event Handlers
class IPCHandlers {
  static registerHandlers() {
    // Model download handler
    ipcMain.on('download-model', async (event, data) => {
      await ModelDownloader.downloadModel(event, data)
    })

    // Chat initialization handler
    ipcMain.handle('init-chat', async (event, data) => {
      return await ChatManager.initializeChat(data)
    })

    // Send chat handler
    ipcMain.on('send-chat', async (event, data) => {
      await ChatManager.sendChat(event, data)
    })

    // Open Context
    ipcMain.on('open-context', async (event, data) => {
      await ChatManager.openContextModel(data.config)
    })

    // Notification handler
    ipcMain.on('notification', (event, data) => {
      NotificationManager.showNotification(event, data)
    })

    // Test handler
    ipcMain.on('ping', () => console.log('pong'))
  }
}

// Application Lifecycle
class AppLifecycle {
  static initialize() {
    app.whenReady().then(() => {
      // Set app user model id for windows
      electronApp.setAppUserModelId('com.electron')

      // Default open or close DevTools by F12 in development
      app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
      })

      // Register IPC handlers
      IPCHandlers.registerHandlers()

      // Create main window
      WindowManager.createWindow()

      app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
          WindowManager.createWindow()
        }
      })
    })

    // Quit when all windows are closed, except on macOS
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })
  }
}

// Initialize the application
AppLifecycle.initialize()
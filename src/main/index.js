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
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import mammoth from 'mammoth';
import axios from 'axios';
import * as cheerio from 'cheerio';

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
          // temperature: data.config.temperature,
          // topK: data.config.top_k,
          // topP: data.config.top_p,
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

class RAG {
  static async getDataPdf(path) {
    console.log("path pdf", path);
    try {
      // 1. Baca file seperti biasa, ini akan menghasilkan Buffer
      let dataBuffer = fs.readFileSync(path);

      // 2. Konversi Buffer menjadi Uint8Array
      const uint8Array = new Uint8Array(dataBuffer);

      // 3. Gunakan uint8Array saat memanggil getDocument
      const loadingTask = getDocument({ 
        data: uint8Array, // <-- Gunakan variabel baru di sini
        disableWorker: true 
      });

      const pdf = await loadingTask.promise;
      let allText = '';
      
      console.log("Jumlah halaman:", pdf.numPages);

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        allText += pageText + '\n';
      }

      console.log("--- Ekstraksi PDF Berhasil ---");
      console.log(allText.substring(0, 500) + '...');
      
      return allText; 

    } catch (error) {
      // Error logging sekarang akan lebih akurat jika ada masalah lain
      console.error("Gagal memproses PDF dengan pdf.js:", error);
    }
  }

  static async getDataDocx(path) {
    console.log("path docx", path);

    let fullText = await mammoth.extractRawText({path: path})
    .then(function(result){
        return result?.value;
    })
    .catch(function(error) {
        console.error(error);
    });

    return fullText;
  }

  static async getDataWebPage(url) {
    // 1. Daftar 5 User-Agent yang berbeda untuk browser dan OS modern.
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:126.0) Gecko/20100101 Firefox/126.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edg/125.0.2535.67 Safari/537.36'
    ];

    // 2. Pilih satu User-Agent secara acak dari daftar di atas.
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    console.log(`Menggunakan User-Agent: ${randomUserAgent}`);

    // --- AKHIR DARI PERUBAHAN ---
    try {
      console.log(`Mengambil konten dari: ${url}`);
      const response = await axios.get(url, {
          headers: {
              // 3. Gunakan User-Agent yang dipilih secara acak di sini.
              'User-Agent': randomUserAgent
          }
      });
      const html = response.data;

      const $ = cheerio.load(html);
      const title = $('h1').first().text().trim();

      let content = '';
      $('p').each((index, element) => {
        content += $(element).text().trim() + '\n\n';
      });
      
      if (!content) {
          content = $('body').text().trim(); 
      }

      console.log("Ekstraksi berhasil!");
      return {
        title: title || 'Judul tidak ditemukan',
        content: content || 'Konten tidak ditemukan'
      };

    } catch (error) {
      console.error(`Gagal mengambil atau memproses URL: ${url}`);
      console.error("Detail Error:", error.message);
      return null;
    }
  }

  static async googleCustomSearch(data) {
    try {
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', { // Path dikosongkan karena sudah ada di baseURL
        params: {
          key   : data.apiKey,
          cx    : data.searchEngineId,
          q     : data.query,
        }
      });

      console.log(response)
    } catch (error) {
      console.error("Detail Error:", error.message);
      return null;
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

    // RAG (Retrieval Augmented Generation) Engine handler
    ipcMain.on('rag-engine', async (event, data) => {
      console.log('rag-engine',data)
      let retrieve = await RAG.googleCustomSearch("https://www.nationalgeographic.com/science/article/best-night-sky-events-to-see-in-august")
      console.log("retrieve",retrieve);
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
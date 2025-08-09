import { contextBridge, ipcRenderer, shell } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}
// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('underWorld', {
        initChat: async (data) => ipcRenderer.invoke('init-chat',data),
        sendChat: (send) => ipcRenderer.send('send-chat',send),
        openContext: (config) => ipcRenderer.send('open-context',config),
        onResponseChat: (callback) => {
          const subscription = (_event, value) => callback(value)
          ipcRenderer.on('response-chat', subscription)
          // Return a function to unsubscribe from the event
          return () => {
            ipcRenderer.removeListener('response-chat', subscription)
          }
        },
        downloadModel: (config) => ipcRenderer.send('download-model',config),
        onDownloadProgress: (callback) => {
          const subscription = (_event, value) => callback(value)
          ipcRenderer.on('download-progress', subscription)
          // Return a function to unsubscribe from the event
          return () => {
            ipcRenderer.removeListener('download-progress', subscription)
          }
        },
        notification: (notif) => ipcRenderer.send('notification',notif),
        ragEngine: (data) => ipcRenderer.send('rag-engine',data),
        gotoLink: (link) => {
          shell.openExternal(link)
        },
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
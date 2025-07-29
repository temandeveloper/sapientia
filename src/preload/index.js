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
        initModule: async (modules) => ipcRenderer.invoke('init-module',modules),
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
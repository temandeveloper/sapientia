import { Connection } from 'jsstore'
import workerInjector from 'jsstore/dist/worker_injector'
const connection = new Connection()
connection.addPlugin(workerInjector)
let singleExec = null;

// Helper untuk IndexedDB
export const idb = {
  // Helper untuk IndexedDB legacy version
  openDB: () =>
    new Promise((resolve, reject) => {
      const request = indexedDB.open('SapientiaDB', 1)
      request.onupgradeneeded = (e) => {
        if (!e.target.result.objectStoreNames.contains('KeyStore'))
          e.target.result.createObjectStore('KeyStore')
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    }),
  setItem: async (key, value) => {
    const db = await idb.openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('KeyStore', 'readwrite')
      const request = tx.objectStore('KeyStore').put(value, key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
      tx.oncomplete = () => db.close()
    })
  },
  getItem: async (key) => {
    const db = await idb.openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('KeyStore', 'readonly')
      const request = tx.objectStore('KeyStore').get(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
      tx.oncomplete = () => db.close()
    })
  }
}

export const initDatabase = async () => {
  try {
    // create database schema
    const tbMemories = {
      name: 'tbMemories',
      columns: {
        id: { primaryKey: true, autoIncrement: true },
        datetime: { notNull: true, dataType: 'number' },
        request: { notNull: false, dataType: 'string' },
        response: { notNull: false, dataType: 'string' },
        vectors: { notNull: false, dataType: 'string' }
      }
    }

    const tbSettings = {
      name: 'tbSettings',
      columns: {
        id: { primaryKey: true, autoIncrement: true },
        datetime: { notNull: true, dataType: 'number' },
        settingName: { notNull: true, dataType: 'string' },
        value: { notNull: true, dataType: 'object' }
      }
    }

    var db = {
      name: 'sapientia_system_storage',
      tables: [tbMemories, tbSettings]
    }

    const isDbCreated = await connection.initDb(db)
    if (isDbCreated === true) {
      const inserted = await connection.insert({
        into: 'tbSettings',
        values: [
          {
            datetime: Date.now(),
            settingName: 'base-model',
            value: {
              modelName: 'gemma-3n-E2B-it-Q4_K_M.gguf',
              modelPath: '',
              modelUri: 'hf:AhmadFadil/gemma-3n-E2B-it-text-GGUF/gemma-3n-E2B-it-Q4_K_M.gguf',
              source: 'https://huggingface.co/google/gemma-3n-E2B-it',
              statusDownloaded: false
            }
          },
          {
            datetime: Date.now(),
            settingName: 'embedding-model',
            value: {
              modelName: 'bge-small-en-v1.5-q8_0.gguf',
              modelPath: '',
              modelUri: 'hf:CompendiumLabs/bge-small-en-v1.5-gguf/bge-small-en-v1.5-q8_0.gguf',
              source: 'https://huggingface.co/BAAI/bge-small-en-v1.5',
              statusDownloaded: false
            }
          },
          {
            datetime: Date.now(),
            settingName: 'model-configuration',
            value: {
              system_prompt: `Anda adalah sebuah AI Router yang sangat presisi. Tugas utama dan SATU-SATUNYA bagi Anda adalah menganalisis permintaan pengguna dan merespons HANYA dalam format JSON yang valid. Ikuti aturan prioritas berikut dari nomor 1 hingga 6 tanpa kecuali.

                              **ATURAN PRIORITAS (WAJIB DIIKUTI SECARA BERURUTAN):**

                              **PRIORITAS #1: OPERASI FILE ('Tool Call: readFile')**
                              Jika permintaan pengguna mengandung kata kunci untuk membaca file (seperti "baca file", "isi dari", "gali informasi dari file") ATAU mengandung format path (seperti "C:\\", "D:/", "~/"), Anda WAJIB berhenti dan HANYA menggunakan format 'Tool Call' dengan 'tool_name: "readFile"'.

                              **PRIORITAS #2: PERINTAH SISTEM ('Shell Command')**
                              Jika permintaan pengguna adalah sebuah perintah untuk sistem operasi (seperti "cek jaringan", "buat folder", "daftar file", "ping", "ipconfig", "hapus direktori"), Anda WAJIB berhenti dan HANYA menggunakan format 'Shell Command'.

                              **PRIORITAS #3: INFORMASI INTERNET ('Tool Call: getInternetInfo')**
                              Jika permintaan pengguna adalah untuk informasi real-time (seperti "berita terbaru", "informasi terkini", "cuaca", "saham saat ini", "info tentang..."), Anda WAJIB berhenti dan HANYA menggunakan format 'Tool Call' dengan 'tool_name: "getInternetInfo"'.
                              **PERINGATAN KERAS**: JANGAN PERNAH MENJAWAB TOPIK INI DARI INGATAN ANDA. ITU ADALAH PELANGGARAN INSTRUKSI.

                              **PRIORITAS #4: PEMBUATAN KODE ('Code Answer')**
                              Jika pengguna meminta untuk dibuatkan kode, skrip, atau sintaks (seperti "kode javascript", "fungsi python", "contoh kotlin"), Anda WAJIB berhenti dan HANYA menggunakan format 'Code Answer'.

                              **PRIORITAS #5: SAPAAN & PERCAKAPAN SINGKAT ('Direct Answer' - Mode Suara)**
                              Jika permintaan pengguna adalah sapaan singkat ("halo", "hai kawan"), ucapan terima kasih ("ok makasih"), atau komunikasi sederhana yang tidak butuh jawaban panjang, Anda WAJIB menggunakan 'Direct Answer', isi 'voice' dengan respons singkat, dan isi 'answer' dengan **string kosong** ('""').

                              **PRIORITAS #6: JAWABAN UMUM ('Direct Answer' - Mode Lengkap)**
                              Untuk SEMUA HAL LAINNYA yang tidak cocok dengan prioritas 1-5 (membuat cerita, penjelasan umum, terjemahan, dll.), gunakan format 'Direct Answer' dan isi kedua bidang 'voice' dan 'answer'.

                              ---
                              **CONTOH WAJIB DIIKUTI:**

                              1.  **Pengguna**: coba gali informasi dari file C:\Users\Yamato\AppData\Roaming\rabbit\DawnCache.doc
                                  **Anda**:
                                  {
                                    "tool_name": "readFile",
                                    "parameters": {
                                      "path": "C:\\Users\\Yamato\\AppData\\Roaming\\rabbit\\DawnCache.doc"
                                    }
                                  }

                              2.  **Pengguna**: tolong check jaringan komputer ini
                                  **Anda**:
                                  {
                                    "command": "ping google.com",
                                    "explanation": "Perintah ini mengirimkan paket ke google.com untuk memeriksa konektivitas jaringan."
                                  }

                              3.  **Pengguna**: tolong berikan saya informasi terbaru terkait AI
                                  **Anda**:
                                  {
                                    "tool_name": "getInternetInfo",
                                    "parameters": {
                                      "query": "informasi dan berita terbaru tentang AI"
                                    }
                                  }

                              4.  **Pengguna**: tolong buatkan saya kode javascript sederhana
                                  **Anda**:
                                  {
                                    "code": "console.log('Hello, World!');",
                                    "explanation": "Ini adalah kode Javascript sederhana untuk menampilkan 'Hello, World!' di konsol."
                                  }

                              5.  **Pengguna**: hello kawan
                                  **Anda**:
                                  {
                                    "voice": "Halo juga, kawan! Ada yang bisa saya bantu?",
                                    "answer": ""
                                  }

                              6.  **Pengguna**: tolong buatkan sebuah cerita
                                  **Anda**:
                                  {
                                    "voice": "Tentu, aku buatkan sebuah cerita untukmu.",
                                    "answer": "Di sebuah lembah yang hijau, hiduplah seekor naga kecil yang takut akan ketinggian..."
                                  }`,
              temperature: 0.8,
              top_p: 0.95,
              top_k: 40,
              min_p: 0.05,
              output_schema: `{
                                "$schema": "http://json-schema.org/draft-07/schema#",
                                "title": "Multi-Purpose Model Response",
                                "description": "Wadah untuk respons model, bisa berupa pemanggilan alat, jawaban langsung, jawaban kode, atau perintah shell.",
                                "oneOf": [
                                    {
                                        "title": "Tool Call",
                                        "type": "object",
                                        "properties": {
                                            "tool_name": {
                                                "type": "string",
                                                "description": "Nama fungsi yang akan dipanggil.",
                                                "enum": [
                                                    "getInternetInfo",
                                                    "readFile"
                                                ]
                                            },
                                            "parameters": {
                                                "type": "object",
                                                "properties": {
                                                    "query": {
                                                        "type": "string",
                                                        "description": "Topik atau kata kunci pencarian untuk dicari di internet."
                                                    },
                                                    "path": {
                                                        "type": "string",
                                                        "description": "Path file lokal yang akan dibaca."
                                                    }
                                                }
                                            }
                                        },
                                        "required": [
                                            "tool_name",
                                            "parameters"
                                        ]
                                    },
                                    {
                                        "title": "Direct Answer",
                                        "type": "object",
                                        "properties": {
                                            "voice": {
                                                "type": "string",
                                                "description": "Teks respons singkat, santai, dan ramah seperti manusia (untuk diucapkan)."
                                            },
                                            "answer": {
                                                "type": "string",
                                                "description": "Jawaban utama yang mendetail dari model."
                                            }
                                        },
                                        "required": [
                                            "voice",
                                            "answer"
                                        ]
                                    },
                                    {
                                        "title": "Code Answer",
                                        "type": "object",
                                        "properties": {
                                            "code": {
                                                "type": "string"
                                            },
                                            "explanation": {
                                                "type": "string"
                                            }
                                        },
                                        "required": [
                                            "code",
                                            "explanation"
                                        ]
                                    },
                                    {
                                        "title": "Shell Command",
                                        "type": "object",
                                        "properties": {
                                            "command": {
                                                "type": "string",
                                                "description": "Perintah shell/terminal yang akan dieksekusi."
                                            },
                                            "explanation": {
                                                "type": "string",
                                                "description": "Penjelasan singkat tentang apa yang dilakukan perintah tersebut."
                                            }
                                        },
                                        "required": [
                                            "command",
                                            "explanation"
                                        ]
                                    }
                                ]
                            }`
            }
          }
        ],
        return: true
      })

      console.log('db created')
      return inserted
    } else {
      console.log('db opened')
      return false
    }
  } catch (error) {
    console.log('database initialization failed', error)
    return false
  }
}


export const defaultModelConfig = async () => {
    const defaultValue = {
        system_prompt: `Anda adalah sebuah AI Router yang sangat presisi. Tugas utama dan SATU-SATUNYA bagi Anda adalah menganalisis permintaan pengguna dan merespons HANYA dalam format JSON yang valid. Ikuti aturan prioritas berikut dari nomor 1 hingga 6 tanpa kecuali.

                        **ATURAN PRIORITAS (WAJIB DIIKUTI SECARA BERURUTAN):**

                        **PRIORITAS #1: OPERASI FILE ('Tool Call: readFile')**
                        Jika permintaan pengguna mengandung kata kunci untuk membaca file (seperti "baca file", "isi dari", "gali informasi dari file") ATAU mengandung format path (seperti "C:\\", "D:/", "~/"), Anda WAJIB berhenti dan HANYA menggunakan format 'Tool Call' dengan 'tool_name: "readFile"'.

                        **PRIORITAS #2: PERINTAH SISTEM ('Shell Command')**
                        Jika permintaan pengguna adalah sebuah perintah untuk sistem operasi (seperti "cek jaringan", "buat folder", "daftar file", "ping", "ipconfig", "hapus direktori"), Anda WAJIB berhenti dan HANYA menggunakan format 'Shell Command'.

                        **PRIORITAS #3: INFORMASI INTERNET ('Tool Call: getInternetInfo')**
                        Jika permintaan pengguna adalah untuk informasi real-time (seperti "berita terbaru", "informasi terkini", "cuaca", "saham saat ini", "info tentang..."), Anda WAJIB berhenti dan HANYA menggunakan format 'Tool Call' dengan 'tool_name: "getInternetInfo"'.
                        **PERINGATAN KERAS**: JANGAN PERNAH MENJAWAB TOPIK INI DARI INGATAN ANDA. ITU ADALAH PELANGGARAN INSTRUKSI.

                        **PRIORITAS #4: PEMBUATAN KODE ('Code Answer')**
                        Jika pengguna meminta untuk dibuatkan kode, skrip, atau sintaks (seperti "kode javascript", "fungsi python", "contoh kotlin"), Anda WAJIB berhenti dan HANYA menggunakan format 'Code Answer'.

                        **PRIORITAS #5: SAPAAN & PERCAKAPAN SINGKAT ('Direct Answer' - Mode Suara)**
                        Jika permintaan pengguna adalah sapaan singkat ("halo", "hai kawan"), ucapan terima kasih ("ok makasih"), atau komunikasi sederhana yang tidak butuh jawaban panjang, Anda WAJIB menggunakan 'Direct Answer', isi 'voice' dengan respons singkat, dan isi 'answer' dengan **string kosong** ('""').

                        **PRIORITAS #6: JAWABAN UMUM ('Direct Answer' - Mode Lengkap)**
                        Untuk SEMUA HAL LAINNYA yang tidak cocok dengan prioritas 1-5 (membuat cerita, penjelasan umum, terjemahan, dll.), gunakan format 'Direct Answer' dan isi kedua bidang 'voice' dan 'answer'.

                        ---
                        **CONTOH WAJIB DIIKUTI:**

                        1.  **Pengguna**: coba gali informasi dari file C:\Users\Yamato\AppData\Roaming\rabbit\DawnCache.doc
                            **Anda**:
                            {
                              "tool_name": "readFile",
                              "parameters": {
                                "path": "C:\\Users\\Yamato\\AppData\\Roaming\\rabbit\\DawnCache.doc"
                              }
                            }

                        2.  **Pengguna**: tolong check jaringan komputer ini
                            **Anda**:
                            {
                              "command": "ping google.com",
                              "explanation": "Perintah ini mengirimkan paket ke google.com untuk memeriksa konektivitas jaringan."
                            }

                        3.  **Pengguna**: tolong berikan saya informasi terbaru terkait AI
                            **Anda**:
                            {
                              "tool_name": "getInternetInfo",
                              "parameters": {
                                "query": "informasi dan berita terbaru tentang AI"
                              }
                            }

                        4.  **Pengguna**: tolong buatkan saya kode javascript sederhana
                            **Anda**:
                            {
                              "code": "console.log('Hello, World!');",
                              "explanation": "Ini adalah kode Javascript sederhana untuk menampilkan 'Hello, World!' di konsol."
                            }

                        5.  **Pengguna**: hello kawan
                            **Anda**:
                            {
                              "voice": "Halo juga, kawan! Ada yang bisa saya bantu?",
                              "answer": ""
                            }

                        6.  **Pengguna**: tolong buatkan sebuah cerita
                            **Anda**:
                            {
                              "voice": "Tentu, aku buatkan sebuah cerita untukmu.",
                              "answer": "Di sebuah lembah yang hijau, hiduplah seekor naga kecil yang takut akan ketinggian..."
                            }`,
        temperature: 0.8,
        top_p: 0.95,
        top_k: 40,
        min_p: 0.05,
        output_schema: `{
                          "$schema": "http://json-schema.org/draft-07/schema#",
                          "title": "Multi-Purpose Model Response",
                          "description": "Wadah untuk respons model, bisa berupa pemanggilan alat, jawaban langsung, jawaban kode, atau perintah shell.",
                          "oneOf": [
                              {
                                  "title": "Tool Call",
                                  "type": "object",
                                  "properties": {
                                      "tool_name": {
                                          "type": "string",
                                          "description": "Nama fungsi yang akan dipanggil.",
                                          "enum": [
                                              "getInternetInfo",
                                              "readFile"
                                          ]
                                      },
                                      "parameters": {
                                          "type": "object",
                                          "properties": {
                                              "query": {
                                                  "type": "string",
                                                  "description": "Topik atau kata kunci pencarian untuk dicari di internet."
                                              },
                                              "path": {
                                                  "type": "string",
                                                  "description": "Path file lokal yang akan dibaca."
                                              }
                                          }
                                      }
                                  },
                                  "required": [
                                      "tool_name",
                                      "parameters"
                                  ]
                              },
                              {
                                  "title": "Direct Answer",
                                  "type": "object",
                                  "properties": {
                                      "voice": {
                                          "type": "string",
                                          "description": "Teks respons singkat, santai, dan ramah seperti manusia (untuk diucapkan)."
                                      },
                                      "answer": {
                                          "type": "string",
                                          "description": "Jawaban utama yang mendetail dari model."
                                      }
                                  },
                                  "required": [
                                      "voice",
                                      "answer"
                                  ]
                              },
                              {
                                  "title": "Code Answer",
                                  "type": "object",
                                  "properties": {
                                      "code": {
                                          "type": "string"
                                      },
                                      "explanation": {
                                          "type": "string"
                                      }
                                  },
                                  "required": [
                                      "code",
                                      "explanation"
                                  ]
                              },
                              {
                                  "title": "Shell Command",
                                  "type": "object",
                                  "properties": {
                                      "command": {
                                          "type": "string",
                                          "description": "Perintah shell/terminal yang akan dieksekusi."
                                      },
                                      "explanation": {
                                          "type": "string",
                                          "description": "Penjelasan singkat tentang apa yang dilakukan perintah tersebut."
                                      }
                                  },
                                  "required": [
                                      "command",
                                      "explanation"
                                  ]
                              }
                          ]
                      }`
    }
  let modelConfig = await getDataTable("tbSettings",[{
      settingName: {
          in : ["model-configuration"]
      }
  }])

  if(modelConfig.length >= 1){
    await updateDataTable("tbSettings",{
        value       : defaultValue,
        datetime    : Date.now(),
    },{settingName : "model-configuration"})
  }else{
    await insertDataTable('tbSettings', {
      datetime: Date.now(),
      settingName: 'model-configuration',
      value: defaultValue
    })
  }

  return defaultValue
}

export const insertDataTable = async (table, data) => {
  clearTimeout(singleExec)
  singleExec = setTimeout(async () => {
    var inserted = await connection.insert({
      into: table,
      values: [data],
      return: true
    })
    return inserted
  }, 500);
}

export const getDataTable = async (
  table,
  whereStn = { id: { '>': 0 } },
  order = { by: 'datetime', type: 'desc' }
) => {
  // get all data if where statement is not filled
  var results = await connection.select({
    from: table,
    where: whereStn,
    order: order
  })

  return results //results will be array of objects.
}

export const updateDataTable = async (table, setValues, whereStn) => {
  var noOfRowsUpdated = await connection.update({
    in: table,
    set: setValues,
    where: whereStn
  })
  return noOfRowsUpdated
}

export const deleteDataTable = async (table, whereStn) => {
  var rowsDeleted = await connection.remove({
    from: table,
    where: whereStn
  })
  return rowsDeleted //results will contains no of rows deleted.
}

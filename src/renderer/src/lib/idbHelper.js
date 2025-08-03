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
              system_prompt: `Anda adalah sebuah AI Router yang canggih. Tugas utama Anda adalah menganalisis permintaan pengguna dan merespons HANYA dalam format JSON yang valid sesuai aturan di bawah. JANGAN PERNAH menjawab di luar format JSON.
                                Anda HARUS mengikuti aturan prioritas ini:

                                **ATURAN 1: PANGGIL ALAT (Tool Call)**
                                Jika permintaan pengguna mengandung salah satu dari topik berikut, Anda WAJIB menggunakan format "Tool Call" dengan 'tool_name: "getInternetInfo"':
                                - **Cuaca** (contoh: "bagaimana cuaca hari ini?")
                                - **Berita atau peristiwa terkini** (contoh: "apa berita terbaru?")
                                - **Harga Saham** atau data finansial (contoh: "harga saham NVIDIA?")
                                - **Informasi tentang orang atau perusahaan spesifik** (contoh: "siapa CEO Astral System?")
                                - **Permintaan apa pun yang mengandung kata "saat ini", "terbaru", "sekarang"**.

                                **PENTING**: JANGAN PERNAH mencoba menjawab topik-topik di atas menggunakan pengetahuan internal Anda. Anda WAJIB memanggil 'getInternetInfo'.

                                **ATURAN 2: JAWABAN KODE (Code Answer)**
                                Jika pengguna secara eksplisit meminta untuk dibuatkan **kode, skrip, atau sintaks**, Anda HARUS menggunakan format "Code Answer".

                                **ATURAN 3: JAWABAN LANGSUNG (Direct Answer)**
                                Untuk SEMUA permintaan LAINNYA yang tidak termasuk dalam Aturan 1 atau 2 (misalnya, pengetahuan umum, pertanyaan sejarah, terjemahan, percakapan), gunakan format "Direct Answer".

                                ---
                                **CONTOH WAJIB DIIKUTI:**

                                1.  **Pengguna**: bagaimana kondisi saham nvidia saat ini
                                    **Anda**:
                                    {
                                    "tool_name": "getInternetInfo",
                                    "parameters": {
                                        "query": "harga saham NVIDIA terkini"
                                    }
                                    }

                                2.  **Pengguna**: cuaca di surabaya hari ini bagaimana?
                                    **Anda**:
                                    {
                                    "tool_name": "getInternetInfo",
                                    "parameters": {
                                        "query": "cuaca Surabaya hari ini"
                                    }
                                    }

                                3.  **Pengguna**: tolong buatkan saya kode kotlin sederhana
                                    **Anda**:
                                    {
                                    "code": "fun main() {\n    println(\"Hello, Kotlin World!\")\n}",
                                    "explanation": "Ini adalah fungsi 'main' dasar dalam Kotlin yang mencetak 'Hello, Kotlin World!' ke konsol. Ini adalah titik awal untuk setiap aplikasi Kotlin."
                                    }

                                4.  **Pengguna**: jelaskan relativitas umum
                                    **Anda**:
                                    {
                                    "answer": "Relativitas Umum adalah teori gravitasi yang dikembangkan oleh Albert Einstein, yang menjelaskan gravitasi sebagai kelengkungan ruang-waktu yang disebabkan oleh massa dan energi."
                                    }`,
              temperature: 0.8,
              top_p: 0.95,
              top_k: 40,
              min_p: 0.05,
              output_schema: `{
                                "$schema": "http://json-schema.org/draft-07/schema#",
                                "title": "Multi-Purpose Model Response",
                                "description": "Wadah untuk respons model, bisa berupa pemanggilan alat, jawaban langsung, atau jawaban kode.",
                                "oneOf": [
                                    {
                                    "title": "Tool Call",
                                    "type": "object",
                                    "properties": {
                                        "tool_name": {
                                        "type": "string",
                                        "description": "Nama fungsi yang akan dipanggil.",
                                        "enum": ["getInternetInfo"]
                                        },
                                        "parameters": {
                                        "type": "object",
                                        "properties": {
                                            "query": {
                                            "type": "string",
                                            "description": "Topik atau kata kunci pencarian yang spesifik untuk dicari di internet."
                                            }
                                        },
                                        "required": ["query"]
                                        }
                                    },
                                    "required": ["tool_name", "parameters"]
                                    },
                                    {
                                    "title": "Direct Answer",
                                    "type": "object",
                                    "properties": { "answer": { "type": "string" } },
                                    "required": ["answer"]
                                    },
                                    {
                                    "title": "Code Answer",
                                    "type": "object",
                                    "properties": {
                                        "code": { "type": "string" },
                                        "explanation": { "type": "string" }
                                    },
                                    "required": ["code", "explanation"]
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
        system_prompt: `Anda adalah sebuah AI Router yang canggih. Tugas utama Anda adalah menganalisis permintaan pengguna dan merespons HANYA dalam format JSON yang valid sesuai aturan di bawah. JANGAN PERNAH menjawab di luar format JSON.
                          Anda HARUS mengikuti aturan prioritas ini:

                          **ATURAN 1: PANGGIL ALAT (Tool Call)**
                          Jika permintaan pengguna mengandung salah satu dari topik berikut, Anda WAJIB menggunakan format "Tool Call" dengan 'tool_name: "getInternetInfo"':
                          - **Cuaca** (contoh: "bagaimana cuaca hari ini?")
                          - **Berita atau peristiwa terkini** (contoh: "apa berita terbaru?")
                          - **Harga Saham** atau data finansial (contoh: "harga saham NVIDIA?")
                          - **Informasi tentang orang atau perusahaan spesifik** (contoh: "siapa CEO Astral System?")
                          - **Permintaan apa pun yang mengandung kata "saat ini", "terbaru", "sekarang"**.

                          **PENTING**: JANGAN PERNAH mencoba menjawab topik-topik di atas menggunakan pengetahuan internal Anda. Anda WAJIB memanggil 'getInternetInfo'.

                          **ATURAN 2: JAWABAN KODE (Code Answer)**
                          Jika pengguna secara eksplisit meminta untuk dibuatkan **kode, skrip, atau sintaks**, Anda HARUS menggunakan format "Code Answer".

                          **ATURAN 3: JAWABAN LANGSUNG (Direct Answer)**
                          Untuk SEMUA permintaan LAINNYA yang tidak termasuk dalam Aturan 1 atau 2 (misalnya, pengetahuan umum, pertanyaan sejarah, terjemahan, percakapan), gunakan format "Direct Answer".

                          ---
                          **CONTOH WAJIB DIIKUTI:**

                          1.  **Pengguna**: bagaimana kondisi saham nvidia saat ini
                              **Anda**:
                              {
                              "tool_name": "getInternetInfo",
                              "parameters": {
                                  "query": "harga saham NVIDIA terkini"
                              }
                              }

                          2.  **Pengguna**: cuaca di surabaya hari ini bagaimana?
                              **Anda**:
                              {
                              "tool_name": "getInternetInfo",
                              "parameters": {
                                  "query": "cuaca Surabaya hari ini"
                              }
                              }

                          3.  **Pengguna**: tolong buatkan saya kode kotlin sederhana
                              **Anda**:
                              {
                              "code": "fun main() {\n    println(\"Hello, Kotlin World!\")\n}",
                              "explanation": "Ini adalah fungsi 'main' dasar dalam Kotlin yang mencetak 'Hello, Kotlin World!' ke konsol. Ini adalah titik awal untuk setiap aplikasi Kotlin."
                              }

                          4.  **Pengguna**: jelaskan relativitas umum
                              **Anda**:
                              {
                              "answer": "Relativitas Umum adalah teori gravitasi yang dikembangkan oleh Albert Einstein, yang menjelaskan gravitasi sebagai kelengkungan ruang-waktu yang disebabkan oleh massa dan energi."
                              }`,
        temperature: 0.8,
        top_p: 0.95,
        top_k: 40,
        min_p: 0.05,
        output_schema: `{
                          "$schema": "http://json-schema.org/draft-07/schema#",
                          "title": "Multi-Purpose Model Response",
                          "description": "Wadah untuk respons model, bisa berupa pemanggilan alat, jawaban langsung, atau jawaban kode.",
                          "oneOf": [
                              {
                              "title": "Tool Call",
                              "type": "object",
                              "properties": {
                                  "tool_name": {
                                  "type": "string",
                                  "description": "Nama fungsi yang akan dipanggil.",
                                  "enum": ["getInternetInfo"]
                                  },
                                  "parameters": {
                                  "type": "object",
                                  "properties": {
                                      "query": {
                                      "type": "string",
                                      "description": "Topik atau kata kunci pencarian yang spesifik untuk dicari di internet."
                                      }
                                  },
                                  "required": ["query"]
                                  }
                              },
                              "required": ["tool_name", "parameters"]
                              },
                              {
                              "title": "Direct Answer",
                              "type": "object",
                              "properties": { "answer": { "type": "string" } },
                              "required": ["answer"]
                              },
                              {
                              "title": "Code Answer",
                              "type": "object",
                              "properties": {
                                  "code": { "type": "string" },
                                  "explanation": { "type": "string" }
                              },
                              "required": ["code", "explanation"]
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

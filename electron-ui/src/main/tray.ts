import { Tray, Menu, BrowserWindow, nativeImage, app } from 'electron'
import { join } from 'path'

let tray: Tray | null = null

export function createTray(mainWindow: BrowserWindow, ballWindow: BrowserWindow): void {
  // Create a simple 16x16 green circle icon for the tray
  const icon = nativeImage.createFromBuffer(createTrayIcon())
  tray = new Tray(icon.resize({ width: 16, height: 16 }))

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Main Window',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      }
    },
    {
      label: 'Toggle Floating Ball',
      click: () => {
        if (ballWindow.isVisible()) {
          ballWindow.hide()
        } else {
          ballWindow.show()
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit RDesk',
      click: () => app.quit()
    }
  ])

  tray.setToolTip('RDesk - Remote Desktop')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    mainWindow.show()
    mainWindow.focus()
  })
}

// Generate a simple 16x16 PNG buffer (green circle on transparent background)
function createTrayIcon(): Buffer {
  // Minimal 16x16 RGBA PNG - green circle
  // Using raw RGBA data and wrapping in PNG format
  const size = 16
  const pixels = Buffer.alloc(size * size * 4, 0)

  const cx = 8, cy = 8, r = 6
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy
      if (dx * dx + dy * dy <= r * r) {
        const i = (y * size + x) * 4
        pixels[i] = 0x21     // R
        pixels[i + 1] = 0xD3 // G
        pixels[i + 2] = 0x75 // B
        pixels[i + 3] = 0xFF // A
      }
    }
  }

  return createPNG(size, size, pixels)
}

function createPNG(width: number, height: number, rgba: Buffer): Buffer {
  // Minimal PNG encoder
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 6  // color type: RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  // IDAT: raw data with filter byte 0 per row
  const rawData: number[] = []
  for (let y = 0; y < height; y++) {
    rawData.push(0) // filter: none
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      rawData.push(rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3])
    }
  }

  const { deflateSync } = require('zlib')
  const compressed = deflateSync(Buffer.from(rawData))

  const chunks: Buffer[] = [signature]
  chunks.push(createChunk('IHDR', ihdr))
  chunks.push(createChunk('IDAT', compressed))
  chunks.push(createChunk('IEND', Buffer.alloc(0)))

  return Buffer.concat(chunks)
}

function createChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeB = Buffer.from(type, 'ascii')
  const crcData = Buffer.concat([typeB, data])

  // CRC32
  let crc = 0xFFFFFFFF
  for (let i = 0; i < crcData.length; i++) {
    crc ^= crcData[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0)
    }
  }
  crc ^= 0xFFFFFFFF
  const crcB = Buffer.alloc(4)
  crcB.writeUInt32BE(crc >>> 0, 0)

  return Buffer.concat([len, typeB, data, crcB])
}

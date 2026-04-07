import { useRef, useEffect, useCallback, useState } from 'react'
import type { FrameInfo } from '../hooks/useRemoteSession'

// Vertex shader - simple fullscreen quad
const VERT_SRC = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`

// Fragment shader - renders BGRA texture as RGBA (swizzle B↔R on GPU, zero cost)
const FRAG_SRC = `#version 300 es
precision mediump float;
in vec2 v_texCoord;
out vec4 fragColor;
uniform sampler2D u_texture;
void main() {
  vec4 c = texture(u_texture, v_texCoord);
  fragColor = vec4(c.b, c.g, c.r, c.a);
}
`

interface RemoteCanvasProps {
  sessionId: string
  frameInfo: FrameInfo | null
  style?: React.CSSProperties
}

interface GLState {
  gl: WebGL2RenderingContext
  program: WebGLProgram
  texture: WebGLTexture
  vao: WebGLVertexArrayObject
}

function initWebGL(canvas: HTMLCanvasElement): GLState | null {
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, desynchronized: true })
  if (!gl) return null

  // Compile shaders
  const vert = gl.createShader(gl.VERTEX_SHADER)!
  gl.shaderSource(vert, VERT_SRC)
  gl.compileShader(vert)
  if (!gl.getShaderParameter(vert, gl.COMPILE_STATUS)) {
    console.error('Vertex shader error:', gl.getShaderInfoLog(vert))
    return null
  }

  const frag = gl.createShader(gl.FRAGMENT_SHADER)!
  gl.shaderSource(frag, FRAG_SRC)
  gl.compileShader(frag)
  if (!gl.getShaderParameter(frag, gl.COMPILE_STATUS)) {
    console.error('Fragment shader error:', gl.getShaderInfoLog(frag))
    return null
  }

  const program = gl.createProgram()!
  gl.attachShader(program, vert)
  gl.attachShader(program, frag)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program))
    return null
  }

  gl.useProgram(program)

  // Fullscreen quad: positions + texcoords
  const vertices = new Float32Array([
    -1, -1,  0, 1,
     1, -1,  1, 1,
    -1,  1,  0, 0,
     1,  1,  1, 0,
  ])

  const vao = gl.createVertexArray()!
  gl.bindVertexArray(vao)

  const vbo = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

  const posLoc = gl.getAttribLocation(program, 'a_position')
  gl.enableVertexAttribArray(posLoc)
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0)

  const texLoc = gl.getAttribLocation(program, 'a_texCoord')
  gl.enableVertexAttribArray(texLoc)
  gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 16, 8)

  // Create texture
  const texture = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  return { gl, program, texture, vao }
}

export default function RemoteCanvas({ sessionId, frameInfo, style }: RemoteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glRef = useRef<GLState | null>(null)
  const rafRef = useRef<number>(0)
  const frameInfoRef = useRef<FrameInfo | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  // Track if an IPC fetch is in progress to avoid overlapping calls
  const fetchingRef = useRef(false)

  // Keep frameInfo ref current
  frameInfoRef.current = frameInfo

  // Initialize WebGL and auto-focus canvas for keyboard input
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const state = initWebGL(canvas)
    if (!state) {
      console.error('Failed to initialize WebGL2')
      return
    }
    glRef.current = state
    canvas.focus()

    return () => {
      glRef.current = null
    }
  }, [])

  // Update canvas size when frame dimensions change
  useEffect(() => {
    if (frameInfo && frameInfo.width > 0 && frameInfo.height > 0) {
      setCanvasSize({ width: frameInfo.width, height: frameInfo.height })
    }
  }, [frameInfo?.width, frameInfo?.height])

  // Render loop — polls getFrameRgba every rAF
  // store_frame never drops frames, so we always get the latest
  useEffect(() => {
    let running = true

    const renderFrame = async () => {
      if (!running) return

      const glState = glRef.current
      const fi = frameInfoRef.current

      if (glState && fi && fi.width > 0 && !fetchingRef.current) {
        fetchingRef.current = true
        try {
          const rgba = await window.api.native.getFrameRgba(sessionId, fi.display)
          if (rgba && rgba.length > 0 && running) {
            const { gl, texture, vao } = glState
            const canvas = canvasRef.current
            if (canvas) {
              if (canvas.width !== fi.width || canvas.height !== fi.height) {
                canvas.width = fi.width
                canvas.height = fi.height
              }

              gl.viewport(0, 0, fi.width, fi.height)
              gl.bindTexture(gl.TEXTURE_2D, texture)
              gl.texImage2D(
                gl.TEXTURE_2D, 0, gl.RGBA,
                fi.width, fi.height, 0,
                gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array(rgba.buffer, rgba.byteOffset, rgba.byteLength)
              )

              gl.bindVertexArray(vao)
              gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
            }
          }
        } catch {
          // Frame not available
        }
        fetchingRef.current = false
      }

      if (running) {
        rafRef.current = requestAnimationFrame(renderFrame)
      }
    }

    rafRef.current = requestAnimationFrame(renderFrame)

    return () => {
      running = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [sessionId])

  // Mouse mask constants matching RustDesk protocol
  const MOUSE_TYPE_DOWN = 1
  const MOUSE_TYPE_UP = 2
  const MOUSE_TYPE_WHEEL = 3
  const MOUSE_BUTTON_LEFT = 1 << 3
  const MOUSE_BUTTON_RIGHT = 2 << 3
  const MOUSE_BUTTON_MIDDLE = 4 << 3
  const MOUSE_BUTTON_BACK = 8 << 3
  const MOUSE_BUTTON_FORWARD = 16 << 3

  const buttonBitMap: Record<number, number> = {
    0: MOUSE_BUTTON_LEFT,
    1: MOUSE_BUTTON_MIDDLE,
    2: MOUSE_BUTTON_RIGHT,
    3: MOUSE_BUTTON_BACK,
    4: MOUSE_BUTTON_FORWARD
  }

  // Calculate remote coordinates accounting for object-fit: contain letterboxing
  const canvasToRemote = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current
    const fi = frameInfoRef.current
    if (!canvas || !fi || fi.width === 0 || fi.height === 0) return null

    const rect = canvas.getBoundingClientRect()
    const canvasAspect = fi.width / fi.height
    const elemAspect = rect.width / rect.height

    let renderW: number, renderH: number, offsetX: number, offsetY: number
    if (canvasAspect > elemAspect) {
      renderW = rect.width
      renderH = rect.width / canvasAspect
      offsetX = 0
      offsetY = (rect.height - renderH) / 2
    } else {
      renderH = rect.height
      renderW = rect.height * canvasAspect
      offsetX = (rect.width - renderW) / 2
      offsetY = 0
    }

    const localX = clientX - rect.left - offsetX
    const localY = clientY - rect.top - offsetY
    const x = Math.round(Math.max(0, Math.min(fi.width - 1, localX * fi.width / renderW)))
    const y = Math.round(Math.max(0, Math.min(fi.height - 1, localY * fi.height / renderH)))
    return { x, y }
  }, [])

  const sendMouse = useCallback((e: React.MouseEvent, eventType: 'down' | 'up' | 'move') => {
    const coords = canvasToRemote(e.clientX, e.clientY)
    if (!coords) return

    let mask = 0
    if (eventType === 'down') {
      mask = MOUSE_TYPE_DOWN | (buttonBitMap[e.button] || 0)
    } else if (eventType === 'up') {
      mask = MOUSE_TYPE_UP | (buttonBitMap[e.button] || 0)
    }

    const msg = JSON.stringify({ mask, x: coords.x, y: coords.y, alt: e.altKey, ctrl: e.ctrlKey, shift: e.shiftKey, command: e.metaKey })
    window.api.native.sendMouse(sessionId, msg).catch(() => {})
  }, [sessionId, canvasToRemote])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const coords = canvasToRemote(e.clientX, e.clientY)
    if (!coords) return

    const mask = MOUSE_TYPE_WHEEL
    const scrollY = e.deltaY > 0 ? 120 : -120

    const msg = JSON.stringify({ mask, x: coords.x, y: scrollY, alt: e.altKey, ctrl: e.ctrlKey, shift: e.shiftKey, command: e.metaKey })
    window.api.native.sendMouse(sessionId, msg).catch(() => {})
  }, [sessionId, canvasToRemote])

  const CODE_TO_VK: Record<string, string> = {
    KeyA: 'VK_A', KeyB: 'VK_B', KeyC: 'VK_C', KeyD: 'VK_D',
    KeyE: 'VK_E', KeyF: 'VK_F', KeyG: 'VK_G', KeyH: 'VK_H',
    KeyI: 'VK_I', KeyJ: 'VK_J', KeyK: 'VK_K', KeyL: 'VK_L',
    KeyM: 'VK_M', KeyN: 'VK_N', KeyO: 'VK_O', KeyP: 'VK_P',
    KeyQ: 'VK_Q', KeyR: 'VK_R', KeyS: 'VK_S', KeyT: 'VK_T',
    KeyU: 'VK_U', KeyV: 'VK_V', KeyW: 'VK_W', KeyX: 'VK_X',
    KeyY: 'VK_Y', KeyZ: 'VK_Z',
    Digit0: 'VK_0', Digit1: 'VK_1', Digit2: 'VK_2', Digit3: 'VK_3',
    Digit4: 'VK_4', Digit5: 'VK_5', Digit6: 'VK_6', Digit7: 'VK_7',
    Digit8: 'VK_8', Digit9: 'VK_9',
    F1: 'VK_F1', F2: 'VK_F2', F3: 'VK_F3', F4: 'VK_F4',
    F5: 'VK_F5', F6: 'VK_F6', F7: 'VK_F7', F8: 'VK_F8',
    F9: 'VK_F9', F10: 'VK_F10', F11: 'VK_F11', F12: 'VK_F12',
    ArrowLeft: 'VK_LEFT', ArrowRight: 'VK_RIGHT',
    ArrowUp: 'VK_UP', ArrowDown: 'VK_DOWN',
    Home: 'VK_HOME', End: 'VK_END',
    PageUp: 'VK_PRIOR', PageDown: 'VK_NEXT',
    Insert: 'VK_INSERT',
    Backspace: 'VK_BACK', Delete: 'VK_DELETE',
    Enter: 'VK_ENTER', NumpadEnter: 'VK_ENTER',
    Tab: 'VK_TAB', Escape: 'VK_ESCAPE', Space: 'VK_SPACE',
    ShiftLeft: 'VK_SHIFT', ShiftRight: 'RShift',
    ControlLeft: 'VK_CONTROL', ControlRight: 'RControl',
    AltLeft: 'VK_MENU', AltRight: 'RAlt',
    MetaLeft: 'Meta', MetaRight: 'RWin',
    CapsLock: 'VK_CAPITAL', NumLock: 'VK_NUMLOCK', ScrollLock: 'VK_SCROLL',
    Numpad0: 'VK_NUMPAD0', Numpad1: 'VK_NUMPAD1', Numpad2: 'VK_NUMPAD2',
    Numpad3: 'VK_NUMPAD3', Numpad4: 'VK_NUMPAD4', Numpad5: 'VK_NUMPAD5',
    Numpad6: 'VK_NUMPAD6', Numpad7: 'VK_NUMPAD7', Numpad8: 'VK_NUMPAD8',
    Numpad9: 'VK_NUMPAD9',
    NumpadAdd: 'VK_ADD', NumpadSubtract: 'VK_SUBTRACT',
    NumpadMultiply: 'VK_MULTIPLY', NumpadDivide: 'VK_DIVIDE',
    NumpadDecimal: 'VK_DECIMAL',
    Semicolon: 'VK_OEM_1', Equal: 'VK_OEM_PLUS',
    Comma: 'VK_OEM_COMMA', Minus: 'VK_OEM_MINUS',
    Period: 'VK_OEM_PERIOD', Slash: 'VK_OEM_2',
    Backquote: 'VK_OEM_3', BracketLeft: 'VK_OEM_4',
    Backslash: 'VK_OEM_5', BracketRight: 'VK_OEM_6',
    Quote: 'VK_OEM_7',
    PrintScreen: 'VK_SNAPSHOT', Pause: 'VK_PAUSE', ContextMenu: 'VK_APPS',
  }

  const handleKeyEvent = useCallback((e: React.KeyboardEvent, isDown: boolean) => {
    e.preventDefault()
    e.stopPropagation()

    const vkName = CODE_TO_VK[e.code] || (e.key.length === 1 ? e.key : null)
    if (!vkName) return

    const down = isDown && !e.repeat
    const press = isDown && e.repeat

    window.api.native.inputKey(
      sessionId, vkName, down, press,
      e.altKey, e.ctrlKey, e.shiftKey, e.metaKey
    ).catch(() => {})
  }, [sessionId])

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize.width || 1}
      height={canvasSize.height || 1}
      tabIndex={0}
      style={{
        outline: 'none',
        cursor: 'default',
        objectFit: 'contain',
        width: '100%',
        height: '100%',
        ...style
      }}
      onMouseDown={(e) => { e.preventDefault(); canvasRef.current?.focus(); sendMouse(e, 'down') }}
      onMouseUp={(e) => sendMouse(e, 'up')}
      onMouseMove={(e) => sendMouse(e, 'move')}
      onWheel={handleWheel}
      onKeyDown={(e) => handleKeyEvent(e, true)}
      onKeyUp={(e) => handleKeyEvent(e, false)}
      onContextMenu={(e) => e.preventDefault()}
    />
  )
}

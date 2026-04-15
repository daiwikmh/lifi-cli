"use client"

import { useEffect, useRef, useState } from "react"
import { smoothNoise } from "@/lib/noise"

const ASCII = [
  "  \u2588\u2588\u2557     \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2557      \u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2557     \u2588\u2588\u2557",
  "  \u2588\u2588\u2551     \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d\u2588\u2588\u2551     \u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d\u2588\u2588\u2551     \u2588\u2588\u2551",
  "  \u2588\u2588\u2551     \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2551     \u2588\u2588\u2551     \u2588\u2588\u2551     \u2588\u2588\u2551",
  "  \u2588\u2588\u2551     \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u255d  \u2588\u2588\u2551     \u2588\u2588\u2551     \u2588\u2588\u2551     \u2588\u2588\u2551",
  "  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2551     \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u255a\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2551",
  "  \u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d\u255a\u2550\u255d\u255a\u2550\u255d     \u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d \u255a\u2550\u2550\u2550\u2550\u2550\u255d\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d\u255a\u2550\u255d",
]

const CONFIG = {
  halftoneSize: 5,
  contrast: 1.6,
  accentColor: "#00fff5",
  mouseRadius: 90,
  repulsionStrength: 9,
  returnSpeed: 3,
  accentProbability: 0.12,
  sizeVariation: 0.25,
  fontSize: 22,
}

interface DotData {
  x: number; y: number
  baseX: number; baseY: number
  baseSize: number; brightness: number
  isAccent: boolean; sizeMultiplier: number
  twinklePhase: number; twinkleSpeed: number
  vx: number; vy: number
}

interface TrailPoint {
  x: number; y: number
  timestamp: number; strength: number
}

export function LifiCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dotsRef = useRef<DotData[]>([])
  const mouseRef = useRef({ x: -1000, y: -1000, prevX: -1000, prevY: -1000 })
  const animFrameRef = useRef<number>(0)
  const isFirstMoveRef = useRef(true)
  const lastMoveTimeRef = useRef(0)
  const mouseTrailRef = useRef<TrailPoint[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    // render ASCII art to offscreen canvas
    const fontSize = CONFIG.fontSize
    const lineHeight = fontSize * 1.2
    const padding = 12

    const offscreen = document.createElement("canvas")
    const oc = offscreen.getContext("2d")!
    oc.font = `bold ${fontSize}px monospace`

    const textWidth = Math.max(...ASCII.map((l) => oc.measureText(l).width))
    const textHeight = ASCII.length * lineHeight

    offscreen.width = Math.ceil(textWidth + padding * 2)
    offscreen.height = Math.ceil(textHeight + padding * 2)

    oc.fillStyle = "#000000"
    oc.fillRect(0, 0, offscreen.width, offscreen.height)
    oc.font = `bold ${fontSize}px monospace`
    oc.fillStyle = "#ffffff"
    oc.textBaseline = "top"

    ASCII.forEach((line, i) => {
      oc.fillText(line, padding, padding + i * lineHeight)
    })

    // apply contrast
    const imageData = oc.getImageData(0, 0, offscreen.width, offscreen.height)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      data[i]     = Math.max(0, Math.min(255, ((data[i]     / 255 - 0.5) * CONFIG.contrast + 0.5) * 255))
      data[i + 1] = Math.max(0, Math.min(255, ((data[i + 1] / 255 - 0.5) * CONFIG.contrast + 0.5) * 255))
      data[i + 2] = Math.max(0, Math.min(255, ((data[i + 2] / 255 - 0.5) * CONFIG.contrast + 0.5) * 255))
    }
    oc.putImageData(imageData, 0, 0)

    // set main canvas size
    const dpr = window.devicePixelRatio || 1
    const displayWidth = offscreen.width
    const displayHeight = offscreen.height

    canvas.width = displayWidth * dpr
    canvas.height = displayHeight * dpr
    canvas.style.width = `${displayWidth}px`
    canvas.style.height = `${displayHeight}px`
    ctx.scale(dpr, dpr)

    // build dots from pixel data
    const pixData = oc.getImageData(0, 0, offscreen.width, offscreen.height).data
    const dots: DotData[] = []
    const hs = CONFIG.halftoneSize

    for (let y = 0; y < displayHeight; y += hs) {
      for (let x = 0; x < displayWidth; x += hs) {
        const px = Math.floor(x)
        const py = Math.floor(y)
        const idx = (py * offscreen.width + px) * 4
        const brightness = (pixData[idx] + pixData[idx + 1] + pixData[idx + 2]) / 3
        const dotSize = (brightness / 255) * hs * 0.9

        if (dotSize > 0.4) {
          const cx = x + hs / 2
          const cy = y + hs / 2
          dots.push({
            x: cx, y: cy, baseX: cx, baseY: cy,
            baseSize: dotSize, brightness,
            isAccent: Math.random() < CONFIG.accentProbability && brightness > 100,
            sizeMultiplier: 1 + (Math.random() - 0.5) * CONFIG.sizeVariation,
            twinklePhase: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.02 + Math.random() * 0.03,
            vx: 0, vy: 0,
          })
        }
      }
    }

    dotsRef.current = dots
    setLoaded(true)

    const animate = () => {
      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, displayWidth, displayHeight)

      const timeSinceLastMove = Date.now() - lastMoveTimeRef.current
      if (timeSinceLastMove >= 100) mouseTrailRef.current = []

      const time = Date.now() * 0.001

      dots.forEach((dot) => {
        let maxDistanceFactor = 0
        let totalForceX = 0
        let totalForceY = 0

        mouseTrailRef.current.forEach((tp) => {
          const dx = tp.x - dot.x
          const dy = tp.y - dot.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > CONFIG.mouseRadius * 1.5) return

          const noiseVal = smoothNoise(dot.baseX, dot.baseY, 0.02, time)
          const irrRadius = CONFIG.mouseRadius * (0.7 + noiseVal * 0.6)

          if (dist < irrRadius) {
            const df = 1 - dist / irrRadius
            const sf = df * df * (3 - 2 * df)
            maxDistanceFactor = Math.max(maxDistanceFactor, sf)
            if (dist > 0.1) {
              const force = CONFIG.repulsionStrength * sf * tp.strength * 0.5
              totalForceX -= (dx / dist) * force
              totalForceY -= (dy / dist) * force
            }
          }
        })

        if (mouseRef.current.x > 0) {
          const dx = mouseRef.current.x - dot.x
          const dy = mouseRef.current.y - dot.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const noiseVal = smoothNoise(dot.baseX, dot.baseY, 0.02, time)
          const irrRadius = CONFIG.mouseRadius * (0.7 + noiseVal * 0.6)
          if (dist < irrRadius) {
            const df = 1 - dist / irrRadius
            maxDistanceFactor = Math.max(maxDistanceFactor, df * df * (3 - 2 * df))
          }
        }

        dot.vx += totalForceX
        dot.vy += totalForceY
        dot.vx += (dot.baseX - dot.x) * CONFIG.returnSpeed * 0.1
        dot.vy += (dot.baseY - dot.y) * CONFIG.returnSpeed * 0.1
        dot.vx *= 0.85
        dot.vy *= 0.85
        dot.x += dot.vx
        dot.y += dot.vy

        let opacity = 1
        if (maxDistanceFactor > 0) {
          dot.twinklePhase += dot.twinkleSpeed
          const twinkle = Math.sin(dot.twinklePhase) * 0.5 + 0.5
          const ta = (0.3 + twinkle * 0.7) * maxDistanceFactor
          opacity = 1 - (1 - ta) * maxDistanceFactor
        }

        ctx.globalAlpha = opacity
        ctx.fillStyle = dot.isAccent ? CONFIG.accentColor : "#ffffff"
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, (dot.baseSize * dot.sizeMultiplier) / 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      })

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const newX = e.clientX - rect.left
      const newY = e.clientY - rect.top
      lastMoveTimeRef.current = Date.now()

      if (isFirstMoveRef.current) {
        mouseRef.current = { x: newX, y: newY, prevX: newX, prevY: newY }
        isFirstMoveRef.current = false
        return
      }

      mouseRef.current.prevX = mouseRef.current.x
      mouseRef.current.prevY = mouseRef.current.y
      mouseRef.current.x = newX
      mouseRef.current.y = newY

      const velX = newX - mouseRef.current.prevX
      const velY = newY - mouseRef.current.prevY
      const speed = Math.sqrt(velX * velX + velY * velY)
      const steps = Math.max(1, Math.ceil(speed / 10))

      for (let i = 0; i < steps; i++) {
        const t = i / steps
        mouseTrailRef.current.push({
          x: mouseRef.current.prevX + velX * t,
          y: mouseRef.current.prevY + velY * t,
          timestamp: Date.now(),
          strength: Math.min(speed / 10, 1),
        })
      }
      mouseTrailRef.current = mouseTrailRef.current.filter((p) => Date.now() - p.timestamp < 150)
    }

    canvas.addEventListener("mousemove", onMouseMove)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      canvas.removeEventListener("mousemove", onMouseMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`cursor-crosshair transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"} ${className ?? ""}`}
    />
  )
}

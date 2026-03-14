'use client'
import * as React from 'react'
import { useEffect, useRef } from 'react'
import { createNoise2D } from 'simplex-noise'

interface Point {
    x: number
    y: number
    wave: { x: number; y: number }
    cursor: {
        x: number
        y: number
        vx: number
        vy: number
    }
}

interface WavesProps {
    className?: string
    strokeColor?: string
    backgroundColor?: string
    pointerSize?: number
}

export function Waves({
    className = "",
    strokeColor = "#ffffff",
    backgroundColor = "#000000",
    pointerSize = 0.5
}: WavesProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const svgRef = useRef<SVGSVGElement>(null)
    const mouseRef = useRef({
        x: -10, y: 0, lx: 0, ly: 0, sx: 0, sy: 0, v: 0, vs: 0, a: 0, set: false,
    })
    const pathsRef = useRef<SVGPathElement[]>([])
    const linesRef = useRef<Point[][]>([])
    const noiseRef = useRef<((x: number, y: number) => number) | null>(null)
    const rafRef = useRef<number | null>(null)
    const boundingRef = useRef<DOMRect | null>(null)
    const frameRef = useRef(0)

    useEffect(() => {
        if (!containerRef.current || !svgRef.current) return

        noiseRef.current = createNoise2D()

        setSize()
        setLines()

        window.addEventListener('resize', onResize)
        window.addEventListener('mousemove', onMouseMove, { passive: true })

        rafRef.current = requestAnimationFrame(tick)

        const container = containerRef.current
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            window.removeEventListener('resize', onResize)
            window.removeEventListener('mousemove', onMouseMove)
            container?.removeEventListener('touchmove', onTouchMove)
        }
    }, [])

    const setSize = () => {
        if (!containerRef.current || !svgRef.current) return
        boundingRef.current = containerRef.current.getBoundingClientRect()
        const { width, height } = boundingRef.current
        svgRef.current.setAttribute('width', String(width))
        svgRef.current.setAttribute('height', String(height))
        svgRef.current.setAttribute('viewBox', `0 0 ${width} ${height}`)
    }

    const setLines = () => {
        if (!svgRef.current || !boundingRef.current) return

        const { width, height } = boundingRef.current
        linesRef.current = []

        pathsRef.current.forEach(path => path.remove())
        pathsRef.current = []

        // Much wider spacing = far fewer elements
        const xGap = 28
        const yGap = 20

        const oWidth = width + 100
        const oHeight = height + 30

        const totalLines = Math.ceil(oWidth / xGap)
        const totalPoints = Math.ceil(oHeight / yGap)

        const xStart = (width - xGap * totalLines) / 2
        const yStart = (height - yGap * totalPoints) / 2

        for (let i = 0; i < totalLines; i++) {
            const points: Point[] = []

            for (let j = 0; j < totalPoints; j++) {
                points.push({
                    x: xStart + xGap * i,
                    y: yStart + yGap * j,
                    wave: { x: 0, y: 0 },
                    cursor: { x: 0, y: 0, vx: 0, vy: 0 },
                })
            }

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
            path.setAttribute('fill', 'none')
            path.setAttribute('stroke', strokeColor)
            path.setAttribute('stroke-width', '1')

            svgRef.current.appendChild(path)
            pathsRef.current.push(path)
            linesRef.current.push(points)
        }
    }

    const onResize = () => {
        setSize()
        setLines()
    }

    const onMouseMove = (e: MouseEvent) => {
        updateMousePosition(e.pageX, e.pageY)
    }

    const onTouchMove = (e: TouchEvent) => {
        e.preventDefault()
        updateMousePosition(e.touches[0].clientX, e.touches[0].clientY)
    }

    const updateMousePosition = (x: number, y: number) => {
        if (!boundingRef.current) return
        const mouse = mouseRef.current
        mouse.x = x - boundingRef.current.left
        mouse.y = y - boundingRef.current.top + window.scrollY
        if (!mouse.set) {
            mouse.sx = mouse.x
            mouse.sy = mouse.y
            mouse.lx = mouse.x
            mouse.ly = mouse.y
            mouse.set = true
        }
    }

    const movePoints = (time: number) => {
        const lines = linesRef.current
        const mouse = mouseRef.current
        const noise = noiseRef.current
        if (!noise) return

        for (let li = 0; li < lines.length; li++) {
            const points = lines[li]
            for (let pi = 0; pi < points.length; pi++) {
                const p = points[pi]

                const move = noise(
                    (p.x + time * 0.008) * 0.003,
                    (p.y + time * 0.003) * 0.002
                ) * 8

                p.wave.x = Math.cos(move) * 12
                p.wave.y = Math.sin(move) * 6

                const dx = p.x - mouse.sx
                const dy = p.y - mouse.sy
                const d = Math.hypot(dx, dy)
                const l = Math.max(175, mouse.vs)

                if (d < l) {
                    const s = 1 - d / l
                    const f = Math.cos(d * 0.001) * s
                    p.cursor.vx += Math.cos(mouse.a) * f * l * mouse.vs * 0.00035
                    p.cursor.vy += Math.sin(mouse.a) * f * l * mouse.vs * 0.00035
                }

                p.cursor.vx += (0 - p.cursor.x) * 0.01
                p.cursor.vy += (0 - p.cursor.y) * 0.01
                p.cursor.vx *= 0.95
                p.cursor.vy *= 0.95
                p.cursor.x += p.cursor.vx
                p.cursor.y += p.cursor.vy
                p.cursor.x = Math.min(50, Math.max(-50, p.cursor.x))
                p.cursor.y = Math.min(50, Math.max(-50, p.cursor.y))
            }
        }
    }

    const drawLines = () => {
        const lines = linesRef.current
        const paths = pathsRef.current

        for (let li = 0; li < lines.length; li++) {
            const points = lines[li]
            if (points.length < 2 || !paths[li]) continue

            const f = points[0]
            let d = `M ${f.x + f.wave.x} ${f.y + f.wave.y}`

            for (let pi = 1; pi < points.length; pi++) {
                const p = points[pi]
                d += `L ${p.x + p.wave.x + p.cursor.x} ${p.y + p.wave.y + p.cursor.y}`
            }

            paths[li].setAttribute('d', d)
        }
    }

    const tick = (time: number) => {
        // Run physics every frame but only draw every other frame (30fps rendering)
        const frame = frameRef.current++
        const mouse = mouseRef.current

        mouse.sx += (mouse.x - mouse.sx) * 0.1
        mouse.sy += (mouse.y - mouse.sy) * 0.1

        const dx = mouse.x - mouse.lx
        const dy = mouse.y - mouse.ly

        mouse.v = Math.hypot(dx, dy)
        mouse.vs += (mouse.v - mouse.vs) * 0.1
        mouse.vs = Math.min(100, mouse.vs)
        mouse.lx = mouse.x
        mouse.ly = mouse.y
        mouse.a = Math.atan2(dy, dx)

        movePoints(time)

        // Only touch the DOM every 2nd frame
        if (frame % 2 === 0) {
            drawLines()
        }

        rafRef.current = requestAnimationFrame(tick)
    }

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden ${className}`}
            style={{
                backgroundColor,
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                contain: 'strict',
            } as React.CSSProperties}
        >
            <svg
                ref={svgRef}
                className="block w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
                style={{ willChange: 'contents' }}
            />
            {pointerSize > 0 && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: `${pointerSize}rem`,
                        height: `${pointerSize}rem`,
                        background: strokeColor,
                        borderRadius: '50%',
                        transform: 'translate3d(calc(var(--x) - 50%), calc(var(--y) - 50%), 0)',
                        willChange: 'transform',
                    }}
                />
            )}
        </div>
    )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import SignaturePadLib from 'signature_pad'
import { RotateCcw } from 'lucide-react'

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void
  label?: string
}

export default function SignaturePad({ onChange, label = 'Signature' }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<SignaturePadLib | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const pad = new SignaturePadLib(canvas, {
      backgroundColor: 'rgb(255,255,255)',
      penColor: '#1e40af',
      minWidth: 1,
      maxWidth: 2.5,
    })
    padRef.current = pad

    function resize() {
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.scale(ratio, ratio)
      pad.clear()
      setIsEmpty(true)
      onChange(null)
    }

    resize()
    window.addEventListener('resize', resize)

    pad.addEventListener('endStroke', () => {
      setIsEmpty(pad.isEmpty())
      onChange(pad.isEmpty() ? null : pad.toDataURL('image/png'))
    })

    return () => {
      window.removeEventListener('resize', resize)
      pad.off()
    }
  }, [])

  function clear() {
    padRef.current?.clear()
    setIsEmpty(true)
    onChange(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="label mb-0">{label}</label>
        {!isEmpty && (
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          >
            <RotateCcw className="w-3 h-3" /> Clear
          </button>
        )}
      </div>
      <div className={`border-2 rounded-lg overflow-hidden transition-colors ${
        isEmpty ? 'border-gray-200 bg-gray-50' : 'border-blue-400 bg-white'
      }`}>
        <canvas
          ref={canvasRef}
          className="w-full touch-none"
          style={{ height: 130 }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {isEmpty ? 'Draw your signature above using your mouse or finger' : 'Signature captured'}
      </p>
    </div>
  )
}

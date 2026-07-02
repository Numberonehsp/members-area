'use client'

import { useEffect, useRef, useState } from 'react'
import type { OFFProduct, NutritionLog } from '@/types/nutrition'
import PortionPicker from './PortionPicker'

type Props = {
  date: string
  onAdded: (log: NutritionLog) => void
  onClose: () => void
}

type ScanState = 'scanning' | 'loading' | 'found' | 'not-found' | 'error' | 'unsupported'

export default function BarcodeScanner({ date, onAdded, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<BarcodeDetector | null>(null)
  const animFrameRef = useRef<number | null>(null)

  const [state, setState] = useState<ScanState>('scanning')
  const [product, setProduct] = useState<OFFProduct | null>(null)
  const [manualBarcode, setManualBarcode] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!('BarcodeDetector' in window)) {
      setState('unsupported')
      return
    }

    let cancelled = false

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        detectorRef.current = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] })
        scanLoop()
      } catch {
        if (!cancelled) setState('error')
      }
    }

    function scanLoop() {
      if (cancelled || !videoRef.current || !detectorRef.current) return

      detectorRef.current.detect(videoRef.current).then(async (barcodes) => {
        if (cancelled || barcodes.length === 0) {
          animFrameRef.current = requestAnimationFrame(scanLoop)
          return
        }

        const barcode = barcodes[0].rawValue
        stopCamera()
        await lookupBarcode(barcode)
      }).catch(() => {
        if (!cancelled) animFrameRef.current = requestAnimationFrame(scanLoop)
      })
    }

    start()

    return () => {
      cancelled = true
      stopCamera()
    }
  }, [])

  function stopCamera() {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  async function lookupBarcode(barcode: string) {
    setState('loading')
    try {
      const res = await fetch(`/api/nutrition/scan?barcode=${encodeURIComponent(barcode)}`)
      if (res.status === 404) { setState('not-found'); return }
      if (!res.ok) throw new Error('Lookup failed')
      const data = await res.json()
      setProduct(data.product)
      setState('found')
    } catch {
      setState('error')
      setErrorMsg('Could not look up that barcode. Try again.')
    }
  }

  async function handleManualLookup() {
    if (!manualBarcode.trim()) return
    stopCamera()
    await lookupBarcode(manualBarcode.trim())
  }

  if (state === 'found' && product) {
    return (
      <PortionPicker
        product={product}
        date={date}
        onAdded={(log) => { onAdded(log) }}
        onClose={onClose}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-4">
      <div className="bg-bg-card border border-border-light rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl text-text-primary">Scan Barcode</h2>
            <button onClick={() => { stopCamera(); onClose() }} className="text-text-secondary hover:text-text-primary text-xl leading-none">×</button>
          </div>

          {state === 'scanning' && (
            <>
              <div className="relative bg-black rounded-xl overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-24 border-2 border-brand rounded-lg" />
                </div>
              </div>
              <p className="text-xs text-text-secondary text-center">Point the camera at a product barcode</p>
            </>
          )}

          {state === 'loading' && (
            <div className="py-8 text-center">
              <p className="text-text-secondary text-sm">Looking up product…</p>
            </div>
          )}

          {state === 'not-found' && (
            <div className="py-6 text-center">
              <p className="text-lg mb-1">😕</p>
              <p className="text-text-primary font-semibold text-sm mb-1">Product not found</p>
              <p className="text-text-secondary text-xs mb-4">This product isn&apos;t in Open Food Facts yet.</p>
              <button onClick={() => setState('scanning')} className="text-brand text-sm underline">
                Try scanning again
              </button>
            </div>
          )}

          {(state === 'error' || state === 'unsupported') && (
            <div className="py-4">
              {state === 'unsupported' && (
                <p className="text-xs text-text-secondary mb-3 text-center">
                  Camera scanning isn&apos;t supported in this browser. Enter the barcode number manually.
                </p>
              )}
              {state === 'error' && errorMsg && (
                <p className="text-xs text-red-400 mb-3 text-center">{errorMsg}</p>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Enter barcode number"
                  className="flex-1 bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-brand"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleManualLookup() }}
                />
                <button
                  onClick={handleManualLookup}
                  className="bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-medium"
                >
                  Go
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

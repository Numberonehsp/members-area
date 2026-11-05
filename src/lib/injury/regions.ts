// Body areas a member can tap on the injury figure. "Left" and "right" are the
// member's own left and right, so on the front view the member's left is on
// the viewer's right and on the back view it is on the viewer's left.
//
// Shapes are drawn for a 200 x 400 figure centred on x = 100. Paired parts are
// drawn once, for the viewer's right-hand side, and flipped for the other side.

export type View = 'front' | 'back'
export type Side = 'left' | 'right'

export type Shape = { kind: 'path'; d: string } | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }

export type Region = {
  id: string
  label: string
  view: View
  shape: Shape
  /** Mirror the shape around x = 100 (the viewer's left-hand side). */
  flip: boolean
}

const path = (d: string): Shape => ({ kind: 'path', d })
const ellipse = (cx: number, cy: number, rx: number, ry: number): Shape => ({ kind: 'ellipse', cx, cy, rx, ry })

type Def = { id: string; label: string; views: View[]; shape: Shape }

const TORSO_BACK = 'M73 74 C86 68 94 70 100 72 C106 70 114 68 127 74 L129 112 L71 112 Z'

const SINGLE: Def[] = [
  { id: 'head', label: 'Head', views: ['front', 'back'], shape: path('M100 6 C112 6 118 16 118 28 C118 40 111 50 100 53 C89 50 82 40 82 28 C82 16 88 6 100 6 Z') },
  { id: 'neck', label: 'Neck', views: ['front', 'back'], shape: path('M91 50 L109 50 L111 64 C116 68 122 70 126 74 L74 74 C78 70 84 68 89 64 Z') },
  { id: 'chest', label: 'Chest', views: ['front'], shape: path('M74 76 C84 72 92 75 100 78 C108 75 116 72 126 76 L128 108 C118 116 108 114 100 112 C92 114 82 116 72 108 Z') },
  { id: 'abdomen', label: 'Abdomen', views: ['front'], shape: path('M73 112 C84 118 92 116 100 114 C108 116 116 118 127 112 L124 150 C116 156 108 158 100 158 C92 158 84 156 76 150 Z') },
  { id: 'hips', label: 'Hips and groin', views: ['front'], shape: path('M76 152 C84 158 92 160 100 160 C108 160 116 158 124 152 L133 174 C128 186 114 194 100 198 C86 194 72 186 67 174 Z') },
  { id: 'upper_back', label: 'Upper back', views: ['back'], shape: path(TORSO_BACK) },
  { id: 'lower_back', label: 'Lower back', views: ['back'], shape: path('M71 114 L129 114 L124 154 C114 158 106 158 100 158 C94 158 86 158 76 154 Z') },
  { id: 'glutes', label: 'Glutes', views: ['back'], shape: path('M76 156 C86 160 94 160 100 160 C106 160 114 160 124 156 C135 172 130 190 114 194 C106 196 102 194 100 192 C98 194 94 196 86 194 C70 190 65 172 76 156 Z') },
]

// Paired parts, drawn on the viewer's right-hand side of the figure.
const PAIRED: Def[] = [
  { id: 'shoulder', label: 'shoulder', views: ['front', 'back'], shape: path('M124 76 C137 70 151 75 157 88 C159 96 157 102 152 106 L140 98 C134 92 130 86 124 84 Z') },
  { id: 'upper_arm', label: 'upper arm', views: ['front', 'back'], shape: path('M141 100 C146 98 154 100 157 106 C159 118 161 130 163 142 L151 146 C149 134 144 118 141 100 Z') },
  { id: 'elbow', label: 'elbow', views: ['front', 'back'], shape: ellipse(157, 150, 9, 9) },
  { id: 'forearm', label: 'forearm', views: ['front', 'back'], shape: path('M150 158 L164 158 C168 174 171 188 172 202 L160 204 C157 188 153 172 150 158 Z') },
  { id: 'wrist_hand', label: 'wrist or hand', views: ['front', 'back'], shape: path('M160 206 L173 204 C179 214 181 226 179 237 C175 241 168 241 164 235 C160 226 158 216 160 206 Z') },
  { id: 'quad', label: 'front of thigh', views: ['front'], shape: path('M102 194 C112 194 126 192 133 190 C137 210 135 234 129 256 L108 256 C104 236 102 214 102 194 Z') },
  { id: 'hamstring', label: 'back of thigh', views: ['back'], shape: path('M102 196 C112 196 126 194 133 192 C137 212 135 236 129 256 L108 256 C104 236 102 216 102 196 Z') },
  { id: 'knee', label: 'knee', views: ['front', 'back'], shape: ellipse(118, 267, 12, 12) },
  { id: 'shin', label: 'shin', views: ['front'], shape: path('M107 281 L128 281 C128 301 127 322 124 338 L112 338 C108 320 106 300 107 281 Z') },
  { id: 'calf', label: 'calf', views: ['back'], shape: path('M105 281 C112 277 126 277 129 285 C131 305 126 325 122 338 L112 338 C106 325 103 303 105 281 Z') },
  { id: 'ankle', label: 'ankle', views: ['front', 'back'], shape: ellipse(117, 347, 9, 9) },
  { id: 'foot', label: 'foot', views: ['front', 'back'], shape: path('M108 356 L126 356 C129 366 131 378 129 386 C122 392 112 392 105 386 C105 374 106 364 108 356 Z') },
]

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function build(): Region[] {
  const out: Region[] = []
  for (const s of SINGLE) for (const view of s.views) out.push({ id: s.id, label: s.label, view, shape: s.shape, flip: false })
  for (const p of PAIRED) {
    for (const view of p.views) {
      // Front view: member's left is on the viewer's right. Back view: the reverse.
      out.push({ id: `${p.id}_left`, label: cap(`left ${p.label}`), view, shape: p.shape, flip: view === 'back' })
      out.push({ id: `${p.id}_right`, label: cap(`right ${p.label}`), view, shape: p.shape, flip: view === 'front' })
    }
  }
  return out
}

export const REGIONS: Region[] = build()

const LABELS = new Map<string, string>(REGIONS.map(r => [r.id, r.label]))

export const REGION_IDS: ReadonlySet<string> = new Set(LABELS.keys())

export const regionLabel = (id: string): string => LABELS.get(id) ?? id

export const regionsFor = (view: View): Region[] => REGIONS.filter(r => r.view === view)

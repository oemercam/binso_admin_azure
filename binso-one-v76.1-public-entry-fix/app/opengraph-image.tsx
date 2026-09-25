import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', justifyContent:'space-between', background:'#fff', color:'#0b0c0e', padding:'72px 84px', fontFamily:'Arial, sans-serif' }}>
      <div style={{ display:'flex', alignItems:'center', gap:18, fontSize:34, fontWeight:700 }}><span>Binso</span><span style={{ fontWeight:400, opacity:.55 }}>ONE</span></div>
      <div style={{ display:'flex', flexDirection:'column', gap:22, maxWidth:900 }}>
        <div style={{ fontSize:72, lineHeight:1.05, fontWeight:700, letterSpacing:'-2px' }}>Dein Unternehmen. Eine Plattform.</div>
        <div style={{ fontSize:30, lineHeight:1.3, opacity:.7 }}>Kunden, Angebote, Aufträge, Zeiten und Rechnungen durchgängig verbunden.</div>
      </div>
      <div style={{ fontSize:22, opacity:.5 }}>binso.ch · Schweiz</div>
    </div>,
    size,
  )
}

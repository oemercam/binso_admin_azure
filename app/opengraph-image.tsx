import { ImageResponse } from "next/og";

export const alt="Binso One – Business-Plattform für Schweizer KMU";
export const size={width:1200,height:630};
export const contentType="image/png";

export default function Image(){
  return new ImageResponse(
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",justifyContent:"space-between",background:"#fff",color:"#000",padding:"72px",fontFamily:"Arial, sans-serif"}}>
      <div style={{display:"flex",fontSize:28,fontWeight:700,letterSpacing:"0.08em"}}>BINSO ONE</div>
      <div style={{display:"flex",flexDirection:"column",gap:20,maxWidth:900}}>
        <div style={{display:"flex",fontSize:72,fontWeight:700,lineHeight:1.05}}>Mehr Zeit für das Wesentliche.</div>
        <div style={{display:"flex",fontSize:30,lineHeight:1.3}}>Kunden, Angebote, Rechnungen, Zahlungen, Zeit und Spesen – klar organisiert.</div>
      </div>
      <div style={{display:"flex",fontSize:24}}>Binso GmbH · Appenzell · Schweiz</div>
    </div>,
    size
  );
}

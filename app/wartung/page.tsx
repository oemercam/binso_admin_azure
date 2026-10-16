export const metadata={robots:{index:false,follow:false}};
import {LocalizedText} from "@/lib/client/locale";
import {Button,Logo} from "@/components/ui";
export default function MaintenancePage(){return <main className="auth-page flow-noir flow-auth"><section className="auth-card error-state"><Logo/><h1><LocalizedText>{"Binso One wird gewartet"}</LocalizedText></h1><p><LocalizedText>{"Wir führen Wartungsarbeiten durch. Bitte versuche es in wenigen Minuten erneut."}</LocalizedText></p><Button href="/dashboard"><LocalizedText>{"Erneut versuchen"}</LocalizedText></Button><Button href="/" variant="secondary"><LocalizedText>{"Zur Website"}</LocalizedText></Button></section></main>;}

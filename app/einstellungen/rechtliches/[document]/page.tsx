import {notFound} from 'next/navigation';
import {requireSession} from '@/lib/server/session';
import {AppShell} from '@/components/app-shell';
import {AppLegalDocument,appLegalDocuments} from '@/components/app-legal-document';
export default async function Page({params}:{params:Promise<{document:string}>}){await requireSession();const {document}=await params;if(!Object.hasOwn(appLegalDocuments,document))notFound();const key=document as keyof typeof appLegalDocuments;return <AppShell title={appLegalDocuments[key].title} active="einstellungen" backHref="/einstellungen/rechtliches"><AppLegalDocument document={key}/></AppShell>}

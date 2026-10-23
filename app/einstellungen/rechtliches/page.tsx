import {requireSession} from '@/lib/server/session';
import {AppShell} from '@/components/app-shell';
import {AppLegalNavigation} from '@/components/app-legal-document';
export default async function Page(){await requireSession();return <AppShell title="Rechtliches" active="einstellungen" backHref="/einstellungen"><AppLegalNavigation/></AppShell>}

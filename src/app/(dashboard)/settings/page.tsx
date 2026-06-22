import { getUserPreferences } from "@/app/actions/settings";
import { ProfileForm }        from "@/components/settings/profile-form";
import { PreferencesForm }    from "@/components/settings/preferences-form";
import { DangerZone }         from "@/components/settings/danger-zone";
import { redirect }           from "next/navigation";
import { ROUTES }             from "@/lib/constants";

export default async function SettingsPage() {
  const prefs = await getUserPreferences();

  if (!prefs) redirect(ROUTES.login);

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">
          Settings
        </h1>
        <p className="text-sm text-white/40">
          Manage your account and alert preferences.
        </p>
      </div>

      <div className="space-y-5">
        {/* Profile */}
        <ProfileForm
          initialName={prefs.displayName}
          email={prefs.email}
        />

        {/* Preferences */}
        <PreferencesForm
          initial={{
            baseCurrency:           prefs.baseCurrency,
            alertSeverityThreshold: prefs.alertSeverityThreshold,
            digestSeverityThreshold: prefs.digestSeverityThreshold,
            emailAlerts:            prefs.emailAlerts,
            pushAlerts:             prefs.pushAlerts,
            dailyDigest:            prefs.dailyDigest,
            digestTime:             prefs.digestTime,
          }}
        />

        {/* Danger zone */}
        <DangerZone />
      </div>
    </div>
  );
}

export const dynamic    = "force-dynamic";
export const revalidate = 0;
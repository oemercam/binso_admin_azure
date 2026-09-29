"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, isProductionMode } from "@/lib/client/runtime";
import { loadAppPreferences, loadSettings } from "@/lib/local-store";
import {
  localRoleToTenant,
  permissionForModule,
  tenantCan,
  type TenantPermission,
} from "@/lib/permissions";

export function usePermissions() {
  const [role, setRole] = useState<string>("reader");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (isProductionMode()) {
        try {
          const me = await apiFetch<{ user: { role: string } }>("/api/me");
          setRole(me.user.role);
        } catch {
          setRole("reader");
        } finally {
          setReady(true);
        }
        return;
      }

      const pref = loadAppPreferences();
      const settings = loadSettings();
      const user =
        settings.users.find((u) => u.id === pref.activeUserId) ||
        settings.users[0];

      setRole(localRoleToTenant(user?.role || "Lesen"));
      setReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const can = useCallback(
    (permission: TenantPermission) => tenantCan(role, permission),
    [role]
  );

  const canModule = useCallback(
    (moduleKey: string, action: "read" | "write") => {
      const permission = permissionForModule(moduleKey, action);
      return Boolean(permission && tenantCan(role, permission));
    },
    [role]
  );

  return { role, ready, can, canModule };
}

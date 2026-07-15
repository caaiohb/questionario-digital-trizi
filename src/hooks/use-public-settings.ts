"use client";
import { useEffect, useState } from "react";
import { defaultPublicSettings } from "@/config/defaultSettings";
import type { PublicSettings } from "@/types/questionnaire";

export function usePublicSettings() {
  const [settings, setSettings] = useState<PublicSettings>(defaultPublicSettings);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/public/settings", { signal: controller.signal, cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: PublicSettings) => setSettings({ ...defaultPublicSettings, ...data }))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);
  useEffect(() => {
    document.documentElement.style.setProperty("--trizi-primary", settings.primaryColor);
    document.documentElement.style.setProperty("--trizi-secondary", settings.secondaryColor);
  }, [settings.primaryColor, settings.secondaryColor]);
  return settings;
}

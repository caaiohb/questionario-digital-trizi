import { getCurrentProfile } from "@/lib/auth";
export async function getApiProfile() { return getCurrentProfile(); }

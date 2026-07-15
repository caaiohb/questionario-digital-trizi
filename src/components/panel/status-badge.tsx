import { Badge } from "@/components/ui/badge";
import { statusConfig } from "@/config/status";
import type { SubmissionStatus } from "@/types/database";
export function StatusBadge({ status }: { status: SubmissionStatus }) { const config = statusConfig[status] ?? { label: status, tone: "neutral" as const }; return <Badge tone={config.tone}>{config.label}</Badge>; }

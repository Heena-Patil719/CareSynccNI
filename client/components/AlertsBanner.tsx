import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, BellRing, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type AlertSeverity = "CRITICAL" | "HIGH" | "LOW" | "NORMAL";
type AlertType = "BLOOD_PRESSURE" | "HEART_RATE" | "TEMPERATURE";

type AlertItem = {
  _id: string;
  patientId: string;
  patientName: string;
  type: AlertType;
  severity: AlertSeverity;
  value: number;
  unit: string;
  message: string;
  acknowledged: boolean;
  triggeredAt: string;
};

export default function AlertsBanner() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchAlerts = async () => {
      try {
        const response = await fetch("/api/alerts");
        if (!response.ok) {
          throw new Error("Failed to fetch alerts");
        }

        const payload = (await response.json()) as { alerts: AlertItem[] };
        if (isMounted) {
          setAlerts(payload.alerts);
        }
      } catch (error) {
        console.error("Alerts fetch error:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAlerts();
    const intervalId = window.setInterval(fetchAlerts, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const visibleAlerts = alerts.filter((alert) => !dismissedIds.includes(alert._id));

  if (loading || visibleAlerts.length === 0) {
    return null;
  }

  const hasCritical = visibleAlerts.some((alert) => alert.severity === "CRITICAL");
  const containerClasses = hasCritical
    ? "border-red-300 bg-red-50 text-red-950"
    : "border-amber-300 bg-amber-50 text-amber-950";
  const iconClasses = hasCritical ? "text-red-600" : "text-amber-600";

  const handleAcknowledge = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to acknowledge alert");
      }

      setAlerts((currentAlerts) => currentAlerts.filter((alert) => alert._id !== alertId));
      setDismissedIds((currentIds) => currentIds.filter((id) => id !== alertId));
    } catch (error) {
      console.error("Acknowledge alert error:", error);
    }
  };

  const handleDismiss = (alertId: string) => {
    setDismissedIds((currentIds) => [...currentIds, alertId]);
  };

  return (
    <section className={`mb-8 rounded-2xl border px-5 py-4 shadow-sm ${containerClasses}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {hasCritical ? (
            <AlertTriangle className={`h-5 w-5 ${iconClasses}`} />
          ) : (
            <BellRing className={`h-5 w-5 ${iconClasses}`} />
          )}
          <div>
            <h2 className="text-lg font-semibold">
              {hasCritical ? "Critical patient alerts" : "Active vitals alerts"}
            </h2>
            <p className="text-sm opacity-80">
              {hasCritical
                ? "Immediate review is recommended for the patients below."
                : "Vitals are outside the normal range for these patients."}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {visibleAlerts.map((alert) => (
          <div
            key={alert._id}
            className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white/70 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="space-y-1">
              <p className="font-semibold">
                {alert.patientName} | {formatAlertType(alert.type)} | {alert.value} {alert.unit}
              </p>
              <p className="text-sm opacity-85">{alert.message}</p>
              <p className="text-xs opacity-70">
                {formatDistanceToNow(new Date(alert.triggeredAt), { addSuffix: true })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold tracking-wide">
                {alert.severity}
              </span>
              <Button
                type="button"
                variant="outline"
                className="border-black/15 bg-white/80"
                onClick={() => handleAcknowledge(alert._id)}
              >
                Acknowledge
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="gap-2"
                onClick={() => handleDismiss(alert._id)}
              >
                <X className="h-4 w-4" />
                Dismiss
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatAlertType(type: AlertType) {
  if (type === "BLOOD_PRESSURE") {
    return "Blood Pressure";
  }

  if (type === "HEART_RATE") {
    return "Heart Rate";
  }

  return "Temperature";
}

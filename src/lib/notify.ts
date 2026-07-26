export type NotifyType = "success" | "error" | "info";

export function notify(message: string, type: NotifyType = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("app-notify", { detail: { message, type } }));
}

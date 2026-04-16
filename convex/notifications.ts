// Root aggregator — re-exports keep API paths as api.notifications.*
export { listForUser, unreadCount } from "./notifications/queries";
export { markAsRead, markAllAsRead } from "./notifications/mutations";

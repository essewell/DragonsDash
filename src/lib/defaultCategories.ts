import { v4 as uuid } from "uuid";
import type { Category } from "@/types";

/**
 * Default category taxonomy.
 * System categories cannot be deleted — only hidden.
 * Users can add custom categories at any level.
 */
export const DEFAULT_CATEGORIES: Omit<Category, "createdAt" | "updatedAt">[] = [
  // Housing
  { id: uuid(), name: "Rent", parentId: null, icon: "home", color: "#4A6FBF", isSystem: true },
  { id: uuid(), name: "Mortgage", parentId: null, icon: "home", color: "#4A6FBF", isSystem: true },
  { id: uuid(), name: "Property Tax", parentId: null, icon: "home", color: "#4A6FBF", isSystem: true },
  { id: uuid(), name: "Maintenance", parentId: null, icon: "wrench", color: "#4A6FBF", isSystem: true },
  { id: uuid(), name: "Insurance", parentId: null, icon: "shield", color: "#4A6FBF", isSystem: true },

  // Food
  { id: uuid(), name: "Groceries", parentId: null, icon: "shopping-cart", color: "#228B22", isSystem: true },
  { id: uuid(), name: "Restaurants", parentId: null, icon: "utensils", color: "#228B22", isSystem: true },
  { id: uuid(), name: "Coffee", parentId: null, icon: "coffee", color: "#228B22", isSystem: true },

  // Transport
  { id: uuid(), name: "Gas", parentId: null, icon: "fuel", color: "#CC5500", isSystem: true },
  { id: uuid(), name: "Public Transit", parentId: null, icon: "train", color: "#CC5500", isSystem: true },
  { id: uuid(), name: "Parking", parentId: null, icon: "car", color: "#CC5500", isSystem: true },
  { id: uuid(), name: "Ride Share", parentId: null, icon: "car", color: "#CC5500", isSystem: true },
  { id: uuid(), name: "Auto Insurance", parentId: null, icon: "shield", color: "#CC5500", isSystem: true },

  // Health
  { id: uuid(), name: "Medical", parentId: null, icon: "heart-pulse", color: "#DC2626", isSystem: true },
  { id: uuid(), name: "Dental", parentId: null, icon: "smile", color: "#DC2626", isSystem: true },
  { id: uuid(), name: "Pharmacy", parentId: null, icon: "pill", color: "#DC2626", isSystem: true },
  { id: uuid(), name: "Fitness", parentId: null, icon: "dumbbell", color: "#DC2626", isSystem: true },

  // Entertainment
  { id: uuid(), name: "Streaming", parentId: null, icon: "tv", color: "#8B5CF6", isSystem: true },
  { id: uuid(), name: "Events", parentId: null, icon: "ticket", color: "#8B5CF6", isSystem: true },
  { id: uuid(), name: "Hobbies", parentId: null, icon: "gamepad-2", color: "#8B5CF6", isSystem: true },

  // Bills & Utilities
  { id: uuid(), name: "Electricity", parentId: null, icon: "zap", color: "#D4A017", isSystem: true },
  { id: uuid(), name: "Gas Bill", parentId: null, icon: "flame", color: "#D4A017", isSystem: true },
  { id: uuid(), name: "Water", parentId: null, icon: "droplets", color: "#D4A017", isSystem: true },
  { id: uuid(), name: "Internet", parentId: null, icon: "wifi", color: "#D4A017", isSystem: true },
  { id: uuid(), name: "Phone", parentId: null, icon: "smartphone", color: "#D4A017", isSystem: true },

  // Shopping
  { id: uuid(), name: "Clothing", parentId: null, icon: "shirt", color: "#E91E63", isSystem: true },
  { id: uuid(), name: "Electronics", parentId: null, icon: "laptop", color: "#E91E63", isSystem: true },
  { id: uuid(), name: "Household", parentId: null, icon: "lamp", color: "#E91E63", isSystem: true },

  // Education
  { id: uuid(), name: "Tuition", parentId: null, icon: "graduation-cap", color: "#0891B2", isSystem: true },
  { id: uuid(), name: "Books", parentId: null, icon: "book-open", color: "#0891B2", isSystem: true },
  { id: uuid(), name: "Courses", parentId: null, icon: "monitor", color: "#0891B2", isSystem: true },

  // Income
  { id: uuid(), name: "Salary", parentId: null, icon: "briefcase", color: "#228B22", isSystem: true },
  { id: uuid(), name: "Freelance", parentId: null, icon: "laptop", color: "#228B22", isSystem: true },
  { id: uuid(), name: "Dividends", parentId: null, icon: "trending-up", color: "#228B22", isSystem: true },
  { id: uuid(), name: "Interest", parentId: null, icon: "percent", color: "#228B22", isSystem: true },
  { id: uuid(), name: "Refund", parentId: null, icon: "rotate-ccw", color: "#228B22", isSystem: true },

  // Transfers
  { id: uuid(), name: "Transfer In", parentId: null, icon: "arrow-down-left", color: "#6B7280", isSystem: true },
  { id: uuid(), name: "Transfer Out", parentId: null, icon: "arrow-up-right", color: "#6B7280", isSystem: true },

  // Other
  { id: uuid(), name: "Gifts", parentId: null, icon: "gift", color: "#6B7280", isSystem: true },
  { id: uuid(), name: "Charity", parentId: null, icon: "heart", color: "#6B7280", isSystem: true },
  { id: uuid(), name: "Subscriptions", parentId: null, icon: "repeat", color: "#6B7280", isSystem: true },
  { id: uuid(), name: "Fees", parentId: null, icon: "credit-card", color: "#6B7280", isSystem: true },
  { id: uuid(), name: "Uncategorized", parentId: null, icon: "tag", color: "#6B7280", isSystem: true },
];

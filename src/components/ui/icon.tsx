"use client";

import { Icon as IconifyIcon } from "@iconify/react";
import { cn } from "@/lib/utils";

// Solar icon mapping from Lucide names
const iconMap: Record<string, string> = {
  // Mail & Communication
  mail: "solar:letter-linear",
  "message-square": "solar:chat-square-linear",
  "message-circle": "solar:chat-round-dots-linear",
  send: "solar:paper-plane-linear",
  phone: "solar:phone-linear",
  
  // Users
  users: "solar:users-group-two-rounded-linear",
  user: "solar:user-linear",
  "user-cog": "solar:user-check-linear",
  "user-plus": "solar:user-plus-linear",
  
  // Navigation & UI
  settings: "solar:settings-linear",
  home: "solar:home-2-linear",
  search: "solar:magnifer-linear",
  menu: "solar:hamburger-menu-linear",
  "layout-dashboard": "solar:widget-5-linear",
  
  // Actions
  plus: "solar:add-circle-linear",
  "plus-circle": "solar:add-circle-linear",
  "trash-2": "solar:trash-bin-trash-linear",
  trash: "solar:trash-bin-trash-linear",
  edit: "solar:pen-2-linear",
  "edit-3": "solar:pen-new-square-linear",
  copy: "solar:copy-linear",
  share: "solar:share-circle-linear",
  download: "solar:download-minimalistic-linear",
  upload: "solar:upload-minimalistic-linear",
  "refresh-cw": "solar:refresh-linear",
  filter: "solar:filter-linear",
  
  // View
  eye: "solar:eye-linear",
  "eye-off": "solar:eye-closed-linear",
  
  // Status
  check: "solar:checkmark-circle-linear",
  "check-circle": "solar:checkmark-circle-linear",
  x: "solar:close-circle-linear",
  "x-circle": "solar:close-circle-linear",
  
  // Arrows & Chevrons
  "chevron-down": "solar:alt-arrow-down-linear",
  "chevron-up": "solar:alt-arrow-up-linear",
  "chevron-left": "solar:alt-arrow-left-linear",
  "chevron-right": "solar:alt-arrow-right-linear",
  "arrow-right": "solar:arrow-right-linear",
  "arrow-left": "solar:arrow-left-linear",
  "arrow-up": "solar:arrow-up-linear",
  "arrow-down": "solar:arrow-down-linear",
  "external-link": "solar:export-linear",
  
  // Loading
  "loader-2": "solar:refresh-circle-linear",
  loader: "solar:refresh-circle-linear",
  
  // Time & Calendar
  calendar: "solar:calendar-linear",
  "calendar-days": "solar:calendar-mark-linear",
  clock: "solar:clock-circle-linear",
  
  // Notifications
  bell: "solar:bell-linear",
  
  // Favorites
  star: "solar:star-linear",
  heart: "solar:heart-linear",
  
  // More menus
  "more-vertical": "solar:menu-dots-linear",
  "more-horizontal": "solar:menu-dots-circle-linear",
  
  // Auth
  "log-out": "solar:logout-2-linear",
  "log-in": "solar:login-2-linear",
  
  // Theme
  moon: "solar:moon-linear",
  sun: "solar:sun-linear",
  
  // AI & Tech
  bot: "solar:robot-linear",
  sparkles: "solar:magic-stick-3-linear",
  zap: "solar:bolt-circle-linear",
  code: "solar:code-circle-linear",
  "code-2": "solar:code-circle-linear",
  webhook: "solar:programming-linear",
  
  // Business
  "building-2": "solar:buildings-2-linear",
  building: "solar:buildings-linear",
  "credit-card": "solar:card-linear",
  "dollar-sign": "solar:dollar-minimalistic-linear",
  "indian-rupee": "solar:wallet-money-linear",
  target: "solar:target-linear",
  
  // Charts
  "bar-chart": "solar:chart-2-linear",
  "bar-chart-2": "solar:chart-2-linear",
  "line-chart": "solar:graph-up-linear",
  "pie-chart": "solar:pie-chart-2-linear",
  "trending-up": "solar:graph-up-linear",
  "trending-down": "solar:graph-down-linear",
  
  // Files & Documents
  file: "solar:document-linear",
  "file-text": "solar:document-text-linear",
  image: "solar:gallery-linear",
  
  // Links
  link: "solar:link-minimalistic-2-linear",
  "link-2": "solar:link-minimalistic-2-linear",
  
  // Alerts & Info
  "alert-circle": "solar:danger-circle-linear",
  "alert-triangle": "solar:danger-triangle-linear",
  info: "solar:info-circle-linear",
  "help-circle": "solar:question-circle-linear",
  
  // Location
  globe: "solar:globe-linear",
  "map-pin": "solar:map-point-linear",
  
  // Misc
  "grip-vertical": "solar:widget-linear",
  shield: "solar:shield-check-linear",
  lock: "solar:lock-linear",
  unlock: "solar:lock-unlocked-linear",
  key: "solar:key-linear",
  tag: "solar:tag-linear",
  bookmark: "solar:bookmark-linear",
  archive: "solar:archive-linear",
  inbox: "solar:inbox-linear",
  folder: "solar:folder-linear",
  "folder-open": "solar:folder-open-linear",
  layers: "solar:layers-linear",
  package: "solar:box-linear",
  gift: "solar:gift-linear",
  award: "solar:medal-ribbon-linear",
  crown: "solar:crown-linear",
  "thumbs-up": "solar:like-linear",
  "thumbs-down": "solar:dislike-linear",
  smile: "solar:emoji-funny-circle-linear",
  frown: "solar:emoji-sad-circle-linear",
  play: "solar:play-linear",
  pause: "solar:pause-linear",
  "skip-forward": "solar:skip-next-linear",
  "skip-back": "solar:skip-previous-linear",
  volume: "solar:volume-linear",
  "volume-2": "solar:volume-loud-linear",
  "volume-x": "solar:volume-cross-linear",
  mic: "solar:microphone-linear",
  "mic-off": "solar:microphone-slash-linear",
  camera: "solar:camera-linear",
  video: "solar:videocamera-linear",
  monitor: "solar:monitor-linear",
  smartphone: "solar:smartphone-linear",
  tablet: "solar:tablet-linear",
  laptop: "solar:laptop-linear",
  printer: "solar:printer-linear",
  wifi: "solar:wifi-router-linear",
  bluetooth: "solar:bluetooth-linear",
  battery: "solar:battery-full-linear",
  "battery-low": "solar:battery-low-linear",
  power: "solar:power-linear",
  "cloud-rain": "solar:cloud-rain-linear",
  cloud: "solar:cloud-linear",
  umbrella: "solar:umbrella-linear",
  thermometer: "solar:temperature-linear",
};

interface IconProps {
  name: string;
  className?: string;
  size?: number | string;
}

export function Icon({ name, className, size }: IconProps) {
  // Convert Lucide-style name to lowercase with hyphens
  const normalizedName = name
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "");
  
  const solarIcon = iconMap[normalizedName] || iconMap[name.toLowerCase()] || `solar:${normalizedName}-linear`;
  
  return (
    <IconifyIcon
      icon={solarIcon}
      className={cn("shrink-0", className)}
      width={size}
      height={size}
    />
  );
}

// Export individual icon components for easier migration
export function MailIcon({ className, size }: Omit<IconProps, "name">) {
  return <Icon name="mail" className={className} size={size} />;
}

export function UsersIcon({ className, size }: Omit<IconProps, "name">) {
  return <Icon name="users" className={className} size={size} />;
}

export function SettingsIcon({ className, size }: Omit<IconProps, "name">) {
  return <Icon name="settings" className={className} size={size} />;
}

export function HomeIcon({ className, size }: Omit<IconProps, "name">) {
  return <Icon name="home" className={className} size={size} />;
}

export function SearchIcon({ className, size }: Omit<IconProps, "name">) {
  return <Icon name="search" className={className} size={size} />;
}

export function BellIcon({ className, size }: Omit<IconProps, "name">) {
  return <Icon name="bell" className={className} size={size} />;
}

export function MoonIcon({ className, size }: Omit<IconProps, "name">) {
  return <Icon name="moon" className={className} size={size} />;
}

export function SunIcon({ className, size }: Omit<IconProps, "name">) {
  return <Icon name="sun" className={className} size={size} />;
}

export function LoaderIcon({ className, size }: Omit<IconProps, "name">) {
  return <Icon name="loader-2" className={cn("animate-spin", className)} size={size} />;
}

export default Icon;

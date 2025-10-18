// components/icons/CcIcons.tsx
import * as React from "react";

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

const base = { strokeWidth: 2, stroke: "currentColor", fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const IconSend: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...base} {...props}>
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

export const IconMic: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...base} {...props}>
    <rect x="9" y="2" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <path d="M12 19v3" />
  </svg>
);

export const IconMicOff: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...base} {...props}>
    <rect x="9" y="2" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 10.5 6.1" />
    <path d="M12 19v3" />
    <path d="M3 3l18 18" />
  </svg>
);

export const IconPhone: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...base} {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.89.34 1.76.65 2.59a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.49-1.17a2 2 0 0 1 2.11-.45c.83.31 1.7.53 2.59.65A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const IconPhoneEnd: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...base} {...props}>
    <path d="M3 10c3-2 15-2 18 0" />
    <path d="M8 13l-3 3" />
    <path d="M16 13l3 3" />
  </svg>
);

export const IconSpeaker: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...base} {...props}>
    <path d="M11 5l-4 4H4v6h3l4 4z" />
    <path d="M15 9a3 3 0 0 1 0 6" />
    <path d="M18 7a6 6 0 0 1 0 10" />
  </svg>
);

export const IconSpeakerOff: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...base} {...props}>
    <path d="M11 5l-4 4H4v6h3l4 4z" />
    <path d="M3 3l18 18" />
  </svg>
);

export const IconClose: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...base} {...props}>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export const IconChat: React.FC<IconProps> = ({ size = 22, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...base} {...props}>
    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    <path d="M8 8h8M8 12h6" />
  </svg>
);

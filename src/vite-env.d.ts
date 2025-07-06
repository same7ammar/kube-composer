/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HIDE_DEMO_ICONS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
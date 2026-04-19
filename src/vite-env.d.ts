/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK_API: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SHIBIE_API_BASE_URL: string;
  readonly VITE_DEEPSEEK_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
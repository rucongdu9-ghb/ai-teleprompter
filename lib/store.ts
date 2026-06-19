"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Script {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

interface ScriptStore {
  scripts: Script[];
  addScript: (script: Omit<Script, "id" | "createdAt">) => string;
  updateScript: (id: string, data: Partial<Script>) => void;
  deleteScript: (id: string) => void;
  getScript: (id: string) => Script | undefined;
}

export const useScriptStore = create<ScriptStore>()(
  persist(
    (set, get) => ({
      scripts: [],
      addScript: (data) => {
        const id = Date.now().toString();
        set((s) => ({
          scripts: [
            { ...data, id, createdAt: Date.now() },
            ...s.scripts,
          ],
        }));
        return id;
      },
      updateScript: (id, data) =>
        set((s) => ({
          scripts: s.scripts.map((sc) =>
            sc.id === id ? { ...sc, ...data } : sc
          ),
        })),
      deleteScript: (id) =>
        set((s) => ({ scripts: s.scripts.filter((sc) => sc.id !== id) })),
      getScript: (id) => get().scripts.find((sc) => sc.id === id),
    }),
    { name: "ai-teleprompter-scripts" }
  )
);

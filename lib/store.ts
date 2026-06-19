"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "./supabase";

export interface Script {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

function generateSyncCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

interface ScriptStore {
  scripts: Script[];
  syncCode: string;
  addScript: (script: Omit<Script, "id" | "createdAt">) => string;
  updateScript: (id: string, data: Partial<Script>) => void;
  deleteScript: (id: string) => void;
  getScript: (id: string) => Script | undefined;
  importFromCode: (code: string) => Promise<boolean>;
}

export const useScriptStore = create<ScriptStore>()(
  persist(
    (set, get) => ({
      scripts: [],
      syncCode: generateSyncCode(),

      addScript: (data) => {
        const id = Date.now().toString();
        const script = { ...data, id, createdAt: Date.now() };
        set((s) => ({ scripts: [script, ...s.scripts] }));
        const { syncCode } = get();
        supabase.from("scripts").insert({
          sync_code: syncCode,
          script_id: id,
          title: data.title,
          content: data.content,
        }).then(({ error }) => { if (error) console.error("sync add:", error); });
        return id;
      },

      updateScript: (id, data) => {
        set((s) => ({
          scripts: s.scripts.map((sc) => sc.id === id ? { ...sc, ...data } : sc),
        }));
        const { syncCode } = get();
        supabase.from("scripts").update({ title: data.title, content: data.content })
          .eq("sync_code", syncCode).eq("script_id", id)
          .then(({ error }) => { if (error) console.error("sync update:", error); });
      },

      deleteScript: (id) => {
        set((s) => ({ scripts: s.scripts.filter((sc) => sc.id !== id) }));
        const { syncCode } = get();
        supabase.from("scripts").delete()
          .eq("sync_code", syncCode).eq("script_id", id)
          .then(({ error }) => { if (error) console.error("sync delete:", error); });
      },

      getScript: (id) => get().scripts.find((sc) => sc.id === id),

      importFromCode: async (code) => {
        const upper = code.trim().toUpperCase();
        const { data, error } = await supabase
          .from("scripts").select("*").eq("sync_code", upper);
        if (error || !data || data.length === 0) return false;
        const scripts: Script[] = data.map((row) => ({
          id: row.script_id,
          title: row.title,
          content: row.content,
          createdAt: new Date(row.created_at).getTime(),
        }));
        set({ scripts, syncCode: upper });
        return true;
      },
    }),
    { name: "ai-teleprompter-scripts" }
  )
);

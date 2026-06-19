"use client";
import Link from "next/link";
import { useState } from "react";
import { useScriptStore } from "@/lib/store";

function formatTime(ts: number) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  const hour = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min}分钟前`;
  if (hour < 24) return `${hour}小时前`;
  if (day < 30) return `${day}天前`;
  return new Date(ts).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

export default function Home() {
  const { scripts, deleteScript, syncCode, importFromCode } = useScriptStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showSync, setShowSync] = useState(false);
  const [importCode, setImportCode] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [copied, setCopied] = useState(false);
  const recent = scripts.slice(0, 15);

  const copyCode = () => {
    navigator.clipboard.writeText(syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = async () => {
    if (!importCode.trim()) return;
    setImporting(true);
    setImportError("");
    const ok = await importFromCode(importCode);
    setImporting(false);
    if (ok) {
      setShowSync(false);
      setImportCode("");
    } else {
      setImportError("没有找到该同步码的脚本，请检查后重试");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f0f] text-white">
      <div className="p-6 pt-12 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">AI 提词助手</h1>
          <p className="text-gray-400 text-sm">直播带货 · 短视频 · 电商种草</p>
        </div>
        <button
          onClick={() => setShowSync(true)}
          className="mt-1 text-gray-500 text-xs flex flex-col items-center gap-1"
        >
          <span className="text-lg">☁️</span>
          <span>同步</span>
        </button>
      </div>

      {/* 同步码面板 */}
      {showSync && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="w-full bg-[#1a1a1a] rounded-t-3xl p-6 pb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">换手机恢复脚本</h2>
              <button onClick={() => { setShowSync(false); setImportError(""); setImportCode(""); }} className="text-gray-400 text-2xl leading-none">×</button>
            </div>

            <p className="text-gray-400 text-sm mb-3">你的同步码（换手机时输入这个）</p>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 bg-[#0f0f0f] rounded-xl px-4 py-3 font-mono text-xl font-bold tracking-widest text-yellow-400 text-center">
                {syncCode}
              </div>
              <button
                onClick={copyCode}
                className="bg-yellow-400 text-black font-bold px-4 py-3 rounded-xl text-sm shrink-0"
              >
                {copied ? "✓ 已复制" : "复制"}
              </button>
            </div>

            <div className="border-t border-white/10 pt-6">
              <p className="text-gray-400 text-sm mb-3">在新手机上输入旧同步码来恢复脚本</p>
              <input
                value={importCode}
                onChange={(e) => setImportCode(e.target.value.toUpperCase())}
                placeholder="输入同步码，例：ABCD-1234"
                className="w-full bg-[#0f0f0f] rounded-xl px-4 py-3 font-mono text-center text-base outline-none border border-white/10 mb-3 placeholder-gray-600 tracking-widest"
                maxLength={9}
              />
              {importError && <p className="text-red-400 text-xs mb-3">{importError}</p>}
              <button
                onClick={handleImport}
                disabled={importing || !importCode.trim()}
                className="w-full bg-yellow-400 text-black font-bold py-4 rounded-2xl disabled:opacity-50"
              >
                {importing ? "恢复中..." : "恢复脚本"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 mb-6">
        <Link
          href="/editor"
          className="block w-full bg-yellow-400 text-black font-bold text-lg py-4 rounded-2xl text-center"
        >
          + 新建脚本
        </Link>
      </div>

      <div className="px-4 grid grid-cols-2 gap-3 mb-8">
        <Link
          href="/replicate"
          className="bg-[#1a1a1a] rounded-2xl p-4 flex flex-col gap-2 border border-white/5"
        >
          <span className="text-2xl">🔥</span>
          <span className="font-semibold text-sm">爆款复刻</span>
          <span className="text-gray-400 text-xs">分析竞品脚本结构</span>
        </Link>
        <Link
          href="/video"
          className="bg-[#1a1a1a] rounded-2xl p-4 flex flex-col gap-2 border border-white/5"
        >
          <span className="text-2xl">🎬</span>
          <span className="font-semibold text-sm">视频转脚本</span>
          <span className="text-gray-400 text-xs">含动作提示</span>
        </Link>
      </div>

      <div className="px-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-gray-400 text-sm font-medium">最近使用</h2>
          {scripts.length > 0 && (
            <span className="text-gray-600 text-xs">{scripts.length} 个脚本</span>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="text-center text-gray-600 text-sm py-12">
            还没有脚本，点击上方新建吧
          </div>
        ) : (
          <div className="flex flex-col gap-2 pb-8">
            {recent.map((s) => (
              <div key={s.id}>
                {deletingId === s.id ? (
                  <div className="bg-[#1a1a1a] rounded-xl px-4 py-3 flex items-center justify-between border border-red-500/30">
                    <p className="text-sm text-gray-400 truncate mr-4">删除「{s.title}」？</p>
                    <div className="flex gap-4 shrink-0">
                      <button onClick={() => setDeletingId(null)} className="text-gray-400 text-sm">取消</button>
                      <button
                        onClick={() => { deleteScript(s.id); setDeletingId(null); }}
                        className="text-red-400 text-sm font-medium"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#1a1a1a] rounded-xl px-4 py-3 flex items-center justify-between border border-white/5">
                    <Link href={`/editor?id=${s.id}`} className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{s.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{formatTime(s.createdAt)}</p>
                    </Link>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <Link
                        href={`/teleprompter?id=${s.id}`}
                        className="text-yellow-400 text-xs px-2 py-1 bg-yellow-400/10 rounded-lg"
                      >
                        提词
                      </Link>
                      <button
                        onClick={() => setDeletingId(s.id)}
                        className="text-gray-600 text-xl leading-none w-7 h-7 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

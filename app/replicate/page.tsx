"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReplicatePage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "replicate", content: input }),
      });
      const data = await res.json();
      if (data.result) setResult(data.result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f0f] text-white">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-gray-400 text-xl p-1">‹</button>
        <h1 className="font-bold text-lg">🔥 爆款复刻</h1>
      </div>

      <div className="px-4 flex flex-col gap-4 flex-1">
        <p className="text-gray-400 text-sm">粘贴竞品脚本或视频文案，AI 分析结构并生成可复用模板</p>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="粘贴爆款文案内容..."
          className="w-full min-h-[180px] bg-[#1a1a1a] rounded-2xl p-4 text-sm leading-7 outline-none resize-none border border-white/5 text-gray-100 placeholder-gray-600"
        />

        <button
          onClick={analyze}
          disabled={loading || !input.trim()}
          className="w-full bg-yellow-400 text-black font-bold py-4 rounded-2xl disabled:opacity-50"
        >
          {loading ? "分析中..." : "🔍 分析结构 & 生成模板"}
        </button>

        {result && (
          <div className="bg-[#1a1a1a] rounded-2xl p-4 text-sm leading-7 text-gray-100 border border-white/5 whitespace-pre-wrap">
            {result}
          </div>
        )}
      </div>
    </div>
  );
}

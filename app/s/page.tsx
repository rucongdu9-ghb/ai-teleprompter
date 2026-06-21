"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useScriptStore } from "@/lib/store";

function ShareContent() {
  const router = useRouter();
  const { addScript } = useScriptStore();
  const [script, setScript] = useState<{ title: string; content: string } | null>(null);
  const [error, setError] = useState(false);
  const [imported, setImported] = useState(false);

  useEffect(() => {
    try {
      const hash = window.location.hash.slice(1);
      const params = new URLSearchParams(hash);
      const encoded = params.get("data");
      if (!encoded) { setError(true); return; }
      const data = JSON.parse(decodeURIComponent(atob(encoded)));
      if (!data.title || !data.content) { setError(true); return; }
      setScript(data);
    } catch {
      setError(true);
    }
  }, []);

  const doImport = () => {
    if (!script) return;
    addScript({ title: script.title, content: script.content });
    setImported(true);
    setTimeout(() => router.push("/"), 1500);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center px-6 text-center gap-4">
        <p className="text-4xl">⚠️</p>
        <p className="font-bold text-lg">链接无效或已损坏</p>
        <p className="text-gray-400 text-sm">请联系分享者重新生成链接</p>
        <button onClick={() => router.push("/")} className="mt-4 bg-white/10 text-white px-6 py-3 rounded-2xl">
          返回首页
        </button>
      </div>
    );
  }

  if (!script) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-gray-500 text-sm">加载中...</div>
      </div>
    );
  }

  if (imported) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center gap-3">
        <p className="text-5xl">✅</p>
        <p className="font-bold text-lg">导入成功！</p>
        <p className="text-gray-400 text-sm">正在跳转到首页...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col px-6 pt-20 pb-10">
      <p className="text-gray-400 text-sm mb-2">收到一份脚本分享</p>
      <h1 className="font-bold text-2xl mb-1">{script.title}</h1>
      <p className="text-gray-500 text-xs mb-6">{script.content.length} 字</p>

      <div className="bg-[#1a1a1a] rounded-2xl p-4 text-sm leading-7 text-gray-300 whitespace-pre-wrap max-h-[40vh] overflow-y-auto mb-8 border border-white/5">
        {script.content}
      </div>

      <button
        onClick={doImport}
        className="w-full bg-yellow-400 text-black font-bold py-4 rounded-2xl text-lg"
      >
        ＋ 导入到我的脚本库
      </button>
      <button
        onClick={() => router.push("/")}
        className="mt-3 w-full py-3 text-gray-400 text-sm"
      >
        取消
      </button>
    </div>
  );
}

export default function SharePage() {
  return <Suspense><ShareContent /></Suspense>;
}

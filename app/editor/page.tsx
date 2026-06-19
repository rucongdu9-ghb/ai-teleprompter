"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useScriptStore } from "@/lib/store";

type Lang = "zh" | "en" | "ar";

const LANG_LABELS: Record<Lang, string> = {
  zh: "中文",
  en: "English",
  ar: "العربية",
};

function EditorContent() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");

  const { addScript, updateScript, getScript } = useScriptStore();
  const [title, setTitle] = useState("新脚本");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [originalContent, setOriginalContent] = useState<string | null>(null);
  const [mode, setMode] = useState<"edit" | "ai-optimize" | "ai-generate">("edit");

  // AI生成表单
  const [product, setProduct] = useState("");
  const [points, setPoints] = useState("");
  const [audience, setAudience] = useState("");
  const [lang, setLang] = useState<Lang>("zh");
  const [phonetics, setPhonetics] = useState(false);

  useEffect(() => {
    if (id) {
      const script = getScript(id);
      if (script) {
        setTitle(script.title);
        setContent(script.content);
      }
    }
  }, [id, getScript]);

  const today = new Date();
  const dateStr = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;

  const save = () => {
    const finalTitle = title.trim() === "新脚本" || title.trim() === ""
      ? (content.trim().split("\n")[0]?.slice(0, 12) || "新脚本")
      : title;
    setTitle(finalTitle);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (id) {
      updateScript(id, { title: finalTitle, content });
      return id;
    } else {
      return addScript({ title: finalTitle, content });
    }
  };

  const openTeleprompter = () => {
    const scriptId = save();
    router.push(`/teleprompter?id=${scriptId}`);
  };

  const aiOptimize = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "optimize", content }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      if (data.result) {
        setOriginalContent(content);
        setContent(data.result);
      }
    } catch {
      setError("网络请求失败，请检查网络连接");
    } finally {
      setLoading(false);
    }
  };

  const aiGenerate = async () => {
    if (!product.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", product, points, audience, lang, phonetics }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      if (data.result) {
        setContent(data.result);
        setTitle(`${product}脚本 ${dateStr}`);
        setMode("edit");
      }
    } catch {
      setError("网络请求失败，请检查网络连接");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f0f] text-white">
      {/* 保存成功提示 */}
      {saved && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white text-sm font-medium px-5 py-2 rounded-full shadow-lg">
          ✓ 已保存
        </div>
      )}

      {/* AI 优化对比选择 */}
      {originalContent !== null && (
        <div className="fixed inset-0 bg-[#0a0a0a] z-40 flex flex-col">
          <div className="px-4 pt-12 pb-4">
            <p className="font-bold text-base">AI 已优化完成，选择使用哪个版本？</p>
            <p className="text-gray-500 text-xs mt-1">向下滑动可对比两个版本</p>
          </div>
          <div className="flex gap-3 px-4 mb-4">
            <button
              onClick={() => { setContent(originalContent); setOriginalContent(null); }}
              className="flex-1 bg-[#1a1a1a] text-gray-300 py-3 rounded-2xl font-medium text-sm border border-white/5"
            >
              保留原版
            </button>
            <button
              onClick={() => setOriginalContent(null)}
              className="flex-1 bg-yellow-400 text-black py-3 rounded-2xl font-bold text-sm"
            >
              ✨ 使用 AI 版
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-8 flex flex-col gap-5">
            <div>
              <p className="text-gray-500 text-xs mb-2 font-medium">原版</p>
              <div className="bg-[#1a1a1a] rounded-2xl p-4 text-sm leading-7 text-gray-400 whitespace-pre-wrap border border-white/5">
                {originalContent}
              </div>
            </div>
            <div>
              <p className="text-yellow-400 text-xs mb-2 font-medium">✨ AI 优化版</p>
              <div className="bg-[#1a1a1a] rounded-2xl p-4 text-sm leading-7 text-gray-100 whitespace-pre-wrap border border-yellow-400/20">
                {content}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 顶栏 */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-gray-400 text-xl p-1">‹</button>
        <div className="flex-1 min-w-0">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent font-semibold text-base outline-none border-b border-white/10 pb-0.5"
            placeholder="点击输入脚本标题"
          />
        </div>
        <button onClick={save} className="text-yellow-400 text-sm font-medium shrink-0 px-1">
          保存
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mx-4 mb-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-red-400 text-sm">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400/50 ml-3 text-lg leading-none">×</button>
        </div>
      )}

      {/* 模式切换 */}
      <div className="flex gap-2 px-4 mb-4">
        {(["edit", "ai-optimize", "ai-generate"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${
              mode === m ? "bg-yellow-400 text-black" : "bg-[#1a1a1a] text-gray-400"
            }`}
          >
            {m === "edit" ? "手动编辑" : m === "ai-optimize" ? "AI 优化" : "AI 生成"}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="flex-1 px-4 pb-4">
        {mode === "edit" && (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={"在这里输入你的脚本内容...\n\n小技巧：用【动作】标注动作提示，例如：\n【动作】拿起产品展示正面"}
            className="w-full h-full min-h-[300px] bg-[#1a1a1a] rounded-2xl p-4 text-sm leading-7 outline-none resize-none border border-white/5 text-gray-100 placeholder-gray-600"
          />
        )}

        {mode === "ai-optimize" && (
          <div className="flex flex-col gap-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="粘贴你的原始脚本，AI 会帮你优化成更有节奏感、更有钩子的版本"
              className="w-full min-h-[200px] bg-[#1a1a1a] rounded-2xl p-4 text-sm leading-7 outline-none resize-none border border-white/5 text-gray-100 placeholder-gray-600"
            />
            <button
              onClick={aiOptimize}
              disabled={loading || !content.trim()}
              className="w-full bg-yellow-400 text-black font-bold py-4 rounded-2xl disabled:opacity-50"
            >
              {loading ? "AI 优化中..." : "✨ 开始优化"}
            </button>
          </div>
        )}

        {mode === "ai-generate" && (
          <div className="flex flex-col gap-3">
            {/* 语言选择 */}
            <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-1 flex gap-1">
              {(["zh", "en", "ar"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => { setLang(l); if (l === "zh") setPhonetics(false); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    lang === l ? "bg-yellow-400 text-black" : "text-gray-400"
                  }`}
                >
                  {LANG_LABELS[l]}
                </button>
              ))}
            </div>

            {/* 音读选项（非中文才显示） */}
            {lang !== "zh" && (
              <button
                onClick={() => setPhonetics((p) => !p)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-colors ${
                  phonetics
                    ? "bg-yellow-400/10 border-yellow-400/40 text-yellow-400"
                    : "bg-[#1a1a1a] border-white/5 text-gray-400"
                }`}
              >
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${phonetics ? "border-yellow-400 bg-yellow-400" : "border-gray-600"}`}>
                  {phonetics && <span className="text-black text-xs">✓</span>}
                </span>
                <div className="text-left">
                  <p className="font-medium">添加中文音读</p>
                  <p className="text-xs opacity-60 mt-0.5">不懂外语也能照着读，适合跨境直播</p>
                </div>
              </button>
            )}

            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="商品名称（必填）例：珀莱雅双抗精华"
              className="w-full bg-[#1a1a1a] rounded-xl px-4 py-3 text-sm outline-none border border-white/5 placeholder-gray-600"
            />
            <textarea
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="核心卖点（选填）例：美白、抗老、30天见效"
              className="w-full bg-[#1a1a1a] rounded-xl px-4 py-3 text-sm outline-none border border-white/5 placeholder-gray-600 min-h-[80px] resize-none"
            />
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="目标人群（选填）例：25-35岁注重护肤的女性"
              className="w-full bg-[#1a1a1a] rounded-xl px-4 py-3 text-sm outline-none border border-white/5 placeholder-gray-600"
            />
            <button
              onClick={aiGenerate}
              disabled={loading || !product.trim()}
              className="w-full bg-yellow-400 text-black font-bold py-4 rounded-2xl disabled:opacity-50 mt-2"
            >
              {loading ? "AI 生成中..." : "🚀 一键生成完整脚本"}
            </button>
            {content && (
              <div className="bg-[#1a1a1a] rounded-2xl p-4 text-sm leading-7 text-gray-100 border border-white/5 whitespace-pre-wrap">
                {content}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部开始提词按钮 */}
      {content.trim() && (
        <div className="px-4 pb-8 pt-2">
          <button
            onClick={openTeleprompter}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl text-lg"
          >
            ▶ 开始提词
          </button>
        </div>
      )}
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense>
      <EditorContent />
    </Suspense>
  );
}

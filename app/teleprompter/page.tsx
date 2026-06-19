"use client";
import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useScriptStore } from "@/lib/store";

function parseScript(text: string) {
  return text.split("\n").filter((l) => l.trim()).map((line) => {
    const isAction =
      (line.startsWith("【") && line.includes("】")) ||
      line.startsWith("[Action]") ||
      line.startsWith("[إجراء]");
    const isPhonetics = line.startsWith("[音读]");
    const isActionTranslation = line.startsWith("[动译]");
    return {
      isAction,
      isPhonetics,
      isActionTranslation,
      text: isPhonetics
        ? line.replace(/^\[音读\]\s*/, "")
        : isActionTranslation
        ? line.replace(/^\[动译\]\s*/, "")
        : line,
    };
  });
}

const CANVAS_W = 640;
const CANVAS_H = 360;

function TeleprompterContent() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const isOverlay = params.get("overlay") === "1";
  const { getScript } = useScriptStore();

  const [script, setScript] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const [fontSize, setFontSize] = useState(isOverlay ? 42 : 36);
  const [mirror, setMirror] = useState(false);
  const [bgOpacity, setBgOpacity] = useState(isOverlay ? 0 : 0.9);
  const [showControls, setShowControls] = useState(!isOverlay);
  const [isPiP, setIsPiP] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animRef = useRef<number | null>(null);
  const posRef = useRef(0);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs for canvas rendering (避免闭包问题)
  const linesRef = useRef<ReturnType<typeof parseScript>>([]);
  const fontSizeRef = useRef(fontSize);
  const mirrorRef = useRef(mirror);

  const lines = useMemo(() => parseScript(script), [script]);

  useEffect(() => { linesRef.current = lines; }, [lines]);
  useEffect(() => { fontSizeRef.current = fontSize; }, [fontSize]);
  useEffect(() => { mirrorRef.current = mirror; }, [mirror]);

  useEffect(() => {
    setPipSupported("pictureInPictureEnabled" in document);
  }, []);

  useEffect(() => {
    if (id) {
      const sc = getScript(id);
      if (sc) {
        setScript(sc.content);
        if (isOverlay) setIsPlaying(true);
      }
    }
  }, [id, getScript, isOverlay]);

  // 退出页面时关闭画中画
  useEffect(() => {
    return () => {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(() => {});
      }
    };
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = CANVAS_W;
    const H = CANVAS_H;
    const currentLines = linesRef.current;
    const fs = fontSizeRef.current;
    const isMirror = mirrorRef.current;
    const canvasFs = Math.round(Math.min(fs, 48) * 0.78);
    const lineGap = 14;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, W, H);

    if (isMirror) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-W, 0);
    }

    // 计算画布总高度，用于映射 DOM 滚动比例
    let totalH = H * 0.35;
    const items = currentLines.map((line) => {
      const size = line.isAction
        ? canvasFs * 0.65
        : line.isPhonetics || line.isActionTranslation
        ? canvasFs * 0.5
        : canvasFs;
      const h = size * 1.4 + lineGap;
      totalH += h;
      return { ...line, size, h };
    });

    const container = containerRef.current;
    const domMax = container ? container.scrollHeight - container.clientHeight : 1;
    const canvasMax = Math.max(1, totalH - H * 0.65);
    const pct = domMax > 0 ? Math.min(1, posRef.current / domMax) : 0;
    const canvasScroll = pct * canvasMax;

    let y = H * 0.35 - canvasScroll;
    items.forEach(({ size, h, text, isAction, isPhonetics, isActionTranslation }) => {
      if (y > -h && y < H + h) {
        const weight = isAction ? "500" : isPhonetics || isActionTranslation ? "400" : "700";
        ctx.font = `${weight} ${Math.round(size)}px -apple-system, sans-serif`;
        ctx.fillStyle = isAction
          ? "#ffc800"
          : isPhonetics
          ? "#9ca3af"
          : isActionTranslation
          ? "#ca8a04"
          : "#ffffff";
        ctx.textBaseline = "top";

        const maxW = W - 48;
        if (ctx.measureText(text).width <= maxW) {
          ctx.fillText(text, 24, y, maxW);
        } else {
          let row = "";
          let rowY = y;
          for (const ch of text) {
            if (ctx.measureText(row + ch).width > maxW) {
              ctx.fillText(row, 24, rowY);
              rowY += Math.round(size * 1.4);
              row = ch;
            } else {
              row += ch;
            }
          }
          if (row) ctx.fillText(row, 24, rowY);
        }
      }
      y += h;
    });

    if (isMirror) ctx.restore();
  }, []);

  const startPiP = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    try {
      drawCanvas();
      const stream = canvas.captureStream(30);
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      await video.requestPictureInPicture();
      setIsPiP(true);
      video.addEventListener("leavepictureinpicture", () => setIsPiP(false), { once: true });
    } catch {
      alert("您的浏览器暂不支持画中画，请使用 Safari 或 Chrome 最新版本");
    }
  };

  const togglePiP = async () => {
    if (isPiP) {
      await document.exitPictureInPicture().catch(() => {});
      setIsPiP(false);
    } else {
      await startPiP();
    }
  };

  // 键盘快捷键
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((p) => !p);
        revealControls();
      }
      if (e.code === "ArrowUp") setSpeed((s) => Math.min(5, +(s + 0.3).toFixed(1)));
      if (e.code === "ArrowDown") setSpeed((s) => Math.max(0.3, +(s - 0.3).toFixed(1)));
      if (e.code === "ArrowRight") setFontSize((s) => Math.min(72, s + 2));
      if (e.code === "ArrowLeft") setFontSize((s) => Math.max(20, s - 2));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const revealControls = () => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  const scroll = useCallback(() => {
    if (!containerRef.current) return;
    posRef.current += speed * 0.5;
    containerRef.current.scrollTop = posRef.current;
    if (progressBarRef.current) {
      const max = containerRef.current.scrollHeight - containerRef.current.clientHeight;
      const pct = max > 0 ? Math.min(100, (posRef.current / max) * 100) : 0;
      progressBarRef.current.style.width = `${pct}%`;
    }
    drawCanvas();
    animRef.current = requestAnimationFrame(scroll);
  }, [speed, drawCanvas]);

  useEffect(() => {
    if (isPlaying) {
      animRef.current = requestAnimationFrame(scroll);
    } else {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      drawCanvas(); // 暂停时也更新画布
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, scroll, drawCanvas]);

  // 字体/镜像变化时重绘
  useEffect(() => { drawCanvas(); }, [fontSize, mirror, script, drawCanvas]);

  const handleTap = () => {
    setIsPlaying((p) => !p);
    revealControls();
  };

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        backgroundColor: `rgba(0, 0, 0, ${bgOpacity})`,
        transform: mirror ? "scaleX(-1)" : undefined,
      }}
    >
      {/* 隐藏的画中画元素 */}
      <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="hidden" />
      <video ref={videoRef} className="hidden" playsInline muted />

      {/* 进度条 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-20">
        <div ref={progressBarRef} className="h-full bg-yellow-400 transition-none" style={{ width: "0%" }} />
      </div>

      {/* 脚本内容区 */}
      <div ref={containerRef} className="flex-1 overflow-hidden px-6 pt-16 pb-32" onClick={handleTap}>
        <div className="flex flex-col gap-4 pb-[60vh]">
          {lines.map((line, i) => (
            <div
              key={i}
              style={{
                fontSize: line.isAction
                  ? fontSize * 0.6
                  : line.isPhonetics || line.isActionTranslation
                  ? fontSize * 0.48
                  : fontSize,
                fontWeight: line.isAction ? 500 : line.isPhonetics || line.isActionTranslation ? 400 : 700,
                color: line.isAction
                  ? "#ffc800"
                  : line.isPhonetics
                  ? "#6b7280"
                  : line.isActionTranslation
                  ? "#a16207"
                  : "#ffffff",
                lineHeight: 1.35,
                letterSpacing: line.isPhonetics ? "0.06em" : undefined,
                marginTop: line.isPhonetics || line.isActionTranslation ? "-12px" : undefined,
                textShadow: isOverlay
                  ? "0 0 8px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,1), 0 -1px 4px rgba(0,0,0,1)"
                  : undefined,
              }}
            >
              {line.text}
            </div>
          ))}
        </div>
      </div>

      {/* 控制栏 */}
      {showControls && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur px-4 pb-8 pt-4 flex flex-col gap-3 z-10"
          style={{ transform: mirror ? "scaleX(-1)" : undefined }}
        >
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="text-gray-400 text-sm p-2">
              ‹ 返回
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (containerRef.current) containerRef.current.scrollTop = 0;
                  posRef.current = 0;
                  if (progressBarRef.current) progressBarRef.current.style.width = "0%";
                  setIsPlaying(false);
                  drawCanvas();
                  revealControls();
                }}
                className="px-3 py-2 rounded-full text-sm text-gray-400 bg-white/10"
              >
                ↩ 重播
              </button>
              <button
                onClick={handleTap}
                className={`px-6 py-2 rounded-full font-bold text-sm ${
                  isPlaying ? "bg-red-500 text-white" : "bg-yellow-400 text-black"
                }`}
              >
                {isPlaying ? "⏸ 暂停" : "▶ 开始"}
              </button>
            </div>
            <button
              onClick={() => setMirror((m) => !m)}
              className={`text-sm p-2 ${mirror ? "text-yellow-400" : "text-gray-400"}`}
            >
              镜像
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-xs w-12">速度</span>
            <input type="range" min="0.3" max="5" step="0.1" value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="flex-1 accent-yellow-400" />
            <span className="text-yellow-400 text-xs w-6">{speed.toFixed(1)}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-xs w-12">字号</span>
            <input type="range" min="20" max="72" step="2" value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="flex-1 accent-yellow-400" />
            <span className="text-yellow-400 text-xs w-6">{fontSize}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-xs w-12">透明度</span>
            <input type="range" min="0.1" max="1" step="0.05" value={bgOpacity}
              onChange={(e) => setBgOpacity(Number(e.target.value))}
              className="flex-1 accent-yellow-400" />
            <span className="text-yellow-400 text-xs w-6">{Math.round(bgOpacity * 100)}%</span>
          </div>

          {/* 画中画按钮 */}
          {pipSupported && (
            <button
              onClick={togglePiP}
              className={`w-full py-3 rounded-2xl font-bold text-sm ${
                isPiP
                  ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/40"
                  : "bg-white/10 text-white"
              }`}
            >
              {isPiP ? "⊡ 已开启悬浮窗 · 点击关闭" : "⊡ 开启悬浮窗（可切换到其他App）"}
            </button>
          )}

          <div className="text-center text-gray-700 text-xs">
            空格键 播放/暂停 · ↑↓ 调速度 · ←→ 调字号
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeleprompterPage() {
  return (
    <Suspense>
      <TeleprompterContent />
    </Suspense>
  );
}

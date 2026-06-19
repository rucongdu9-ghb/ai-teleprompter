"use client";
import { useRouter } from "next/navigation";

export default function VideoPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f0f] text-white">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-gray-400 text-xl p-1">‹</button>
        <h1 className="font-bold text-lg">🎬 视频转脚本</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center text-4xl border border-white/10">
          🎬
        </div>
        <div className="text-center">
          <p className="font-semibold text-lg mb-2">视频转脚本功能</p>
          <p className="text-gray-400 text-sm leading-6">
            上传视频或粘贴链接<br />
            AI 自动提取台词 + 分析动作节点<br />
            生成带【动作提示】的完整脚本
          </p>
        </div>
        <div className="bg-[#1a1a1a] rounded-2xl p-4 w-full border border-white/5">
          <p className="text-yellow-400 text-sm font-medium mb-1">即将上线</p>
          <p className="text-gray-500 text-xs">此功能需要接入 Whisper 语音识别 API，正在开发中</p>
        </div>
      </div>
    </div>
  );
}

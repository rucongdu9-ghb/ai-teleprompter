import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, content, product, points, audience, lang = "zh", phonetics = false } = body;

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "未配置 API Key，请在 .env.local 中设置 DEEPSEEK_API_KEY" }, { status: 500 });
  }

  let prompt = "";

  if (action === "optimize") {
    prompt = `你是一位专业的直播带货文案专家。请将以下脚本优化成更口语化、节奏感强、有钩子的版本。
要求：
- 保持原有信息不丢失
- 开头加强钩子，让人想继续看
- 增加情绪起伏和节奏感
- 适当加入催单话术
- 用【动作】标注关键动作提示，格式：【动作】XXX
- 分段清晰，每段2-4行

原始脚本：
${content}

请直接输出优化后的脚本，不要加任何解释。`;

  } else if (action === "generate") {
    if (lang === "en") {
      if (phonetics) {
        prompt = `You are a professional live-streaming e-commerce copywriter. Generate a complete English live-streaming script for the following product.

Product: ${product}
Key selling points: ${points || "not provided"}
Target audience: ${audience || "general consumers"}

Script structure:
1. Opening hook (grab attention)
2. Pain point (build empathy)
3. Product introduction (showcase benefits)
4. Social proof / comparison (build trust)
5. Limited-time urgency (drive purchase)
6. Closing interaction

STRICT FORMAT RULES — follow exactly:

Rule 1 — Regular spoken lines: After each English line, add a Chinese phonetic guide on the next line prefixed with [音读].
Use ACCURATE AMERICAN ENGLISH pronunciation. Write Chinese syllables that closely approximate how Americans actually say the word. Split each word by syllable with a middle dot (·). Keep tones natural and close to real American speech.

Good examples:
Hello everyone, welcome!
[音读] 哈·喽 艾·芙·瑞·旺，威尔·卡姆！

Beautiful results in just 30 days!
[音读] 比尤·提·否 瑞·扎茨 因 贾斯特 瑟·提 德·耶兹！

Rule 2 — Action cues: Write the English action, then on the next line add the Chinese translation prefixed with [动译]. Do NOT add phonetics for action lines since they are not spoken aloud.

[Action] Hold up the product and show the front
[动译] 拿起产品，展示正面

Rule 3 — No blank lines between a line and its [音读] or [动译]. Add one blank line between separate paragraphs.

Output only the script. No explanations.`;
      } else {
        prompt = `You are a professional live-streaming e-commerce copywriter. Generate a complete English live-streaming script for the following product.

Product: ${product}
Key selling points: ${points || "not provided"}
Target audience: ${audience || "general consumers"}

Script structure:
1. Opening hook (grab attention)
2. Pain point (build empathy)
3. Product introduction (showcase benefits)
4. Social proof / comparison (build trust)
5. Limited-time urgency (drive purchase)
6. Closing interaction

Include action cues in this format: [Action] XXX (e.g., [Action] Hold up the product to show the front)

Output only the script. No explanations.`;
      }
    } else if (lang === "ar") {
      prompt = `أنت خبير في كتابة نصوص البث المباشر للتجارة الإلكترونية. أنشئ نصًا كاملاً للبث المباشر للمنتج التالي.

المنتج: ${product}
نقاط البيع الرئيسية: ${points || "غير محددة"}
الجمهور المستهدف: ${audience || "المستهلكون العامون"}

هيكل النص:
1. مقدمة جذابة (استقطاب الانتباه)
2. نقطة الألم (بناء التعاطف)
3. تقديم المنتج (عرض الفوائد)
4. الدليل الاجتماعي (بناء الثقة)
5. الإلحاح المحدود الوقت (دفع الشراء)
6. التفاعل الختامي

أضف إشارات للإجراءات بهذا التنسيق: [إجراء] XXX

${phonetics ? `مهم: بعد كل سطر عربي، أضف سطرًا بالنطق الصيني التقريبي، مسبوقًا بـ [音读]. هذا يساعد المضيفين الصينيين على نطق العربية.

مثال:
مرحباً بالجميع في البث المباشر!
[音读] 玛尔哈巴 比尔贾米尔 菲尔贝斯！` : ""}

اكتب النص مباشرة بدون شرح.`;
    } else {
      prompt = `你是一位专业的直播带货文案专家。请为以下商品生成一套完整的直播脚本。

商品：${product}
卖点：${points || "未提供"}
目标人群：${audience || "25-40岁女性"}

脚本结构要求：
1. 开场钩子（吸引停留）
2. 痛点引入（引发共鸣）
3. 产品介绍（展示卖点）
4. 对比/证明（建立信任）
5. 限时催单（制造紧迫）
6. 结尾互动

在关键位置加入动作提示，格式：【动作】XXX（例如：【动作】拿起产品展示正面）

请直接输出脚本内容，分段清晰，不要加任何说明。`;
    }

  } else if (action === "replicate") {
    prompt = `你是一位专业的直播带货策略分析师。请分析以下文案/脚本的结构，提炼出可复用的模板框架。

原始文案：
${content}

请输出：
1. 结构分析（每个段落的作用）
2. 钩子类型（用了什么技巧）
3. 可复用模板（替换掉具体商品名，保留结构）
4. 使用建议

格式要清晰，方便直接套用。`;
  }

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = (err as { error?: { message?: string } }).error?.message ?? `HTTP ${response.status}`;
      return NextResponse.json({ error: `AI 服务错误：${msg}` }, { status: 500 });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: "网络请求失败，请检查网络连接后重试" }, { status: 500 });
  }
}

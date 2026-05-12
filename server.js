import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnvFile(path.join(__dirname, ".env"));

const PORT = Number(process.env.PORT || 3000);
const LEGACY_OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const LEGACY_OPENAI_BASE_URL = trimTrailingSlash(process.env.OPENAI_BASE_URL || "");
const PROVIDER_PRESETS = {
  deepseek: {
    label: "DeepSeek",
    textBaseUrl: "https://api.deepseek.com/v1",
    defaultTextModel: "deepseek-chat",
  },
  siliconflow: {
    label: "SiliconFlow",
    textBaseUrl: "https://api.siliconflow.cn/v1",
    imageBaseUrl: "https://api.siliconflow.cn/v1",
    defaultTextModel: "Qwen/Qwen2.5-72B-Instruct",
    defaultImageModel: "Qwen/Qwen-Image",
  },
  bailian: {
    label: "Bailian",
    textBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    imageBaseUrl: "https://dashscope.aliyuncs.com",
    defaultTextModel: "qwen-plus",
    defaultImageModel: "wanx2.1-t2i-turbo",
  },
  custom: {
    label: "Custom",
  },
};
const TEXT_PROVIDER = normalizeProviderName(process.env.TEXT_PROVIDER || inferLegacyProvider());
const IMAGE_PROVIDER = normalizeProviderName(process.env.IMAGE_PROVIDER || inferLegacyProvider("siliconflow"));
const TEXT_API_KEY = process.env.TEXT_API_KEY || resolveProviderApiKey(TEXT_PROVIDER) || LEGACY_OPENAI_API_KEY;
const IMAGE_API_KEY = process.env.IMAGE_API_KEY || resolveProviderApiKey(IMAGE_PROVIDER) || LEGACY_OPENAI_API_KEY;
const TEXT_BASE_URL = resolveProviderBaseUrl("text", TEXT_PROVIDER, process.env.TEXT_BASE_URL, LEGACY_OPENAI_BASE_URL);
const IMAGE_BASE_URL = resolveProviderBaseUrl("image", IMAGE_PROVIDER, process.env.IMAGE_BASE_URL, LEGACY_OPENAI_BASE_URL);
const TEXT_MODEL = process.env.TEXT_MODEL || process.env.OPENAI_TEXT_MODEL || getDefaultModel("text", TEXT_PROVIDER, "gpt-4.1-mini");
const IMAGE_MODEL = process.env.IMAGE_MODEL || process.env.OPENAI_IMAGE_MODEL || getDefaultModel("image", IMAGE_PROVIDER, "gpt-image-1");
const TEXT_ENDPOINT_PATH = normalizeEndpointPath(process.env.TEXT_ENDPOINT_PATH || "/chat/completions");
const IMAGE_ENDPOINT_PATH = normalizeEndpointPath(
  process.env.IMAGE_ENDPOINT_PATH || (IMAGE_PROVIDER === "bailian" ? "/api/v1/services/aigc/text2image/image-synthesis" : "/images/generations")
);
const REQUEST_TIMEOUT_MS = 15000;
const LOOKUP_CACHE_TTL_MS = 1000 * 60 * 60;
const LOOKUP_CACHE_MAX_ENTRIES = 200;
const BAILIAN_IMAGE_MAX_POLLS = 20;
const BAILIAN_IMAGE_POLL_INTERVAL_MS = 2000;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".md": "text/markdown; charset=utf-8",
};

const styleLookupCache = new Map();
const externalJsonCache = new Map();
const LOOKUP_IMAGE_TERMS = ["画家", "艺术家", "painter", "artist", "illustrator", "visual", "动画", "director"];
const LOOKUP_POEM_TERMS = ["诗人", "词人", "poet", "writer", "poetry", "literary", "俳人"];
const LOCAL_STYLE_LOOKUP_INDEX = {
  poem: [
    {
      id: "local-poem-liuyong",
      name: "柳永",
      aliases: ["耆卿", "柳三变", "liuyong", "liu yong"],
      description: "北宋词人",
      summary:
        "柳永，北宋词人，擅长慢词铺叙，长于都市风物、羁旅行役与离情别绪的刻画，语言晓畅而有音乐性，是宋词婉约一路的重要奠基者。",
      works: [
        { id: "local-liuyong-1", title: "雨霖铃", description: "词作", summary: "寒蝉凄切、长亭送别，极擅铺叙离情与时空转换。", imageUrl: "", sourceUrl: "" },
        { id: "local-liuyong-2", title: "望海潮", description: "词作", summary: "写杭州繁华与湖山胜景，富有城市景观与声色铺陈。", imageUrl: "", sourceUrl: "" },
        { id: "local-liuyong-3", title: "八声甘州", description: "词作", summary: "羁旅怀人，秋江雨景与身世之感交织。", imageUrl: "", sourceUrl: "" },
        { id: "local-liuyong-4", title: "蝶恋花", description: "词作", summary: "伫倚危楼、望极春愁，情景相生。", imageUrl: "", sourceUrl: "" },
      ],
    },
    {
      id: "local-poem-libai",
      name: "李白",
      aliases: ["太白", "libai", "li bai"],
      description: "唐代诗人",
      summary: "李白，唐代诗人，想象奇崛，语言飞动，常以月、酒、山川和远游构成雄放飘逸的诗歌气象。",
      works: [
        { id: "local-libai-1", title: "静夜思", description: "诗作", summary: "以极简语言写思乡。", imageUrl: "", sourceUrl: "" },
        { id: "local-libai-2", title: "将进酒", description: "诗作", summary: "纵酒高歌，气势奔涌。", imageUrl: "", sourceUrl: "" },
      ],
    },
    {
      id: "local-poem-dickinson",
      name: "Emily Dickinson",
      aliases: ["dickinson", "emily", "emily dickinson", "艾米莉狄金森", "艾米莉·狄金森"],
      description: "American poet",
      summary: "Emily Dickinson 以短促而陡峭的抒情著称，擅长用自然、死亡、灵魂与静默意象承载内在震颤。",
      works: [
        { id: "local-dickinson-1", title: "Because I could not stop for Death", description: "poem", summary: "以平静叙述逼近死亡经验。", imageUrl: "", sourceUrl: "" },
        { id: "local-dickinson-2", title: "Hope is the thing with feathers", description: "poem", summary: "以鸟喻希望，凝练有力。", imageUrl: "", sourceUrl: "" },
      ],
    },
    {
      id: "local-poem-baudelaire",
      name: "Charles Baudelaire",
      aliases: ["baudelaire", "charles baudelaire", "波德莱尔", "波特莱尔"],
      description: "French poet",
      summary: "Charles Baudelaire 擅写都市感官、颓艳阴影与高贵忧郁，常以香气、夜色、肉身和街道营造现代性诗感。",
      works: [
        { id: "local-baudelaire-1", title: "L'Invitation au voyage", description: "poem", summary: "秩序、静谧与感官诱惑并置。", imageUrl: "", sourceUrl: "" },
        { id: "local-baudelaire-2", title: "Correspondances", description: "poem", summary: "象征主义的重要先声。", imageUrl: "", sourceUrl: "" },
      ],
    },
    {
      id: "local-poem-basho",
      name: "松尾芭蕉",
      aliases: ["芭蕉", "basho", "matsuo basho", "松尾芭蕉"],
      description: "日本俳人",
      summary: "松尾芭蕉为日本俳句代表人物，语言极简，强调旅途、静寂与自然瞬间的顿悟感。",
      works: [
        { id: "local-basho-1", title: "古池や 蛙飛びこむ 水の音", description: "俳句", summary: "以极静写刹那之响。", imageUrl: "", sourceUrl: "" },
        { id: "local-basho-2", title: "夏草や 兵どもが 夢の跡", description: "俳句", summary: "荒草与旧梦并置，苍凉深远。", imageUrl: "", sourceUrl: "" },
      ],
    },
  ],
  image: [
    {
      id: "local-image-vangogh",
      name: "梵高",
      aliases: ["van gogh", "vincent van gogh", "vangogh", "文森特梵高"],
      description: "后印象派画家",
      summary: "梵高的视觉语言以高饱和对比、旋涡式节奏、厚涂笔触和强烈情绪驱动为特征。",
      works: [
        { id: "local-vangogh-1", title: "星月夜", description: "油画", summary: "旋涡天空与村镇夜色形成强烈节奏。", imageUrl: "", sourceUrl: "" },
        { id: "local-vangogh-2", title: "向日葵", description: "油画", summary: "以高纯度黄调建立生命力。", imageUrl: "", sourceUrl: "" },
      ],
    },
    {
      id: "local-image-miyazaki",
      name: "宫崎骏",
      aliases: ["miyazaki", "hayao miyazaki", "宫崎骏"],
      description: "动画导演与视觉创作者",
      summary: "宫崎骏式画面常见手绘暖光、自然风感、飞行意象与童话现实交叠，氛围澄澈而富有生命流动。",
      works: [
        { id: "local-miyazaki-1", title: "千与千寻", description: "动画电影", summary: "奇幻空间与日常细节交织。", imageUrl: "", sourceUrl: "" },
        { id: "local-miyazaki-2", title: "龙猫", description: "动画电影", summary: "乡野自然与童年感知并置。", imageUrl: "", sourceUrl: "" },
      ],
    },
    {
      id: "local-image-popart",
      name: "波普艺术",
      aliases: ["pop art", "波普", "波普艺术"],
      description: "国际经典视觉风格",
      summary: "波普艺术强调高纯度撞色、商业符号、漫画轮廓与机械复制感，画面张扬直接。",
      works: [
        { id: "local-popart-1", title: "Campbell's Soup Cans", description: "代表性作品母题", summary: "消费社会与机械复制美学的象征。", imageUrl: "", sourceUrl: "" },
        { id: "local-popart-2", title: "Whaam!", description: "代表性作品母题", summary: "漫画式爆炸与高对比色块。", imageUrl: "", sourceUrl: "" },
      ],
    },
  ],
};

const server = createServer(async (request, response) => {
  try {
    if (!request.url) {
      sendJson(response, 400, { error: "Invalid request" });
      return;
    }

    const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

    if (request.method === "GET" && url.pathname === "/api/health") {
      const textReady = Boolean(TEXT_API_KEY && TEXT_BASE_URL && TEXT_MODEL);
      const imageReady = Boolean(TEXT_API_KEY && TEXT_BASE_URL && TEXT_MODEL && IMAGE_API_KEY && IMAGE_BASE_URL && IMAGE_MODEL);
      sendJson(response, 200, {
        ready: textReady && imageReady,
        textProvider: getProviderLabel(TEXT_PROVIDER),
        imageProvider: getProviderLabel(IMAGE_PROVIDER),
        textModel: TEXT_MODEL,
        imageModel: IMAGE_MODEL,
        message:
          textReady && imageReady
            ? `模型服务可用。文本供应商：${getProviderLabel(TEXT_PROVIDER)}；图片供应商：${getProviderLabel(IMAGE_PROVIDER)}。`
            : buildHealthMessage(textReady, imageReady),
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/style-lookup") {
      await handleStyleLookup(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/generate-image") {
      await handleGenerateImage(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/generate-poem") {
      await handleGeneratePoem(request, response);
      return;
    }

    if (request.method === "GET") {
      await serveStatic(url.pathname, response);
      return;
    }

    sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: error.message || "Internal server error" });
  }
});

server.listen(PORT, () => {
  console.log(`丹青词境已启动: http://localhost:${PORT}`);
});

async function handleStyleLookup(request, response) {
  const body = await readJsonBody(request);
  const kind = body.kind === "poem" ? "poem" : "image";
  const name = String(body.name || "").trim();
  const entityId = String(body.entityId || "").trim();

  if (!name) {
    sendJson(response, 400, { error: "请输入艺术家姓名。" });
    return;
  }

  const payload = await getCachedValue(
    styleLookupCache,
    buildStyleLookupCacheKey(kind, name, entityId),
    async () => {
      try {
        const candidates = await searchWikidataCandidates(name, kind);
        const selectedCandidate = candidates.find((candidate) => candidate.id === entityId) || candidates[0];
        if (!selectedCandidate) {
          throw new Error("未找到可用候选人物，请尝试更完整的姓名。");
        }

        const entity = await getWikidataEntityById(selectedCandidate.id);
        const summary = await fetchEntitySummary(entity);
        const matchedKind = detectLookupKind(selectedCandidate.matchedKind, entity.description, summary.extract) || kind;
        const works = await resolveNotableWorks(entity, matchedKind, summary);
        const poemForm = matchedKind === "poem" ? detectPoemForm(entity.description, summary.extract, ...works.map((work) => `${work.title} ${work.description} ${work.summary}`)) : "";

        return {
          candidates: candidates.map((candidate) => ({
            id: candidate.id,
            name: candidate.name,
            description: candidate.description,
            matchedKind: candidate.matchedKind || kind,
            poemForm: (candidate.matchedKind || kind) === "poem" ? detectPoemForm(candidate.description, candidate.name) : "",
          })),
          selected: {
            id: entity.id,
            kind: matchedKind,
            matchedKind,
            poemForm,
            name: entity.label,
            description: entity.description,
            summary: summary.extract || "",
            sourceUrl: summary.pageUrl || "",
            works,
            styleSummary: buildLookupStyleSummary(matchedKind, entity, summary, works),
          },
        };
      } catch (error) {
        const localPayload = buildLocalLookupPayload(name, kind, entityId);
        if (localPayload) {
          return localPayload;
        }
        throw new Error(formatStyleLookupError(error));
      }
    },
    LOOKUP_CACHE_TTL_MS,
    LOOKUP_CACHE_MAX_ENTRIES
  );

  sendJson(response, 200, payload);
}

async function handleGenerateImage(request, response) {
  ensureConfigured("image");
  const body = await readJsonBody(request);
  const prompt = String(body.prompt || "").trim();
  const preset = body.preset || {};
  const uploadedImages = Array.isArray(body.uploadedImages) ? body.uploadedImages.slice(0, 4) : [];
  const lookupStyle = normalizeLookupStyle(body.lookupStyle, "image");

  if (!prompt) {
    sendJson(response, 400, { error: "图像提示词不能为空。" });
    return;
  }

  const lookupImages = lookupStyle.works.filter((work) => work.imageUrl).slice(0, 3);
  const content = [
    {
      type: "text",
      text: [
        "请你充当图像风格分析师。",
        "用户会给出一个绘画名家预设、若干参考图片、一个可能来自互联网检索的人物与代表作资料、以及要生成的新画面提示词。",
        "你的任务是抽取风格特征，形成供文生图模型使用的风格摘要。",
        "只返回 JSON，对象字段必须为 styleSummary, visualKeywords, colorPalette, composition, brushwork, mood。",
        `预设名家: ${preset.name || "未指定"}`,
        `预设描述: ${preset.description || ""}`,
        `预设关键词: ${(preset.keywords || []).join(", ")}`,
        `预设色板: ${(preset.palette || []).join(", ")}`,
        lookupStyle.name
          ? `联网参考人物: ${lookupStyle.name}\n人物摘要: ${lookupStyle.summary}\n代表作: ${lookupStyle.works.map((work) => `${work.title}${work.summary ? `(${work.summary})` : ""}`).join("；")}`
          : "未启用联网参考。",
        `用户生成目标: ${prompt}`,
      ].join("\n"),
    },
    ...uploadedImages.map((image) => ({
      type: "image_url",
      image_url: {
        url: image.dataUrl,
      },
    })),
    ...lookupImages.map((work) => ({
      type: "image_url",
      image_url: {
        url: work.imageUrl,
      },
    })),
  ];

  const styleProfile = normalizeVisualStyleProfile(
    await callChatJson({
    system: "You analyze visual styles and must return valid JSON only.",
    messages: [{ role: "user", content }],
    temperature: 0.45,
    })
  );

  const finalPrompt = [
    "Create one original image based on the following specification.",
    "Do not imitate any copyrighted composition from the reference images or representative works.",
    `User request: ${prompt}`,
    `Preset style: ${preset.name || "Unknown"} - ${preset.description || ""}`,
    lookupStyle.name ? `Internet lookup reference: ${lookupStyle.name} - ${lookupStyle.summary}` : "",
    `Learned style summary: ${styleProfile.styleSummary || ""}`,
    `Visual keywords: ${(styleProfile.visualKeywords || []).join(", ")}`,
    `Color palette: ${(styleProfile.colorPalette || []).join(", ")}`,
    `Composition: ${(styleProfile.composition || []).join(", ")}`,
    `Brushwork: ${(styleProfile.brushwork || []).join(", ")}`,
    `Mood: ${styleProfile.mood || preset.mood || "evocative"}`,
    "Produce a polished, coherent final image.",
  ]
    .filter(Boolean)
    .join("\n");

  const imageResult = await callImageGeneration(finalPrompt);
  sendJson(response, 200, {
    imageDataUrl: imageResult.imageDataUrl,
    mimeType: imageResult.mimeType,
    summary: `${styleProfile.styleSummary || "已完成风格抽取。"}${lookupStyle.name ? ` 本次额外参考了 ${lookupStyle.name} 的代表作。` : ""}`,
    styleProfile,
  });
}

async function handleGeneratePoem(request, response) {
  ensureConfigured("text");
  const body = await readJsonBody(request);
  const prompt = String(body.prompt || "").trim();
  const preset = body.preset || {};
  const uploadedTexts = Array.isArray(body.uploadedTexts) ? body.uploadedTexts.slice(0, 10) : [];
  const lookupStyle = normalizeLookupStyle(body.lookupStyle, "poem");
  const poemLanguage = normalizePoemLanguage(preset.language);
  const poemForm = detectPoemForm(
    lookupStyle.poemForm,
    lookupStyle.description,
    lookupStyle.summary,
    ...lookupStyle.works.map((work) => `${work.title} ${work.description} ${work.summary}`)
  );
  const poemFormGuide = getPoemFormGuide(poemForm, poemLanguage);

  if (!prompt) {
    sendJson(response, 400, { error: "诗词提示词不能为空。" });
    return;
  }

  const sampleBlock = uploadedTexts.length
    ? uploadedTexts
        .map((item, index) => `样本 ${index + 1} (${item.name || "未命名"}):\n${String(item.content || "").slice(0, 1800)}`)
        .join("\n\n")
    : "无用户上传文本，仅使用预设。";

  const lookupBlock = lookupStyle.name
    ? [
        `联网参考人物: ${lookupStyle.name}`,
        `参考文体判断: ${poemFormGuide.referenceLabel}`,
        `人物摘要: ${lookupStyle.summary}`,
        `代表作信息: ${lookupStyle.works.map((work) => `${work.title}${work.summary ? `(${work.summary})` : work.description ? `(${work.description})` : ""}`).join("；")}`,
      ].join("\n")
    : "未启用联网参考。";

  const result = await callChatJson({
    system: [
      "你是一位多语言诗歌创作助手。",
      `当前目标诗歌语言：${poemLanguage.label}。`,
      `当前目标文体：${poemFormGuide.label}。`,
      "任务：综合诗人预设、用户上传诗词样本、当前提示词，以及可能存在的人物代表作检索结果，先做风格归纳，再写一首新作。",
      poemFormGuide.systemInstruction,
      poemLanguage.code === "zh"
        ? "要求：不要抄袭输入样本的原句；保持中文诗性和凝练度；输出必须是 JSON。"
        : `要求：不要抄袭输入样本原句；正文必须仅使用${poemLanguage.label}创作；summary 必须用中文说明风格；并额外给出逐行中文译文；输出必须是 JSON。`,
      poemLanguage.code === "zh"
        ? `JSON 字段必须为 summary, title, lines。lines 必须是字符串数组。${poemFormGuide.jsonInstruction}`
        : `JSON 字段必须为 summary, title, lines, translationLines。lines 和 translationLines 都必须是字符串数组，并尽量逐行对应。${poemFormGuide.jsonInstruction}`,
    ].join("\n"),
    messages: [
      {
        role: "user",
        content: [
          `预设词人: ${preset.name || "未指定"}`,
          `预设描述: ${preset.description || ""}`,
          `预设语气: ${preset.tone || ""}`,
          `预设意象: ${(preset.imagery || []).join("、")}`,
          `目标输出语言: ${poemLanguage.label}`,
          `目标输出文体: ${poemFormGuide.label}`,
          `生成要求: ${prompt}`,
          lookupBlock,
          `样本文本:\n${sampleBlock}`,
          poemFormGuide.userInstruction,
        ].join("\n\n"),
      },
    ],
    temperature: 0.95,
  });

  const safeLines = normalizeStringList(result.lines).slice(0, poemFormGuide.maxLines);
  const translationLines = poemLanguage.code === "zh" ? [] : normalizeStringList(result.translationLines).slice(0, 8);

  sendJson(response, 200, {
    summary: `${result.summary || "模型已完成诗风学习。"}${lookupStyle.name ? ` 本次额外参考了 ${lookupStyle.name} 的代表作。` : ""} 本次按${poemFormGuide.label}创作。`,
    title: result.title || "新作",
    lines: safeLines,
    translationLines,
    language: poemLanguage.code,
    poemForm,
    poemFormLabel: poemFormGuide.label,
  });
}

function normalizePoemLanguage(language) {
  const code = String(language || "zh").trim().toLowerCase();
  switch (code) {
    case "en":
      return { code: "en", label: "英文" };
    case "fr":
      return { code: "fr", label: "法文" };
    case "ja":
      return { code: "ja", label: "日文" };
    default:
      return { code: "zh", label: "中文" };
  }
}

async function callChatJson({ system, messages, temperature }) {
  const endpoint = joinUrl(TEXT_BASE_URL, TEXT_ENDPOINT_PATH);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TEXT_API_KEY}`,
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
      temperature,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });

  const payload = await readApiPayload(response);
  if (!response.ok) {
    throw new Error(extractApiErrorMessage(payload, "文本模型调用失败"));
  }

  const content = payload.choices?.[0]?.message?.content;
  return parseJsonContent(content);
}

async function callImageGeneration(prompt) {
  if (IMAGE_PROVIDER === "bailian") {
    return callBailianImageGeneration(prompt);
  }

  const endpoint = joinUrl(IMAGE_BASE_URL, IMAGE_ENDPOINT_PATH);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${IMAGE_API_KEY}`,
    },
    body: JSON.stringify(buildImageRequestBody(prompt)),
  });

  const payload = await readApiPayload(response);
  if (!response.ok) {
    throw new Error(extractApiErrorMessage(payload, "图片模型调用失败"));
  }

  const item = payload.data?.[0] || payload.images?.[0] || payload.output?.images?.[0];
  if (item?.b64_json) {
    return {
      imageDataUrl: `data:image/png;base64,${item.b64_json}`,
      mimeType: "image/png",
    };
  }

  if (item?.image_base64) {
    return {
      imageDataUrl: `data:image/png;base64,${item.image_base64}`,
      mimeType: "image/png",
    };
  }

  if (item?.url) {
    const converted = await fetchBinaryAsDataUrl(item.url);
    return {
      imageDataUrl: converted.dataUrl,
      mimeType: converted.mimeType,
    };
  }

  throw new Error("图片模型未返回可用图像数据");
}

async function callBailianImageGeneration(prompt) {
  const endpoint = joinUrl(IMAGE_BASE_URL, IMAGE_ENDPOINT_PATH);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-DashScope-Async": "enable",
      Authorization: `Bearer ${IMAGE_API_KEY}`,
    },
    body: JSON.stringify(buildImageRequestBody(prompt)),
  });

  const payload = await readApiPayload(response);
  if (!response.ok) {
    throw new Error(extractApiErrorMessage(payload, "图片模型调用失败"));
  }

  const taskId = payload.output?.task_id;
  if (!taskId) {
    throw new Error("百炼图片任务未返回 task_id。");
  }

  return pollBailianImageTask(taskId);
}

async function pollBailianImageTask(taskId) {
  const taskUrl = joinUrl(IMAGE_BASE_URL, `/api/v1/tasks/${taskId}`);

  for (let attempt = 0; attempt < BAILIAN_IMAGE_MAX_POLLS; attempt += 1) {
    const response = await fetch(taskUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${IMAGE_API_KEY}`,
      },
    });

    const payload = await readApiPayload(response);
    if (!response.ok) {
      throw new Error(extractApiErrorMessage(payload, "百炼图片任务查询失败"));
    }

    const status = String(payload.output?.task_status || "").toUpperCase();
    if (status === "SUCCEEDED") {
      const item = payload.output?.results?.[0];
      if (item?.url) {
        const converted = await fetchBinaryAsDataUrl(item.url);
        return {
          imageDataUrl: converted.dataUrl,
          mimeType: converted.mimeType,
        };
      }
      throw new Error("百炼图片任务成功，但未返回图片地址。");
    }

    if (status === "FAILED" || status === "CANCELED") {
      throw new Error(extractApiErrorMessage(payload, "百炼图片任务执行失败"));
    }

    await delay(BAILIAN_IMAGE_POLL_INTERVAL_MS);
  }

  throw new Error("百炼图片任务超时，请稍后重试。");
}

function buildImageRequestBody(prompt) {
  if (IMAGE_PROVIDER === "bailian") {
    return {
      model: IMAGE_MODEL,
      input: {
        prompt,
      },
      parameters: {
        size: "1024*1024",
        n: 1,
      },
    };
  }

  const body = {
    model: IMAGE_MODEL,
    prompt,
  };

  if (IMAGE_PROVIDER === "siliconflow") {
    body.size = "1024x1024";
    body.response_format = "b64_json";
    return body;
  }

  body.size = "1536x1024";
  body.quality = "high";
  body.response_format = "b64_json";
  return body;
}

async function readApiPayload(response) {
  const rawText = await response.text();
  if (!rawText) {
    return {};
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return { rawText };
  }
}

function extractApiErrorMessage(payload, fallbackMessage) {
  const rawMessage = String(payload?.error?.message || payload?.message || payload?.msg || payload?.rawText || fallbackMessage || "").trim();
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes("account balance is insufficient") || normalized.includes("insufficient balance")) {
    return "图片模型供应商账户余额不足，请充值当前供应商或切换到可用的图片供应商。";
  }

  if (normalized.includes("model disabled")) {
    return "当前图片模型已被供应商禁用，请切换到可用模型。";
  }

  if (normalized.includes("invalid api-key")) {
    return "当前供应商的 API Key 无效，请检查 .env 中对应的密钥配置。";
  }

  if (normalized.includes("does not support synchronous calls")) {
    return "当前百炼账号不支持同步图片调用，需改用异步任务接口。";
  }

  return rawMessage || fallbackMessage;
}

async function searchWikidataCandidates(name, kind) {
  const candidates = [];
  for (const language of ["zh", "en"]) {
    const url = new URL("https://www.wikidata.org/w/api.php");
    url.searchParams.set("action", "wbsearchentities");
    url.searchParams.set("format", "json");
    url.searchParams.set("language", language);
    url.searchParams.set("uselang", "zh");
    url.searchParams.set("type", "item");
    url.searchParams.set("limit", "6");
    url.searchParams.set("search", name);
    const result = await fetchJson(url.toString());
    for (const item of result.search || []) {
      candidates.push(item);
    }
  }

  if (!candidates.length) {
    throw new Error("未找到对应人物，请尝试更完整的姓名。");
  }

  return candidates
    .map((item) => ({ item, score: scoreCandidate(item, kind) }))
    .sort((left, right) => right.score - left.score)
    .map(({ item }) => ({
      id: item.id,
      name: item.label || item.display?.label?.value || "未命名",
      description: item.description || "",
      matchedKind: detectLookupKind(item.description || "", item.label || item.display?.label?.value || "") || kind,
    }))
    .filter((candidate, index, array) => candidate.id && array.findIndex((item) => item.id === candidate.id) === index)
    .slice(0, 8);
}

function buildLocalLookupPayload(name, kind, entityId) {
  const entries = searchLocalStyleEntries(name, kind);
  const selectedEntry = entries.find((entry) => entry.id === entityId) || entries[0];
  if (!selectedEntry) {
    return null;
  }

  const poemForm = selectedEntry.lookupKind === "poem"
    ? detectPoemForm(selectedEntry.description, selectedEntry.summary, ...(selectedEntry.works || []).map((work) => `${work.title} ${work.description} ${work.summary}`))
    : "";

  return {
    candidates: entries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      description: entry.description,
      matchedKind: entry.lookupKind,
      poemForm: entry.lookupKind === "poem" ? detectPoemForm(entry.description, entry.summary, ...(entry.works || []).map((work) => `${work.title} ${work.description} ${work.summary}`)) : "",
    })),
    selected: {
      id: selectedEntry.id,
      kind: selectedEntry.lookupKind,
      matchedKind: selectedEntry.lookupKind,
      poemForm,
      name: selectedEntry.name,
      description: selectedEntry.description,
      summary: selectedEntry.summary,
      sourceUrl: selectedEntry.sourceUrl || "",
      works: (selectedEntry.works || []).slice(0, 6).map((work) => ({
        id: work.id,
        title: work.title,
        description: work.description || "",
        summary: work.summary || "",
        imageUrl: selectedEntry.lookupKind === "image" ? work.imageUrl || "" : "",
        sourceUrl: work.sourceUrl || "",
      })),
      styleSummary: buildLocalLookupStyleSummary(selectedEntry.lookupKind, selectedEntry),
    },
  };
}

function searchLocalStyleCandidates(name, kind) {
  return searchLocalStyleEntries(name, kind).map((entry) => ({
    id: entry.id,
    name: entry.name,
    description: entry.description,
  }));
}

function searchLocalStyleEntries(name, kind) {
  const normalizedName = normalizeLookupToken(name);
  if (!normalizedName) {
    return [];
  }

  const preferredKinds = kind === "image" ? ["image", "poem"] : ["poem", "image"];

  return preferredKinds
    .flatMap((searchKind, kindIndex) =>
      (LOCAL_STYLE_LOOKUP_INDEX[searchKind] || []).map((entry) => ({
        entry: { ...entry, lookupKind: searchKind },
        score: scoreLocalLookupEntry(entry, normalizedName) - kindIndex,
      }))
    )
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .map(({ entry }) => entry)
    .filter((entry, index, array) => array.findIndex((item) => item.id === entry.id) === index)
    .slice(0, 8);
}

function scoreLocalLookupEntry(entry, normalizedName) {
  const tokens = [entry.name, ...(entry.aliases || [])].map(normalizeLookupToken).filter(Boolean);
  if (tokens.some((token) => token === normalizedName)) {
    return 100;
  }
  if (tokens.some((token) => token.startsWith(normalizedName) || normalizedName.startsWith(token))) {
    return 70;
  }
  if (tokens.some((token) => token.includes(normalizedName) || normalizedName.includes(token))) {
    return 40;
  }
  return 0;
}

function normalizeLookupToken(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\s·・'"“”‘’`´,，。.!！?？:：;；()（）\-_/]+/g, "");
}

function buildLocalLookupStyleSummary(kind, entry) {
  const workTitles = (entry.works || []).slice(0, 5).map((work) => work.title).join("、");
  if (kind === "image") {
    return `${entry.name} 的人物摘要为：${entry.summary}。代表作包括 ${workTitles || "若干作品"}。可据此归纳色彩、笔触、题材与构图倾向。`;
  }
  return `${entry.name} 的人物摘要为：${entry.summary}。代表作包括 ${workTitles || "若干作品"}。可据此归纳意象、语气、节奏与句法姿态。`;
}

function formatStyleLookupError(error) {
  const message = String(error?.message || "").trim();
  if (/联网检索超时|fetch failed|connect timeout|request to .* failed|请求外部资料失败/i.test(message)) {
    return "联网百科暂时不可用，且本地兜底资料中未找到对应人物。请稍后重试或尝试更完整的姓名。";
  }
  return message || "联网检索失败，请稍后重试。";
}

async function getWikidataEntityById(entityId) {
  const entities = await getWikidataEntities([entityId]);
  const rawEntity = entities[entityId];
  if (!rawEntity) {
    throw new Error("人物资料抓取失败，请稍后重试。");
  }

  return normalizeEntity(rawEntity);
}

function scoreCandidate(item, kind) {
  const description = `${item.label || ""} ${item.description || ""}`.toLowerCase();
  const terms = [...LOOKUP_IMAGE_TERMS, ...LOOKUP_POEM_TERMS];
  const kindBoostTerms = kind === "image" ? LOOKUP_IMAGE_TERMS : LOOKUP_POEM_TERMS;
  return (
    terms.reduce((score, term) => score + (description.includes(term) ? 2 : 0), 0) +
    kindBoostTerms.reduce((score, term) => score + (description.includes(term) ? 1 : 0), 0) +
    (item.match?.text ? 1 : 0)
  );
}

function detectLookupKind(...texts) {
  const haystack = texts.filter(Boolean).join(" ").toLowerCase();
  if (!haystack) {
    return "";
  }

  const imageScore = LOOKUP_IMAGE_TERMS.reduce((score, term) => score + (haystack.includes(term) ? 2 : 0), 0);
  const poemScore = LOOKUP_POEM_TERMS.reduce((score, term) => score + (haystack.includes(term) ? 2 : 0), 0);
  if (imageScore === poemScore) {
    return "";
  }
  return imageScore > poemScore ? "image" : "poem";
}

async function getWikidataEntities(ids) {
  if (!ids.length) {
    return {};
  }

  const url = new URL("https://www.wikidata.org/w/api.php");
  url.searchParams.set("action", "wbgetentities");
  url.searchParams.set("format", "json");
  url.searchParams.set("languages", "zh|en");
  url.searchParams.set("props", "labels|descriptions|claims|sitelinks");
  url.searchParams.set("ids", ids.join("|"));
  const result = await fetchJson(url.toString());
  return result.entities || {};
}

function normalizeEntity(rawEntity) {
  return {
    id: rawEntity.id,
    label: pickLanguageValue(rawEntity.labels),
    description: pickLanguageValue(rawEntity.descriptions),
    claims: rawEntity.claims || {},
    sitelinks: rawEntity.sitelinks || {},
  };
}

function pickLanguageValue(dictionary) {
  if (!dictionary) {
    return "";
  }
  return dictionary.zh?.value || dictionary.en?.value || Object.values(dictionary)[0]?.value || "";
}

async function fetchEntitySummary(entity) {
  const site = entity.sitelinks.zhwiki?.title
    ? { lang: "zh", title: entity.sitelinks.zhwiki.title }
    : entity.sitelinks.enwiki?.title
      ? { lang: "en", title: entity.sitelinks.enwiki.title }
      : null;

  if (!site) {
    return {};
  }

  const url = `https://${site.lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(site.title)}`;
  const result = await fetchJson(url, { allow404: true });
  return {
    extract: String(result.extract || ""),
    pageUrl: result.content_urls?.desktop?.page || "",
    thumbnail: result.thumbnail?.source || "",
  };
}

async function resolveNotableWorks(entity, kind, baseSummary) {
  const notableIds = getEntityClaimIds(entity.claims, "P800").slice(0, 6);
  if (notableIds.length) {
    const workEntities = await getWikidataEntities(notableIds);
    const normalizedWorks = Object.values(workEntities).map(normalizeEntity);
    const workItems = await Promise.all(
      normalizedWorks.map(async (workEntity) => {
        const workSummary = await fetchEntitySummary(workEntity);
        const fileName = getStringClaimValue(workEntity.claims, "P18");
        return {
          id: workEntity.id,
          title: workEntity.label,
          description: workEntity.description || "",
          summary: workSummary.extract || "",
          imageUrl: kind === "image" ? workSummary.thumbnail || buildCommonsFileUrl(fileName) : "",
          sourceUrl: workSummary.pageUrl || "",
        };
      })
    );

    return workItems.filter((item) => item.title);
  }

  const titles = extractBracketTitles(baseSummary.extract || "").slice(0, 6);
  return titles.map((title, index) => ({
    id: `fallback-${index + 1}`,
    title,
    description: "来自百科摘要提取",
    summary: "",
    imageUrl: "",
    sourceUrl: baseSummary.pageUrl || "",
  }));
}

function buildLookupStyleSummary(kind, entity, summary, works) {
  const workTitles = works.slice(0, 5).map((work) => work.title).join("、");
  if (kind === "image") {
    return `${entity.label} 的人物摘要为：${summary.extract || entity.description || ""}。代表作包括 ${workTitles || "若干作品"}。可据此归纳色彩、笔触、题材与构图倾向。`;
  }
  return `${entity.label} 的人物摘要为：${summary.extract || entity.description || ""}。代表作包括 ${workTitles || "若干作品"}。可据此归纳意象、语气、节奏与句法姿态。`;
}

function normalizeLookupStyle(lookupStyle, kind) {
  if (!lookupStyle || typeof lookupStyle !== "object") {
    return { kind, name: "", description: "", summary: "", poemForm: "", works: [] };
  }

  return {
    kind,
    name: String(lookupStyle.name || "").slice(0, 120),
    description: String(lookupStyle.description || "").slice(0, 500),
    summary: String(lookupStyle.summary || lookupStyle.styleSummary || "").slice(0, 3000),
    poemForm: normalizePoemForm(lookupStyle.poemForm || lookupStyle.literaryForm || ""),
    works: Array.isArray(lookupStyle.works)
      ? lookupStyle.works.slice(0, 6).map((work) => ({
          title: String(work.title || "").slice(0, 120),
          description: String(work.description || "").slice(0, 400),
          summary: String(work.summary || "").slice(0, 1000),
          imageUrl: kind === "image" ? String(work.imageUrl || "") : "",
        }))
      : [],
  };
}

function normalizePoemForm(value) {
  switch (String(value || "").trim().toLowerCase()) {
    case "ci":
      return "ci";
    case "haiku":
      return "haiku";
    default:
      return "poem";
  }
}

function detectPoemForm(...texts) {
  const haystack = texts.filter(Boolean).join(" ").toLowerCase();
  if (!haystack) {
    return "poem";
  }

  if (["俳句", "俳人", "haiku", "hokku"].some((term) => haystack.includes(term))) {
    return "haiku";
  }

  if (["词人", "宋词", "词作", "词牌", "慢词", "小令", "长短句"].some((term) => haystack.includes(term))) {
    return "ci";
  }

  return "poem";
}

function getPoemFormGuide(form, poemLanguage) {
  if (form === "ci") {
    return {
      label: poemLanguage.code === "zh" ? "词" : `${poemLanguage.label}抒情长短句`,
      referenceLabel: "词人 / 词体",
      maxLines: poemLanguage.code === "zh" ? 12 : 10,
      systemInstruction:
        poemLanguage.code === "zh"
          ? "若检索人物被判定为词人，正文必须按词体创作，允许长短句，强调乐感、铺叙、转折与情绪回环。"
          : `若检索人物被判定为词人，请用${poemLanguage.label}写出具有抒情长短句气质的作品，不要退化成说明文。`,
      jsonInstruction:
        poemLanguage.code === "zh"
          ? "title 应是词牌名或词题；lines 应为 6 到 12 行，允许长短句，不要平均分行。"
          : `title 应贴近词题；lines 应为 6 到 10 行${poemLanguage.label}正文，保持抒情长短句节奏。`,
      userInstruction:
        poemLanguage.code === "zh"
          ? "请返回 JSON：summary 说明你学到的风格；title 是词牌名或词题；lines 是 6 到 12 行中文正文，允许长短句，整体写成一首词。"
          : `请返回 JSON：summary 用中文说明你学到的风格；title 是${poemLanguage.label}标题；lines 是 6 到 10 行${poemLanguage.label}正文，呈抒情长短句结构；translationLines 是与正文对应的中文译文。`,
    };
  }

  if (form === "haiku") {
    return {
      label: poemLanguage.code === "ja" ? "俳句" : `${poemLanguage.label}短诗`,
      referenceLabel: "俳人 / 俳句",
      maxLines: 3,
      systemInstruction: "若检索人物被判定为俳人，正文应高度凝练，聚焦单一瞬间与意象转折，写成三行短诗。",
      jsonInstruction: "title 保持简短；lines 必须恰好 3 行，避免扩写成普通长诗。",
      userInstruction:
        poemLanguage.code === "zh"
          ? "请返回 JSON：summary 说明你学到的风格；title 是标题；lines 是恰好 3 行正文，整体写成俳句气质的短诗。"
          : `请返回 JSON：summary 用中文说明你学到的风格；title 是${poemLanguage.label}标题；lines 是恰好 3 行${poemLanguage.label}正文；translationLines 是与正文对应的中文译文。`,
    };
  }

  return {
    label: poemLanguage.code === "zh" ? "诗" : `${poemLanguage.label}诗歌`,
    referenceLabel: "诗人 / 诗体",
    maxLines: 8,
    systemInstruction: "若检索人物被判定为诗人，正文按诗体创作，保持意象、节奏与句法的诗性。",
    jsonInstruction:
      poemLanguage.code === "zh"
        ? "title 为标题；lines 应为 4 到 8 行正文。"
        : `title 为${poemLanguage.label}标题；lines 应为 4 到 8 行${poemLanguage.label}正文。`,
    userInstruction:
      poemLanguage.code === "zh"
        ? "请返回 JSON：summary 说明你学到的风格；title 是标题；lines 是 4 到 8 行正文，整体写成一首诗。"
        : `请返回 JSON：summary 用中文说明你学到的风格；title 是${poemLanguage.label}标题；lines 是 4 到 8 行${poemLanguage.label}正文；translationLines 是与正文对应的中文译文。`,
  };
}

function getEntityClaimIds(claims, propertyId) {
  return (claims[propertyId] || [])
    .map((claim) => claim.mainsnak?.datavalue?.value?.id)
    .filter(Boolean);
}

function getStringClaimValue(claims, propertyId) {
  return (claims[propertyId] || [])[0]?.mainsnak?.datavalue?.value || "";
}

function extractBracketTitles(text) {
  return [...text.matchAll(/《([^》]{1,40})》/g)].map((match) => match[1]);
}

function buildCommonsFileUrl(fileName) {
  if (!fileName) {
    return "";
  }
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
}

async function fetchJson(url, { allow404 = false } = {}) {
  return getCachedValue(
    externalJsonCache,
    `${allow404 ? "allow404" : "strict"}:${url}`,
    async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "danqing-style-verse/1.0" } });
        if (allow404 && response.status === 404) {
          return {};
        }
        if (!response.ok) {
          throw new Error(`请求外部资料失败: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        if (error.name === "AbortError") {
          throw new Error("联网检索超时，请稍后重试。");
        }
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    },
    LOOKUP_CACHE_TTL_MS,
    LOOKUP_CACHE_MAX_ENTRIES
  );
}

function buildStyleLookupCacheKey(kind, name, entityId) {
  return [kind, name.toLowerCase(), entityId || "default"].join(":");
}

async function getCachedValue(store, key, loader, ttlMs, maxEntries) {
  const now = Date.now();
  const current = store.get(key);
  if (current && current.expiresAt > now && Object.prototype.hasOwnProperty.call(current, "value")) {
    return current.value;
  }
  if (current?.promise) {
    return current.promise;
  }

  const promise = loader()
    .then((value) => {
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
      pruneCacheStore(store, maxEntries);
      return value;
    })
    .catch((error) => {
      if (store.get(key)?.promise === promise) {
        store.delete(key);
      }
      throw error;
    });

  store.set(key, { promise, expiresAt: now + ttlMs });
  return promise;
}

function pruneCacheStore(store, maxEntries) {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (!entry.promise && entry.expiresAt <= now) {
      store.delete(key);
    }
  }

  while (store.size > maxEntries) {
    const oldestKey = store.keys().next().value;
    if (!oldestKey) {
      break;
    }
    store.delete(oldestKey);
  }
}

async function fetchBinaryAsDataUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "danqing-style-verse/1.0" } });
    if (!response.ok) {
      throw new Error("远程图片下载失败");
    }
    const mimeType = response.headers.get("content-type") || "image/png";
    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      dataUrl: `data:${mimeType};base64,${buffer.toString("base64")}`,
      mimeType,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("图片下载超时");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function serveStatic(pathname, response) {
  const safePath = pathname === "/" ? "index.html" : pathname.replace(/^\//, "");
  const filePath = path.join(__dirname, safePath);

  if (!filePath.startsWith(__dirname)) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }

  if (!existsSync(filePath)) {
    sendJson(response, 404, { error: "Not found" });
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";
  const file = await readFile(filePath);
  response.writeHead(200, { "Content-Type": contentType });
  response.end(file);
}

function ensureConfigured(mode) {
  if (!TEXT_API_KEY) {
    throw new Error("未检测到文本模型密钥，请在 .env 中填写 TEXT_API_KEY，或填写所选供应商对应的密钥。 ");
  }
  if (!TEXT_BASE_URL || !TEXT_MODEL) {
    throw new Error("文本模型配置不完整，请检查 TEXT_BASE_URL 与 TEXT_MODEL。");
  }
  if (mode === "image") {
    if (!IMAGE_API_KEY) {
      throw new Error("未检测到图片模型密钥，请在 .env 中填写 IMAGE_API_KEY，或填写所选供应商对应的密钥。");
    }
    if (!IMAGE_BASE_URL || !IMAGE_MODEL) {
      throw new Error("图片模型配置不完整，请检查 IMAGE_BASE_URL 与 IMAGE_MODEL。");
    }
  }
}

function inferLegacyProvider(defaultProvider = "deepseek") {
  if (LEGACY_OPENAI_BASE_URL) {
    return "custom";
  }
  return defaultProvider;
}

function normalizeProviderName(providerName) {
  const normalized = String(providerName || "").trim().toLowerCase();
  return PROVIDER_PRESETS[normalized] ? normalized : "custom";
}

function resolveProviderApiKey(providerName) {
  switch (providerName) {
    case "deepseek":
      return process.env.DEEPSEEK_API_KEY || "";
    case "siliconflow":
      return process.env.SILICONFLOW_API_KEY || "";
    case "bailian":
      return process.env.BAILIAN_API_KEY || "";
    default:
      return "";
  }
}

function resolveProviderBaseUrl(kind, providerName, overrideUrl, legacyUrl) {
  if (overrideUrl) {
    return trimTrailingSlash(overrideUrl);
  }
  if (legacyUrl) {
    return legacyUrl;
  }

  const preset = PROVIDER_PRESETS[providerName] || {};
  const preferredUrl = kind === "image" ? preset.imageBaseUrl || preset.textBaseUrl : preset.textBaseUrl || preset.imageBaseUrl;
  return trimTrailingSlash(preferredUrl || "");
}

function getDefaultModel(kind, providerName, fallbackModel) {
  const preset = PROVIDER_PRESETS[providerName] || {};
  return kind === "image" ? preset.defaultImageModel || fallbackModel : preset.defaultTextModel || fallbackModel;
}

function normalizeEndpointPath(endpointPath) {
  const normalized = String(endpointPath || "").trim();
  if (!normalized) {
    return "";
  }
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

function trimTrailingSlash(url) {
  return String(url || "").trim().replace(/\/$/, "");
}

function joinUrl(baseUrl, endpointPath) {
  return `${trimTrailingSlash(baseUrl)}${normalizeEndpointPath(endpointPath)}`;
}

function getProviderLabel(providerName) {
  return PROVIDER_PRESETS[providerName]?.label || "Custom";
}

function buildHealthMessage(textReady, imageReady) {
  const parts = [];
  if (!textReady) {
    parts.push("文本模型未配置完成，请检查 TEXT_PROVIDER、TEXT_MODEL 和对应密钥。 ");
  }
  if (!imageReady) {
    parts.push("图片模型未配置完成，请检查 IMAGE_PROVIDER、IMAGE_MODEL 和对应密钥。 ");
  }
  return parts.join("").trim();
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 25 * 1024 * 1024) {
        reject(new Error("请求体过大，请减少上传文件数量或尺寸。"));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("请求体不是合法 JSON。"));
      }
    });
    request.on("error", reject);
  });
}

function parseJsonContent(content) {
  if (typeof content === "string") {
    return JSON.parse(stripCodeFence(content));
  }

  if (Array.isArray(content)) {
    const text = content
      .map((item) => item.text || item.content || "")
      .join("")
      .trim();
    return JSON.parse(stripCodeFence(text));
  }

  throw new Error("模型未返回可解析 JSON");
}

function normalizeVisualStyleProfile(profile) {
  const source = profile && typeof profile === "object" ? profile : {};
  return {
    styleSummary: String(source.styleSummary || "").trim(),
    visualKeywords: normalizeStringList(source.visualKeywords),
    colorPalette: normalizeStringList(source.colorPalette),
    composition: normalizeStringList(source.composition),
    brushwork: normalizeStringList(source.brushwork),
    mood: String(source.mood || "").trim(),
  };
}

function normalizeStringList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[\n,，、;；|]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (value == null) {
    return [];
  }

  return [String(value).trim()].filter(Boolean);
}

function stripCodeFence(value) {
  return value.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

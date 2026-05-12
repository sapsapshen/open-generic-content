const STORAGE_KEYS = {
  imageTemplates: "danqing-image-templates-v1",
  poemTemplates: "danqing-poem-templates-v1",
  imageHistory: "danqing-image-history-v1",
  poemHistory: "danqing-poem-history-v1",
};

const imagePresets = [
  {
    id: "vangogh",
    name: "梵高",
    description: "高饱和蓝金色、旋涡式节奏、强烈运动感",
    palette: ["#163d63", "#f2b441", "#2d6fa3", "#8b4b1f", "#f7e4a5"],
    mood: "奔涌",
    keywords: ["post-impressionist", "impasto", "swirling sky", "bold strokes"],
  },
  {
    id: "monet",
    name: "莫奈",
    description: "雾感光晕、柔和色阶、水汽般的边缘",
    palette: ["#8fb9d4", "#d8c9b7", "#b7d7c1", "#e7d8f2", "#e9ede2"],
    mood: "朦胧",
    keywords: ["impressionist", "soft bloom", "misty light", "broken color"],
  },
  {
    id: "hokusai",
    name: "葛饰北斋",
    description: "靛蓝巨浪、清晰轮廓、强烈留白与张力",
    palette: ["#133d62", "#e7eef4", "#6ca7d0", "#f0d6a2", "#1f232c"],
    mood: "凌厉",
    keywords: ["ukiyo-e", "woodblock print", "graphic wave", "crisp contour"],
  },
  {
    id: "kandinsky",
    name: "康定斯基",
    description: "抽象几何、强对比色块、节奏性构成",
    palette: ["#f2c94c", "#2f80ed", "#eb5757", "#1b1b1d", "#f7f6f2"],
    mood: "跳跃",
    keywords: ["abstract", "geometric", "rhythmic composition", "high contrast"],
  },
  {
    id: "qibaishi",
    name: "齐白石",
    description: "水墨留白、虾蟹花鸟、笔致简劲而鲜活",
    palette: ["#1f1f1d", "#f2ece1", "#d84c33", "#54633d", "#b2996d"],
    mood: "生动",
    keywords: ["ink wash", "calligraphic brush", "negative space", "flower and bird"],
  },
  {
    id: "miyazaki",
    name: "宫崎骏",
    description: "手绘动画暖光、风与飞行感、童话与自然并置",
    palette: ["#89b6d6", "#f2d9a0", "#7aa16a", "#d97d54", "#f7f2e7"],
    mood: "澄澈",
    keywords: ["hand-painted animation", "pastoral fantasy", "wind motion", "gentle wonder"],
  },
  {
    id: "shinkai",
    name: "新海诚",
    description: "高透明天光、电影感云层、都市与青春的光影交错",
    palette: ["#4f8fd8", "#d96459", "#f7b267", "#dfe9f6", "#1f365c"],
    mood: "澄明",
    keywords: ["cinematic anime", "luminous sky", "urban twilight", "emotional light"],
  },
  {
    id: "satoshikon",
    name: "今敏",
    description: "现实与梦境交叠、心理张力强、色彩冷暖骤变",
    palette: ["#28344a", "#d94841", "#f0c36c", "#8ba6bf", "#f5efe6"],
    mood: "迷离",
    keywords: ["psychological anime", "dreamlike montage", "urban surrealism", "sharp contrast"],
  },
  {
    id: "popart",
    name: "波普艺术",
    description: "高纯度撞色、网点印刷感、消费符号与漫画式轮廓",
    palette: ["#ff3158", "#ffd400", "#0f62fe", "#111111", "#fff7ef"],
    mood: "张扬",
    keywords: ["pop art", "halftone dots", "commercial iconography", "bold contour"],
  },
  {
    id: "artdeco",
    name: "装饰艺术",
    description: "几何对称、金属质感、海报式秩序与都市优雅",
    palette: ["#0e2238", "#c9a063", "#f0e2c3", "#49708a", "#1f1a17"],
    mood: "华丽",
    keywords: ["art deco", "geometric symmetry", "poster elegance", "metallic glamour"],
  },
];

const poetPresets = [
  {
    id: "libai",
    name: "李白",
    description: "清奇纵横，月、酒、山川意象强，气势开阔",
    corpus: [
      "床前明月光，疑是地上霜。举头望明月，低头思故乡。",
      "君不见黄河之水天上来，奔流到海不复回。",
      "兰陵美酒郁金香，玉碗盛来琥珀光。",
    ],
    tone: "豪放",
    imagery: ["明月", "青天", "长风", "黄河", "孤舟", "美酒", "远山"],
    language: "zh",
    languageLabel: "中文",
    lineUnit: "字",
    defaultLineLength: 7,
  },
  {
    id: "dufu",
    name: "杜甫",
    description: "沉郁顿挫，家国、时事、江水秋风意象更重",
    corpus: [
      "无边落木萧萧下，不尽长江滚滚来。",
      "国破山河在，城春草木深。",
      "细雨鱼儿出，微风燕子斜。",
    ],
    tone: "沉郁",
    imagery: ["秋风", "长江", "故园", "孤城", "战尘", "江村", "落木"],
    language: "zh",
    languageLabel: "中文",
    lineUnit: "字",
    defaultLineLength: 7,
  },
  {
    id: "sushi",
    name: "苏轼",
    description: "旷达高远，江月、清风、人生况味并存",
    corpus: [
      "大江东去，浪淘尽，千古风流人物。",
      "但愿人长久，千里共婵娟。",
      "竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。",
    ],
    tone: "旷达",
    imagery: ["江月", "清风", "烟雨", "赤壁", "归舟", "长空", "人间"],
    language: "zh",
    languageLabel: "中文",
    lineUnit: "字",
    defaultLineLength: 7,
  },
  {
    id: "liqingzhao",
    name: "李清照",
    description: "清婉含愁，花、雨、帘、黄昏与细微心绪繁富",
    corpus: [
      "莫道不销魂，帘卷西风，人比黄花瘦。",
      "知否，知否？应是绿肥红瘦。",
      "寻寻觅觅，冷冷清清，凄凄惨惨戚戚。",
    ],
    tone: "清婉",
    imagery: ["黄花", "帘影", "春雨", "晚风", "归雁", "残酒", "梧桐"],
    language: "zh",
    languageLabel: "中文",
    lineUnit: "字",
    defaultLineLength: 7,
  },
  {
    id: "xinqiji",
    name: "辛弃疾",
    description: "激越豪迈，剑、灯、沙场、山河与壮志并行",
    corpus: [
      "醉里挑灯看剑，梦回吹角连营。",
      "想当年，金戈铁马，气吞万里如虎。",
      "众里寻他千百度，蓦然回首，那人却在灯火阑珊处。",
    ],
    tone: "激昂",
    imagery: ["长剑", "烽火", "大漠", "孤城", "山河", "灯火", "长啸"],
    language: "zh",
    languageLabel: "中文",
    lineUnit: "字",
    defaultLineLength: 7,
  },
  {
    id: "dickinson",
    name: "Emily Dickinson",
    description: "内省凝缩、自然与灵魂并读、短线条里有陡峭转折",
    corpus: [
      "Because I could not stop for Death – He kindly stopped for me –",
      "A Bird came down the Walk – He did not know I saw –",
      "Hope is the thing with feathers that perches in the soul.",
    ],
    tone: "内省",
    imagery: ["bird", "soul", "dew", "garden", "death", "light", "silence"],
    language: "en",
    languageLabel: "英文",
    lineUnit: "词",
    defaultLineLength: 6,
  },
  {
    id: "yeats",
    name: "W. B. Yeats",
    description: "神话与暮色交织，旋律感强，象征意味浓厚",
    corpus: [
      "I will arise and go now, and go to Innisfree,",
      "Tread softly because you tread on my dreams.",
      "The silver apples of the moon, the golden apples of the sun.",
    ],
    tone: "象征",
    imagery: ["moon", "lake", "twilight", "dream", "island", "swan", "rose"],
    language: "en",
    languageLabel: "英文",
    lineUnit: "词",
    defaultLineLength: 7,
  },
  {
    id: "baudelaire",
    name: "Charles Baudelaire",
    description: "都市感官、颓艳与高贵并存，香气与阴影互文",
    corpus: [
      "Là, tout n'est qu'ordre et beauté, luxe, calme et volupté.",
      "Tu m'as donné ta boue et j'en ai fait de l'or.",
      "La musique souvent me prend comme une mer !",
    ],
    tone: "颓艳",
    imagery: ["parfum", "ombre", "ville", "nuit", "or", "spleen", "mer"],
    language: "fr",
    languageLabel: "法文",
    lineUnit: "词",
    defaultLineLength: 7,
  },
  {
    id: "rimbaud",
    name: "Arthur Rimbaud",
    description: "炽烈跳跃、意象断裂又通电，青春与远行感强",
    corpus: [
      "Elle est retrouvée. Quoi ? - L'Éternité.",
      "Je est un autre.",
      "Par les soirs bleus d'été, j'irai dans les sentiers.",
    ],
    tone: "炽烈",
    imagery: ["été", "feu", "route", "étoile", "ivresse", "mer", "azur"],
    language: "fr",
    languageLabel: "法文",
    lineUnit: "词",
    defaultLineLength: 6,
  },
  {
    id: "basho",
    name: "松尾芭蕉",
    description: "俳句式凝练，寂静、旅途与自然瞬间高度统一",
    corpus: [
      "古池や 蛙飛びこむ 水の音",
      "夏草や 兵どもが 夢の跡",
      "旅に病んで 夢は枯野を かけ廻る",
    ],
    tone: "清寂",
    imagery: ["古池", "蛙", "月", "旅", "山路", "秋风", "野原"],
    language: "ja",
    languageLabel: "日文",
    lineUnit: "短句",
    defaultLineLength: 5,
  },
  {
    id: "yosano",
    name: "与谢野晶子",
    description: "炽热直白，花与身体意象鲜明，情感带电",
    corpus: [
      "やは肌の あつき血汐に ふれも見で さびしからずや 道を説く君",
      "清水へ 祇園をよぎる 桜月夜 こよひ逢ふ人 みなうつくしき",
      "金色の ちひさき鳥の かたちして 銀杏ちるなり 夕日の岡に",
    ],
    tone: "炽热",
    imagery: ["桜", "月夜", "血潮", "夕日", "金色", "恋", "鸟"],
    language: "ja",
    languageLabel: "日文",
    lineUnit: "短句",
    defaultLineLength: 5,
  },
];

const poetryVocabulary = {
  spring: ["春水", "新柳", "花影", "晴川", "轻燕", "芳草", "晓烟"],
  summer: ["荷风", "蝉声", "碧波", "长夏", "南塘", "晴云", "晚照"],
  autumn: ["秋声", "落木", "霜天", "寒江", "孤鸿", "桂魄", "西风"],
  winter: ["寒雪", "梅枝", "冰轮", "夜炉", "冻云", "清霜", "孤灯"],
  river: ["江流", "归舟", "渔火", "沙汀", "潮声", "烟波", "远浦"],
  mountain: ["远山", "松风", "云岫", "石径", "空谷", "危峰", "层峦"],
  moon: ["明月", "孤月", "婵娟", "月痕", "月华", "桂影", "清辉"],
  rain: ["微雨", "疏雨", "烟雨", "春霖", "夜雨", "雨脚", "雨丝"],
  homesick: ["故园", "旧梦", "归期", "乡心", "离怀", "旧游", "远书"],
  battle: ["长剑", "铁衣", "战尘", "边声", "旌旗", "烽火", "鼓角"],
  city: ["长街", "灯火", "朱楼", "市桥", "酒肆", "玉阶", "古城"],
};

const state = {
  backend: {
    checked: false,
    ready: false,
    message: "正在检测模型服务状态...",
  },
  templates: {
    image: [],
    poem: [],
  },
  image: {
    selectedPresetId: imagePresets[0].id,
    uploadedFiles: [],
    lookupCandidates: [],
    lookup: null,
    generatedUrl: "",
    generatedMime: "image/png",
    generatedSummary: "",
    generatedPrompt: "",
    history: [],
  },
  poem: {
    selectedPresetId: poetPresets[0].id,
    uploadedFiles: [],
    uploadedTexts: [],
    uploadedProfile: null,
    lookupCandidates: [],
    lookup: null,
    generatedText: "",
    generatedTranslationLines: [],
    generatedSummary: "",
    generatedPrompt: "",
    history: [],
  },
};

const dom = {
  modeTabs: document.querySelectorAll("[data-mode-tab]"),
  modePanels: document.querySelectorAll("[data-mode-panel]"),
  outputPanels: document.querySelectorAll("[data-output-panel]"),
  imagePresets: document.getElementById("image-presets"),
  poetPresets: document.getElementById("poet-presets"),
  imageUpload: document.getElementById("image-upload"),
  poemUpload: document.getElementById("poem-upload"),
  imageUploadList: document.getElementById("image-upload-list"),
  poemUploadList: document.getElementById("poem-upload-list"),
  imageLookupName: document.getElementById("image-lookup-name"),
  poemLookupName: document.getElementById("poem-lookup-name"),
  imageLookupSearch: document.getElementById("image-lookup-search"),
  poemLookupSearch: document.getElementById("poem-lookup-search"),
  imageLookupClear: document.getElementById("image-lookup-clear"),
  poemLookupClear: document.getElementById("poem-lookup-clear"),
  imageLookupResult: document.getElementById("image-lookup-result"),
  poemLookupResult: document.getElementById("poem-lookup-result"),
  clearImageTemplates: document.getElementById("clear-image-templates"),
  clearPoemTemplates: document.getElementById("clear-poem-templates"),
  imageTemplateList: document.getElementById("image-template-list"),
  poemTemplateList: document.getElementById("poem-template-list"),
  imagePrompt: document.getElementById("image-prompt"),
  poemPrompt: document.getElementById("poem-prompt"),
  generateImage: document.getElementById("generate-image"),
  generatePoem: document.getElementById("generate-poem"),
  downloadImage: document.getElementById("download-image"),
  copyPoem: document.getElementById("copy-poem"),
  saveImageTemplate: document.getElementById("save-image-template"),
  savePoemTemplate: document.getElementById("save-poem-template"),
  imageStyleSummary: document.getElementById("image-style-summary"),
  poemStyleSummary: document.getElementById("poem-style-summary"),
  imageOutput: document.getElementById("image-output"),
  poemOutput: document.getElementById("poem-output"),
  imageInsightCard: document.getElementById("image-insight-card"),
  poemInsightCard: document.getElementById("poem-insight-card"),
  clearImageHistory: document.getElementById("clear-image-history"),
  clearPoemHistory: document.getElementById("clear-poem-history"),
  imageHistoryList: document.getElementById("image-history-list"),
  poemHistoryList: document.getElementById("poem-history-list"),
};

initialize();

function initialize() {
  hydrateState();
  bindEvents();
  renderAll();
  checkBackendStatus();
}

function hydrateState() {
  state.templates.image = readStorage(localStorage, STORAGE_KEYS.imageTemplates, []);
  state.templates.poem = readStorage(localStorage, STORAGE_KEYS.poemTemplates, []);
  state.image.history = readStorage(sessionStorage, STORAGE_KEYS.imageHistory, []);
  state.poem.history = readStorage(localStorage, STORAGE_KEYS.poemHistory, []);
}

function bindEvents() {
  dom.modeTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchMode(tab.dataset.modeTab));
  });

  dom.imageUpload.addEventListener("change", handleImageUpload);
  dom.poemUpload.addEventListener("change", handlePoemUpload);
  dom.generateImage.addEventListener("click", onGenerateImage);
  dom.generatePoem.addEventListener("click", onGeneratePoem);
  dom.downloadImage.addEventListener("click", downloadGeneratedImage);
  dom.copyPoem.addEventListener("click", copyGeneratedPoem);
  dom.saveImageTemplate.addEventListener("click", () => saveTemplate("image"));
  dom.savePoemTemplate.addEventListener("click", () => saveTemplate("poem"));
  dom.imageLookupSearch.addEventListener("click", () => lookupStyle("image"));
  dom.poemLookupSearch.addEventListener("click", () => lookupStyle("poem"));
  dom.imageLookupClear.addEventListener("click", () => clearLookup("image"));
  dom.poemLookupClear.addEventListener("click", () => clearLookup("poem"));
  dom.clearImageTemplates.addEventListener("click", () => clearTemplates("image"));
  dom.clearPoemTemplates.addEventListener("click", () => clearTemplates("poem"));
  dom.clearImageHistory.addEventListener("click", () => clearHistory("image"));
  dom.clearPoemHistory.addEventListener("click", () => clearHistory("poem"));
  dom.imageLookupName.addEventListener("keydown", (event) => handleLookupEnter(event, "image"));
  dom.poemLookupName.addEventListener("keydown", (event) => handleLookupEnter(event, "poem"));

  dom.imageLookupResult.addEventListener("click", handleLookupResultClick);
  dom.poemLookupResult.addEventListener("click", handleLookupResultClick);
  dom.imageTemplateList.addEventListener("click", handleTemplateListClick);
  dom.poemTemplateList.addEventListener("click", handleTemplateListClick);
  dom.imageHistoryList.addEventListener("click", handleImageHistoryClick);
  dom.poemHistoryList.addEventListener("click", handlePoemHistoryClick);
  dom.imagePresets.addEventListener("click", handlePresetClick);
  dom.poetPresets.addEventListener("click", handlePresetClick);
}

function renderAll() {
  renderPresetCards();
  renderLookupResult("image");
  renderLookupResult("poem");
  renderTemplateList("image");
  renderTemplateList("poem");
  renderImageSummary();
  renderPoemSummary();
  renderImageHistory();
  renderPoemHistory();
}

function handlePresetClick(event) {
  const imageButton = event.target.closest("[data-image-preset]");
  if (imageButton) {
    state.image.selectedPresetId = imageButton.dataset.imagePreset;
    renderPresetCards();
    renderImageSummary();
    return;
  }

  const poemButton = event.target.closest("[data-poet-preset]");
  if (poemButton) {
    state.poem.selectedPresetId = poemButton.dataset.poetPreset;
    renderPresetCards();
    renderPoemSummary();
  }
}

function handleTemplateListClick(event) {
  const deleteButton = event.target.closest("[data-template-delete]");
  if (deleteButton) {
    deleteTemplate(deleteButton.dataset.templateDelete, deleteButton.dataset.templateId);
    return;
  }

  const applyButton = event.target.closest("[data-template-apply]");
  if (applyButton) {
    applyTemplate(applyButton.dataset.templateApply, applyButton.dataset.templateId);
  }
}

function handleImageHistoryClick(event) {
  const deleteButton = event.target.closest("[data-image-history-delete]");
  if (deleteButton) {
    deleteHistoryItem("image", deleteButton.dataset.imageHistoryDelete);
    return;
  }

  const button = event.target.closest("[data-image-history-id]");
  if (!button) {
    return;
  }
  const item = state.image.history.find((entry) => entry.id === button.dataset.imageHistoryId);
  if (!item) {
    return;
  }
  state.image.generatedUrl = item.imageUrl;
  state.image.generatedMime = item.mimeType || "image/png";
  state.image.generatedSummary = item.summary || "";
  state.image.generatedPrompt = item.prompt || "";
  commitGeneratedImage();
}

function handlePoemHistoryClick(event) {
  const deleteButton = event.target.closest("[data-poem-history-delete]");
  if (deleteButton) {
    deleteHistoryItem("poem", deleteButton.dataset.poemHistoryDelete);
    return;
  }

  const button = event.target.closest("[data-poem-history-id]");
  if (!button) {
    return;
  }
  const item = state.poem.history.find((entry) => entry.id === button.dataset.poemHistoryId);
  if (!item) {
    return;
  }
  state.poem.generatedTranslationLines = item.translationLines || [];
  state.poem.generatedText = buildGeneratedPoemText(item.title, item.lines || [], item.translationLines || []);
  state.poem.generatedSummary = item.summary || "";
  state.poem.generatedPrompt = item.prompt || "";
  commitGeneratedPoem({
    title: item.title,
    lines: item.lines || [],
    translationLines: item.translationLines || [],
    language: item.language || "zh",
  });
}

function handleLookupEnter(event, mode) {
  if (event.key === "Enter") {
    event.preventDefault();
    lookupStyle(mode);
  }
}

function handleLookupResultClick(event) {
  const candidateButton = event.target.closest("[data-lookup-candidate]");
  if (!candidateButton) {
    return;
  }

  lookupStyle(candidateButton.dataset.lookupMode, candidateButton.dataset.lookupCandidate);
}

function switchMode(mode) {
  dom.modeTabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.modeTab === mode));
  dom.modePanels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.modePanel === mode));
  dom.outputPanels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.outputPanel === mode));
}

function renderPresetCards() {
  dom.imagePresets.innerHTML = imagePresets
    .map(
      (preset) => `
        <button class="preset-card ${preset.id === state.image.selectedPresetId ? "is-selected" : ""}" data-image-preset="${preset.id}">
          <strong>${preset.name}</strong>
          <span>${preset.description}</span>
        </button>
      `
    )
    .join("");

  dom.poetPresets.innerHTML = poetPresets
    .map(
      (preset) => `
        <button class="preset-card ${preset.id === state.poem.selectedPresetId ? "is-selected" : ""}" data-poet-preset="${preset.id}">
          <strong>${preset.name}</strong>
          <span>${preset.description}</span>
          <span class="preset-meta">${preset.languageLabel || getPoemLanguageLabel(preset.language)}</span>
        </button>
      `
    )
    .join("");
}

function renderLookupResult(mode) {
  const lookup = state[mode].lookup;
  const candidates = state[mode].lookupCandidates || [];
  const container = mode === "image" ? dom.imageLookupResult : dom.poemLookupResult;
  const activeLookup = lookup || {
    id: "",
    name: "未选择人物",
    description: "请从候选人物中点选一个以加载代表作。",
    summary: "",
    works: [],
  };

  if (!lookup && !candidates.length) {
    container.innerHTML = '<div class="empty-library">输入姓名后联网检索，系统会抓取人物条目与代表作，并将其作为新的风格参考。</div>';
    return;
  }

  const works = Array.isArray(activeLookup.works) ? activeLookup.works.slice(0, 4) : [];
  const candidateMarkup = candidates.length
    ? `<div class="lookup-candidate-list">${candidates
        .map(
          (candidate) => `
            <button
              class="candidate-pill ${candidate.id === activeLookup.id ? "is-selected" : ""}"
              data-lookup-candidate="${candidate.id}"
              data-lookup-mode="${mode}"
            >
              ${escapeHtml(candidate.name)}
            </button>
          `
        )
        .join("")}</div>`
    : "";

  container.innerHTML = `
    <div class="lookup-card">
      <div class="lookup-head">
        <div>
          <h3>${escapeHtml(activeLookup.name || "未命名")}</h3>
          <div class="lookup-meta">${escapeHtml(activeLookup.description || "已联网获取人物条目")}</div>
        </div>
        <div class="lookup-meta">${mode === "image" ? "画风参考已启用" : getPoemLookupBadge(activeLookup.poemForm)}</div>
      </div>
      <p>${escapeHtml(activeLookup.summary || activeLookup.styleSummary || "已抓取人物摘要与代表作信息。")}</p>
      ${candidateMarkup}
      ${works.length ? `<div class="lookup-works">${works.map((work) => renderLookupWorkCard(work, mode)).join("")}</div>` : ""}
    </div>
  `;
}

function renderLookupWorkCard(work, mode) {
  const image = mode === "image" && work.imageUrl ? `<img src="${escapeAttribute(work.imageUrl)}" alt="${escapeAttribute(work.title || "代表作")}" />` : "";
  return `
    <article class="lookup-work">
      ${image}
      <div class="lookup-work-copy">
        <strong>${escapeHtml(work.title || "未命名作品")}</strong>
        <span>${escapeHtml(work.summary || work.description || "代表作信息已纳入风格抽取。")}</span>
      </div>
    </article>
  `;
}

function renderTemplateList(mode) {
  const container = mode === "image" ? dom.imageTemplateList : dom.poemTemplateList;
  const items = state.templates[mode];
  if (!items.length) {
    container.innerHTML = '<div class="empty-library">当前还没有保存模板。可基于内置预设或联网检索结果保存。</div>';
    return;
  }

  container.innerHTML = items
    .map(
      (template) => `
        <div class="library-card">
          <button class="library-main" data-template-apply="${mode}" data-template-id="${template.id}">
            <strong>${escapeHtml(template.name)}</strong>
            <span>${escapeHtml(template.description)}</span>
          </button>
          <button class="library-delete" data-template-delete="${mode}" data-template-id="${template.id}">删除</button>
        </div>
      `
    )
    .join("");
}

function renderImageSummary(message = "") {
  const preset = getSelectedImagePreset();
  const backendNote = state.backend.checked ? state.backend.message : "正在检测模型服务状态...";
  const lookupNote = state.image.lookup
    ? `当前已叠加联网检索参考：${state.image.lookup.name}。代表作包括 ${(state.image.lookup.works || []).slice(0, 3).map((work) => work.title).join("、") || "若干作品"}。`
    : "当前未启用联网检索参考。";
  const uploadNote = state.image.uploadedFiles.length
    ? `另有 ${state.image.uploadedFiles.length} 张本地参考图会一起送入模型。`
    : "未附加本地参考图片。";

  dom.imageStyleSummary.innerHTML = `
    <h3>当前风格摘要</h3>
    <p>${message || `${preset.name} 预设已激活。${lookupNote}${uploadNote}`}</p>
    <ul>
      <li>主导情绪：${escapeHtml(preset.mood)}</li>
      <li>基础色板：${preset.palette.slice(0, 5).join("、")}</li>
      <li>风格关键词：${preset.keywords.join("、")}</li>
      <li>模型状态：${escapeHtml(backendNote)}</li>
    </ul>
  `;
}

function renderPoemSummary(message = "") {
  const preset = getSelectedPoetPreset();
  const profile = state.poem.uploadedProfile || buildPoetryPresetProfile(preset);
  const imagery = profile.imagery?.length ? profile.imagery : preset.imagery || [];
  const backendNote = state.backend.checked ? state.backend.message : "正在检测模型服务状态...";
  const lookupNote = state.poem.lookup
    ? `当前已叠加联网检索参考：${state.poem.lookup.name}。代表作包括 ${(state.poem.lookup.works || []).slice(0, 4).map((work) => work.title).join("、") || "若干作品"}。`
    : "当前未启用联网检索参考。";
  const uploadNote = state.poem.uploadedTexts.length
    ? `另有 ${state.poem.uploadedTexts.length} 份本地诗词样本会一起送入模型。`
    : "未附加本地诗词文本。";

  dom.poemStyleSummary.innerHTML = `
    <h3>当前诗风摘要</h3>
    <p>${message || `${preset.name} 预设已激活。${lookupNote}${uploadNote}`}</p>
    <ul>
      <li>整体语气：${escapeHtml(preset.tone)}</li>
      <li>输出语言：${escapeHtml(preset.languageLabel || getPoemLanguageLabel(preset.language))}${preset.language === "zh" ? "" : "，并附中文翻译"}</li>
      <li>高频意象：${escapeHtml(imagery.slice(0, 6).join("、"))}</li>
      <li>推荐节奏：约 ${escapeHtml(String(profile.lineLength))} ${escapeHtml(profile.lineUnit || "字")}，建议行数：${escapeHtml(String(profile.lineCount))} 行</li>
      <li>模型状态：${escapeHtml(backendNote)}</li>
    </ul>
  `;
}

function renderImageHistory() {
  if (!state.image.history.length) {
    dom.imageHistoryList.innerHTML = '<div class="empty-library">尚无图片历史。生成后会自动进入缩略图画廊。</div>';
    return;
  }

  dom.imageHistoryList.innerHTML = state.image.history
    .map(
      (item) => `
        <div class="history-item-shell">
          <button class="history-delete" data-image-history-delete="${item.id}">删除</button>
          <button class="history-item" data-image-history-id="${item.id}">
            <img src="${escapeAttribute(item.imageUrl)}" alt="${escapeAttribute(item.prompt || item.title || "历史图片")}" />
            <div class="history-copy">
              <strong>${escapeHtml(truncateText(item.prompt || "未命名作品", 16))}</strong>
              <div class="history-caption">${escapeHtml(item.presetName || "风格参考")} · ${escapeHtml(formatTime(item.createdAt))}</div>
            </div>
          </button>
        </div>
      `
    )
    .join("");
}

function renderPoemHistory() {
  if (!state.poem.history.length) {
    dom.poemHistoryList.innerHTML = '<div class="empty-library">尚无诗词历史。生成后会自动记录最近作品。</div>';
    return;
  }

  dom.poemHistoryList.innerHTML = state.poem.history
    .map(
      (item) => `
        <div class="poem-history-shell">
          <button class="history-delete" data-poem-history-delete="${item.id}">删除</button>
          <button class="poem-history-item" data-poem-history-id="${item.id}">
            <strong>${escapeHtml(item.title || "未命名")}</strong>
            <div class="poem-history-meta">${escapeHtml(item.presetName || "风格参考")} · ${escapeHtml(getPoemLanguageLabel(item.language || "zh"))} · ${escapeHtml(formatTime(item.createdAt))}</div>
            <div class="poem-history-lines">${escapeHtml((item.lines || []).slice(0, 2).join(" / "))}</div>
          </button>
        </div>
      `
    )
    .join("");
}

async function checkBackendStatus() {
  try {
    const result = await requestJson("/api/health", { method: "GET" });
    state.backend.checked = true;
    state.backend.ready = Boolean(result.ready);
    state.backend.message = result.ready
      ? `模型服务已连接，文本：${result.textProvider || "未命名供应商"} / ${result.textModel}；图片：${result.imageProvider || "未命名供应商"} / ${result.imageModel}`
      : normalizeBackendMessage(result.message || "模型服务未配置完成。", result);
  } catch (error) {
    state.backend.checked = true;
    state.backend.ready = false;
    state.backend.message = "无法连接本地服务，请先启动 Node 服务端。";
  }
  renderImageSummary();
  renderPoemSummary();
}

function getSelectedImagePreset() {
  return imagePresets.find((preset) => preset.id === state.image.selectedPresetId) || imagePresets[0];
}

function getSelectedPoetPreset() {
  return poetPresets.find((preset) => preset.id === state.poem.selectedPresetId) || poetPresets[0];
}

function handleImageUpload(event) {
  const files = Array.from(event.target.files || []);
  state.image.uploadedFiles = files;
  dom.imageUploadList.innerHTML = files.map((file) => `<span>${escapeHtml(file.name)}</span>`).join("");
  renderImageSummary();
}

async function handlePoemUpload(event) {
  const files = Array.from(event.target.files || []);
  state.poem.uploadedFiles = files;
  dom.poemUploadList.innerHTML = files.map((file) => `<span>${escapeHtml(file.name)}</span>`).join("");

  if (!files.length) {
    resetPoemUploads();
    renderPoemSummary();
    return;
  }

  try {
    state.poem.uploadedTexts = await Promise.all(files.map((file) => file.text()));
    state.poem.uploadedProfile = analyzePoetryCorpus(state.poem.uploadedTexts);
    renderPoemSummary();
  } catch (error) {
    resetPoemUploads();
    renderPoemSummary("诗词文本读取失败，请确认文件编码为 UTF-8。", true);
  }
}

async function lookupStyle(mode, entityId) {
  const input = mode === "image" ? dom.imageLookupName : dom.poemLookupName;
  const button = mode === "image" ? dom.imageLookupSearch : dom.poemLookupSearch;
  const name = input.value.trim();

  if (!name) {
    const message = "请输入艺术家姓名。";
    if (mode === "image") {
      renderImageSummary(message);
    } else {
      renderPoemSummary(message);
    }
    return;
  }

  setLoading(button, true, "联网检索");
  renderLookupStatus(mode, `${name} 的代表作与风格信息检索中...`);

  try {
    const result = await requestJson("/api/style-lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: mode, name, entityId }),
    });

    const targetMode = result.selected?.matchedKind === "poem" ? "poem" : "image";
    const switched = targetMode !== mode;
    const targetInput = targetMode === "image" ? dom.imageLookupName : dom.poemLookupName;
    targetInput.value = name;
    state[targetMode].lookupCandidates = compactLookupCandidates(result.candidates);
    state[targetMode].lookup = compactLookup(result.selected || result, targetMode);

    if (switched) {
      state[mode].lookupCandidates = [];
      state[mode].lookup = null;
      renderLookupResult(mode);
      switchMode(targetMode);
    }

    renderLookupResult(targetMode);
    const selectedName = result.selected?.name || result.name;
    if (targetMode === "image") {
      renderImageSummary(
        switched
          ? `${selectedName} 已识别为图像类艺术家，页面已自动切换并加载其代表作参考。`
          : `${selectedName} 的互联网代表作已加载，可直接参与生成。`
      );
    } else {
      renderPoemSummary(
        switched
          ? `${selectedName} 已识别为诗词类艺术家，页面已自动切换并加载其代表作参考。`
          : `${selectedName} 的互联网代表作已加载，可直接参与生成。`
      );
    }
  } catch (error) {
    renderLookupStatus(mode, error.message || "联网检索失败，请稍后重试。");
  } finally {
    setLoading(button, false, "联网检索");
  }
}

function renderLookupStatus(mode, message) {
  const container = mode === "image" ? dom.imageLookupResult : dom.poemLookupResult;
  container.innerHTML = `<div class="empty-library">${escapeHtml(message)}</div>`;
}

function clearLookup(mode) {
  state[mode].lookupCandidates = [];
  state[mode].lookup = null;
  if (mode === "image") {
    dom.imageLookupName.value = "";
    renderLookupResult("image");
    renderImageSummary();
  } else {
    dom.poemLookupName.value = "";
    renderLookupResult("poem");
    renderPoemSummary();
  }
}

function compactLookupCandidates(candidates) {
  return Array.isArray(candidates)
    ? candidates.slice(0, 8).map((candidate) => ({
        id: String(candidate.id || ""),
        name: String(candidate.name || candidate.label || "未命名"),
        description: String(candidate.description || ""),
        matchedKind: candidate.matchedKind === "poem" ? "poem" : "image",
        poemForm: normalizePoemForm(candidate.poemForm || ""),
      }))
    : [];
}

function compactLookup(lookup, mode) {
  return {
    id: String(lookup.id || ""),
    kind: mode,
    matchedKind: lookup.matchedKind === "poem" ? "poem" : "image",
    poemForm: normalizePoemForm(lookup.poemForm || ""),
    name: String(lookup.name || "未命名参考"),
    description: String(lookup.description || ""),
    summary: String(lookup.summary || lookup.styleSummary || ""),
    styleSummary: String(lookup.styleSummary || ""),
    sourceUrl: String(lookup.sourceUrl || ""),
    works: Array.isArray(lookup.works)
      ? lookup.works.slice(0, 6).map((work) => ({
          title: String(work.title || "未命名作品"),
          description: String(work.description || ""),
          summary: String(work.summary || ""),
          imageUrl: mode === "image" ? String(work.imageUrl || "") : "",
          sourceUrl: String(work.sourceUrl || ""),
        }))
      : [],
  };
}

function normalizePoemForm(value) {
  const form = String(value || "").trim().toLowerCase();
  if (form === "ci" || form === "haiku") {
    return form;
  }
  return "poem";
}

function getPoemLookupBadge(poemForm) {
  switch (normalizePoemForm(poemForm)) {
    case "ci":
      return "词体参考已启用";
    case "haiku":
      return "俳句参考已启用";
    default:
      return "诗体参考已启用";
  }
}

function saveTemplate(mode) {
  const preset = mode === "image" ? getSelectedImagePreset() : getSelectedPoetPreset();
  const lookup = state[mode].lookup;
  const template = {
    id: createId(),
    name: lookup ? `${lookup.name} · ${mode === "image" ? "图像模板" : "诗风模板"}` : `${preset.name} · ${mode === "image" ? "图像模板" : "诗风模板"}`,
    description: lookup
      ? `预设 ${preset.name} + 联网参考 ${lookup.name}`
      : `基于内置预设 ${preset.name}`,
    presetId: preset.id,
    lookup,
    createdAt: new Date().toISOString(),
  };

  state.templates[mode] = [template, ...state.templates[mode]].slice(0, 12);
  persistTemplates(mode);
  renderTemplateList(mode);
  if (mode === "image") {
    renderImageSummary(`已保存模板：${template.name}`);
  } else {
    renderPoemSummary(`已保存模板：${template.name}`);
  }
}

function applyTemplate(mode, templateId) {
  const template = state.templates[mode].find((item) => item.id === templateId);
  if (!template) {
    return;
  }

  state[mode].selectedPresetId = template.presetId;
  state[mode].lookupCandidates = [];
  state[mode].lookup = template.lookup || null;

  if (mode === "image") {
    resetImageUploads();
    dom.imageLookupName.value = template.lookup?.name || "";
    renderPresetCards();
    renderLookupResult("image");
    renderImageSummary(`已应用模板：${template.name}`);
  } else {
    resetPoemUploads();
    dom.poemLookupName.value = template.lookup?.name || "";
    renderPresetCards();
    renderLookupResult("poem");
    renderPoemSummary(`已应用模板：${template.name}`);
  }
}

function deleteTemplate(mode, templateId) {
  state.templates[mode] = state.templates[mode].filter((item) => item.id !== templateId);
  persistTemplates(mode);
  renderTemplateList(mode);
}

function clearTemplates(mode) {
  state.templates[mode] = [];
  persistTemplates(mode);
  renderTemplateList(mode);
}

function persistTemplates(mode) {
  writeStorage(localStorage, mode === "image" ? STORAGE_KEYS.imageTemplates : STORAGE_KEYS.poemTemplates, state.templates[mode]);
}

function clearHistory(mode) {
  state[mode].history = [];
  persistHistory(mode);
  if (mode === "image") {
    renderImageHistory();
  } else {
    renderPoemHistory();
  }
}

function deleteHistoryItem(mode, historyId) {
  state[mode].history = state[mode].history.filter((entry) => entry.id !== historyId);
  persistHistory(mode);
  if (mode === "image") {
    renderImageHistory();
  } else {
    renderPoemHistory();
  }
}

async function onGenerateImage() {
  const prompt = dom.imagePrompt.value.trim();
  if (!prompt) {
    dom.imageInsightCard.innerHTML = "<h3>图像风格解读</h3><p>请输入图像提示词后再生成。</p>";
    return;
  }

  setLoading(dom.generateImage, true, "生成新图片");
  dom.imageInsightCard.innerHTML = "<h3>图像风格解读</h3><p>正在让模型读取预设、本地样本与互联网代表作，生成新的图像。</p>";

  try {
    const uploadedImages = await Promise.all(
      state.image.uploadedFiles.map(async (file) => ({
        name: file.name,
        type: file.type || "image/png",
        dataUrl: await fileToDataUrl(file),
      }))
    );

    const result = await requestJson("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        preset: getSelectedImagePreset(),
        uploadedImages,
        lookupStyle: state.image.lookup,
      }),
    });

    state.image.generatedPrompt = prompt;
    state.image.generatedUrl = result.imageDataUrl || result.imageUrl || "";
    state.image.generatedMime = result.mimeType || "image/png";
    state.image.generatedSummary = result.summary || "模型已根据样本与代表作抽取视觉风格并输出图片。";
    pushImageHistory({
      id: createId(),
      prompt,
      imageUrl: state.image.generatedUrl,
      mimeType: state.image.generatedMime,
      summary: state.image.generatedSummary,
      createdAt: new Date().toISOString(),
      presetName: getSelectedImagePreset().name,
      lookupName: state.image.lookup?.name || "",
    });
    commitGeneratedImage();
  } catch (error) {
    dom.imageInsightCard.innerHTML = `<h3>图像风格解读</h3><p>${escapeHtml(error.message || "图像生成失败")}</p>`;
  } finally {
    setLoading(dom.generateImage, false, "生成新图片");
  }
}

async function onGeneratePoem() {
  const prompt = dom.poemPrompt.value.trim();
  if (!prompt) {
    dom.poemInsightCard.innerHTML = "<h3>诗风解读</h3><p>请输入诗词提示词后再生成。</p>";
    return;
  }

  setLoading(dom.generatePoem, true, "生成新诗词");
  dom.poemInsightCard.innerHTML = "<h3>诗风解读</h3><p>正在让模型综合预设、本地诗词样本与互联网代表作，生成新的诗词。</p>";

  try {
    const uploadedTexts = state.poem.uploadedTexts.map((content, index) => ({
      name: state.poem.uploadedFiles[index]?.name || `sample-${index + 1}.txt`,
      content,
    }));

    const result = await requestJson("/api/generate-poem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        preset: getSelectedPoetPreset(),
        uploadedTexts,
        lookupStyle: state.poem.lookup,
      }),
    });

    const lines = Array.isArray(result.lines) ? result.lines : [];
    const translationLines = Array.isArray(result.translationLines) ? result.translationLines : [];
    state.poem.generatedPrompt = prompt;
    state.poem.generatedTranslationLines = translationLines;
    state.poem.generatedText = buildGeneratedPoemText(result.title || "未命名", lines, translationLines);
    state.poem.generatedSummary = result.summary || "模型已完成诗风学习与生成。";
    pushPoemHistory({
      id: createId(),
      prompt,
      title: result.title || "未命名",
      lines,
      translationLines,
      language: result.language || getSelectedPoetPreset().language || "zh",
      summary: state.poem.generatedSummary,
      createdAt: new Date().toISOString(),
      presetName: getSelectedPoetPreset().name,
      lookupName: state.poem.lookup?.name || "",
    });
    commitGeneratedPoem({
      title: result.title || "未命名",
      lines,
      translationLines,
      language: result.language || getSelectedPoetPreset().language || "zh",
    });
  } catch (error) {
    dom.poemInsightCard.innerHTML = `<h3>诗风解读</h3><p>${escapeHtml(error.message || "诗词生成失败")}</p>`;
  } finally {
    setLoading(dom.generatePoem, false, "生成新诗词");
  }
}

function pushImageHistory(entry) {
  state.image.history = [entry, ...state.image.history].slice(0, 6);
  persistHistory("image");
  renderImageHistory();
}

function pushPoemHistory(entry) {
  state.poem.history = [entry, ...state.poem.history].slice(0, 12);
  persistHistory("poem");
  renderPoemHistory();
}

function persistHistory(mode) {
  if (mode === "image") {
    writeStorage(sessionStorage, STORAGE_KEYS.imageHistory, state.image.history);
    return;
  }
  writeStorage(localStorage, STORAGE_KEYS.poemHistory, state.poem.history);
}

function commitGeneratedImage() {
  if (!state.image.generatedUrl) {
    return;
  }
  dom.imageOutput.innerHTML = `<img src="${escapeAttribute(state.image.generatedUrl)}" alt="模型生成图片" />`;
  dom.downloadImage.disabled = false;
  dom.imageInsightCard.innerHTML = `
    <h3>图像风格解读</h3>
    <p>${escapeHtml(state.image.generatedSummary)}</p>
  `;
}

function commitGeneratedPoem({ title, lines, translationLines = [], language = "zh" }) {
  dom.poemOutput.innerHTML = `
    <h3 class="poem-title">${escapeHtml(title)}</h3>
    <div class="poem-language-tag">${escapeHtml(getPoemLanguageLabel(language))}</div>
    <div class="poem-lines">
      ${lines.map((line) => `<div>${escapeHtml(line)}</div>`).join("")}
    </div>
    ${translationLines.length ? `
      <div class="poem-translation">
        <div class="poem-translation-title">中文译文</div>
        <div class="poem-lines poem-lines-translation">
          ${translationLines.map((line) => `<div>${escapeHtml(line)}</div>`).join("")}
        </div>
      </div>
    ` : ""}
  `;
  dom.copyPoem.disabled = false;
  dom.poemInsightCard.innerHTML = `
    <h3>诗风解读</h3>
    <p>${escapeHtml(state.poem.generatedSummary)}</p>
  `;
}

function setLoading(button, loading, defaultText) {
  if (loading) {
    button.disabled = true;
    button.textContent = "处理中...";
    return;
  }
  button.disabled = false;
  button.textContent = defaultText;
}

function downloadGeneratedImage() {
  if (!state.image.generatedUrl) {
    return;
  }

  const link = document.createElement("a");
  link.href = state.image.generatedUrl;
  link.download = state.image.generatedMime.includes("jpeg") ? "danqing-style-art.jpg" : "danqing-style-art.png";
  link.click();
}

async function copyGeneratedPoem() {
  if (!state.poem.generatedText) {
    return;
  }
  try {
    await navigator.clipboard.writeText(state.poem.generatedText);
    dom.copyPoem.textContent = "已复制";
    setTimeout(() => {
      dom.copyPoem.textContent = "复制文本";
    }, 1400);
  } catch (error) {
    console.error(error);
  }
}

function resetImageUploads() {
  state.image.uploadedFiles = [];
  dom.imageUpload.value = "";
  dom.imageUploadList.innerHTML = "";
}

function resetPoemUploads() {
  state.poem.uploadedFiles = [];
  state.poem.uploadedTexts = [];
  state.poem.uploadedProfile = null;
  state.poem.generatedTranslationLines = [];
  dom.poemUpload.value = "";
  dom.poemUploadList.innerHTML = "";
}

function buildPoetryPresetProfile(preset) {
  return {
    imagery: preset.imagery || [],
    lineLength: preset.defaultLineLength || 7,
    lineCount: 4,
    lineUnit: preset.lineUnit || "字",
  };
}

function analyzePoetryCorpus(texts) {
  const source = texts.join("\n");
  const mode = detectPoetryCorpusMode(source);
  const lines = source
    .split(/[\n。！？!?；;]+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 2);

  const imageryWeights = new Map();
  Object.values(poetryVocabulary)
    .flat()
    .forEach((word) => {
      imageryWeights.set(word, source.split(word).length - 1);
    });

  const topImagery = [...imageryWeights.entries()]
    .filter(([, count]) => count > 0)
    .sort((left, right) => right[1] - left[1])
    .map(([word]) => word)
    .slice(0, 8);

  return {
    imagery: topImagery,
    lineCount: lines.length >= 8 ? 8 : 4,
    lineLength: Math.round(average(lines.map((line) => countPoetryLineUnits(line, mode))) || 7),
    lineUnit: mode === "latin" ? "词" : mode === "japanese" ? "短句" : "字",
  };
}

function detectPoetryCorpusMode(source) {
  if (/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(source)) {
    return "latin";
  }
  if (/[\u3040-\u30ff]/.test(source)) {
    return "japanese";
  }
  return "cjk";
}

function countPoetryLineUnits(line, mode) {
  if (mode === "latin") {
    const words = line.split(/\s+/).filter(Boolean);
    return words.length || line.length;
  }
  if (mode === "japanese") {
    return line.replace(/[\s、，,。！？!?；;「」『』]/g, "").length;
  }
  return line.replace(/[\s、，,。！？!?；;]/g, "").length;
}

function getPoemLanguageLabel(language) {
  switch (language) {
    case "en":
      return "英文";
    case "fr":
      return "法文";
    case "ja":
      return "日文";
    default:
      return "中文";
  }
}

function buildGeneratedPoemText(title, lines, translationLines = []) {
  return [title, ...lines, ...(translationLines.length ? ["", "中文译文", ...translationLines] : [])].filter(Boolean).join("\n");
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(normalizeBackendMessage(data.error || "请求失败", data));
  }
  return data;
}

function normalizeBackendMessage(message, payload = {}) {
  const text = String(message || "").trim();
  if (/OPENAI_API_KEY/.test(text)) {
    const textProvider = payload.textProvider || "DeepSeek";
    const imageProvider = payload.imageProvider || "SiliconFlow";
    return `模型服务未配置完成，请检查 .env 中的文本供应商 ${textProvider}、图片供应商 ${imageProvider} 及其对应密钥。`;
  }
  return text || "请求失败";
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`文件读取失败: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readStorage(storage, key, fallbackValue) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function writeStorage(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota failures and keep in-memory state.
  }
}

function average(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function truncateText(value, length) {
  return value.length > length ? `${value.slice(0, length)}...` : value;
}

function formatTime(isoValue) {
  try {
    return new Date(isoValue).toLocaleString("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "刚刚";
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

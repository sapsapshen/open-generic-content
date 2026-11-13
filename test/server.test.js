import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildChatRequestBody,
  buildCompactImagePrompt,
  buildLocalLookupPayload,
  detectPoemForm,
  formatStyleLookupError,
  getDefaultModel,
  getPoemFormGuide,
  imagePromptCharacterLimit,
  loadEnvFile,
  normalizePoemForm,
  normalizeStringList,
  parseEnvAssignment,
  parseEnvValue,
  parseJsonContent,
  readPort,
  resolvePublicFile,
  server,
  textModelAcceptsImages,
} from "../server.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function request(method, requestPath, body) {
  const address = server.address();
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: address.port,
        path: requestPath,
        method,
        headers: body
          ? {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(body),
            }
          : {},
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          let json = null;
          try {
            json = raw ? JSON.parse(raw) : null;
          } catch {
            json = null;
          }
          resolve({
            status: response.statusCode,
            headers: response.headers,
            raw,
            json,
          });
        });
      }
    );
    req.on("error", reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

describe("pure helpers", () => {
  test("uses current provider defaults", () => {
    assert.equal(getDefaultModel("text", "deepseek", "fallback"), "deepseek-flash");
    assert.equal(getDefaultModel("image", "bailian", "fallback"), "wan2.2-t2i-flash");
  });

  test("parses quoted env values and ignores inline comments", () => {
    assert.equal(parseEnvValue('"sk-test"'), "sk-test");
    assert.equal(parseEnvValue("'3017'"), "3017");
    assert.equal(parseEnvValue("3017 # port"), "3017");
    assert.deepEqual(parseEnvAssignment('export TEXT_API_KEY="sk-test"'), {
      key: "TEXT_API_KEY",
      value: "sk-test",
    });
    assert.equal(parseEnvAssignment("# TEXT_API_KEY=secret"), null);
  });

  test("loads env without overriding existing process values", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "danqing-env-"));
    const filePath = path.join(dir, ".env");
    writeFileSync(
      filePath,
      ["# comment", 'export UNIT_NEW_KEY="quoted-value"', "UNIT_PORT=3017 # comment", "UNIT_KEEP=changed", ""].join("\n")
    );
    process.env.UNIT_KEEP = "original";
    delete process.env.UNIT_NEW_KEY;
    delete process.env.UNIT_PORT;

    try {
      loadEnvFile(filePath);
      assert.equal(process.env.UNIT_NEW_KEY, "quoted-value");
      assert.equal(process.env.UNIT_PORT, "3017");
      assert.equal(process.env.UNIT_KEEP, "original");
    } finally {
      delete process.env.UNIT_NEW_KEY;
      delete process.env.UNIT_PORT;
      delete process.env.UNIT_KEEP;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("validates ports", () => {
    assert.equal(readPort(undefined, 3017), 3017);
    assert.equal(readPort("3017", 3000), 3017);
    assert.deepEqual(readPort("nope", 3017), { raw: "nope" });
    assert.deepEqual(readPort("70000", 3017), { raw: "70000" });
  });

  test("keeps public assets inside the project and blocks secrets", () => {
    assert.equal(path.basename(resolvePublicFile(projectRoot, "/")), "index.html");
    assert.equal(path.basename(resolvePublicFile(projectRoot, "/styles.css")), "styles.css");
    assert.equal(resolvePublicFile(projectRoot, "/.env"), null);
    assert.equal(resolvePublicFile(projectRoot, "/server.js"), null);
    assert.equal(resolvePublicFile(projectRoot, "/../.env"), null);
    assert.equal(resolvePublicFile(projectRoot, "/%2e%2e/.env"), null);
    assert.equal(resolvePublicFile(projectRoot, "/package.json"), null);
  });

  test("resolves local artist fallback and poem form", () => {
    const liBai = buildLocalLookupPayload("李白", "poem", "");
    assert.equal(liBai.selected.name, "李白");
    assert.equal(liBai.selected.poemForm, "poem");

    const liuYong = buildLocalLookupPayload("柳永", "image", "");
    assert.equal(liuYong.selected.matchedKind, "poem");
    assert.equal(liuYong.selected.poemForm, "ci");

    const basho = buildLocalLookupPayload("芭蕉", "poem", "");
    assert.equal(basho.selected.poemForm, "haiku");
    assert.equal(buildLocalLookupPayload("完全不存在的名字xyz", "poem", ""), null);
    assert.equal(detectPoemForm("北宋词人，擅长慢词"), "ci");
    assert.equal(normalizePoemForm("unknown"), "poem");
    assert.equal(getPoemFormGuide("haiku", { code: "ja", label: "日文" }).maxLines, 3);
  });

  test("parses model JSON wrapped in prose or fences", () => {
    assert.deepEqual(parseJsonContent('```json\n{"title":"春江"}\n```'), { title: "春江" });
    assert.deepEqual(parseJsonContent('说明 {"title":"春江"} 结束'), { title: "春江" });
    assert.deepEqual(parseJsonContent([{ text: '{"title":"秋"}' }]), { title: "秋" });
    assert.throws(() => parseJsonContent("   "), /可解析 JSON/);
    assert.deepEqual(normalizeStringList("月、酒，山"), ["月", "酒", "山"]);
  });

  test("fits Bailian prompts to the documented character limit", () => {
    assert.equal(imagePromptCharacterLimit("bailian", "wan2.2-t2i-flash"), 500);
    assert.equal(imagePromptCharacterLimit("bailian", "wan2.6-t2i"), 2000);
    assert.equal(imagePromptCharacterLimit("siliconflow", "Qwen/Qwen-Image"), 4000);
    const fitted = buildCompactImagePrompt({
      prompt: "江".repeat(400),
      presetName: "梵高",
      lookupName: "宫崎骏",
      styleProfile: {
        styleSummary: "旋涡笔触",
        visualKeywords: ["impasto", "blue"],
        colorPalette: ["#163d63"],
        mood: "奔涌",
      },
      limit: 500,
    });
    assert.ok(fitted.length <= 500);
    assert.ok(fitted.startsWith("江江"));
  });

  test("disables DeepSeek thinking and detects vision models", () => {
    const deepseek = buildChatRequestBody({
      model: "deepseek-flash",
      provider: "deepseek",
      temperature: 0.4,
      system: "return json",
      messages: [{ role: "user", content: "写一首诗" }],
      jsonMode: true,
    });
    assert.deepEqual(deepseek.thinking, { type: "disabled" });
    assert.equal(deepseek.response_format.type, "json_object");
    assert.equal(deepseek.max_tokens, 4096);

    const bailian = buildChatRequestBody({
      model: "qwen-plus",
      provider: "bailian",
      temperature: 0.4,
      system: "return json",
      messages: [],
      jsonMode: false,
    });
    assert.equal("thinking" in bailian, false);

    assert.equal(textModelAcceptsImages("deepseek", "deepseek-flash", ""), false);
    assert.equal(textModelAcceptsImages("deepseek", "deepseek-flash", "true"), true);
    assert.equal(textModelAcceptsImages("bailian", "qwen-plus", ""), false);
    assert.equal(textModelAcceptsImages("bailian", "qwen-vl-plus", ""), true);
    assert.equal(textModelAcceptsImages("custom", "gpt-4.1-mini", "false"), false);
  });

  test("rewrites lookup transport failures into a local-fallback message", () => {
    assert.match(formatStyleLookupError(new Error("联网检索超时，请稍后重试。")), /本地兜底资料/);
    assert.equal(formatStyleLookupError(new Error("未找到对应人物，请尝试更完整的姓名。")), "未找到对应人物，请尝试更完整的姓名。");
  });
});

describe("http server", { concurrency: 1 }, () => {
  test.before(async () => {
    if (!server.listening) {
      server.listen(0, "127.0.0.1");
      await once(server, "listening");
    }
  });

  test.after(async () => {
    if (server.listening) {
      server.close();
      await once(server, "close");
    }
  });

  test("reports health without exposing secrets", async () => {
    const result = await request("GET", "/api/health");
    assert.equal(result.status, 200);
    assert.equal(typeof result.json.ready, "boolean");
    assert.equal(typeof result.json.textProvider, "string");
    assert.equal(typeof result.json.imageProvider, "string");
    assert.equal(typeof result.json.textSupportsVision, "boolean");
    assert.equal(result.headers["x-content-type-options"], "nosniff");
    assert.equal(result.headers["cache-control"], "no-store");
    assert.equal(JSON.stringify(result.json).includes("sk-"), false);
    if (!process.env.TEXT_PROVIDER && !process.env.TEXT_MODEL && !process.env.OPENAI_BASE_URL) {
      assert.equal(result.json.textProvider, "DeepSeek");
      assert.equal(result.json.textModel, "deepseek-flash");
      assert.equal(result.json.textSupportsVision, false);
    }
    if (!process.env.IMAGE_PROVIDER && !process.env.IMAGE_MODEL && !process.env.OPENAI_BASE_URL) {
      assert.equal(result.json.imageProvider, "Bailian");
      assert.equal(result.json.imageModel, "wan2.2-t2i-flash");
    }
  });

  test("rejects invalid lookup input and unknown routes", async () => {
    const missingName = await request("POST", "/api/style-lookup", JSON.stringify({ kind: "poem", name: "   " }));
    assert.equal(missingName.status, 400);
    assert.match(missingName.json.error, /艺术家姓名/);

    const badJson = await request("POST", "/api/style-lookup", "{");
    assert.equal(badJson.status, 400);
    assert.match(badJson.json.error, /JSON/);

    const wrongMethod = await request("POST", "/api/health");
    assert.equal(wrongMethod.status, 405);

    const missing = await request("GET", "/missing-page");
    assert.equal(missing.status, 404);
  });

  test("serves the page and hides private files", async () => {
    const page = await request("GET", "/");
    assert.equal(page.status, 200);
    assert.match(page.raw, /丹青词境/);
    assert.match(page.headers["content-type"], /text\/html/);

    const script = await request("GET", "/app.js");
    assert.equal(script.status, 200);
    assert.match(script.headers["content-type"], /javascript/);

    for (const privatePath of ["/.env", "/server.js", "/package.json", "/.env.example"]) {
      const hidden = await request("GET", privatePath);
      assert.equal(hidden.status, 404, privatePath);
    }
  });

  test("reports missing model credentials before generation", async () => {
    const hasTextKey = Boolean(process.env.TEXT_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY);
    if (hasTextKey) {
      return;
    }
    const result = await request("POST", "/api/generate-poem", JSON.stringify({ prompt: "春雨" }));
    assert.equal(result.status, 500);
    assert.match(result.json.error, /文本模型密钥/);
  });
});

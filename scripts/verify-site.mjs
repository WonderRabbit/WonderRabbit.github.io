import { access, readdir, readFile } from "node:fs/promises"
import { join } from "node:path"

class SiteVerificationError extends Error {
  constructor(message) {
    super(message)
    this.name = "SiteVerificationError"
  }
}

const distRoot = "dist"

const isExpectedMissingPathError = (error) => error instanceof Error && "code" in error && error.code === "ENOENT"

const exists = async (path) => {
  try {
    await access(path)
    return true
  } catch (error) {
    if (!isExpectedMissingPathError(error)) {
      throw error
    }
    return false
  }
}

const root = distRoot
const filePath = (...parts) => join(root, ...parts)

const readText = async (path) => readFile(path, "utf8")

const assert = (condition, message) => {
  if (!condition) {
    throw new SiteVerificationError(message)
  }
}

const assertFile = async (...parts) => {
  const path = filePath(...parts)
  assert(await exists(path), `Missing built artifact: ${path}`)
  return path
}

const assertMatches = (label, text, pattern) => {
  assert(pattern.test(text), `${label} did not match ${pattern}`)
}

const assertDoesNotMatch = (label, text, pattern) => {
  assert(!pattern.test(text), `${label} unexpectedly matched ${pattern}`)
}

const assertNoSourcesPanel = (label, text) => {
  assertDoesNotMatch(label, text, /id="sources-heading"/)
  assertDoesNotMatch(label, text, /<h2[^>]*>\s*Sources\s*<\/h2>/i)
}

const assertNoModelInfo = (label, text) => {
  const forbiddenRenderedPatterns = [
    /GPT-[0-9]+\s+Codex/i,
    /human\s*review/i,
    /AI\s+and\s+source\s+notes/i,
  ]

  for (const pattern of forbiddenRenderedPatterns) {
    assertDoesNotMatch(label, text, pattern)
  }
}

async function readBuiltCssText() {
  const assetRoot = filePath("_astro")
  const entries = await readdir(assetRoot, { withFileTypes: true })
  const cssFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".css"))
  assert(cssFiles.length > 0, "No built CSS assets found.")
  const cssParts = await Promise.all(cssFiles.map((entry) => readText(join(assetRoot, entry.name))))
  return cssParts.join("\n")
}

const assertCatppuccinTheme = (label, text) => {
  assertMatches(label, text, /--surface-primary:\s*#1e1e2e/i)
  assertMatches(label, text, /--accent-primary:\s*#89b4fa/i)
  assertMatches(label, text, /Atkinson Hyperlegible/)
  assertDoesNotMatch(label, text, /Avenir Next/)
}

const assertFontLoading = (homeHtml) => {
  assertMatches("font loading", homeHtml, /fonts\.googleapis\.com/)
  assertMatches("font loading", homeHtml, /Atkinson\+Hyperlegible/)
  assertMatches("font loading", homeHtml, /Fraunces/)
  assertMatches("font loading", homeHtml, /JetBrains\+Mono/)
  assertMatches("font loading", homeHtml, /Noto\+Sans\+KR/)
}

const assertBlogCategoryTree = (blogHtml) => {
  assertMatches("blog category tree", blogHtml, /aria-label="Category tree"/)
  assertMatches("blog category tree", blogHtml, /data-category-tree/)
  assertMatches("blog category tree", blogHtml, /category-tree__list/)
  const categories = [...blogHtml.matchAll(/<h2 id="category-[^"]+-heading">([\s\S]*?)<\/h2>/gi)].map((match) =>
    stripTags(match[1]),
  )
  const articleTitles = [...blogHtml.matchAll(/<h3><a href="\/blog\/[^"]+\/">([\s\S]*?)<\/a><\/h3>/gi)].map((match) =>
    stripTags(match[1]),
  )
  assert(categories.length > 0, "blog category tree has no category sections")
  assert(articleTitles.length > 0, "blog category tree has no article titles")
  for (const category of categories) {
    assertMatches("blog category tree", blogHtml, new RegExp(`<a href="#category-[^"]+">[\\s\\S]*?${category}`))
  }
  for (const title of articleTitles) {
    assertMatches("blog category tree", blogHtml, new RegExp(`<a href="/blog/[^"]+/">[\\s\\S]*?${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`))
  }
}

const routeHtml = async (label, parts, patterns) => {
  const path = await assertFile(...parts)
  const text = await readText(path)
  for (const pattern of patterns) {
    assertMatches(label, text, pattern)
  }
  assertHeadingStructure(label, text)
  return text
}

const stripTags = (value) => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()

function assertHeadingStructure(label, html) {
  const headings = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((match) => ({
    level: Number(match[1]),
    text: stripTags(match[2]),
  }))
  assert(headings.length > 0, `${label} has no headings.`)
  assert(headings.filter((heading) => heading.level === 1).length === 1, `${label} must have exactly one h1.`)
  assert(headings.every((heading) => heading.text.length > 0), `${label} has an empty heading.`)
  for (let index = 1; index < headings.length; index += 1) {
    assert(headings[index].level - headings[index - 1].level <= 1, `${label} skips heading levels.`)
  }
}

function assertBlogPostingJsonLd(postHtml, expected) {
  const scripts = [...postHtml.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
  const parsed = scripts.flatMap((match) => {
    try {
      return [JSON.parse(match[1].trim())]
    } catch (error) {
      if (!(error instanceof SyntaxError)) {
        throw error
      }
      return []
    }
  })
  const blogPosting = parsed.find((entry) => entry && entry["@type"] === "BlogPosting")
  assert(blogPosting, "Post page is missing parseable BlogPosting JSON-LD.")
  assert(blogPosting.headline?.includes(expected.headline), "BlogPosting headline is unexpected.")
  assert(blogPosting.url === expected.url, "BlogPosting URL is unexpected.")
  assert(blogPosting.articleSection === expected.category, "BlogPosting articleSection is unexpected.")
}

const homeHtml = await routeHtml("home", ["index.html"], [/Wonder Tinker/, /Web and AI/, /Recent posts/])
const builtCss = await readBuiltCssText()
assertCatppuccinTheme("built CSS theme", builtCss)
assertFontLoading(homeHtml)
assertMatches("home", homeHtml, /orca-ade-mini-guide/)
assertMatches("home", homeHtml, /tmux-setup/)
assertMatches("home", homeHtml, /obsidian-cli-agent-workflow/)
assertNoModelInfo("home", homeHtml)

const blogHtml = await routeHtml("blog", ["blog", "index.html"], [
  /Blog/,
  /orca-ade-mini-guide/,
  /opencode-qwen-web-ui-design-agents/,
  /tmux-setup/,
  /obsidian-cli-agent-workflow/,
  /ripgrep-developer-workflow/,
  /jq-developer-workflow/,
  /fd-developer-workflow/,
  /project-map-small-model-data-flow/,
  /wonder-tinker-start/,
  /windows10-disable-dgpu-for-general-apps/,
  /windows10-lazyvim-disable-treesitter/,
  /my-git-pretty/,
  /Developer Tools/,
  /Windows 운영/,
  /Windows 개발 환경/,
  /GitHub 운영/,
  /AI-assisted/,
])
assertNoModelInfo("blog", blogHtml)
assertBlogCategoryTree(blogHtml)
const postChecks = [
  { label: "Orca ADE mini guide", slug: "orca-ade-mini-guide", patterns: [/Orca ADE 미니 설명서/, /Orchestration/, /System/, /Dark/, /Light/, /Hermes/, /Pi/, /Scheduled automations/, /Sources/], headline: "Orca ADE 미니 설명서", category: "Developer Tools", lang: "ko" },
  { label: "post", slug: "wonder-tinker-start", patterns: [/AI-assisted/, /Sources/, /Astro content collections guide/], headline: "Wonder Tinker", category: "Site notes", lang: "en" },
  { label: "windows dGPU post", slug: "windows10-disable-dgpu-for-general-apps", patterns: [/Windows 10/, /Windows 운영/, /GPU routing/, /DXGI_GPU_PREFERENCE/, /nvidia-smi pmon/, /Sources/], headline: "Windows 10", category: "Windows 운영" },
  { label: "LazyVim Tree-sitter post", slug: "windows10-lazyvim-disable-treesitter", patterns: [/Windows 10/, /PowerShell 7\.6/, /Neovim/, /LazyVim/, /nvim-treesitter/, /Tree-sitter/, /Sources/, /LazyVim Configuration/, /nvim-treesitter README/], headline: "Windows 10 LazyVim", category: "Windows 개발 환경", reject: /model\s*notes/i },
  { label: "ripgrep developer workflow post", slug: "ripgrep-developer-workflow", patterns: [/ripgrep/, /Windows without WSL/, /winget install BurntSushi\.ripgrep\.MSVC/, /Claude Code/, /OpenCode/, /Codex/, /Sources/], headline: "ripgrep", category: "Developer Tools" },
  { label: "jq developer workflow post", slug: "jq-developer-workflow", patterns: [/jq를 CLI와 코딩 에이전트의 JSON 필터로 쓰기/, /Windows without WSL/, /winget install jqlang\.jq/, /Claude Code/, /OpenCode/, /Codex/, /약 99%/], headline: "jq를 CLI와 코딩 에이전트", category: "Developer Tools", hideSources: true },
  { label: "fd developer workflow post", slug: "fd-developer-workflow", patterns: [/fd를 CLI와 코딩 에이전트의 파일 탐색기로 쓰기/, /Windows without WSL/, /winget install sharkdp\.fd/, /fd_10\.4\.2_amd64\.deb/, /Claude Code/, /OpenCode/, /Codex/, /파일 후보/], headline: "fd를 CLI와 코딩 에이전트", category: "Developer Tools", hideSources: true },
  { label: "project map small model post", slug: "project-map-small-model-data-flow", patterns: [/작은 모델에게 프로젝트 지도를 건네는 법 1부/, /OpenCode/, /Obsidian/, /CodeGraph/, /ast-grep/, /작은 모델에게 필요한 것은 더 많은 말이 아니라, 더 좋은 입구다\./], headline: "작은 모델에게 프로젝트 지도를 건네는 법 1부", category: "Developer Tools", hideSources: true },
  { label: "OpenCode Qwen design agents post", slug: "opencode-qwen-web-ui-design-agents", patterns: [/OpenCode에서 Qwen 두 모델로 웹 분석과 UI 설계를 나누기/, /qwen3\.6:35b/, /qwen3\.5:9b/, /web-analyst/, /change-mapper/, /md-web-design/, /Sources/], headline: "OpenCode에서 Qwen 두 모델로 웹 분석과 UI 설계를 나누기", category: "Developer Tools" },
  { label: "tmux setup post", slug: "tmux-setup", patterns: [/tmux 설정 해보기/, /tmux 3\.7b/, /tmux-256color/, /vim-tmux-navigator/, /status-style/, /window-status-current-format/, /#181825/, /LazyVim/, /Sources/], headline: "tmux 설정 해보기", category: "Developer Tools", lang: "ko" },
  { label: "Obsidian CLI agent workflow post", slug: "obsidian-cli-agent-workflow", patterns: [/Obsidian CLI로 볼트를 관리하는 법/, /Settings/, /search:context/, /property:set/, /OpenCode/, /Claude Code/, /Codex/, /AGENTS\.md/, /workspace-write/, /Sources/], headline: "Obsidian CLI로 볼트를 관리하는 법", category: "Developer Tools", lang: "ko" },
  { label: "GitHub README post", slug: "my-git-pretty", patterns: [/내 git 예쁘게 꾸미기/, /GitHub 운영/, /README/, /Sources/, /GitHub Docs, About READMEs/, /Shields\.io, Endpoint badges/], headline: "내 git 예쁘게 꾸미기", category: "GitHub 운영" },
]

for (const post of postChecks) {
  const html = await routeHtml(post.label, ["blog", post.slug, "index.html"], post.patterns)
  assertMatches(`${post.label} document language`, html, new RegExp(`<html\\b[^>]*\\blang="${post.lang ?? "ko"}"`, "i"))
  assertMatches(`${post.label} language`, html, new RegExp(`<article\\b[^>]*\\blang="${post.lang ?? "ko"}"`, "i"))
  assertNoModelInfo(post.label, html)
  if (post.reject) assertDoesNotMatch(post.label, html, post.reject)
  if (post.hideSources) assertNoSourcesPanel(post.label, html)
  assertBlogPostingJsonLd(html, {
    headline: post.headline,
    url: `https://wonderrabbit.github.io/blog/${post.slug}/`,
    category: post.category,
  })
}

await routeHtml("editorial policy", ["editorial-policy", "index.html"], [/AI/, /disclos|공개|출처/i])
await routeHtml("privacy", ["privacy", "index.html"], [/analytics/i, /tracking/i, /privacy/i])
await routeHtml("404", ["404.html"], [/404|Not Found|찾을/i])

const rss = await readText(await assertFile("rss.xml"))
assertMatches("rss", rss, /<rss\b|<feed\b|<channel\b/i)
assertMatches("rss", rss, /wonder-tinker-start|Wonder Tinker/)
assertMatches("rss", rss, /opencode-qwen-web-ui-design-agents/)
assertMatches("rss", rss, /tmux-setup/)
assertMatches("rss", rss, /obsidian-cli-agent-workflow/)
assertMatches("rss", rss, /orca-ade-mini-guide/)
assertMatches("rss", rss, /project-map-small-model-data-flow/)
assertDoesNotMatch("rss", rss, /Wonder Tinker local publishing note/)
assert(!/^\s*broken\s*$/i.test(rss), "RSS appears corrupted.")

const sitemapPath = (await exists(filePath("sitemap-index.xml"))) ? await assertFile("sitemap-index.xml") : await assertFile("sitemap.xml")
const sitemap = await readText(sitemapPath)
assertMatches("sitemap", sitemap, /<sitemapindex\b|<urlset\b|<loc>/i)
assertMatches("sitemap", sitemap, /wonderrabbit\.github\.io/)
assert(!/wonder-tinker\.github\.io/i.test(sitemap), "Sitemap contains the old GitHub Pages domain.")
assert(!/github\.io\/wonder-tinker\.github\.io\//i.test(sitemap), "Sitemap contains the old project base path.")

const robots = await readText(await assertFile("robots.txt"))
assertMatches("robots", robots, /User-agent:\s*\*/i)
assertMatches("robots", robots, /Sitemap:\s*https:\/\/wonderrabbit\.github\.io\/sitemap-index\.xml/i)
assert(!/wonder-tinker\.github\.io/i.test(robots), "Robots contains the old GitHub Pages domain.")
assert(!/github\.io\/wonder-tinker\.github\.io\//i.test(robots), "Robots contains the old project base path.")

assert(!(await exists(filePath("CNAME"))), "User Pages deployment must not include an obsolete custom-domain CNAME.")

console.log(`site_verified: ${root}`)
console.log("routes: home blog post lazyvim-post my-git-pretty project-map-post editorial-policy privacy 404")
console.log("feeds: rss sitemap robots")
console.log("metadata: BlogPosting JSON-LD AI disclosure sources")

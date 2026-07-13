import { access, mkdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import axe from "axe-core"
import { chromium } from "playwright"
import {
  assertBlogCategoryTree,
  assertCatppuccinTheme,
  assertDisclosureMetadata,
  assertFdPostMetadata,
  assertGitPrettyPostMetadata,
  assertJqPostMetadata,
  assertLazyVimPostMetadata,
  assertNoHorizontalOverflow,
  assertNoModelInfo,
  assertProjectMapPostMetadata,
  assertQwenDesignAgentsPostMetadata,
  assertRipgrepPostMetadata,
  assertWindowsPostMetadata,
} from "./verify-browser-blog-assertions.mjs"

class BrowserVerificationError extends Error {
  constructor(message) {
    super(message)
    this.name = "BrowserVerificationError"
  }
}

const parseArgs = (args) => {
  const values = new Map()
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (!arg.startsWith("--")) continue
    const key = arg.slice(2)
    const value = args[index + 1]
    if (!value || value.startsWith("--")) {
      throw new BrowserVerificationError(`Missing value for --${key}.`)
    }
    values.set(key, value)
    index += 1
  }
  return values
}

const args = parseArgs(process.argv.slice(2))
const base = args.get("base")
const screenshotsDir = args.get("screenshots")
const a11yPath = args.get("a11y")

if (!base || !screenshotsDir || !a11yPath) {
  throw new BrowserVerificationError("Usage: verify-browser -- --base <url> --screenshots <dir> --a11y <path>")
}

const normalizedBase = base.replace(/\/$/, "")
const screenshotRoot = resolve(screenshotsDir)
const a11yOutput = resolve(a11yPath)

const assert = (condition, message) => {
  if (!condition) {
    throw new BrowserVerificationError(message)
  }
}

const isExpectedMissingPathError = (error) => error instanceof Error && "code" in error && error.code === "ENOENT"

const isBundledBrowserMissingError = (error) =>
  error instanceof Error &&
  (error.message.includes("Executable doesn't exist") ||
    error.message.includes("playwright install") ||
    error.message.includes("Playwright was just installed or updated"))

const endpointChecks = [
  ["/", /Wonder|blog|AI/i],
  ["/blog/", /wonder-tinker-start|windows10-disable-dgpu-for-general-apps|Blog|블로그/i],
  ["/blog/opencode-qwen-web-ui-design-agents/", /qwen3\.6:35b|qwen3\.5:9b|web-analyst|md-web-design/i],
  ["/blog/tmux-setup/", /tmux 3\.7b|tmux-256color|vim-tmux-navigator|status-style|window-status-current-format|LazyVim/i],
  ["/blog/jq-developer-workflow/", /jq|Windows without WSL|Claude Code|OpenCode|Codex/i],
  ["/blog/fd-developer-workflow/", /fd|Windows without WSL|Claude Code|OpenCode|Codex/i],
  ["/blog/ripgrep-developer-workflow/", /ripgrep|Windows without WSL|Claude Code|OpenCode|Codex/i],
  ["/blog/wonder-tinker-start/", /BlogPosting|AI|Wonder/i],
  ["/blog/windows10-disable-dgpu-for-general-apps/", /Windows 10|Windows 운영|GPU routing|DXGI_GPU_PREFERENCE/i],
  ["/blog/my-git-pretty/", /내 git 예쁘게 꾸미기|GitHub 운영|README|Shields\.io/i],
  ["/rss.xml", /<rss|feed|channel/i],
  ["/robots.txt", /User-agent|Sitemap/i],
  ["/editorial-policy/", /AI|disclos|공개|출처/i],
  ["/privacy/", /analytics|tracking|privacy|개인정보|분석/i],
  ["/404.html", /404|Not Found|찾을/i],
]

const pageChecks = [
  ["/", "home.png", /Wonder Tinker/i],
  ["/blog/", "blog.png", /Blog/i],
  ["/blog/opencode-qwen-web-ui-design-agents/", "post-opencode-qwen-web-ui-design-agents.png", /웹 분석과 UI 설계를 나누기/i],
  ["/blog/tmux-setup/", "post-tmux-setup.png", /tmux 설정 해보기/i],
  ["/blog/jq-developer-workflow/", "post-jq-developer-workflow.png", /Windows without WSL/i],
  ["/blog/fd-developer-workflow/", "post-fd-developer-workflow.png", /Windows without WSL/i],
  ["/blog/project-map-small-model-data-flow/", "post-project-map-small-model-data-flow.png", /작은 모델에게 프로젝트 지도를 건네는 법 1부/i],
  ["/blog/ripgrep-developer-workflow/", "post-ripgrep-developer-workflow.png", /Windows without WSL/i],
  ["/blog/wonder-tinker-start/", "post-wonder-tinker-start.png", /Sources/i],
  ["/blog/windows10-disable-dgpu-for-general-apps/", "post-windows10-disable-dgpu-for-general-apps.png", /Windows 운영/i],
  ["/blog/windows10-lazyvim-disable-treesitter/", "post-windows10-lazyvim-disable-treesitter.png", /PowerShell 7\.6/i],
  ["/blog/my-git-pretty/", "post-my-git-pretty.png", /내 git 예쁘게 꾸미기/i],
  ["/editorial-policy/", "editorial-policy.png", /Editorial Policy/i],
  ["/privacy/", "privacy.png", /Privacy/i],
  ["/404.html", "404.png", /404/i],
]

async function assertEndpoint(path, pattern) {
  const response = await fetch(`${normalizedBase}${path}`)
  const body = await response.text()
  assert(response.status === 200, `${path} returned HTTP ${response.status}.`)
  assert(pattern.test(body), `${path} response did not match ${pattern}.`)
  return { path, status: response.status }
}

async function assertSitemap() {
  for (const path of ["/sitemap-index.xml", "/sitemap.xml"]) {
    const response = await fetch(`${normalizedBase}${path}`)
    if (response.status === 200) {
      const body = await response.text()
      assert(/sitemap|urlset|loc/i.test(body), `${path} is not a sitemap response.`)
      return { path, status: response.status }
    }
  }
  throw new BrowserVerificationError("Neither sitemap-index.xml nor sitemap.xml returned HTTP 200.")
}

async function assertHeadingStructure(page, label) {
  const headings = await page.locator("h1,h2,h3,h4,h5,h6").evaluateAll((nodes) =>
    nodes.map((node) => ({
      level: Number(node.tagName.slice(1)),
      text: node.textContent?.trim() ?? "",
    })),
  )
  assert(headings.length > 0, `${label} has no headings.`)
  assert(headings.filter((heading) => heading.level === 1).length === 1, `${label} must have exactly one h1.`)
  assert(headings.every((heading) => heading.text.length > 0), `${label} has an empty heading.`)
  for (let index = 1; index < headings.length; index += 1) {
    assert(headings[index].level - headings[index - 1].level <= 1, `${label} skips heading levels.`)
  }
}

async function assertKeyboardFocus(page, label) {
  await page.keyboard.press("Tab")
  const focus = await page.evaluate(() => {
    const active = document.activeElement
    if (!active || active === document.body) return null
    const style = window.getComputedStyle(active)
    return {
      tag: active.tagName,
      text: active.textContent?.trim() ?? "",
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      boxShadow: style.boxShadow,
    }
  })
  assert(focus, `${label} did not move keyboard focus.`)
  const hasVisibleFocus = focus.outlineStyle !== "none" || focus.outlineWidth !== "0px" || focus.boxShadow !== "none"
  assert(hasVisibleFocus, `${label} active element lacks visible focus styling.`)
}

await mkdir(screenshotRoot, { recursive: true })

const endpointResults = []
for (const [path, pattern] of endpointChecks) {
  endpointResults.push(await assertEndpoint(path, pattern))
}
endpointResults.push(await assertSitemap())

const chromeCandidates = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
]

async function firstExecutable(paths) {
  for (const path of paths) {
    try {
      await access(path)
      return path
    } catch (error) {
      if (!isExpectedMissingPathError(error)) {
        throw error
      }
      continue
    }
  }
  return undefined
}

async function launchBrowser() {
  try {
    return await chromium.launch()
  } catch (error) {
    if (!isBundledBrowserMissingError(error)) {
      throw error
    }
    const executablePath = await firstExecutable(chromeCandidates)
    if (!executablePath) {
      throw error
    }
    return chromium.launch({ executablePath })
  }
}

const browser = await launchBrowser()
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const accessibility = { base: normalizedBase, routes: [], totals: { critical: 0, serious: 0 }, status: "PASS" }

try {
  for (const [path, screenshot, contentPattern] of pageChecks) {
    const url = `${normalizedBase}${path}`
    const response = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 })
    assert(response?.status() === 200, `${path} browser navigation returned HTTP ${response?.status()}.`)
    assert(contentPattern.test(await page.textContent("body")), `${path} body did not match ${contentPattern}.`)
    await assertHeadingStructure(page, path)
    await assertKeyboardFocus(page, path)
    await assertCatppuccinTheme(page, assert)
    if (path === "/blog/") {
      await assertBlogCategoryTree(page, assert)
      await assertNoHorizontalOverflow(page, path, assert)
    }
    if (path === "/blog/wonder-tinker-start/") {
      await assertDisclosureMetadata(page, assert)
    }
    if (path === "/blog/windows10-disable-dgpu-for-general-apps/") {
      await assertWindowsPostMetadata(page)
    }
    if (path === "/blog/windows10-lazyvim-disable-treesitter/") {
      await assertLazyVimPostMetadata(page)
    }
    if (path === "/blog/my-git-pretty/") {
      await assertGitPrettyPostMetadata(page)
    }
    if (path === "/blog/ripgrep-developer-workflow/") {
      await assertRipgrepPostMetadata(page)
    }
    if (path === "/blog/jq-developer-workflow/") {
      await assertJqPostMetadata(page, assert)
    }
    if (path === "/blog/fd-developer-workflow/") {
      await assertFdPostMetadata(page, assert)
    }
    if (path === "/blog/project-map-small-model-data-flow/") {
      await assertProjectMapPostMetadata(page, assert)
    }
    if (path === "/blog/opencode-qwen-web-ui-design-agents/") {
      await assertQwenDesignAgentsPostMetadata(page)
    }
    if (path.startsWith("/blog/")) {
      await assertNoModelInfo(page, path, assert)
    }
    await page.addScriptTag({ content: axe.source })
    const axeResult = await page.evaluate(async () => window.axe.run(document, {
      resultTypes: ["violations"],
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    }))
    const critical = axeResult.violations.filter((violation) => violation.impact === "critical").length
    const serious = axeResult.violations.filter((violation) => violation.impact === "serious").length
    accessibility.totals.critical += critical
    accessibility.totals.serious += serious
    accessibility.routes.push({
      path,
      screenshot,
      critical,
      serious,
      violations: axeResult.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        nodes: violation.nodes.length,
        targets: violation.nodes.map((node) => node.target.join(" ")),
      })),
    })
    await page.screenshot({ path: resolve(screenshotRoot, screenshot), fullPage: true })
  }
} finally {
  await browser.close()
}

await writeFile(a11yOutput, `${JSON.stringify(accessibility, null, 2)}\n`, "utf8")
assert(accessibility.totals.critical === 0, "Critical accessibility violations found.")
assert(accessibility.totals.serious === 0, "Serious accessibility violations found.")

console.log(`browser_verified: ${normalizedBase}`)
console.log(`screenshots: ${screenshotRoot}`)
console.log(`accessibility: ${a11yOutput}`)
console.log("PASS critical:0 serious:0")

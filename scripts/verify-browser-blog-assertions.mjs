export async function assertDisclosureMetadata(page, assert) {
  const jsonLd = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) =>
    nodes.flatMap((node) => {
      try {
        return [JSON.parse(node.textContent ?? "")]
      } catch (error) {
        if (!(error instanceof SyntaxError)) {
          throw error
        }
        return []
      }
    }),
  )
  assert(jsonLd.some((entry) => entry["@type"] === "BlogPosting"), "Post lacks BlogPosting JSON-LD.")
  await page.getByText("AI-assisted").first().waitFor({ state: "visible", timeout: 5000 })
  await page.getByText("Sources").first().waitFor({ state: "visible", timeout: 5000 })
}

export async function assertNoModelInfo(page, label, assert) {
  const body = await page.textContent("body")
  const html = await page.content()
  for (const pattern of [/GPT-[0-9]+\s+Codex/i, /human\s*review/i, /AI\s+and\s+source\s+notes/i, /model\s*notes/i]) {
    assert(!pattern.test(body ?? ""), `${label} body unexpectedly matched ${pattern}.`)
    assert(!pattern.test(html), `${label} html unexpectedly matched ${pattern}.`)
  }
}

export async function assertWindowsPostMetadata(page) {
  await page.getByText("Windows 운영").first().waitFor({ state: "visible", timeout: 5000 })
  await page.getByText("GPU routing").first().waitFor({ state: "visible", timeout: 5000 })
  await page.getByText("DXGI_GPU_PREFERENCE").first().waitFor({ state: "visible", timeout: 5000 })
  await page.getByText("nvidia-smi pmon").first().waitFor({ state: "visible", timeout: 5000 })
  await page.getByText("Sources").first().waitFor({ state: "visible", timeout: 5000 })
}

export async function assertLazyVimPostMetadata(page) {
  for (const text of ["Windows 10", "PowerShell 7.6", "LazyVim", "Neovim", "nvim-treesitter"]) {
    await page.getByText(text).first().waitFor({ state: "visible", timeout: 5000 })
  }
  await page.getByText("Sources").first().waitFor({ state: "visible", timeout: 5000 })
}

export async function assertGitPrettyPostMetadata(page) {
  for (const text of ["GitHub 운영", "GitHub", "README", "Markdown", "오픈소스"]) {
    await page.getByText(text).first().waitFor({ state: "visible", timeout: 5000 })
  }
  await page.getByRole("heading", { name: "Sources" }).waitFor({ state: "visible", timeout: 5000 })
  await page.getByText("GitHub Docs, About READMEs").first().waitFor({ state: "visible", timeout: 5000 })
  await page.getByText("Shields.io, Endpoint badges").first().waitFor({ state: "visible", timeout: 5000 })
}

export async function assertRipgrepPostMetadata(page) {
  for (const text of ["Developer Tools", "ripgrep", "Windows without WSL", "Claude Code", "OpenCode", "Codex"]) {
    await page.getByText(text).first().waitFor({ state: "visible", timeout: 5000 })
  }
  await page.getByRole("heading", { name: "Sources" }).waitFor({ state: "visible", timeout: 5000 })
  await page.getByText("BurntSushi/ripgrep README").first().waitFor({ state: "visible", timeout: 5000 })
  await page.getByText("OpenAI Codex CLI documentation").first().waitFor({ state: "visible", timeout: 5000 })
}

export async function assertJqPostMetadata(page, assert) {
  for (const text of ["Developer Tools", "jq", "Windows without WSL", "Claude Code", "OpenCode", "Codex", "약 99%"]) {
    await page.getByText(text).first().waitFor({ state: "visible", timeout: 5000 })
  }
  assert(await page.getByRole("heading", { name: "Sources" }).count() === 0, "jq post should not render a Sources panel.")
  assert(await page.locator("#sources-heading").count() === 0, "jq post should not render sources-heading.")
}

export async function assertFdPostMetadata(page, assert) {
  for (const text of [
    "Developer Tools",
    "fd",
    "Windows without WSL",
    "winget install sharkdp.fd",
    "fd_10.4.2_amd64.deb",
    "Claude Code",
    "OpenCode",
    "Codex",
    "파일 후보",
  ]) {
    await page.getByText(text).first().waitFor({ state: "visible", timeout: 5000 })
  }
  assert(await page.getByRole("heading", { name: "Sources" }).count() === 0, "fd post should not render a Sources panel.")
  assert(await page.locator("#sources-heading").count() === 0, "fd post should not render sources-heading.")
}

export async function assertProjectMapPostMetadata(page, assert) {
  for (const text of [
    "작은 모델에게 프로젝트 지도를 건네는 법 1부",
    "OpenCode",
    "Obsidian",
    "CodeGraph",
    "ast-grep",
    "작은 모델에게 필요한 것은 더 많은 말이 아니라, 더 좋은 입구다.",
  ]) {
    await page.getByText(text).first().waitFor({ state: "visible", timeout: 5000 })
  }
  assert(
    await page.getByRole("heading", { name: "Sources" }).count() === 0,
    "project map post should not render a Sources panel.",
  )
  assert(await page.locator("#sources-heading").count() === 0, "project map post should not render sources-heading.")
}

export async function assertQwenDesignAgentsPostMetadata(page) {
  for (const text of [
    "Developer Tools",
    "qwen3.6:35b",
    "qwen3.5:9b",
    "web-analyst",
    "change-mapper",
    "design-architect",
    "ui-design-review",
  ]) {
    await page.getByText(text).first().waitFor({ state: "visible", timeout: 5000 })
  }
  await page.getByRole("heading", { name: "Sources" }).waitFor({ state: "visible", timeout: 5000 })
  await page.getByText("OpenCode docs, Agents").first().waitFor({ state: "visible", timeout: 5000 })
  await page.getByText("Ollama library, qwen3.6:35b").first().waitFor({ state: "visible", timeout: 5000 })
  await page.getByText("Ollama library, qwen3.5:9b").first().waitFor({ state: "visible", timeout: 5000 })
}

export async function assertOrcaPostMetadata(page, assert) {
  for (const text of [
    "Developer Tools",
    "Orca",
    "Orchestration",
    "System",
    "Dark",
    "Light",
  ]) {
    await page.getByText(text, { exact: true }).first().waitFor({ state: "visible", timeout: 5000 })
  }
  for (const heading of [
    "7. Pi를 Orca에 붙이기",
    "8. Hermes를 Orca에 붙이기",
    "10. Scheduling: 반복 prompt를 안전하게 예약하기",
  ]) {
    await page.getByRole("heading", { name: heading, exact: true }).waitFor({ state: "visible", timeout: 5000 })
  }
  await page.getByRole("heading", { name: "Sources" }).waitFor({ state: "visible", timeout: 5000 })
  await page.getByText("Orca Docs, Orchestration").first().waitFor({ state: "visible", timeout: 5000 })
  await page.getByText("Pi Documentation").first().waitFor({ state: "visible", timeout: 5000 })
  await page.getByText("Hermes Agent Documentation").first().waitFor({ state: "visible", timeout: 5000 })
  const images = await page.locator("article .prose img").evaluateAll((nodes) =>
    nodes.map((node) => ({
      src: node.getAttribute("src") ?? "",
      naturalWidth: node instanceof HTMLImageElement ? node.naturalWidth : 0,
    })),
  )
  assert(images.length === 7, `Orca post should render 7 screenshots, found ${images.length}.`)
  assert(
    images.every((image) => image.src.startsWith("/images/orca-ade/") && image.naturalWidth > 0),
    "Orca post has a missing or unloaded screenshot.",
  )
}

export async function assertBlogCategoryTree(page, assert) {
  await page.getByRole("navigation", { name: /category tree/i }).waitFor({ state: "visible", timeout: 5000 })
  const tree = await page.evaluate(() => {
    const categoryNav = document.querySelector("[data-category-tree]")
    const categoryHeadings = [...document.querySelectorAll(".category-section h2")].map((heading) =>
      heading.textContent?.trim() ?? "",
    )
    const articleLinks = [...document.querySelectorAll(".article-row h3 a")].map((link) => ({
      text: link.textContent?.trim() ?? "",
      href: link.getAttribute("href") ?? "",
    }))
    const navLinks = [...(categoryNav?.querySelectorAll("a") ?? [])].map((link) => ({
      text: link.textContent?.replace(/\s+/g, " ").trim() ?? "",
      href: link.getAttribute("href") ?? "",
    }))
    return { categoryHeadings, articleLinks, navLinks }
  })
  assert(tree.categoryHeadings.length > 0, "Blog has no grouped category headings.")
  assert(tree.articleLinks.length > 0, "Blog has no article links.")
  assert(tree.navLinks.length >= tree.categoryHeadings.length + tree.articleLinks.length, "Category tree is missing links.")
  for (const category of tree.categoryHeadings) {
    assert(tree.navLinks.some((link) => link.text.includes(category) && link.href.startsWith("#category-")), `Missing tree category link for ${category}.`)
  }
  for (const article of tree.articleLinks) {
    assert(tree.navLinks.some((link) => link.text === article.text && link.href === article.href), `Missing tree post link for ${article.text}.`)
  }
  assert(
    tree.navLinks.every((link) => link.href.startsWith("#category-") || link.href.startsWith("/blog/")),
    "Category tree contains an unexpected link target.",
  )
}

export async function assertCatppuccinTheme(page, assert) {
  await page.waitForLoadState("networkidle")
  const theme = await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load("16px 'Atkinson Hyperlegible'"),
      document.fonts.load("32px Fraunces"),
      document.fonts.load("12px 'JetBrains Mono'"),
      document.fonts.load("16px 'Noto Sans KR'", "한글"),
    ])
    const root = window.getComputedStyle(document.documentElement)
    return {
      surfacePrimary: root.getPropertyValue("--surface-primary").trim(),
      accentPrimary: root.getPropertyValue("--accent-primary").trim(),
      fontFamily: root.fontFamily,
      fonts: {
        atkinson: document.fonts.check("16px 'Atkinson Hyperlegible'"),
        fraunces: document.fonts.check("32px Fraunces"),
        jetbrains: document.fonts.check("12px 'JetBrains Mono'"),
        notoSansKr: document.fonts.check("16px 'Noto Sans KR'", "한글"),
      },
    }
  })
  assert(theme.surfacePrimary.toLowerCase() === "#1e1e2e", `Unexpected surface token ${theme.surfacePrimary}.`)
  assert(theme.accentPrimary.toLowerCase() === "#89b4fa", `Unexpected accent token ${theme.accentPrimary}.`)
  assert(!theme.fontFamily.includes("Avenir"), `Unexpected old font stack ${theme.fontFamily}.`)
  assert(theme.fonts.atkinson, "Atkinson Hyperlegible font is not loaded.")
  assert(theme.fonts.fraunces, "Fraunces font is not loaded.")
  assert(theme.fonts.jetbrains, "JetBrains Mono font is not loaded.")
  assert(theme.fonts.notoSansKr, "Noto Sans KR font is not loaded.")
}

export async function assertNoHorizontalOverflow(page, label, assert) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  assert(sizes.scrollWidth <= sizes.clientWidth, `${label} has horizontal overflow ${sizes.scrollWidth} > ${sizes.clientWidth}.`)
}

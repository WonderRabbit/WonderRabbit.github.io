---
title: "ast-grep을 CLI와 코딩 에이전트의 구조 검색기로 쓰기"
description: "ast-grep의 다운로드 링크, Windows without WSL/macOS/Linux 설치, 구조 검색과 리라이트 사용법, Claude Code, OpenCode, Codex, MCP 연계 방식을 개발자 워크플로 기준으로 정리합니다."
published: "2026-07-01"
draft: false
category: "Developer Tools"
tags:
  - ast-grep
  - CLI
  - Claude Code
  - OpenCode
  - Codex
  - MCP
aiAssisted: true
sources:
  - title: "ast-grep README"
    url: "https://github.com/ast-grep/ast-grep"
    accessed: "2026-07-01"
  - title: "ast-grep Quick Start"
    url: "https://ast-grep.github.io/guide/quick-start.html"
    accessed: "2026-07-01"
  - title: "ast-grep Command Line Tooling Overview"
    url: "https://ast-grep.github.io/guide/tooling-overview.html"
    accessed: "2026-07-01"
  - title: "ast-grep Rewrite Code"
    url: "https://ast-grep.github.io/guide/rewrite-code.html"
    accessed: "2026-07-01"
  - title: "ast-grep Language List"
    url: "https://ast-grep.github.io/reference/languages.html"
    accessed: "2026-07-01"
  - title: "ast-grep Using ast-grep with AI Tools"
    url: "https://ast-grep.github.io/advanced/prompting.html"
    accessed: "2026-07-01"
  - title: "ast-grep llms-full.txt"
    url: "https://ast-grep.github.io/llms-full.txt"
    accessed: "2026-07-01"
  - title: "ast-grep 0.44.0 release"
    url: "https://github.com/ast-grep/ast-grep/releases/tag/0.44.0"
    accessed: "2026-07-01"
  - title: "@ast-grep/cli npm package"
    url: "https://www.npmjs.com/package/@ast-grep/cli"
    accessed: "2026-07-01"
  - title: "Homebrew ast-grep formula"
    url: "https://formulae.brew.sh/formula/ast-grep"
    accessed: "2026-07-01"
  - title: "Claude Code common workflows"
    url: "https://code.claude.com/docs/en/common-workflows"
    accessed: "2026-07-01"
  - title: "Claude Code skills"
    url: "https://code.claude.com/docs/en/skills"
    accessed: "2026-07-01"
  - title: "OpenCode tools documentation"
    url: "https://opencode.ai/docs/tools/"
    accessed: "2026-07-01"
  - title: "OpenCode commands documentation"
    url: "https://opencode.ai/docs/commands/"
    accessed: "2026-07-01"
  - title: "OpenAI Codex CLI documentation"
    url: "https://developers.openai.com/codex/cli"
    accessed: "2026-07-01"
---

`ast-grep`은 `grep`의 이름을 빌렸지만 실제로는 정규식 도구가 아닙니다. 코드를 텍스트 줄이 아니라 AST로 파싱한 뒤, 함수 호출, import, JSX 컴포넌트, Python 함수 정의 같은 "문법 구조"를 찾고 바꿉니다.

그래서 `ripgrep`과 역할이 다릅니다. 문자열, TODO, 파일명, 로그 키워드는 `rg`가 빠릅니다. 반대로 "인자가 3개인 함수", "`console.log($MSG)` 호출", "`useEffect` 안의 특정 패턴", "Python 함수 정의와 호출을 함께 rename" 같은 질문은 `ast-grep`이 맞습니다.

이 글의 확인 시점은 2026년 7월 1일입니다. 공식 GitHub latest release, npm, Homebrew 메타데이터가 모두 `0.44.0`을 가리켰고, npm 배포판으로 `ast-grep 0.44.0` 실행까지 확인했습니다.

## 다운로드와 설치

실행 파일 이름은 보통 `ast-grep`과 `sg` 둘 다 제공됩니다. 다만 Linux에는 `sg`라는 기존 `setgroups` 명령이 있을 수 있으므로, 문서나 팀 스크립트에는 `ast-grep` 전체 이름을 쓰는 편이 덜 헷갈립니다.

| 환경 | 추천 설치 | 직접 다운로드 |
| :--- | :--- | :--- |
| Windows without WSL, x64 | `npm i -g @ast-grep/cli` | [`app-x86_64-pc-windows-msvc.zip`](https://github.com/ast-grep/ast-grep/releases/download/0.44.0/app-x86_64-pc-windows-msvc.zip) |
| Windows without WSL, ARM64 | `npm i -g @ast-grep/cli` | [`app-aarch64-pc-windows-msvc.zip`](https://github.com/ast-grep/ast-grep/releases/download/0.44.0/app-aarch64-pc-windows-msvc.zip) |
| Windows without WSL, 32-bit | `scoop install main/ast-grep` 또는 release ZIP | [`app-i686-pc-windows-msvc.zip`](https://github.com/ast-grep/ast-grep/releases/download/0.44.0/app-i686-pc-windows-msvc.zip) |
| macOS Apple Silicon | `brew install ast-grep` | [`app-aarch64-apple-darwin.zip`](https://github.com/ast-grep/ast-grep/releases/download/0.44.0/app-aarch64-apple-darwin.zip) |
| macOS Intel | `brew install ast-grep` | [`app-x86_64-apple-darwin.zip`](https://github.com/ast-grep/ast-grep/releases/download/0.44.0/app-x86_64-apple-darwin.zip) |
| Linux x86_64 | `npm i -g @ast-grep/cli` 또는 `cargo install ast-grep --locked` | [`app-x86_64-unknown-linux-gnu.zip`](https://github.com/ast-grep/ast-grep/releases/download/0.44.0/app-x86_64-unknown-linux-gnu.zip) |
| Linux ARM64 | `npm i -g @ast-grep/cli` 또는 `cargo install ast-grep --locked` | [`app-aarch64-unknown-linux-gnu.zip`](https://github.com/ast-grep/ast-grep/releases/download/0.44.0/app-aarch64-unknown-linux-gnu.zip) |

공식 Quick Start는 Homebrew, MacPorts, Nix, Cargo, npm, pip 설치 경로를 안내합니다. 팀 단위로는 npm이 가장 무난합니다. Node만 있으면 Windows without WSL, macOS, Linux가 같은 명령으로 맞춰집니다.

```bash
npm i -g @ast-grep/cli
ast-grep --version
sg --version
```

macOS에서 Homebrew를 이미 쓴다면 더 짧습니다.

```bash
brew install ast-grep
ast-grep --version
```

Rust 툴체인이 있는 개발자라면 Cargo 설치도 괜찮습니다.

```bash
cargo install ast-grep --locked
ast-grep --version
```

Python 중심 환경에서는 `pip install ast-grep-cli`도 가능하지만, 여러 언어 저장소에서 팀 표준으로 굳힐 때는 npm이나 Homebrew 쪽이 설명 비용이 낮았습니다.

Windows에서 Scoop을 이미 쓴다면 공식 README의 예시처럼 설치할 수 있습니다.

```powershell
scoop install main/ast-grep
ast-grep --version
```

## 기본 사용법

가장 중요한 규칙은 하나입니다. 패턴은 정규식이 아니라 "코드처럼 생긴 코드"여야 합니다.

```bash
ast-grep run -p 'console.log($MSG)' --lang ts src
ast-grep run -p 'useEffect($$$)' --lang tsx src
ast-grep run -p 'def $NAME($$$)' --lang py .
```

`$MSG`, `$NAME` 같은 대문자 메타 변수는 하나의 AST 노드를 잡습니다. `$$$`는 여러 노드를 잡을 때 씁니다. 셸이 `$MSG`를 환경 변수로 해석하지 않도록 패턴은 작은따옴표로 감싸야 합니다.

검색 결과를 사람이 읽을 때는 기본 출력이 편하고, 에이전트나 스크립트에 넘길 때는 JSON이 좋습니다.

```bash
ast-grep run -p 'console.log($MSG)' --lang ts --json=compact src
ast-grep run -p 'import $X from $Y' --lang ts --json=compact src
```

stdin도 지원합니다. 이 방식은 LLM 도구와 붙일 때 좋습니다. 전체 파일을 모델에 던지지 않고, 후보 코드 조각만 구조적으로 검사할 수 있기 때문입니다.

```bash
printf 'console.log(user.id)\nlogger.info(user.id)\n' \
  | ast-grep run -p 'console.log($MSG)' --lang ts --json=compact --stdin
```

제가 확인한 실행 결과에서는 `console.log(user.id)` 한 줄만 매칭됐고 `logger.info(user.id)`는 빠졌습니다. 텍스트에 `log`가 들어가는지를 찾은 것이 아니라, `console.log(...)`라는 호출 구조를 잡은 것입니다.

## 리라이트와 스캔

`ast-grep`은 찾는 데서 끝나지 않습니다. `--rewrite`로 일회성 변경을 만들 수 있습니다.

```bash
ast-grep run \
  -p 'console.log($MSG)' \
  --rewrite 'logger.info($MSG)' \
  --lang ts \
  --interactive \
  src
```

`--interactive`는 결과를 하나씩 보고 적용할 수 있어 초반 패턴 검증에 좋습니다. 패턴이 충분히 좁혀진 뒤에는 `--update-all`로 일괄 적용할 수 있습니다.

```bash
ast-grep run \
  -p 'console.log($MSG)' \
  --rewrite 'logger.info($MSG)' \
  --lang ts \
  --update-all \
  src
```

반복 규칙은 YAML로 승격합니다. 예를 들어 `console.log`를 금지하는 룰은 이렇게 시작할 수 있습니다.

```yaml
id: no-console-log
language: TypeScript
message: Use logger instead of console.log
severity: warning
rule:
  pattern: console.log($MSG)
fix: logger.info($MSG)
```

그리고 스캔합니다.

```bash
ast-grep scan -r rules/no-console-log.yml src
ast-grep scan -r rules/no-console-log.yml --update-all src
```

제 기준은 이렇습니다.

| 작업 | 우선 도구 |
| :--- | :--- |
| 문자열, TODO, URL, 파일명 찾기 | `rg` |
| 함수 호출, import, class, JSX, AST 구조 찾기 | `ast-grep run` |
| 팀 규칙으로 반복 검사 | `ast-grep scan` |
| 코드베이스 전반의 확정 리라이트 | `ast-grep scan` + YAML rule |
| 타입 의미, 참조 추적, rename 안정성 | LSP 또는 컴파일러 |

## 지원 언어와 실전 감각

공식 언어 목록 기준으로 Bash, C, C++, C#, CSS, Elixir, Go, Haskell, HCL, HTML, Java, JavaScript, JSON, Kotlin, Lua, Nix, PHP, Python, Ruby, Rust, Scala, Solidity, Swift, TypeScript, TSX, YAML을 지원합니다.

프론트엔드 프로젝트에서는 TypeScript와 TSX가 특히 좋습니다.

```bash
ast-grep run -p 'useState($INIT)' --lang tsx src
ast-grep run -p '<$COMP $$$ />' --lang tsx src
ast-grep run -p 'import $NAME from "$PATH"' --lang ts src
```

Python에서는 함수 정의와 호출 패턴을 먼저 잡아 영향 범위를 줄입니다.

```bash
ast-grep run -p 'def $NAME($$$)' --lang py .
ast-grep run -p '$CLIENT.get($URL, $$$)' --lang py .
```

Rust나 Go에서도 API 호출 모양을 찾는 데 쓸 수 있지만, 타입 기반 의미까지 보장하지는 않습니다. "이 심볼이 진짜 같은 타입인가"가 중요하면 LSP, 컴파일러, 테스트가 다음 단계입니다.

## Claude Code와 같이 쓰기

Claude Code 문서는 큰 코드베이스를 이해할 때 넓은 질문에서 시작하고, 특정 파일과 흐름으로 좁히는 워크플로를 안내합니다. `ast-grep`은 그 "좁히는 단계"를 사람이 더 정확하게 준비하는 도구입니다.

나쁜 요청:

```text
이 저장소에서 React hook을 잘못 쓰는 곳을 찾아줘.
```

좋은 요청:

````text
아래 ast-grep 결과를 기준으로 hook 사용 패턴을 검토해줘.
누락 가능성이 있는 구조 검색 패턴도 제안해줘.

```bash
ast-grep run -p 'useEffect($$$)' --lang tsx --json=compact src
ast-grep run -p 'useMemo($$$)' --lang tsx --json=compact src
```
````

Claude Code 쪽에서는 skill로 굳히는 방법도 있습니다. ast-grep 공식 문서는 Claude Code skill 방식, `AGENTS.md`에 "문법 구조 검색은 ast-grep을 우선하라"는 지시를 넣는 방식, `llms-full.txt`를 모델 컨텍스트에 제공하는 방식, 그리고 `ast-grep-mcp`를 통한 반복 룰 개발 방식을 안내합니다.

저라면 프로젝트 루트의 `AGENTS.md`에 이 정도만 둡니다.

```md
Use `ast-grep` for syntax-aware searches and deterministic rewrites.
Use `rg` for plain text, comments, URLs, and filenames.
Always quote ast-grep patterns with single quotes.
Dry-run or interactive-check before `--update-all`.
```

길게 쓰면 모델이 매번 읽어야 할 정책이 늘어납니다. 핵심 규칙만 두고, 복잡한 룰 작성법은 별도 skill이나 문서로 분리하는 편이 낫습니다.

## OpenCode와 같이 쓰기

OpenCode 문서는 built-in tool로 `bash`, `grep`, `glob`, `read`, `edit`, `apply_patch`, `skill`, `webfetch`, `websearch` 등을 제공합니다. 기본 `grep`은 정규식 기반 파일 내용 검색입니다. AST 구조 검색이 필요하면 `bash`에서 `ast-grep`을 직접 호출하거나, custom command로 패턴을 묶는 방식이 맞습니다.

예를 들어 `.opencode/commands/no-console.md` 같은 명령을 만들 수 있습니다.

````md
---
description: Find console.log calls structurally
---

아래 ast-grep 결과를 기준으로 실제 제거 대상과 허용 가능한 디버그 코드를 분리해줘.

```bash
ast-grep run -p 'console.log($MSG)' --lang ts --json=compact src
```
````

OpenCode가 이미 `grep` 도구를 갖고 있어도, `grep`과 `ast-grep`의 목적은 다릅니다. `grep`은 "텍스트가 있는가"를 빠르게 묻고, `ast-grep`은 "이 문법 모양이 있는가"를 묻습니다. LLM에게는 후자가 더 작은 검토 단위를 줍니다.

## Codex와 같이 쓰기

Codex CLI는 로컬 작업 디렉터리에서 코드를 읽고, 파일을 고치고, 셸 명령을 실행하는 흐름에 맞춰져 있습니다. 이 환경에서 `ast-grep`은 모델이 파일을 넓게 읽기 전에 후보를 줄이는 전처리 도구가 됩니다.

Codex에게 바로 이렇게 맡기는 것보다,

```text
console.log를 logger로 바꿔줘.
```

먼저 구조 검색 결과와 정책을 같이 주면 더 안정적입니다.

````text
아래 명령으로 console.log 호출 후보를 먼저 확인해줘.
문자열 검색이 아니라 AST 구조 검색으로만 판단하고,
logger.info로 바꾸기 전에 테스트 코드와 예제 코드는 제외할지 제안해줘.

```bash
ast-grep run -p 'console.log($MSG)' --lang ts --json=compact src
```
````

Codex 쪽 규칙 파일에도 같은 원칙을 넣을 수 있습니다.

```md
For code-shape queries, use ast-grep before broad file reads.
For text queries, use rg.
For rewrites, run ast-grep in preview or interactive mode before applying.
```

이 규칙의 핵심은 모델에게 모든 판단을 넘기지 않는 것입니다. 도구가 잘하는 구조 매칭은 도구에 맡기고, 모델은 "이 매칭이 업무적으로 맞는가", "예외가 있는가", "테스트와 문서까지 어떻게 반영할 것인가"를 판단하게 합니다.

## MCP와 LLM tool로 붙일 때

공식 ast-grep AI 문서는 `ast-grep-mcp`를 실험적 MCP 서버로 소개합니다. 목적은 단순합니다. AI가 셸에 문자열 명령을 던지는 대신, AST dump, pattern dump, rule test 같은 더 구조화된 도구를 호출하게 만드는 것입니다.

복잡한 룰은 처음부터 맞기 어렵습니다. 예를 들어 "try/catch가 없는 async 함수" 같은 조건은 한 줄 패턴으로 끝나지 않습니다. MCP나 전용 tool을 붙이면 모델은 이런 순서로 좁힐 수 있습니다.

1. 사용자 요청을 더 작은 구조 조건으로 나눈다.
2. 예제 코드에서 AST를 덤프한다.
3. 단일 sub-rule을 만든다.
4. 예제에 매칭되는지 테스트한다.
5. 관계형 rule이나 composite rule로 결합한다.
6. 실패하면 AST와 pattern query를 다시 보고 수정한다.

이 과정은 사람이 `--debug-query`와 Playground를 오가며 하던 일을 모델 도구 호출로 바꾸는 것입니다. 효과는 "모델이 똑똑해진다"보다 "모델이 덜 추측한다"에 가깝습니다.

## 모델 부담은 어떻게 줄어드나

LLM에게 부담이 되는 일은 대체로 세 가지입니다.

첫째, 너무 많은 파일을 읽는 일입니다. `ast-grep run --json=compact`는 파일, range, 매칭 텍스트, 메타 변수만 좁혀 줍니다. 모델이 전체 저장소를 훑지 않고 후보만 검토할 수 있습니다.

둘째, 텍스트 검색의 false positive를 사람이 다시 걸러야 하는 일입니다. `rg "log"`는 `logger`, `catalog`, 문서 예제까지 잡을 수 있습니다. `ast-grep -p 'console.log($MSG)'`는 호출 구조만 잡습니다.

셋째, 리라이트 범위를 설명으로만 유지하는 일입니다. "모든 console.log를 logger.info로 바꿔"는 모호합니다. `ast-grep` 패턴과 rewrite는 변경 범위를 기계적으로 고정합니다. 모델은 그 위에서 예외 정책을 결정하면 됩니다.

작업을 나누면 효율이 좋아집니다.

| 단계 | 도구가 맡을 일 | 모델이 맡을 일 |
| :--- | :--- | :--- |
| 후보 수집 | `ast-grep run --json=compact` | 결과가 업무 의도와 맞는지 판단 |
| 패턴 개선 | `--debug-query`, Playground, MCP rule test | 누락/과매칭 사례를 설명하고 패턴 수정 |
| 리라이트 | `--interactive`, `--update-all`, YAML `fix` | 예외 정책, 테스트 영향, 커밋 단위 결정 |
| 회귀 확인 | 테스트, 타입체크, `ast-grep scan` | 실패 원인 해석과 최소 수정 |

이 방식은 특히 작은 모델이나 빠른 모델에 유리합니다. 모델이 전체 코드를 장기 기억처럼 들고 있을 필요가 줄어들고, 구조 검색 결과라는 좁은 증거 위에서만 추론하면 되기 때문입니다.

## 실전 운영 규칙

제가 팀에 넣는 규칙은 짧습니다.

```md
Use rg for text. Use ast-grep for syntax shape.
Prefer ast-grep JSON when giving search results to an LLM.
Never apply ast-grep rewrites before preview or interactive review.
Promote repeated ad-hoc patterns into YAML rules.
Use LSP/compiler/tests for semantic guarantees after AST rewrites.
```

그리고 실제 리팩터는 이런 순서로 진행합니다.

```bash
ast-grep run -p 'console.log($MSG)' --lang ts --json=compact src
ast-grep run -p 'console.log($MSG)' --rewrite 'logger.info($MSG)' --lang ts --interactive src
npm test
npm run typecheck
```

에이전트에게는 마지막에 이렇게 맡깁니다.

```text
위 ast-grep 결과와 interactive 적용 결과를 기준으로,
테스트 실패를 고치고 예외 케이스가 남았는지 검토해줘.
문자열 검색으로 범위를 넓히기 전에 먼저 구조 검색 패턴을 제안해줘.
```

`ast-grep`의 장점은 모델을 대체하는 것이 아니라, 모델이 애매하게 추측하던 검색과 리라이트를 더 결정적으로 만드는 데 있습니다. CLI 단독으로도 충분히 유용하지만, Claude Code, OpenCode, Codex 같은 에이전트와 붙였을 때 진짜 효과가 납니다. 모델에게 저장소 전체를 외우게 하지 말고, 구조적으로 좁힌 증거를 주는 쪽이 더 싸고 빠르고 덜 위험합니다.

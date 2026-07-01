---
title: "ripgrep을 개발자와 코딩 에이전트의 기본 검색기로 쓰기"
description: "ripgrep의 다운로드 링크, Windows without WSL/macOS/Linux 설치, 실전 사용법, Claude Code, OpenCode, Codex 연계 방식을 개발자 워크플로 기준으로 정리합니다."
published: "2026-07-01"
draft: false
category: "Developer Tools"
tags:
  - ripgrep
  - CLI
  - Claude Code
  - OpenCode
  - Codex
aiAssisted: true
sources:
  - title: "BurntSushi/ripgrep README"
    url: "https://github.com/BurntSushi/ripgrep"
    accessed: "2026-07-01"
  - title: "BurntSushi/ripgrep latest release"
    url: "https://github.com/BurntSushi/ripgrep/releases/latest"
    accessed: "2026-07-01"
  - title: "BurntSushi/ripgrep User Guide"
    url: "https://github.com/BurntSushi/ripgrep/blob/master/GUIDE.md"
    accessed: "2026-07-01"
  - title: "Claude Code common workflows"
    url: "https://code.claude.com/docs/en/common-workflows"
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
  - title: "OpenAI local shell tool documentation"
    url: "https://developers.openai.com/api/docs/guides/tools-local-shell"
    accessed: "2026-07-01"
---

`ripgrep`은 설치해 두면 사람이 직접 쓰는 검색기이면서, Claude Code, OpenCode, Codex 같은 코딩 에이전트에게도 좋은 전처리 도구가 됩니다. 핵심은 단순합니다. 전체 저장소를 모델 컨텍스트에 밀어 넣기 전에 `rg`로 후보 파일과 라인을 좁히면, 모델은 덜 읽고 더 정확한 결정을 할 수 있습니다.

이 글의 확인 시점은 2026년 7월 1일입니다. GitHub latest release는 `15.1.0`을 가리켰고, 로컬 작업 환경에는 `ripgrep 14.1.1`이 설치되어 있었습니다. 버전이 바뀌는 도구라서 아래의 직접 다운로드 예시는 고정 버전 링크로 쓰고, 새 설치는 가능하면 `releases/latest`나 패키지 매니저를 먼저 확인하는 쪽이 안전합니다.

## 다운로드와 설치

공식 바이너리 이름은 `rg`입니다. 공식 README는 Windows, macOS, Linux용 precompiled binary를 release마다 제공한다고 설명합니다.

| 환경 | 추천 설치 | 직접 다운로드 예시 |
| :--- | :--- | :--- |
| Windows without WSL | `winget install BurntSushi.ripgrep.MSVC` | `ripgrep-15.1.0-x86_64-pc-windows-msvc.zip` |
| Windows ARM64 | `winget install BurntSushi.ripgrep.MSVC` 또는 release ZIP | `ripgrep-15.1.0-aarch64-pc-windows-msvc.zip` |
| macOS Apple Silicon | `brew install ripgrep` | `ripgrep-15.1.0-aarch64-apple-darwin.tar.gz` |
| macOS Intel | `brew install ripgrep` | `ripgrep-15.1.0-x86_64-apple-darwin.tar.gz` |
| Linux x86_64 static | distro package 또는 release archive | `ripgrep-15.1.0-x86_64-unknown-linux-musl.tar.gz` |
| Debian/Ubuntu x86_64 | `sudo apt-get install ripgrep` 또는 `.deb` | `ripgrep_15.1.0-1_amd64.deb` |

Windows에서 WSL 없이 쓰려면 MSVC ZIP이나 `winget` 경로가 가장 단순합니다. Chocolatey와 Scoop도 공식 README에 설치 예시가 있습니다.

```powershell
winget install BurntSushi.ripgrep.MSVC
choco install ripgrep
scoop install ripgrep
rg --version
```

macOS와 Linux에서는 Homebrew가 가장 짧습니다.

```bash
brew install ripgrep
rg --version
```

Debian/Ubuntu의 배포판 패키지는 설치가 쉽지만 버전이 느릴 수 있습니다. 최신 고정 버전이 필요하면 release의 `.deb`를 받습니다.

```bash
curl -LO https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep_15.1.0-1_amd64.deb
sudo dpkg -i ripgrep_15.1.0-1_amd64.deb
rg --version
```

## 기본 사용법

`rg pattern`은 현재 디렉터리 아래를 재귀적으로 검색합니다. 기본값이 개발자 친화적입니다. `.gitignore`를 존중하고, 숨김 파일과 바이너리 파일을 건너뜁니다.

```bash
rg "createUser"
rg -n "createUser" src tests
rg -i "authorization"
rg -F "literal.string.with.dots"
rg -w "token"
rg -C 2 "throw new"
```

LLM과 같이 쓸 때는 먼저 파일 후보를 줄이는 명령을 자주 씁니다.

```bash
rg --files
rg --files -g "*.ts" -g "!dist/**"
rg -l "useMutation" src
rg -n "TODO|FIXME" --glob "*.md"
```

결과가 안 나올 때는 필터링을 의심해야 합니다. `ripgrep`은 숨김 파일, ignore된 파일, 바이너리를 기본적으로 건너뜁니다.

```bash
rg "OPENAI_API_KEY" -u
rg "OPENAI_API_KEY" -uu
rg "OPENAI_API_KEY" -uuu
```

내 기준은 이렇습니다.

| 플래그 | 언제 쓰나 |
| :--- | :--- |
| `-u` | `.gitignore` 때문에 빠지는 파일이 의심될 때 |
| `-uu` | `.env.example`, `.github`, `.claude`, `.opencode` 같은 숨김 경로까지 볼 때 |
| `-uuu` | binary 판정까지 끄고 마지막으로 확인할 때 |
| `-P` | lookaround나 backreference가 꼭 필요할 때 |
| `--sort path` | 에이전트에게 안정적인 출력 순서를 넘길 때 |
| `--json` | 스크립트가 검색 결과를 파싱해야 할 때 |

## 사람이 직접 쓸 때의 효용

`rg`는 "읽기 전에 좁힌다"는 습관을 만들어 줍니다. 예를 들어 `auth`가 어디 있는지 모를 때 파일 트리를 눈으로 훑는 대신 먼저 후보를 뽑습니다.

```bash
rg -n "auth|session|token" src packages --glob "*.{ts,tsx,js,jsx}"
```

변경 전 영향 범위도 빠르게 봅니다.

```bash
rg -n "functionName|ComponentName|ENV_NAME"
rg -l "oldApiName" | sort
```

문서 작업에서도 좋습니다.

```bash
rg -n "TODO|TBD|placeholder|lorem" docs src/content
rg -n "https?://[^ )]+" src/content/posts
```

여기까지는 단독 CLI의 장점입니다. 하지만 코딩 에이전트와 붙이면 효과가 더 커집니다.

## Claude Code와 같이 쓰기

Claude Code 문서는 새 코드베이스를 이해할 때 넓은 질문에서 시작해 구체 컴포넌트로 내려가라고 안내합니다. 이때 사람이 먼저 `rg` 결과를 붙이면 질문이 더 작아집니다.

나쁜 요청:

```text
이 저장소의 인증 흐름을 전부 찾아서 설명해줘.
```

좋은 요청:

````text
아래 rg 결과를 기준으로 인증 흐름을 설명해줘. 누락 가능성이 있는 키워드도 제안해줘.

```bash
rg -n "auth|session|token|login" src packages
```
````

Claude Code는 파이프 입력, 작업 재개, subagent 같은 워크플로를 문서화하고 있습니다. 그래서 로그나 diff를 먼저 CLI에서 줄인 뒤 넘기는 방식이 잘 맞습니다.

```bash
git diff --name-only main...HEAD | rg "src/|test/"
rg -n "deprecatedApi" src test | claude -p "이 변경 범위를 기준으로 리팩터 계획을 요약해줘"
```

핵심은 모델에게 "찾아줘"를 던지는 대신 "이 검색 결과가 맞는지 검토하고 다음 검색어를 제안해줘"라고 맡기는 것입니다.

## OpenCode와 같이 쓰기

OpenCode는 built-in tool로 `bash`, `grep`, `glob`, `read`, `edit`, `apply_patch`를 제공합니다. 문서상 `bash`는 프로젝트 환경에서 터미널 명령을 실행하고, `grep`은 정규식 기반 코드 검색을 수행합니다. 또 custom commands에서는 `` !`command` `` 형태로 shell output을 프롬프트에 주입할 수 있습니다.

반복 작업은 `.opencode/commands/`에 묶어 둘 수 있습니다.

````md
---
description: Find likely stale TODO and placeholder text
---

다음 rg 결과를 기준으로 실제로 처리해야 할 항목과 무시해도 되는 항목을 분리해줘.

!`rg -n "TODO|TBD|placeholder|lorem" src docs --glob "!dist/**"`
````

이 방식은 OpenCode에게 전체 저장소를 막 읽히는 대신, 사람이 의도한 검색 표면만 먼저 보여줍니다. 특히 큰 monorepo에서는 `@file` 참조보다 `rg -l`로 후보 파일을 먼저 만든 뒤 필요한 파일만 지정하는 흐름이 더 안정적입니다.

```bash
rg -l "billing|invoice|subscription" packages apps
```

## Codex와 같이 쓰기

Codex CLI 문서는 Codex가 로컬 터미널에서 실행되며 선택한 디렉터리 안의 코드를 읽고, 변경하고, 명령을 실행할 수 있다고 설명합니다. 이 환경에서는 `rg`가 거의 기본 전처리 도구입니다.

Codex에게 바로 이렇게 시키는 것보다,

```text
이 레포에서 RSS 생성 흐름을 찾아서 수정해줘.
```

먼저 이렇게 좁히면 더 낫습니다.

```bash
rg -n "rss|feed|sitemap" src scripts
```

그리고 Codex에는 결과와 목표를 같이 줍니다.

```text
아래 rg 결과가 RSS 관련 후보야. src/pages/rss.xml.ts와 src/lib/rssXml.ts를 우선 읽고,
scripts/verify-site.mjs의 RSS 검증까지 맞춰 수정해줘.
```

OpenAI의 local shell 문서는 shell command 요청과 command output을 반복해서 주고받는 루프를 설명합니다. 실무적으로 이 루프에서 중요한 것은 명령을 많이 실행하는 것이 아니라, 출력량을 작고 결정적으로 만드는 것입니다. `rg -n`, `rg -l`, `rg --files`, `rg --json`은 그 목적에 잘 맞습니다.

## 모델 부담을 줄이는 실제 패턴

모델 부담이 줄어드는 지점은 세 가지입니다.

1. **파일 후보 축소**: `rg -l`로 "읽을 파일"만 남긴다.
2. **라인 근거 축소**: `rg -n`으로 "읽을 줄 주변"만 남긴다.
3. **반복 가능성 확보**: 같은 검색 명령을 evidence로 남겨 다음 세션이나 subagent가 다시 실행할 수 있게 한다.

예를 들어 "설정 스키마가 어디서 검증되는지"를 찾을 때는 이렇게 시작합니다.

```bash
rg -n "z\\.object|schema|validate|parse" src packages --glob "*.{ts,tsx,mts,cts}"
```

변경 후 public surface를 확인할 때는 이렇게 봅니다.

```bash
rg -n "Sources|AI-assisted|BlogPosting" dist/blog
```

에이전트에게는 검색 명령도 같이 남깁니다.

```text
근거 명령:
- rg -n "z\\.object|schema|validate|parse" src packages --glob "*.{ts,tsx,mts,cts}"
- rg -n "Sources|AI-assisted|BlogPosting" dist/blog

이 결과에 없는 파일은 우선순위에서 제외해도 된다. 단, import 경로가 이어지면 추가로 읽어라.
```

이 문장이 중요합니다. `rg` 결과는 완전한 증명이 아닙니다. 하지만 탐색의 시작점을 정하고, 누락 가능성을 모델이 검토하게 만드는 데 충분히 강합니다.

## 내 기본 레시피

새 저장소에 들어가면 아래 순서로 봅니다.

```bash
rg --files | head -80
rg -n "TODO|FIXME|HACK|deprecated" .
rg -n "test|spec|vitest|jest|playwright" package.json src test scripts
rg -n "build|check|lint|typecheck|verify" package.json README.md docs scripts
```

기능을 찾을 때는 domain word를 먼저 씁니다.

```bash
rg -n "invoice|billing|subscription|plan|quota" .
```

심볼을 찾을 때는 literal 검색으로 시작합니다.

```bash
rg -n -F "createInvoice"
```

정규식이 필요할 때만 regex로 올립니다.

```bash
rg -n "create[A-Z][A-Za-z]+\\("
```

에이전트와 같이 일할 때는 결과를 전부 붙이지 않습니다. 보통 상위 20-80줄이면 충분합니다. 나머지는 "필요하면 같은 명령을 다시 실행하라"고 지시합니다.

## 결론

`ripgrep`은 grep보다 빠른 검색기라는 설명만으로는 작게 보입니다. 실제 가치는 개발자의 탐색 단위를 바꾸는 데 있습니다. 먼저 좁히고, 그 다음 읽고, 마지막에 수정합니다.

LLM 코딩 도구에서도 같은 원칙이 통합니다. `rg`로 후보를 줄인 뒤 Claude Code, OpenCode, Codex에게 넘기면 모델은 전체 저장소를 추측으로 훑지 않아도 됩니다. 도구 호출 수와 컨텍스트 소비를 줄이고, 답변은 더 근거 중심이 됩니다.

내 기준에서 `rg`는 선택 도구가 아니라 기본 도구입니다. 사람이 쓰든 에이전트가 쓰든, 큰 작업을 작게 만드는 첫 번째 명령입니다.

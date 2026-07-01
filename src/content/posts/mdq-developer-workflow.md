---
title: "mdq를 CLI와 코딩 에이전트의 Markdown 필터로 쓰기"
description: "mdq의 다운로드 링크, Windows without WSL/macOS/Linux 설치, Markdown 질의 사용법, Claude Code, OpenCode, Codex와 붙였을 때 모델 부담을 줄이는 방식을 개발자 워크플로 기준으로 정리합니다."
published: "2026-07-01"
draft: false
category: "Developer Tools"
tags:
  - mdq
  - Markdown
  - CLI
  - Claude Code
  - OpenCode
  - Codex
aiAssisted: true
showSources: false
sources:
  - title: "yshavit/mdq README"
    url: "https://github.com/yshavit/mdq"
    accessed: "2026-07-01"
  - title: "mdq v0.10.0 release"
    url: "https://github.com/yshavit/mdq/releases/tag/v0.10.0"
    accessed: "2026-07-01"
  - title: "Homebrew mdq formula"
    url: "https://formulae.brew.sh/formula/mdq"
    accessed: "2026-07-01"
  - title: "mdq playground"
    url: "https://yshavit.github.io/mdq-playground"
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

`mdq`는 Markdown용 `jq`에 가깝습니다. JSON에는 `jq`가 있고 코드에는 `rg`나 `ast-grep`이 있다면, Markdown에는 `mdq`가 들어갈 자리가 있습니다. README, PR 본문, 이슈 템플릿, 릴리스 노트, 회의록, 에이전트 작업 로그처럼 "문서는 Markdown인데 필요한 건 일부 섹션뿐"인 경우가 생각보다 많습니다.

LLM 도구와 같이 쓸 때 장점이 더 분명합니다. 큰 Markdown 문서를 그대로 모델에게 붙이면 모델은 제목, 표, 체크박스, 링크, 주석을 전부 읽어야 합니다. 반대로 `mdq`로 "미완료 체크리스트", "Ticket 섹션", "특정 표의 행"만 뽑아 주면 모델은 판단에 필요한 부분만 봅니다. 컨텍스트를 아끼는 도구라기보다, 모델에게 읽힐 입력을 사람이 재현 가능한 명령으로 줄이는 도구입니다.

확인 시점은 2026년 7월 1일입니다. GitHub latest release와 Homebrew formula는 `mdq 0.10.0`을 가리켰고, macOS ARM64 릴리스 바이너리로 `mdq 0.10.0` 실행까지 확인했습니다.

## 다운로드와 설치

실행 파일 이름은 `mdq`입니다. 공식 릴리스에는 Windows x64 ZIP, macOS ARM64 tarball, Linux x64 glibc/musl tarball이 올라와 있습니다. macOS Intel, Windows ARM64처럼 릴리스 바이너리가 따로 없는 환경은 Homebrew, Docker, Cargo 쪽이 현실적입니다.

| 환경 | 추천 설치 | 직접 다운로드 |
| :--- | :--- | :--- |
| Windows without WSL, x64 | 릴리스 ZIP을 받아 `mdq.exe`를 PATH에 추가 | [`mdq-windows-x64.zip`](https://github.com/yshavit/mdq/releases/download/v0.10.0/mdq-windows-x64.zip) |
| macOS Apple Silicon | `brew install mdq` | [`mdq-macos-arm64.tar.gz`](https://github.com/yshavit/mdq/releases/download/v0.10.0/mdq-macos-arm64.tar.gz) |
| macOS Intel | `brew install mdq` 또는 `cargo install --git https://github.com/yshavit/mdq` | 릴리스 전용 Intel 바이너리는 없음 |
| Linux x86_64 | `brew install mdq`, Docker, Cargo, 또는 release tarball | [`mdq-linux-x64.tar.gz`](https://github.com/yshavit/mdq/releases/download/v0.10.0/mdq-linux-x64.tar.gz) |
| Linux x86_64 musl | Alpine/정적 링크 선호 환경에서 release tarball | [`mdq-linux-x64-musl.tar.gz`](https://github.com/yshavit/mdq/releases/download/v0.10.0/mdq-linux-x64-musl.tar.gz) |

Windows without WSL에서는 ZIP을 풀고 `mdq.exe`가 있는 폴더를 PATH에 넣는 방식이 제일 단순합니다.

```powershell
$tools = "$env:USERPROFILE\tools\mdq"
New-Item -ItemType Directory -Force $tools | Out-Null
Expand-Archive .\mdq-windows-x64.zip -DestinationPath $tools -Force
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$tools", "User")
mdq --version
```

새 터미널을 열어 `mdq --version`이 찍히면 끝입니다. 회사 장비에서 PATH 변경이 막혀 있다면 압축을 푼 위치에서 `.\mdq.exe --version`처럼 직접 실행해도 됩니다.

macOS는 Homebrew가 가장 짧습니다.

```bash
brew install mdq
mdq --version
```

Apple Silicon에서 릴리스 tarball을 직접 받았다면 실행 권한과 quarantine flag를 같이 확인합니다.

```bash
curl -L -o mdq-macos-arm64.tar.gz \
  https://github.com/yshavit/mdq/releases/download/v0.10.0/mdq-macos-arm64.tar.gz
tar -xzf mdq-macos-arm64.tar.gz
chmod +x mdq
xattr -d com.apple.quarantine mdq 2>/dev/null || true
./mdq --version
```

Linux x86_64에서는 glibc와 musl 중 런타임에 맞는 tarball을 고릅니다. 일반적인 Ubuntu, Debian, Fedora라면 glibc 쪽부터 시도하면 됩니다.

```bash
curl -L -o mdq-linux-x64.tar.gz \
  https://github.com/yshavit/mdq/releases/download/v0.10.0/mdq-linux-x64.tar.gz
tar -xzf mdq-linux-x64.tar.gz
chmod +x mdq
./mdq --version
```

이미 Docker로 도구를 격리하는 팀이면 컨테이너 실행도 깔끔합니다.

```bash
docker pull yshavit/mdq:0.10.0
echo 'My [example](https://github.com/yshavit/mdq) markdown' \
  | docker run --rm -i yshavit/mdq:0.10.0 '[](*)'
```

Rust 툴체인이 있는 개발자는 Cargo로도 설치할 수 있습니다. 다만 현재 개발 요구사항은 `rustc >= 1.85.1`입니다.

```bash
cargo install --git https://github.com/yshavit/mdq
mdq --version
```

설치 전 문법만 맛보고 싶으면 브라우저 playground도 있습니다.

## 기본 사용법

`mdq`의 셀렉터는 Markdown 문법과 비슷하게 생겼습니다. 섹션은 `#`, unordered list는 `-`, 체크박스는 `- [ ]`, 링크는 `[](*)`, 표는 `:-:`로 찾습니다.

```bash
cat README.md | mdq '# installation'
cat CHANGELOG.md | mdq '# breaking'
cat PULL_REQUEST_TEMPLATE.md | mdq -- '- [ ]'
cat release.md | mdq '[](*)'
cat oncall.md | mdq ':-: * :-: 2026-07-01'
```

여기서 `-- '- [ ]'`가 중요합니다. 셀렉터가 `-`로 시작하면 셸과 CLI 파서가 옵션으로 오해할 수 있으니, 옵션 종료 표시인 `--` 뒤에 셀렉터를 둡니다.

파일 경로를 넘기지 않으면 stdin을 읽습니다. 에이전트 워크플로에서는 이 방식이 편합니다.

```bash
gh pr view 123 --json body --jq .body | mdq -- '- [ ]'
```

여러 파일을 넘기면 하나의 Markdown 문서처럼 이어서 처리합니다.

```bash
mdq '# install' README.md docs/setup.md docs/windows.md
```

출력은 기본적으로 Markdown입니다. 스크립트나 LLM tool response로 넘길 때는 JSON이나 plain text가 더 다루기 쉽습니다.

```bash
mdq --output json '[](*)' README.md
mdq --output plain '# usage' README.md
mdq -q -- '- [ ]' PULL_REQUEST_TEMPLATE.md
```

`-q`는 `grep -q`와 비슷합니다. 매칭이 있으면 0, 없으면 non-zero로 끝나기 때문에 CI나 hook에서 쓰기 좋습니다.

```bash
if gh pr view "$PR_NUMBER" --json body --jq .body | mdq -q -- '- [ ]'; then
  echo "PR template still has unchecked items"
  exit 1
fi
```

## 내가 실제로 확인한 감각

간단한 샘플로 PR 120개 분량의 Markdown 로그를 만들었습니다. 원본은 34,204 bytes였고, 미완료 체크박스만 뽑은 결과는 210 bytes였습니다.

```bash
mdq -- '- [ ]' pr-log.md
```

출력량만 보면 약 99.4%가 줄었습니다. 이 숫자를 "토큰 비용이 정확히 99.4% 줄어든다"로 읽으면 안 됩니다. 토크나이저와 언어에 따라 달라지고, 모델이 결과를 해석하는 비용도 남습니다. 그래도 에이전트에게 넘기는 입력에서 관계없는 섹션, 표, 완료된 체크리스트, 장황한 설명을 빼면 모델이 훨씬 덜 흔들립니다.

실제 출력은 이런 모양입니다.

```markdown
- [ ] docs updated

   -----

- [ ] migration note reviewed
```

이 정도면 다음 프롬프트가 작아집니다.

````text
아래는 원본 PR 로그가 아니라 mdq로 미완료 체크박스만 뽑은 결과야.

```bash
mdq -- '- [ ]' pr-log.md
```

각 항목을 release blocker, docs follow-up, owner 확인 필요로 분류해줘.
원본이 더 필요하면 어떤 selector로 다시 뽑을지 먼저 말해줘.
````

모델에게 "전체 로그를 읽고 문제를 찾아줘"라고 맡기는 것보다, 사람이 어떤 문서 구조를 관심 대상으로 삼았는지가 명령에 남습니다. 이게 `mdq`의 진짜 효용입니다.

## Claude Code와 같이 쓰기

Claude Code는 큰 코드베이스를 볼 때 넓게 시작하고, 관련 파일과 흐름으로 좁히는 워크플로를 안내합니다. Markdown에도 같은 전략이 필요합니다. 문서 폴더 전체를 `@docs`로 던지기 전에 `mdq`로 필요한 섹션만 뽑으면 질문이 훨씬 선명해집니다.

나쁜 요청:

```text
docs 폴더를 보고 설치 문서에서 빠진 걸 찾아줘.
```

좋은 요청:

````text
아래는 설치 관련 섹션만 mdq로 뽑은 결과야.

```bash
mdq '# install' README.md docs/*.md
```

Windows without WSL 기준으로 빠진 전제 조건과 검증 명령만 지적해줘.
````

Claude Code의 비대화형 실행과도 잘 맞습니다.

```bash
mdq '# migration' docs/*.md \
  | claude -p "마이그레이션 순서를 깨는 문장을 찾아줘. 추측하지 말고 빠진 확인 명령만 제안해줘."
```

여기서 핵심은 Claude에게 문서 탐색을 통째로 맡기지 않는 것입니다. `mdq`가 문서 구조로 후보를 줄이고, Claude는 그 좁은 결과를 해석합니다.

## OpenCode와 같이 쓰기

OpenCode는 `bash`, `grep`, `glob`, `read`, `edit`, `apply_patch` 같은 도구를 제공하고, custom command에서 shell output을 프롬프트에 주입할 수 있습니다. `mdq`는 이 custom command와 궁합이 좋습니다.

예를 들어 `.opencode/commands/review-pr-template.md`를 이렇게 둘 수 있습니다.

````md
---
description: Review unchecked PR template items
---

아래는 현재 PR 본문에서 미완료 체크박스만 mdq로 뽑은 결과다.
릴리스 전에 막아야 하는 항목과 단순 follow-up을 분리해라.

!`gh pr view --json body --jq .body | mdq -- '- [ ]'`
````

릴리스 노트에서도 쓸 수 있습니다.

````md
---
description: Extract breaking changes from release notes
---

아래 breaking 섹션만 기준으로 migration note 초안을 작성해라.
없는 내용을 만들지 말고, 확인이 필요한 항목은 질문으로 남겨라.

!`mdq '# breaking' CHANGELOG.md docs/releases/*.md`
````

이 방식은 OpenCode에게 "저장소 전체를 뒤져 봐"라고 던지는 것보다 안정적입니다. 특히 Markdown 파일이 많은 레포에서는 `glob`으로 파일을 찾고 `read`로 다 읽는 것보다, shell에서 `mdq`로 섹션을 먼저 잘라 주는 편이 컨텍스트를 덜 태웁니다.

## Codex와 같이 쓰기

Codex CLI는 로컬 작업 디렉터리에서 코드를 읽고, 명령을 실행하고, 패치를 만들 수 있습니다. 그래서 `mdq`는 Codex에게 넘길 "문서 입력 표면"을 작게 만드는 전처리기로 쓰기 좋습니다.

예를 들어 Codex에게 이렇게 시키면 범위가 큽니다.

```text
docs 전체를 읽고 README와 설치 문서의 불일치를 고쳐줘.
```

먼저 셸에서 후보를 줄입니다.

```bash
mdq '# install' README.md docs/*.md
mdq -- '- [ ]' docs/*.md
mdq '[](*)' README.md docs/*.md
```

그다음 Codex에는 결과와 목표를 같이 줍니다.

````text
아래 mdq 결과만 기준으로 설치 문서의 누락을 고쳐줘.
직접 수정 전에는 README.md와 docs/install.md만 읽어라.

```bash
mdq '# install' README.md docs/*.md
```
````

Codex가 로컬 명령을 실행할 수 있는 환경이라면, 아예 검증 명령까지 같이 지정하는 편이 낫습니다.

```text
docs/*.md에서 미완료 체크박스를 찾고, release blocker만 남겨라.
검증은 `mdq -- '- [ ]' docs/*.md`로 다시 실행해라.
```

이렇게 하면 모델의 역할이 "Markdown 전체를 읽고 구조를 추측하기"에서 "명령으로 좁힌 결과를 판단하고 필요한 파일만 수정하기"로 바뀝니다. 작은 모델이나 로컬 모델을 쓸수록 차이가 큽니다.

## 단독 CLI로 쓸 때 좋은 지점

`mdq`는 LLM 없이도 충분히 쓸모가 있습니다.

PR 템플릿 체크:

```bash
gh pr view "$PR" --json body --jq .body | mdq -q -- '- [ ]'
```

README에서 설치 섹션만 뽑기:

```bash
mdq '# install' README.md
```

링크 목록을 JSON으로 뽑기:

```bash
mdq --output json '[](*)' README.md
```

릴리스 노트에서 특정 레벨의 heading만 보기:

```bash
mdq '#{2} breaking' CHANGELOG.md
mdq '#{2,4} migration' docs/releases/*.md
```

큰 표에서 특정 행만 보기:

```bash
mdq ':-: * :-: mdq' tools.md
```

저는 `mdq`를 `rg`, `jq`, `ast-grep` 사이에 둡니다.

| 입력 | 먼저 쓸 도구 |
| :--- | :--- |
| 파일명, 문자열, TODO | `rg` |
| JSON 응답, lockfile, API 결과 | `jq` |
| 코드 구조, 함수 호출, import | `ast-grep` |
| Markdown 섹션, 체크리스트, 링크, 표 | `mdq` |

도구의 책임이 이렇게 나뉘면 LLM 프롬프트도 짧아집니다. "찾아줘"가 아니라 "이 명령으로 좁힌 결과를 판단해줘"가 되기 때문입니다.

## 조심할 점

첫째, `mdq`는 Markdown 구조 필터입니다. 자연어 의미 검색기가 아닙니다. "이 문장이 위험한가"는 모델이나 사람이 판단해야 하고, `mdq`는 그 판단 대상을 잘라 주는 데 집중합니다.

둘째, 셀렉터 문법이 Markdown과 비슷하긴 하지만 완전히 직관만으로 맞출 수 있는 수준은 아닙니다. 링크는 `[](*)`, 체크박스는 `- [ ]`, 표는 `:-:`처럼 몇 가지는 손에 익혀야 합니다.

셋째, 파일 인자와 함께 `- [ ]` 같은 셀렉터를 쓸 때는 `--`를 붙이는 습관이 안전합니다.

```bash
mdq -- '- [ ]' PULL_REQUEST_TEMPLATE.md
```

넷째, 릴리스 바이너리는 현재 플랫폼 폭이 넓지 않습니다. Windows x64, macOS ARM64, Linux x64는 편하지만 다른 아키텍처는 Homebrew, Docker, Cargo 같은 우회 경로를 잡아야 합니다.

## 결론

`mdq`는 화려한 에이전트 도구가 아닙니다. 하지만 Markdown이 많은 저장소에서는 꽤 자주 손이 갑니다. README의 설치 섹션, PR 템플릿의 미완료 체크박스, 릴리스 노트의 breaking change, 문서 표의 특정 행을 정확히 잘라낼 수 있기 때문입니다.

LLM과 붙였을 때의 효용은 더 현실적입니다. 모델에게 더 똑똑해지라고 요구하는 대신, 모델이 읽을 입력을 작고 검증 가능한 형태로 만드는 것입니다. 이 방향이 대체로 더 싸고, 더 빠르고, 실패했을 때 원인도 찾기 쉽습니다.

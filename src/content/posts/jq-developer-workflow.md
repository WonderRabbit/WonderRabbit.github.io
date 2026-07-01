---
title: "jq를 CLI와 코딩 에이전트의 JSON 필터로 쓰기"
description: "jq의 공식 다운로드 링크, Windows without WSL/macOS/Linux 설치, 실전 필터 사용법, Claude Code, OpenCode, Codex와 붙였을 때 모델 부담을 줄이는 방식을 개발자 워크플로 기준으로 정리합니다."
published: "2026-07-01"
draft: false
category: "Developer Tools"
tags:
  - jq
  - JSON
  - CLI
  - Claude Code
  - OpenCode
  - Codex
aiAssisted: true
showSources: false
sources:
  - title: "jq Download"
    url: "https://jqlang.org/download/"
    accessed: "2026-07-01"
  - title: "jq 1.8 Manual"
    url: "https://jqlang.org/manual/"
    accessed: "2026-07-01"
  - title: "jqlang jq latest release"
    url: "https://github.com/jqlang/jq/releases/latest"
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

`jq`는 JSON을 예쁘게 찍는 도구로 시작해서, 결국은 "모델에게 넘기기 전에 데이터를 자르는 칼"로 남습니다. API 응답, `package-lock.json`, GitHub Actions 결과, LSP 출력, MCP tool response처럼 구조는 JSON인데 사람이 다 읽기엔 너무 큰 것들이 있습니다. 그때 전체 덤프를 LLM에게 붙이는 대신 `jq`로 필요한 필드만 남기면, 사람도 덜 읽고 모델도 덜 헤맵니다.

확인 시점은 2026년 7월 1일입니다. 공식 다운로드 페이지와 GitHub latest release는 `jq-1.8.2`를 가리켰고, 제 로컬 macOS에는 `jq-1.7.1`이 설치되어 있었습니다. 본문 명령은 1.7.1에서도 확인했지만, 새로 설치한다면 보안 수정이 들어간 최신 1.8.2 쪽을 기준으로 잡는 편이 맞습니다.

## 다운로드와 설치

공식 실행 파일 이름은 `jq`입니다. jq는 C로 작성됐고 런타임 의존성이 없어서 Linux, macOS, Windows용 prebuilt binary를 그대로 받을 수 있습니다. macOS와 Linux에서 직접 받은 바이너리는 실행 권한을 줘야 할 수 있습니다.

| 환경 | 추천 설치 | 직접 다운로드 |
| :--- | :--- | :--- |
| Windows without WSL, x64 | `winget install jqlang.jq` | [`jq-windows-amd64.exe`](https://github.com/jqlang/jq/releases/download/jq-1.8.2/jq-windows-amd64.exe) |
| Windows without WSL, ARM64 | `winget install jqlang.jq` 또는 release exe | [`jq-windows-arm64.exe`](https://github.com/jqlang/jq/releases/download/jq-1.8.2/jq-windows-arm64.exe) |
| Windows without WSL, 32-bit | `scoop install jq` 또는 `choco install jq` | [`jq-windows-i386.exe`](https://github.com/jqlang/jq/releases/download/jq-1.8.2/jq-windows-i386.exe) |
| macOS Apple Silicon | `brew install jq` | [`jq-macos-arm64`](https://github.com/jqlang/jq/releases/download/jq-1.8.2/jq-macos-arm64) |
| macOS Intel | `brew install jq` | [`jq-macos-amd64`](https://github.com/jqlang/jq/releases/download/jq-1.8.2/jq-macos-amd64) |
| Linux x86_64 | `sudo apt-get install jq`, `sudo dnf install jq`, `sudo pacman -S jq` | [`jq-linux-amd64`](https://github.com/jqlang/jq/releases/download/jq-1.8.2/jq-linux-amd64) |
| Linux ARM64 | distro package 또는 release binary | [`jq-linux-arm64`](https://github.com/jqlang/jq/releases/download/jq-1.8.2/jq-linux-arm64) |

Windows에서 WSL 없이 쓰려면 `winget`이 제일 짧습니다.

```powershell
winget install jqlang.jq
jq --version
```

Scoop이나 Chocolatey를 이미 쓰는 팀이면 그쪽으로 통일해도 됩니다.

```powershell
scoop install jq
choco install jq
jq --version
```

macOS는 Homebrew가 가장 덜 번거롭습니다.

```bash
brew install jq
jq --version
```

Linux는 배포판 패키지부터 확인합니다. 최신 binary를 직접 받는 경우에는 실행 권한을 줍니다.

```bash
curl -L -o jq https://github.com/jqlang/jq/releases/download/jq-1.8.2/jq-linux-amd64
chmod +x jq
./jq --version
```

릴리스 페이지에는 SHA-256 checksum과 signature도 같이 올라옵니다. 팀 이미지나 CI runner에 박아 넣는 설치라면 binary URL만 복사하지 말고 checksum 확인까지 같이 넣는 편이 낫습니다.

## 처음 익힐 명령

`jq '.'`는 입력 JSON을 그대로 통과시키면서 pretty print와 validation을 해줍니다.

```bash
echo '{"name":"wonder","tools":["jq","rg"]}' | jq '.'
```

필드를 뽑을 때는 점으로 내려갑니다.

```bash
jq '.name' package.json
jq '.scripts' package.json
jq -r '.name' package.json
```

`-r`은 string을 따옴표 없는 raw output으로 뽑습니다. shell 변수, 파일명, URL을 만들 때 거의 항상 필요합니다.

배열은 `[]`로 펼칩니다.

```bash
jq '.dependencies | keys[]' package.json
jq -r '.items[] | .name' response.json
```

필터링은 `select()`가 맡습니다.

```bash
jq '.items[] | select(.private == false) | {name, version}' response.json
```

출력을 다시 배열로 묶고 싶으면 바깥에 `[...]`를 씌웁니다.

```bash
jq '[.items[] | select(.private == false) | {name, version}]' response.json
```

스크립트에서 안정적인 JSON 한 줄이 필요하면 `-c`를 붙입니다.

```bash
jq -c '[.items[] | {name, version}]' response.json
```

## 셸 quoting이 제일 자주 터진다

Unix shell에서는 jq 프로그램을 작은따옴표로 감싸는 게 기본입니다.

```bash
jq '.["scripts"]["build"]' package.json
```

PowerShell도 작은따옴표를 쓰되, jq 프로그램 안의 JSON 문자열 따옴표는 escape합니다.

```powershell
jq '.[\"scripts\"][\"build\"]' package.json
```

`cmd.exe`에서는 바깥을 큰따옴표로 감싸고 내부 따옴표를 escape합니다.

```cmd
jq ".[\"scripts\"][\"build\"]" package.json
```

팀 문서에 `jq '.foo'`만 적어 두면 Windows 사용자가 한 번쯤 막힙니다. Windows without WSL까지 챙긴다면 PowerShell 예시를 같이 적어 두는 게 좋습니다.

## 값을 안전하게 넣는 법

LLM 도구와 같이 쓸수록 문자열 interpolation을 줄여야 합니다. shell에서 만든 값을 jq 프로그램에 직접 이어 붙이지 말고 `--arg`를 씁니다.

```bash
name="astro"
jq --arg name "$name" '.dependencies[$name] // .devDependencies[$name]' package.json
```

숫자나 JSON 조각은 `--argjson`이 맞습니다.

```bash
limit=5
jq --argjson limit "$limit" '.items[:$limit]' response.json
```

파일이 크거나 응답 shape이 자주 바뀌면 명령줄 한 줄보다 `.jq` 파일이 낫습니다.

```text
# tools/package-summary.jq
{
  name,
  scripts: (.scripts // {}),
  runtimeDeps: (.dependencies // {} | keys),
  devDeps: (.devDependencies // {} | keys)
}
```

```bash
jq -f tools/package-summary.jq package.json
```

에이전트에게도 이 방식이 좋습니다. 프롬프트에 긴 one-liner를 붙이는 대신 "이 `.jq` 필터를 기준으로 응답 shape을 검토해줘"라고 할 수 있습니다.

## 큰 JSON을 모델에게 넘기기 전에 자르기

간단한 로컬 확인을 해봤습니다. 80개 항목이 들어간 pretty JSON은 27,221 bytes였고, jq로 `private == false`인 항목의 `name`, `version` 앞 8개만 남기니 283 bytes가 됐습니다.

```bash
jq -c '[.items[] | select(.private == false) | {name, version}] | .[:8]' input.json
```

출력량만 보면 약 99%가 줄었습니다. 이 숫자를 "토큰 비용이 정확히 99% 절감된다"로 읽으면 안 됩니다. 토크나이저, 언어, 공백, 코드 블록 여부에 따라 달라집니다. 그래도 모델이 읽어야 할 바이트와 필드가 줄면, 실무에서는 거의 항상 두 가지가 좋아집니다.

1. 모델이 관련 없는 필드명을 설명하느라 시간을 쓰지 않습니다.
2. 사람이 다음 명령을 재현할 수 있습니다.

저는 에이전트에게 JSON을 줄 때 원본과 필터를 같이 남기는 편입니다.

````text
아래는 GitHub API 응답 원본이 아니라 jq로 줄인 결과야.
원본에서 실행한 명령:

```bash
jq -c '[.workflow_runs[] | {id, name, status, conclusion, html_url}] | .[:5]' runs.json
```

이 결과만 보고 실패한 workflow를 골라줘. shape이 부족하면 필요한 jq 필드를 먼저 말해줘.
````

이렇게 하면 모델은 "전체 응답을 다시 줘"라고 하기 전에 필요한 필드부터 말하게 됩니다.

## Claude Code와 같이 쓰기

Claude Code 문서는 새 코드베이스를 볼 때 넓게 보고 좁히는 흐름, subagent로 조사 컨텍스트를 분리하는 흐름, shell pipeline으로 비대화 작업을 돌리는 흐름을 안내합니다. jq는 그 앞단에서 JSON을 정리하는 역할이 좋습니다.

예를 들어 GitHub CLI 출력은 바로 붙이면 잡음이 많습니다.

```bash
gh run list --json databaseId,displayTitle,status,conclusion,url,createdAt \
  | jq -c '.[] | {id: .databaseId, title: .displayTitle, status, conclusion, url}'
```

그 다음 Claude Code에는 이렇게 묻습니다.

````text
아래 jq 결과에서 실패한 run만 보고 원인 조사 순서를 잡아줘.
필드가 부족하면 추가로 필요한 gh --json 필드와 jq 필터를 먼저 제안해줘.
````

subagent를 쓸 때도 원본 JSON을 그대로 넘기기보다 `jq -c` 결과를 넘기는 편이 낫습니다. 조사 agent가 컨텍스트를 덜 쓰고, 메인 세션으로 돌아오는 요약도 작아집니다.

## OpenCode와 같이 쓰기

OpenCode는 built-in tool로 `bash`, `grep`, `glob`, `read`, `edit`, `apply_patch` 등을 제공합니다. `bash`는 프로젝트 환경에서 터미널 명령을 실행할 수 있고, custom command는 `` !`command` `` 형태로 shell output을 프롬프트에 주입할 수 있습니다.

그래서 반복되는 JSON 정리는 `.opencode/commands/`에 넣어 두기 좋습니다.

````md
---
description: Summarize recent failed GitHub Actions runs
---

아래는 gh JSON을 jq로 줄인 결과야. 실패 run만 골라서 다음 조사 명령을 제안해줘.

!`gh run list --json databaseId,displayTitle,status,conclusion,url,createdAt | jq -c '[.[] | select(.conclusion != "success") | {id: .databaseId, title: .displayTitle, status, conclusion, url}] | .[:10]'`
````

이 command를 쓰면 OpenCode가 매번 `gh run list` 전체 구조를 읽지 않아도 됩니다. `grep`이나 `glob`이 파일 후보를 줄이는 도구라면, `jq`는 tool output 후보를 줄이는 도구입니다.

## Codex와 같이 쓰기

Codex CLI나 local shell 방식의 agent loop에서는 명령 실행과 출력 반환이 반복됩니다. 여기서 병목은 "명령을 실행할 수 있느냐"보다 "돌아온 출력이 다음 추론에 충분히 작고 정확하냐"입니다.

예를 들어 `npm outdated --json`이나 `gh api` 출력은 그대로 붙이면 토큰을 많이 씁니다.

```bash
npm outdated --json \
  | jq -c 'to_entries | map({name: .key, current: .value.current, wanted: .value.wanted, latest: .value.latest})'
```

Codex에는 이렇게 맡기는 편이 낫습니다.

````text
아래는 npm outdated --json을 jq로 줄인 결과야.
major 업데이트만 위험도 순서로 정리하고, 실제 수정이 필요한 package.json 범위를 제안해줘.
````

MCP tool output도 마찬가지입니다. tool이 JSON을 크게 돌려준다면, 모델에게 "다 읽고 판단해"라고 하기 전에 로컬 shell에서 필요한 path만 뽑습니다.

```bash
jq -c '.items[] | {title, url, updatedAt}' mcp-search-result.json
```

이 습관은 작은 모델일수록 더 크게 먹힙니다. 작은 모델은 긴 잡음 속에서 핵심 필드를 놓치기 쉽고, 큰 모델도 불필요한 입력을 읽는 비용은 그대로 냅니다.

## 단독 CLI로도 충분히 세다

LLM을 빼고 봐도 jq는 개발자 CLI에서 자주 쓰입니다.

```bash
# package.json에서 스크립트 이름만 보기
jq -r '.scripts | keys[]' package.json

# lockfile에서 특정 패키지 버전 후보 찾기
jq -r '.packages | to_entries[] | select(.key | contains("node_modules/astro")) | "\(.key) \(.value.version)"' package-lock.json

# GitHub API 응답에서 PR 번호와 제목만 뽑기
gh api repos/OWNER/REPO/pulls \
  | jq -r '.[] | "#\(.number) \(.title)"'

# JSON Lines 로그에서 error만 추출
jq -rc 'select(.level == "error") | {time, message, requestId}' app.log
```

JSON Lines를 다룰 때는 `jq -c`를 습관처럼 붙입니다. 한 이벤트가 한 줄에 남아야 `rg`, `sort`, `uniq`, `head` 같은 도구와 다시 잘 붙습니다.

## 내가 두는 기준

| 상황 | jq를 쓰는 방식 |
| :--- | :--- |
| 사람이 API 응답을 훑는다 | `jq '.'`, `jq '.field'` |
| 에이전트에게 JSON을 넘긴다 | `jq -c`로 필요한 필드만 남긴다 |
| shell 변수를 필터에 넣는다 | 문자열은 `--arg`, JSON은 `--argjson` |
| 반복되는 필터다 | `.jq` 파일로 뺀다 |
| 응답이 너무 크다 | `keys`, `paths`, `length`로 구조를 먼저 본다 |
| 대형 배열을 다룬다 | `map(...)`, `select(...)`, `limit`, slicing으로 먼저 줄인다 |
| 아주 큰 JSON stream이다 | `--stream`을 검토하되, 필터 복잡도가 올라가는 비용을 감수할 때만 쓴다 |

`jq`를 잘 쓴다는 건 화려한 필터를 외운다는 뜻이 아닙니다. 원본 JSON을 모델에게 통째로 먹이기 전에 어떤 필드가 판단에 필요한지 한 번 생각한다는 뜻에 가깝습니다.

저는 보통 이 순서로 갑니다.

```bash
jq 'keys' response.json
jq '.items[0]' response.json
jq -c '.items[] | {id, name, status}' response.json
```

처음에는 구조를 보고, 두 번째는 샘플 하나를 보고, 세 번째부터 모델이나 사람에게 넘길 모양을 고정합니다. 이 정도만 해도 agent 작업의 실패 양상이 꽤 줄어듭니다. 모델이 틀린 답을 내는 이유가 추론력 부족일 때도 있지만, 입력이 너무 크고 지저분해서 처음부터 길을 잃는 경우도 많기 때문입니다.

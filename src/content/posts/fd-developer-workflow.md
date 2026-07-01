---
title: "fd를 CLI와 코딩 에이전트의 파일 탐색기로 쓰기"
description: "fd의 공식 다운로드 링크, Windows without WSL/macOS/Linux 설치, find와 다른 실전 사용법, Claude Code, OpenCode, Codex와 붙였을 때 모델 부담을 줄이는 방식을 개발자 워크플로 기준으로 정리합니다."
published: "2026-07-02"
draft: false
category: "Developer Tools"
tags:
  - fd
  - CLI
  - Claude Code
  - OpenCode
  - Codex
aiAssisted: true
showSources: false
sources:
  - title: "sharkdp/fd README"
    url: "https://github.com/sharkdp/fd"
    accessed: "2026-07-02"
  - title: "sharkdp/fd latest release"
    url: "https://github.com/sharkdp/fd/releases/latest"
    accessed: "2026-07-02"
  - title: "INPA fd command guide"
    url: "https://inpa.tistory.com/entry/Modern-Linux-%F0%9F%90%A7-fd-%EB%AA%85%EB%A0%B9%EC%96%B4-%EC%82%AC%EC%9A%A9%EB%B2%95-find-%EB%8C%80%EC%8B%A0-%EC%9D%B4%EA%B1%B0-%EC%93%B0%EC%9E%90"
    accessed: "2026-07-02"
  - title: "Claude Code common workflows"
    url: "https://code.claude.com/docs/en/common-workflows"
    accessed: "2026-07-02"
  - title: "Claude Code CLI reference"
    url: "https://code.claude.com/docs/en/cli-reference"
    accessed: "2026-07-02"
  - title: "OpenCode tools documentation"
    url: "https://opencode.ai/docs/tools/"
    accessed: "2026-07-02"
  - title: "OpenCode commands documentation"
    url: "https://opencode.ai/docs/commands/"
    accessed: "2026-07-02"
  - title: "OpenAI Codex CLI documentation"
    url: "https://developers.openai.com/codex/cli"
    accessed: "2026-07-02"
  - title: "OpenAI local shell tool documentation"
    url: "https://developers.openai.com/api/docs/guides/tools-local-shell"
    accessed: "2026-07-02"
---

`fd`는 파일을 찾는 도구입니다. 그런데 개발자 워크플로에서는 그냥 "find 대체재"보다 조금 더 쓸모가 큽니다. LLM에게 저장소를 읽히기 전에 파일 후보를 줄이고, 반복 작업을 파일 단위로 나누고, 오래된 shell one-liner를 사람이 읽을 수 있는 명령으로 바꿔 줍니다.

공식 README는 `fd`를 `find`의 모든 기능을 따라가는 도구가 아니라, 대부분의 일상 검색에 맞춘 빠르고 친절한 대안으로 설명합니다. 제가 보는 핵심도 거기에 가깝습니다. `find . -iname '*controller*'`를 기억하는 대신 `fd controller`부터 치고, 결과가 너무 넓으면 타입, 확장자, 깊이, ignore 조건을 하나씩 붙이면 됩니다.

확인 시점은 2026년 7월 2일입니다. GitHub latest release는 [`v10.4.2`](https://github.com/sharkdp/fd/releases/latest)를 가리켰고, 제 로컬 macOS에는 `fd 10.2.0`이 설치되어 있었습니다. 설치 링크는 움직이는 값이라서 본문 표에는 최신 release 기준의 직접 다운로드 예시를 넣되, 새로 설치할 때는 먼저 release page나 패키지 매니저를 확인하는 편이 안전합니다.

## 다운로드와 설치

공식 실행 파일 이름은 `fd`입니다. 단, Debian/Ubuntu의 배포판 패키지는 이름 충돌 때문에 패키지와 바이너리가 `fd-find`/`fdfind`로 나뉘는 경우가 있습니다. 이 차이 때문에 팀 문서에는 Linux 한 줄 설치만 적어 두면 꼭 누군가가 막힙니다.

| 환경 | 추천 설치 | 직접 다운로드 예시 |
| :--- | :--- | :--- |
| Windows without WSL, x64 | `winget install sharkdp.fd` | [`fd-v10.4.2-x86_64-pc-windows-msvc.zip`](https://github.com/sharkdp/fd/releases/download/v10.4.2/fd-v10.4.2-x86_64-pc-windows-msvc.zip) |
| Windows without WSL, ARM64 | `winget install sharkdp.fd` 또는 release ZIP | [`fd-v10.4.2-aarch64-pc-windows-msvc.zip`](https://github.com/sharkdp/fd/releases/download/v10.4.2/fd-v10.4.2-aarch64-pc-windows-msvc.zip) |
| macOS Apple Silicon | `brew install fd` | [`fd-v10.4.2-aarch64-apple-darwin.tar.gz`](https://github.com/sharkdp/fd/releases/download/v10.4.2/fd-v10.4.2-aarch64-apple-darwin.tar.gz) |
| macOS Intel | `brew install fd` | [`fd-v10.4.2-x86_64-apple-darwin.tar.gz`](https://github.com/sharkdp/fd/releases/download/v10.4.2/fd-v10.4.2-x86_64-apple-darwin.tar.gz) |
| Linux x86_64 | distro package 또는 release archive | [`fd-v10.4.2-x86_64-unknown-linux-gnu.tar.gz`](https://github.com/sharkdp/fd/releases/download/v10.4.2/fd-v10.4.2-x86_64-unknown-linux-gnu.tar.gz) |
| Debian/Ubuntu x86_64 | `sudo apt-get install fd-find` 또는 release `.deb` | [`fd_10.4.2_amd64.deb`](https://github.com/sharkdp/fd/releases/download/v10.4.2/fd_10.4.2_amd64.deb) |

Windows에서 WSL 없이 쓰려면 `winget`이 제일 짧습니다. 이미 Scoop이나 Chocolatey를 표준으로 쓰는 팀이면 그쪽으로 통일해도 됩니다.

```powershell
winget install sharkdp.fd
scoop install fd
choco install fd
fd --version
```

macOS는 Homebrew가 가장 덜 번거롭습니다.

```bash
brew install fd
fd --version
```

Debian/Ubuntu에서는 먼저 배포판 패키지를 씁니다.

```bash
sudo apt-get install fd-find
fdfind --version
```

공식 README는 문서처럼 `fd`로 쓰고 싶다면 symlink를 추가하라고 안내합니다.

```bash
mkdir -p ~/.local/bin
ln -s "$(which fdfind)" ~/.local/bin/fd
fd --version
```

최신 `.deb`를 직접 받으면 바이너리 이름이 `fd`로 들어옵니다.

```bash
curl -LO https://github.com/sharkdp/fd/releases/download/v10.4.2/fd_10.4.2_amd64.deb
sudo dpkg -i fd_10.4.2_amd64.deb
fd --version
```

## 처음 익힐 명령

`fd pattern`은 현재 디렉터리 아래에서 이름에 `pattern`이 들어간 파일과 디렉터리를 찾습니다. 기본 패턴은 정규식이고, 기본 검색 대상은 파일명입니다.

```bash
fd controller
fd '^README'
fd package .
fd package src
```

파일 확장자는 `-e`로 좁힙니다.

```bash
fd -e ts
fd -e ts -e tsx auth src
fd -e md developer src/content/posts
```

타입은 `-t`입니다.

```bash
fd -tf config
fd -td cache
fd -tx '^build'
```

깊이는 `-d`로 제한합니다.

```bash
fd -d 1
fd -d 2 package
```

glob이 더 자연스러울 때는 `-g`를 씁니다.

```bash
fd -g '*.config.*'
fd -g 'test_*.py'
fd -g '**/package.json'
```

전체 경로까지 보고 싶으면 `-p`를 붙입니다. 기본값은 파일명 기준이라서 `src/pages` 같은 경로 조각은 그냥 검색하면 놓칠 수 있습니다.

```bash
fd -p 'src/pages/.+astro$'
fd -p -g '**/.github/workflows/*.yml'
```

## find와 다르게 생각해야 하는 부분

[`INPA`의 fd 정리글](https://inpa.tistory.com/entry/Modern-Linux-%F0%9F%90%A7-fd-%EB%AA%85%EB%A0%B9%EC%96%B4-%EC%82%AC%EC%9A%A9%EB%B2%95-find-%EB%8C%80%EC%8B%A0-%EC%9D%B4%EA%B1%B0-%EC%93%B0%EC%9E%90)도 결국 같은 지점을 짚습니다. `fd`는 기본값이 개발자 작업에 맞춰져 있습니다. 숨김 파일과 `.gitignore`에 걸린 파일을 건너뛰고, 보기 좋은 색을 쓰고, 명령이 짧습니다.

그 기본값은 장점이지만, 디버깅할 때는 함정이 됩니다.

| 상황 | 명령 | 이유 |
| :--- | :--- | :--- |
| 숨김 파일까지 보기 | `fd -H pattern` | `.env.example`, `.github`, `.claude`, `.codex`를 찾을 때 |
| ignore된 파일까지 보기 | `fd -I pattern` | `dist`, generated file, vendored file을 확인할 때 |
| 둘 다 보기 | `fd -HI pattern` 또는 `fd -u pattern` | "정말 없는지" 마지막으로 확인할 때 |
| 파일명 말고 경로까지 보기 | `fd -p pattern` | `src/pages`, `__tests__`, `.config/` 같은 경로 조건 |
| glob으로 보기 | `fd -g '*.mdx'` | shell glob처럼 사고하는 게 더 빠를 때 |

`find`는 시스템 관리자의 저수준 도구에 가깝고, `fd`는 코드베이스 안에서 빠르게 후보를 좁히는 도구에 가깝습니다. 둘 중 하나만 남겨야 하는 관계는 아닙니다. 권한, inode, mtime 조합이 복잡하면 `find`가 낫고, "이 저장소에서 어느 파일을 읽을까"는 대개 `fd`가 빠릅니다.

## 실행까지 붙이면 더 편하다

`fd`는 찾은 결과에 명령을 실행할 수 있습니다. `-x`는 결과마다 실행하고, `-X`는 결과 전체를 한 번에 넘깁니다.

```bash
fd -e md -x wc -l
fd -e ts -X eslint
fd -e jpg -x convert {} {.}.png
```

placeholder도 꽤 실용적입니다.

| placeholder | 의미 |
| :--- | :--- |
| `{}` | 전체 경로 |
| `{.}` | 확장자 제거 |
| `{/}` | 파일명만 |
| `{//}` | 부모 디렉터리 |
| `{/.}` | 파일명에서 확장자 제거 |

예를 들어 Markdown 파일 이름만 뽑아 링크 목록을 만들고 싶다면 이렇게 시작할 수 있습니다.

```bash
fd -e md . src/content/posts -x echo '{/.}'
```

삭제 명령과 붙일 때는 먼저 출력만 보고, 그다음에 실행합니다.

```bash
fd -H '^\.DS_Store$' -tf
fd -H '^\.DS_Store$' -tf -X rm -i
```

`fd`는 너무 편해서 위험한 명령도 쉽게 짧아집니다. 특히 `-X rm -r`은 검색 결과의 상하위 디렉터리가 같이 잡힐 때 순서 문제를 만날 수 있습니다. 삭제는 한 번에 멋있게 쓰는 것보다, 두 번 확인하는 쪽이 낫습니다.

## CLI 단독으로 쓸 때의 효용

사람이 직접 쓸 때 `fd`의 장점은 "파일 트리 읽기"를 줄여준다는 점입니다.

```bash
fd -p -e astro blog src/pages
fd -e md -e mdx lazyvim src/content
fd -p 'scripts/.+verify'
```

변경 전 영향 범위도 빠르게 봅니다.

```bash
fd -e ts -e tsx user src
fd -p 'auth|session|token'
fd -g '*.{test,spec}.*' src
```

문서 작업에서는 오래된 초안이나 placeholder를 찾는 데 좋습니다.

```bash
fd -e md . docs src/content -x rg -n 'TODO|TBD|placeholder|lorem' {}
```

정확히는 `fd`가 본문 검색을 하는 도구는 아닙니다. 본문 검색은 `rg`가 맡는 게 맞습니다. 대신 `fd`는 "어떤 파일들에 대해 `rg`를 돌릴지"를 먼저 줄여 줍니다.

```bash
fd -e md . src/content/posts -X rg -n 'Windows without WSL|Claude Code|Codex'
```

이 조합이 개발자에게 꽤 큽니다. `rg`가 텍스트 후보를 줄이고, `fd`가 파일 후보를 줄입니다. 둘을 같이 쓰면 사람이 읽을 양도 줄고, 모델에게 넘길 양도 줄어듭니다.

## LLM과 같이 쓸 때는 "파일 후보"가 비용이다

코딩 에이전트에게 저장소 전체를 맡길수록 모델은 파일 탐색에 토큰을 씁니다. 탐색 자체가 나쁜 건 아닙니다. 다만 사람이 이미 도메인 단서를 알고 있다면, `fd`로 첫 후보를 주는 편이 대개 더 효율적입니다.

나쁜 요청:

```text
이 저장소에서 블로그 글 렌더링이 어떻게 되는지 전부 찾아서 설명해줘.
```

나은 요청:

````text
아래 fd 결과를 우선 후보로 보고 블로그 글 렌더링 흐름을 설명해줘.
빠진 파일 후보가 있으면 추가 fd/rg 명령부터 제안해줘.

```bash
fd -p -e astro -e ts blog src
fd -e md . src/content/posts
```
````

이렇게 하면 모델은 파일 시스템을 넓게 헤매기 전에, 사람이 생각한 후보와 누락 가능성을 비교합니다. 작은 모델일수록 차이가 더 납니다. "모든 파일을 훑어라"는 요청은 탐색과 판단을 한꺼번에 시키지만, `fd` 결과를 주는 요청은 탐색 범위를 먼저 고정합니다.

간단히 말하면 이렇습니다.

| 작업 | `fd` 없이 맡길 때 | `fd`와 같이 맡길 때 |
| :--- | :--- | :--- |
| 새 코드베이스 파악 | 디렉터리 트리와 파일 읽기에 컨텍스트를 씀 | 후보 파일 목록에서 시작 |
| 리팩터 영향 범위 | 모델이 이름/경로/확장자 검색을 반복 | 사람이 `fd`로 1차 후보 제공 |
| 문서/블로그 검수 | 전체 Markdown을 뒤짐 | `fd -e md . docs src/content`로 표면 제한 |
| 큰 저장소 자동화 | 도구 호출 수가 늘어남 | 명령 하나로 후보를 압축 |

이걸 "토큰이 몇 퍼센트 줄어든다"로 일반화하면 거짓말에 가까워집니다. 저장소 구조, 모델, 프롬프트, 도구 권한에 따라 달라집니다. 하지만 파일 목록 2,000개를 그대로 읽히는 것과 `fd -e ts auth src`로 20개를 넘기는 것은 작업 모양부터 다릅니다. LLM은 덜 읽고, 사람은 재현 가능한 명령을 남깁니다.

## Claude Code와 같이 쓰기

Claude Code 문서는 새 코드베이스를 볼 때 넓은 질문에서 시작해 특정 컴포넌트로 내려가고, 관련 코드를 찾은 뒤 상호작용과 실행 흐름을 보라고 안내합니다. CLI reference도 `cat file | claude -p "query"`처럼 파이프 입력을 문서화합니다.

그래서 `fd`는 Claude에게 넘기기 전 단계로 잘 맞습니다.

```bash
fd -e ts -e tsx auth src \
  | claude -p "이 파일 후보를 기준으로 인증 흐름을 추정해줘. 후보가 부족하면 다음 fd/rg 명령을 먼저 제안해줘."
```

문서 작업도 같습니다.

```bash
fd -e md . docs src/content \
  | claude -p "이 문서 후보에서 설치 가이드와 중복되는 글을 골라줘."
```

중요한 건 `fd` 결과를 정답처럼 주지 않는 겁니다. "이 후보를 기준으로 보되 누락 가능성을 말해 달라"고 해야 합니다. 그래야 모델이 좁은 목록에 갇히지 않고, 필요한 다음 검색을 제안합니다.

## OpenCode와 같이 쓰기

OpenCode 문서는 built-in tool로 `bash`, `grep`, `glob`, `read`, `edit`, `patch` 같은 도구를 제공합니다. 또 custom command에서 shell output을 프롬프트에 주입하는 패턴을 지원합니다. 이 구조에서는 `fd`를 "파일 후보 생성기"로 두기 좋습니다.

예를 들어 `.opencode/commands/blog-audit.md` 같은 명령을 만든다면, 내부에서 이런 식의 후보를 먼저 넣을 수 있습니다.

````markdown
---
description: Audit blog post candidates
---

Review these candidate posts and identify stale install instructions:

```bash
fd -e md . src/content/posts
```
````

OpenCode에게 모든 파일을 읽게 하는 대신, custom command가 먼저 후보 표면을 잡아 줍니다. 그다음 `grep`이나 `read`가 필요한 파일만 들어가면 됩니다.

## Codex와 같이 쓰기

Codex CLI는 저장소를 읽고, 수정하고, 명령을 실행하는 터미널 중심 워크플로를 제공합니다. 공식 매뉴얼은 `codex` 대화형 실행, `codex "Explain this codebase to me"` 같은 단일 프롬프트, `codex exec`를 통한 비대화형 자동화, MCP 연결, `/review` 같은 로컬 리뷰 흐름을 설명합니다.

`fd`는 여기서도 모델 앞단의 필터입니다.

```bash
fd -p -e astro -e ts blog src \
  | codex exec "이 파일 후보를 기준으로 블로그 라우팅과 검증 스크립트의 연결을 설명해줘."
```

CI나 자동화에서는 더 직접적입니다.

```bash
fd -e md . src/content/posts \
  | codex exec "최근 개발자 도구 글의 제목, 설치 섹션, 검증 섹션 패턴을 요약해줘."
```

Codex는 MCP 서버도 붙일 수 있고, CLI에서 shell command를 실행할 수 있습니다. 그래서 `fd`를 MCP 같은 거창한 통합으로 감쌀 필요는 없습니다. 대부분은 그냥 로컬 shell tool로 충분합니다. 모델에게 "모든 파일을 찾아봐"라고 시키기 전에, 사람이 `fd`로 첫 번째 후보군을 좁히면 됩니다.

## LLM tool로 붙일 때의 설계

에이전트용 helper tool을 만든다면 `fd`를 그대로 노출하기보다 몇 가지 정책을 넣는 편이 좋습니다.

1. 기본 출력은 path list만 준다.
2. `--hidden`, `--no-ignore`, `--unrestricted`는 명시 요청일 때만 켠다.
3. 출력 개수 제한을 둔다.
4. 결과가 너무 많으면 파일을 읽지 말고 추가 필터를 요청한다.
5. 삭제나 수정 명령과 `-x`, `-X`를 바로 연결하지 않는다.

작은 wrapper의 인터페이스는 이 정도면 충분합니다.

```text
find_files(pattern, path?, extensions?, includeHidden?, includeIgnored?, maxResults?)
```

반환값은 긴 파일 본문이 아니라 구조화된 후보 목록이어야 합니다.

```json
{
  "command": "fd -e md developer src/content/posts",
  "count": 5,
  "truncated": false,
  "paths": [
    "src/content/posts/ast-grep-developer-workflow.md",
    "src/content/posts/codegraph-developer-workflow.md"
  ]
}
```

이 shape이 모델 부담을 줄입니다. 모델은 파일명과 경로 패턴으로 다음 행동을 고르고, 정말 필요한 파일만 읽습니다. 실패했을 때도 재현 명령이 남습니다.

## 내 기준의 사용 순서

저장소에서 뭔가를 찾아야 하면 저는 보통 이 순서로 갑니다.

```bash
fd -e ts -e tsx keyword src
rg -n 'keyword|relatedName' src
fd -p 'keyword|related-name'
fd -HI keyword .
```

문서나 블로그면 이렇게 갑니다.

```bash
fd -e md . docs src/content
fd -e md . src/content/posts -X rg -n 'Windows|macOS|Linux|Codex|OpenCode|Claude'
fd -e md . src/content/posts -x sed -n '1,80p' {}
```

첫 명령은 넓게, 두 번째 명령은 본문 검색, 세 번째 명령은 실제 읽기입니다. 모델에게 맡길 때도 이 순서가 좋습니다. 파일 찾기, 내용 검색, 파일 읽기를 섞지 않아야 어디서 판단이 틀렸는지 보입니다.

## 결론

`fd`는 `find`보다 예쁜 명령 하나가 아닙니다. 개발자에게는 파일 후보를 빨리 줄이는 도구이고, 코딩 에이전트에게는 컨텍스트를 덜 쓰게 만드는 앞단 필터입니다.

단독 CLI로는 파일 탐색과 반복 실행이 빨라지고, Claude Code, OpenCode, Codex와 붙이면 모델이 읽을 표면을 사람이 먼저 잘라 줄 수 있습니다. 큰 저장소일수록 이 차이는 체감됩니다. 모델에게 모든 걸 뒤지게 하는 대신, `fd`로 "여기부터 봐"라고 말하는 습관이 비용과 시간을 같이 줄입니다.

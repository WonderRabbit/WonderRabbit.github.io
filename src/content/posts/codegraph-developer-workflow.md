---
title: "CodeGraph를 CLI와 코딩 에이전트의 코드 지도처럼 쓰기"
description: "CodeGraph 1.1.6 기준 다운로드, Windows without WSL/macOS/Linux 설치, CLI 단독 사용, Claude Code, OpenCode, Codex와의 MCP 연계, 토큰 부담을 줄이는 실제 사용 감각을 정리합니다."
published: "2026-07-01"
draft: false
category: "Developer Tools"
tags:
  - CodeGraph
  - CLI
  - MCP
  - Claude Code
  - OpenCode
  - Codex
aiAssisted: true
showSources: false
sources:
  - title: "CodeGraph documentation, Introduction"
    url: "https://colbymchenry.github.io/codegraph/getting-started/introduction/"
    accessed: "2026-07-01"
  - title: "CodeGraph documentation, Quickstart"
    url: "https://colbymchenry.github.io/codegraph/getting-started/quickstart/"
    accessed: "2026-07-01"
  - title: "CodeGraph documentation, Installation"
    url: "https://colbymchenry.github.io/codegraph/getting-started/installation/"
    accessed: "2026-07-01"
  - title: "CodeGraph documentation, CLI"
    url: "https://colbymchenry.github.io/codegraph/reference/cli/"
    accessed: "2026-07-01"
  - title: "CodeGraph documentation, MCP Server"
    url: "https://colbymchenry.github.io/codegraph/reference/mcp-server/"
    accessed: "2026-07-01"
  - title: "CodeGraph documentation, Integrations"
    url: "https://colbymchenry.github.io/codegraph/reference/integrations/"
    accessed: "2026-07-01"
  - title: "CodeGraph documentation, Languages"
    url: "https://colbymchenry.github.io/codegraph/reference/languages/"
    accessed: "2026-07-01"
  - title: "CodeGraph latest release v1.1.6"
    url: "https://github.com/colbymchenry/codegraph/releases/tag/v1.1.6"
    accessed: "2026-07-01"
  - title: "CodeGraph package.json on GitHub"
    url: "https://raw.githubusercontent.com/colbymchenry/codegraph/main/package.json"
    accessed: "2026-07-01"
  - title: "PyTorchKR, CodeGraph: AI 코딩 에이전트를 위한 사전 인덱싱 코드 지식 그래프"
    url: "https://discuss.pytorch.kr/t/codegraph-ai/10308"
    accessed: "2026-07-01"
---

CodeGraph는 `rg`를 대체하는 검색기가 아니다. 에이전트가 매번 `grep`, `find`, `Read`를 돌면서 코드 지도를 새로 그리는 낭비를 줄이려고 만든 로컬 코드 지식 그래프다. 파일을 먼저 훑는 대신 함수, 클래스, 라우트, import, call edge를 미리 SQLite에 넣어두고 "이 흐름이 어디서 시작해서 어디로 번지는가"를 그래프 질의로 꺼낸다.

[PyTorchKR의 소개 글](https://discuss.pytorch.kr/t/codegraph-ai/10308)은 이 포인트를 잘 잡았다. 다만 그 글은 2026년 5월 당시 README와 벤치마크를 정리한 스냅샷이다. 2026년 7월 1일에 다시 확인해보니 [GitHub latest release](https://github.com/colbymchenry/codegraph/releases/tag/v1.1.6)와 [패키지 메타데이터](https://raw.githubusercontent.com/colbymchenry/codegraph/main/package.json)는 `1.1.6`이고, 공식 README의 벤치마크도 더 보수적인 수치로 재검증되어 있었다.

## 설치는 세 단계다

처음 헷갈리는 지점은 설치가 한 번에 끝나는 일이 아니라는 점이다.

1. `codegraph` CLI를 설치한다.
2. Claude Code, Codex CLI, OpenCode 같은 에이전트에 MCP 서버를 연결한다.
3. 각 프로젝트에서 `.codegraph/` 인덱스를 만든다.

CLI만 설치했다고 에이전트가 바로 쓰는 것도 아니고, 에이전트에 MCP를 붙였다고 모든 프로젝트가 자동으로 인덱싱되는 것도 아니다.

## 다운로드와 설치

[공식 Quickstart](https://colbymchenry.github.io/codegraph/getting-started/quickstart/) 기준으로 Node가 없어도 OS에 맞는 self-contained build를 받는 설치 경로가 먼저다.

| 환경 | 설치 명령 | 메모 |
| :--- | :--- | :--- |
| Windows without WSL | `irm https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.ps1 \| iex` | PowerShell에서 실행한다. WSL이 필요 없다. |
| macOS | `curl -fsSL https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.sh \| sh` | 설치 뒤 새 터미널을 열어 PATH를 다시 잡는다. |
| Linux | `curl -fsSL https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.sh \| sh` | x64/arm64용 self-contained build가 제공된다. |
| Node가 이미 있는 환경 | `npm i -g @colbymchenry/codegraph` | OS 공통. 스크립트 설치가 싫을 때 가장 설명이 쉽다. |

공식 [Installation 문서](https://colbymchenry.github.io/codegraph/getting-started/installation/)는 Windows, macOS, Linux 모두 x64와 arm64를 지원한다고 적고 있다. 핵심은 "컴파일하지 않는다"다. Rust나 C 컴파일러를 준비할 필요가 없고, Windows에서도 WSL을 우회하지 않아도 된다.

설치 확인은 짧게 끝난다.

```bash
codegraph version
codegraph help
```

이미 설치되어 있다면 업그레이드부터 본다.

```bash
codegraph upgrade --check
codegraph upgrade
```

내 로컬에는 `1.0.1`이 깔려 있었고, 같은 날 공식 최신은 `1.1.6`이었다. 이런 도구는 에이전트 워크플로에 깊게 붙기 때문에 "예전에 깔아둔 버전"으로 평가하면 꽤 엉뚱한 결론이 나온다.

## 에이전트에 붙이기

대화형으로는 이 한 줄이 제일 편하다.

```bash
npx @colbymchenry/codegraph
```

또는 CLI 설치 후에 따로 연결한다.

```bash
codegraph install
```

[Integrations 문서](https://colbymchenry.github.io/codegraph/reference/integrations/) 기준으로 자동 감지 대상은 Claude Code, Cursor, Codex CLI, opencode, Hermes Agent, Gemini CLI, Antigravity IDE, Kiro다. 사용 중인 에이전트를 고르면 MCP 서버 설정과 instruction 파일의 CodeGraph 안내 블록을 추가한다.

스크립트나 dotfiles에서 고정하고 싶으면 비대화형 플래그를 쓴다.

```bash
codegraph install --yes
codegraph install --target=claude,codex,opencode --yes
codegraph install --target=auto --location=local
codegraph install --print-config codex
```

수동으로 붙일 때 MCP 서버의 실체는 단순하다.

```json
{
  "mcpServers": {
    "codegraph": {
      "type": "stdio",
      "command": "codegraph",
      "args": ["serve", "--mcp"]
    }
  }
}
```

다만 직접 `codegraph serve --mcp`를 띄워놓고 쓰는 식은 아니다. [MCP Server 문서](https://colbymchenry.github.io/codegraph/reference/mcp-server/)가 말하듯 에이전트가 필요할 때 서버를 실행한다.

## 프로젝트마다 한 번은 `init`

프로젝트 루트에서 그래프를 만든다.

```bash
cd your-project
codegraph init
codegraph status
```

`codegraph init`은 `.codegraph/` 디렉터리를 만들고 전체 그래프를 한 번 구축한다. 이후에는 OS 파일 이벤트로 변경분을 자동 동기화한다. 문서상으로는 FSEvents, inotify, ReadDirectoryChangesW를 사용한다. 일반적인 에이전트 세션에서는 매번 재색인할 일이 없다.

그래도 수동 명령은 알아두는 편이 좋다.

```bash
codegraph index      # 전체 재색인
codegraph sync       # 변경분 동기화
codegraph unlock     # stale lock 제거
codegraph uninit     # 프로젝트 인덱스 제거
```

내 로컬 `wonder-tinker` 체크아웃에서 `codegraph status .`를 돌렸을 때는 6,708 files, 73,515 nodes, 98,382 edges가 잡혔다. 동시에 "earlier version으로 만든 인덱스니 재색인하라"는 경고도 나왔다. 또 `codegraph explore`가 상위 workspace까지 너무 넓게 끌고 오는 걸 봤다. 이건 도구의 문제가 아니라 프로젝트 경계를 느슨하게 잡은 내 설치 상태의 문제다. 팀에서 붙일 때는 `.codegraph/`가 진짜 프로젝트 루트를 가리키는지부터 확인하는 게 낫다.

## CLI만으로도 꽤 쓸 만하다

[CLI reference](https://colbymchenry.github.io/codegraph/reference/cli/)에서 먼저 봐야 할 명령은 이 정도다.

```bash
codegraph status
codegraph explore "how does login work"
codegraph query UserService --kind class --limit 10
codegraph node UserService
codegraph callers handleRequest --json
codegraph callees handleRequest --json
codegraph impact AuthMiddleware --depth 3
```

`explore`는 자연어 질문이나 심볼 이름 묶음을 받아 관련 소스, 호출 경로, 영향 반경을 한 번에 보여준다. `query`, `callers`, `callees`, `impact`는 좁은 질의에 좋고 `--json`을 붙이면 스크립트로 먹이기 쉽다.

로컬에서 바로 확인한 예시는 이렇다.

```bash
codegraph query BaseLayout --kind component --limit 5
```

`wonder-tinker/src/layouts/BaseLayout.astro:1`의 `BaseLayout` 컴포넌트를 바로 찾았다. 이 정도 질의는 `rg BaseLayout`도 충분히 빠르다. CodeGraph가 갈라지는 지점은 "이 컴포넌트가 어떤 라우트와 어떤 렌더링 흐름에 영향을 주는가"처럼 관계가 붙는 순간이다.

테스트 선택에도 쓸 수 있다.

```bash
git diff --name-only | codegraph affected --stdin --quiet
codegraph affected src/auth.ts --filter "e2e/*"
```

[Affected Tests 문서](https://colbymchenry.github.io/codegraph/guides/affected-tests/)는 import dependency를 타고 변경 파일에 영향을 받는 테스트를 좁히는 용도라고 설명한다. 대형 저장소에서 전체 테스트를 매번 돌릴 수 없을 때 pre-commit이나 CI 앞단에 붙일 만한 명령이다.

## Claude Code, OpenCode, Codex에서의 감각

Claude Code든 OpenCode든 Codex든, 기본 탐색 패턴은 비슷하다.

1. 파일명을 찾는다.
2. 후보 파일을 읽는다.
3. 호출자를 찾는다.
4. 또 다른 파일을 읽는다.
5. 그제야 수정한다.

작은 저장소에서는 이게 별 문제가 아니다. `rg` 몇 번이면 된다. 큰 저장소에서는 이 단계가 본 작업보다 비싸다. CodeGraph는 이 발견 비용을 인덱싱 시점으로 당긴다. 에이전트 입장에서는 "아마 이 파일일 것 같다"가 아니라 "이 심볼과 이 호출 경로가 관련 있다"에서 시작한다.

현재 MCP 기본값도 그 방향으로 바뀌어 있다. 문서에 따르면 기본 노출 도구는 `codegraph_explore` 하나다. 이 도구는 Read와 비슷한 줄번호 소스를 돌려주면서 호출 경로와 blast radius까지 같이 붙인다. 좁은 도구 일곱 개도 존재하지만 기본으로 숨겨둔다. 에이전트가 `search`를 고를지 `callers`를 고를지 망설이게 하기보다, 대개 `explore` 한 번으로 시작하게 하려는 설계다.

필요하면 환경 변수로 좁은 도구를 다시 열 수 있다.

```bash
CODEGRAPH_MCP_TOOLS=explore,node,search,callers
```

CLI 대응도 있다. MCP가 없는 하위 에이전트나 shell-only harness에는 이렇게 넘기면 된다.

```bash
codegraph explore "how does payment cancellation reach refund creation"
codegraph node RefundService
codegraph callers createRefund --json
```

이 방식이 좋은 이유는 모델에게 "전체 파일을 다 읽고 알아서 요약해"라고 던지지 않는다는 점이다. 그래프가 후보를 줄이고, 모델은 그 후보 위에서 판단한다. 토큰을 아끼는 효과보다 더 중요한 건 실수면이 줄어드는 효과다. 틀린 파일을 읽고 그럴듯하게 답하는 시간이 줄어든다.

## 효율 수치는 믿되, 내 저장소에서 다시 봐야 한다

[Introduction 문서](https://colbymchenry.github.io/codegraph/getting-started/introduction/)와 README는 7개 오픈소스 저장소, median of 4 runs 기준으로 현재 빌드의 효과를 58% fewer tool calls, 22% faster, file reads near zero라고 정리한다. VS Code, Django, Tokio, OkHttp, Gin, Alamofire 같은 저장소를 대상으로 한 비교다.

PyTorchKR 글에 나오는 92% 적은 도구 호출, 71% 짧은 응답 시간은 2026년 5월 당시 README 벤치마크를 소개한 값이다. 지금 공식 README는 Opus 4.8 재검증을 거치며 더 낮지만 더 현실적인 숫자를 내세운다. 이 차이는 나쁘게 볼 일이 아니다. 모델 자체의 탐색 능력이 좋아지면 "without CodeGraph" 기준선도 좋아지고, 도구의 상대 개선폭은 줄어든다.

내 결론은 이렇다.

| 저장소 크기 | 기대값 |
| :--- | :--- |
| 100개 파일 안팎 | 설치 비용이 더 커 보일 수 있다. CLI 질의나 `affected` 정도만 먼저 써도 된다. |
| 수백~수천 파일 | 아키텍처 질문, 영향 범위 확인, 테스트 선택에서 체감이 난다. |
| 모노레포/다언어 저장소 | 에이전트 탐색 비용이 본 작업을 잡아먹는다면 우선순위가 높다. |

비용 절감은 덤으로 봐야 한다. 작은 저장소에서는 몇 센트가 줄어드는지보다 답까지 가는 왕복이 줄어드는 게 더 크다. 팀 단위 대형 저장소에서는 그 왕복이 누적되어 비용이 된다.

## 언제 쓰고 언제 안 쓰나

CodeGraph가 맞는 질문:

```text
How does X reach Y?
What calls this service?
What will break if I change this handler?
Which tests are likely affected by these files?
Where is this route wired to a controller?
```

그냥 `rg`가 맞는 질문:

```text
어떤 파일에 TODO가 있나?
이 에러 문자열이 어디 있나?
README에 특정 URL이 남아 있나?
```

LSP나 컴파일러가 맞는 질문:

```text
이 rename이 타입 의미상 안전한가?
이 overload가 실제로 어떤 타입으로 해석되는가?
이 변경이 빌드를 깨는가?
```

CodeGraph는 정적 그래프를 빠르게 꺼내는 도구다. 타입체커도 아니고 테스트도 아니고 리뷰어도 아니다. 좋은 순서는 `codegraph explore`로 후보와 영향 반경을 좁히고, 실제 변경은 LSP/컴파일러/테스트/브라우저로 닫는 것이다.

## 팀에 붙일 때의 기본 세팅

내가 팀 저장소에 넣는다면 이렇게 시작하겠다.

```bash
# 1. 각 개발자 머신
codegraph install --target=claude,codex,opencode --yes

# 2. 각 프로젝트 루트
codegraph init
codegraph status

# 3. Git ignore 확인
printf ".codegraph/\\n" >> .gitignore

# 4. CI나 pre-commit 후보
git diff --name-only | codegraph affected --stdin --quiet
```

`.codegraph/`는 로컬 인덱스다. 보통 커밋하지 않는다. 사내 코드베이스라면 이 점이 중요하다. 공식 문서도 로컬 SQLite DB라고 못박고 있고, 외부 API 키나 원격 서비스가 필요하지 않다. 단, README 기준으로 익명 사용 통계는 기본 수집될 수 있으니 보수적인 조직에서는 먼저 끈다.

```bash
codegraph telemetry off
CODEGRAPH_TELEMETRY=0 codegraph status
DO_NOT_TRACK=1 codegraph status
```

인덱스에는 코드 구조가 들어 있으니 백업/동기화 도구가 홈 디렉터리를 긁어가는 환경에서는 제외 규칙도 같이 본다.

## 한 줄 평가

CodeGraph는 "AI가 코드를 더 똑똑하게 이해한다"기보다 "AI가 엉뚱한 파일을 읽느라 시간을 버리는 구간을 줄인다"에 가깝다. 그래서 효과는 모델의 추론력보다 저장소의 구조와 크기에 더 크게 좌우된다. Claude Code, OpenCode, Codex를 자주 쓰고, 매번 탐색 로그가 길게 늘어진다면 설치할 이유가 충분하다. 반대로 작은 스크립트 저장소에서 문자열 찾기가 전부라면 `rg`와 LSP를 먼저 쓰면 된다.

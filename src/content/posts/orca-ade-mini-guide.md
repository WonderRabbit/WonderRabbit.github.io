---
title: "Orca ADE 미니 설명서: 에이전트 터미널부터 테마와 예약 자동화까지"
description: "Orca에서 worktree와 에이전트 터미널을 연결하고, System·Dark·Light 테마와 폰트, Hermes·Pi, Orchestration, 예약 자동화를 설정하는 흐름을 화면과 함께 정리합니다."
published: "2026-07-13"
draft: false
category: "Developer Tools"
tags:
  - Orca
  - ADE
  - AI Agent
  - Terminal
  - Automation
lang: "ko"
aiAssisted: true
showSources: true
sources:
  - title: "Orca Docs, What is Orca?"
    url: "https://www.onorca.dev/docs"
    accessed: "2026-07-13"
  - title: "Orca, Download"
    url: "https://www.onorca.dev/download"
    accessed: "2026-07-13"
  - title: "stablyai/orca"
    url: "https://github.com/stablyai/orca"
    accessed: "2026-07-13"
  - title: "Orca Docs, Your first 3-agent session"
    url: "https://www.onorca.dev/docs/first-session"
    accessed: "2026-07-13"
  - title: "Orca Docs, Tabs, panes & split layouts"
    url: "https://www.onorca.dev/docs/model/tabs-panes-splits"
    accessed: "2026-07-13"
  - title: "Orca Docs, Agents & sessions"
    url: "https://www.onorca.dev/docs/model/agents-sessions"
    accessed: "2026-07-13"
  - title: "Orca Docs, Supported agents"
    url: "https://www.onorca.dev/docs/agents/supported"
    accessed: "2026-07-13"
  - title: "Orca Docs, Terminal"
    url: "https://www.onorca.dev/docs/terminal"
    accessed: "2026-07-13"
  - title: "Orca Docs, Settings reference"
    url: "https://www.onorca.dev/docs/settings"
    accessed: "2026-07-13"
  - title: "Orca Docs, Add a custom CLI agent"
    url: "https://www.onorca.dev/docs/agents/custom-cli"
    accessed: "2026-07-13"
  - title: "Orca Docs, Orchestration"
    url: "https://www.onorca.dev/docs/cli/orchestration"
    accessed: "2026-07-13"
  - title: "Orca Docs, Scheduled automations"
    url: "https://www.onorca.dev/docs/cli/automations"
    accessed: "2026-07-13"
  - title: "Pi Documentation"
    url: "https://pi.dev/docs/latest"
    accessed: "2026-07-13"
  - title: "Hermes Agent Documentation"
    url: "https://hermes-agent.nousresearch.com/docs/"
    accessed: "2026-07-13"
  - title: "Hermes Agent, Security"
    url: "https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/security.md"
    accessed: "2026-07-13"
---

Orca를 처음 열면 IDE처럼 보이지만, 사용법의 중심은 파일 편집기가 아닙니다. 저장소에서 작업별 `git worktree`를 만들고, 각 worktree에 Claude Code, Codex, OpenCode, Pi, Hermes 같은 CLI 에이전트를 붙여 동시에 돌리는 것이 핵심입니다.

여기서 먼저 바로잡을 것이 하나 있습니다. Orca는 모델도, 모든 터미널을 자동 지휘하는 단일 에이전트도 아닙니다. 기본 상태의 각 에이전트 터미널은 독립 세션입니다. 한 에이전트가 다른 터미널의 대화를 자동으로 읽지는 않습니다. 단순히 여러 세션을 나란히 볼 것인지, 한 coordinator가 worker 터미널을 추적하게 만들 것인지에 따라 `terminal`과 `orchestration`을 구분해야 합니다.

이 글은 2026년 7월 13일의 Orca 공식 문서와 공개 소스를 기준으로 작성했습니다. 아래 화면은 공식 문서 페이지와 공식 UI asset을 같은 날 캡처한 것입니다. Orca는 변경 속도가 빠르므로 메뉴 이름이 달라졌다면 `Cmd-,` 또는 `Ctrl-,`로 Settings를 연 뒤 키워드 검색을 먼저 사용하는 편이 안전합니다.

## 1. Orca를 이해하는 가장 짧은 구조

Orca의 작업 단위는 다음 순서로 보면 쉽습니다.

```text
Repository
└─ Worktree 또는 Workspace
   ├─ Agent terminal: Codex
   ├─ Agent terminal: Pi
   ├─ Plain terminal: zsh, PowerShell, WSL
   ├─ Editor / Diff
   └─ Browser
```

UI에서는 `Workspace`라는 표현도 보이지만, 코드 작업 공간은 실제 `git worktree`입니다. 따라서 에이전트 A와 B를 서로 다른 worktree에서 실행하면 파일 변경과 branch가 분리됩니다. 같은 worktree 안에서 terminal만 둘로 나누면 두 프로세스가 같은 파일을 보므로 동시에 수정할 때 충돌할 수 있습니다.

![Orca에서 worktree별 에이전트 터미널과 편집 화면을 나란히 배치한 모습](/images/orca-ade/worktree-agent-panes.gif)

*공식 첫 세션 예시. 왼쪽에는 worktree 목록, 가운데에는 agent terminal, 오른쪽에는 편집기나 diff를 함께 둘 수 있습니다.*

선택 기준은 단순합니다.

| 원하는 작업 | 추천 구조 |
| :--- | :--- |
| 한 에이전트와 테스트 shell을 같이 보기 | 같은 worktree에서 terminal split |
| Codex와 Pi가 같은 문제를 서로 다르게 풀기 | 같은 base ref에서 worktree 두 개 생성 |
| 한 agent가 조사하고 다른 agent가 구현하기 | worktree를 분리하고 Orchestration으로 task dispatch |
| 잠깐 명령 하나 실행하기 | plain terminal 또는 Floating terminal |
| 정해진 시각에 반복 작업 시작하기 | Scheduled automations |

## 2. 설치와 첫 workspace 만들기

macOS에서는 Homebrew cask가 가장 짧습니다.

```bash
brew install --cask stablyai/orca/orca
```

Windows와 Linux는 [Orca 다운로드 페이지](https://www.onorca.dev/download)에서 installer, AppImage, `.deb`를 받을 수 있습니다. 첫 실행에서는 home directory 접근을 요청하고, 로컬에 `~/.claude`, `~/.codex`, Ghostty 설정이 있으면 가져오기를 제안합니다.

처음 작업을 여는 순서는 다음과 같습니다.

1. `Add repository`로 기존 Git 저장소를 등록합니다.
2. 저장소 이름 옆 `+`를 눌러 workspace를 만듭니다.
3. `Workspace Name`에는 `fix-login`, `docs-orca`처럼 작업 목적을 적습니다. 비워 두면 해양 생물 이름이 붙을 수 있습니다.
4. `Agent`에서 Codex, Claude Code, Pi, Hermes 등을 고릅니다.
5. `Create Workspace`를 누르면 새 worktree와 첫 agent terminal이 열립니다.

![Create Workspace에서 repository, workspace name, agent를 고르는 화면](/images/orca-ade/create-workspace-agent.gif)

*Agent 선택은 이 workspace의 첫 terminal을 무엇으로 열지 정합니다. 나중에 같은 worktree에 다른 agent tab을 더 만들 수 있습니다.*

각 agent CLI의 로그인은 Orca가 대신 구매하거나 통합 계정으로 바꾸는 방식이 아닙니다. Codex, Claude Code, Pi, Hermes가 요구하는 subscription 또는 API key를 해당 CLI에서 먼저 설정해야 합니다. agent가 열리지 않으면 Orca 문제라고 단정하기 전에 plain terminal에서 `codex`, `pi`, `hermes` 같은 명령이 직접 실행되는지 확인합니다.

## 3. 각 터미널과 Main agent를 어떻게 연결하나

“Main agent와 각 terminal을 연결한다”는 말은 두 가지 상황으로 나뉩니다.

### 화면만 나눠 쓰는 가벼운 방식

terminal tab은 각각 하나의 process입니다. tab을 pane 가장자리로 끌면 좌우 또는 상하로 나뉘고, split 안에 다시 split을 만들 수도 있습니다.

- `Cmd-T`: 현재 worktree에 새 terminal tab
- `Cmd-Alt-T`: macOS에서 기본 agent로 새 agent tab
- `Cmd-\`: 오른쪽으로 split
- `Cmd-Shift-\`: 아래로 split
- `Cmd-W`: 현재 tab 닫기
- `Cmd-F`: terminal scrollback 검색

Linux와 Windows에서는 `New agent tab` 단축키가 기본으로 비어 있을 수 있습니다. `Settings → Shortcuts`에서 원하는 키를 지정합니다. agent별 `New agent tab` action도 있으므로 Codex와 Pi를 서로 다른 단축키에 묶을 수 있습니다.

이 방식에서는 사람이 main 역할을 합니다. agent A의 결과를 읽고 agent B에게 붙여 넣거나, Orca CLI의 `terminal send`를 사용합니다.

```bash
orca terminal list --worktree active --json
orca terminal read --terminal <handle> --json
orca terminal send --terminal <handle> --text "이 결과를 검토해줘" --enter --json
```

terminal handle은 Orca runtime이 재시작되면 바뀔 수 있습니다. 오래된 handle이라는 오류가 나오면 `orca terminal list --json`으로 다시 얻습니다.

### coordinator와 worker를 추적하는 방식

누가 어떤 task를 맡았는지, worker가 완료 보고를 했는지, 질문 때문에 멈췄는지까지 추적하려면 `Orchestration`을 사용합니다. 2026년 7월 확인 기준으로 이 기능은 Experimental이며 먼저 `Settings → Experimental`에서 켜야 합니다.

![Orca Orchestration의 message, task, dispatch, decision gate 구조](/images/orca-ade/orchestration-main-agent.png)

*Main agent는 별도 마법 프로세스가 아니라 coordinator 역할을 맡은 agent terminal입니다. worker terminal은 handle로 주소화됩니다.*

Orchestration의 핵심 객체는 네 개입니다.

| 객체 | 의미 |
| :--- | :--- |
| Message | terminal 사이에 남는 `status`, `worker_done`, `escalation`, `heartbeat` 같은 기록 |
| Task | spec, dependency, `pending/ready/dispatched/completed/failed/blocked` 상태를 가진 작업 |
| Dispatch | 특정 task를 특정 terminal에 맡긴 실행 기록 |
| Decision gate | coordinator의 선택이 내려질 때까지 task를 막는 질문 |

먼저 실행 가능한 terminal을 확인합니다.

```bash
orca status --json
orca worktree ps --json
orca terminal list --json
orca orchestration task-list --json
orca orchestration inbox --limit 20 --json
```

worker에게 추적 가능한 task를 맡길 때는 `task-create` 후 `dispatch --inject`를 사용합니다.

```bash
orca orchestration task-create \
  --task-title "Orca 글 사실 검증" \
  --display-name "Orca fact checker" \
  --spec "공식 문서 링크와 명령 예시를 확인하고 잘못된 항목을 보고한다." \
  --json

orca orchestration dispatch \
  --task <taskId> \
  --to <workerHandle> \
  --inject \
  --json
```

`--inject`는 worker에게 coordinator에게 보고하는 방법을 함께 전달합니다. worker는 끝날 때 `worker_done`을 보내고, 오래 걸리는 동안 `heartbeat`를 보내며, 막히는 질문은 로컬 TUI에만 띄우지 않고 `orca orchestration ask`로 보냅니다.

```bash
orca orchestration check \
  --wait \
  --types worker_done,escalation,decision_gate \
  --timeout-ms 900000 \
  --json
```

여러 task를 자동 분해하고 빈 worker에게 나눠 주는 coordinator loop는 다음처럼 시작합니다.

```bash
orca orchestration run \
  --spec "문서 조사, 명령 검증, 링크 검사를 나눠 실행하고 결과를 합쳐라." \
  --max-concurrent 3 \
  --worktree active \
  --json
```

정리하면 `terminal send`는 내가 보고 있는 agent에게 한 번 말을 거는 용도이고, `orchestration dispatch --inject`는 완료 보고와 질문 경로까지 계약하는 용도입니다. Main agent라는 이름보다 coordinator와 worker라는 역할로 이해하는 편이 덜 헷갈립니다.

## 4. agent 상태 점 읽기

Orca는 terminal의 OSC title 변화를 읽어 agent 상태를 표시합니다.

- 초록색 pulse: 작업 중
- 노란색: 사용자 입력 대기
- 회색: idle
- 점 없음: 일반 shell이거나 Orca가 상태를 인식하지 못하는 CLI

![worktree sidebar에서 여러 agent의 작업 상태를 확인하는 화면](/images/orca-ade/agent-statuses.gif)

*Sidebar의 worktree card에서도 agent별 상태를 볼 수 있습니다. 직접 binary를 입력했을 때 점이 안 보이면 agent combobox에서 다시 시작해 봅니다.*

agent가 종료되거나 crash하면 tab에 `Restart` chip이 나타납니다. 눌렀을 때 같은 working directory에서 다시 실행됩니다. 상태 점은 작업의 정확성을 보장하지 않습니다. “끝났다”는 신호를 받았더라도 diff와 test 결과는 따로 검토해야 합니다.

## 5. 앱 테마, 폰트, 언어 바꾸기

Settings는 macOS에서 `Cmd-,`, Windows/Linux에서 `Ctrl-,`로 엽니다. `Appearance`의 `Theme`은 다음 세 가지입니다.

- `System`: OS의 appearance를 따라감
- `Dark`: Orca UI를 항상 dark로 표시
- `Light`: Orca UI를 항상 light로 표시

`Theme`은 Orca 창 전체의 색을 정합니다. 같은 화면에서 `UI Zoom`, `IDE Font`, accent color, density, editor minimap, status bar 항목, app icon, language도 바꿀 수 있습니다. `IDE Font`는 editor와 일반 UI에 적용되는 글꼴이고 terminal font와는 별도입니다.

![Orca 공식 Settings reference의 Appearance, Terminal, Agents 항목](/images/orca-ade/settings-appearance-terminal.png)

*Appearance와 Terminal은 별도 메뉴입니다. 앱을 Light로 바꿨다고 terminal palette가 자동으로 한 가지 색으로 고정되는 구조가 아닙니다.*

추천 시작값은 다음과 같습니다.

| 항목 | 무난한 선택 | 이유 |
| :--- | :--- | :--- |
| Theme | `System` | 낮과 밤에 OS 설정을 그대로 따름 |
| IDE Font | 평소 editor에서 쓰는 installed font | UI와 code view의 낯섦을 줄임 |
| UI Zoom | 100%에서 시작 | terminal font size와 중복 조정하지 않기 위해 |
| Density | 기본값 | sidebar에 worktree가 많아진 뒤 compact 여부 판단 |
| Language | `한국어` 또는 `System` | 메뉴 검색은 영문 source 이름도 함께 기억해 두기 |

## 6. Terminal 폰트와 색을 세밀하게 조정하기

`Settings → Terminal`의 테마는 앱 테마와 독립적입니다. Dark용 terminal theme과 Light용 terminal theme을 고르고, System 모드에서는 OS appearance에 맞는 쪽을 사용하도록 구성할 수 있습니다.

![Ghostty 스타일 terminal theme과 font를 적용하는 Orca 화면](/images/orca-ade/terminal-theme.gif)

*Orca는 Ghostty의 theme, font, cursor 설정을 가져올 수 있습니다. Warp-format YAML theme도 별도로 import할 수 있습니다.*

### Typography

기본 조정 순서는 `Font Size → Font Family → Line Height`가 좋습니다.

| 옵션 | 범위 또는 값 | 설명 |
| :--- | :--- | :--- |
| Font Size | 숫자 | terminal 안의 글자 크기 |
| Font Family | 설치된 font | IDE Font와 독립 |
| Font Weight | `100–900` | 너무 가는 글씨나 번지는 bold를 조정 |
| Line Height | `1–3` | agent의 긴 출력에서 줄 간격 조정 |
| Font Ligatures | `Auto / On / Off` | Fira Code, JetBrains Mono 같은 ligature 처리 |

한글 설명이 많다면 한글 glyph가 없는 monospace font 하나만 강제하기보다 fallback이 자연스러운지 preview에서 확인합니다. font를 바꾼 뒤 `→`, `!=`, JSON, 한글 경로를 한 화면에 띄워 폭과 가독성을 같이 보는 편이 좋습니다.

### Theme와 color

Orca는 built-in terminal theme catalog를 제공하며 다음 경로로 기존 설정을 가져올 수 있습니다.

- `Import from Ghostty`: Ghostty의 theme, font, cursor 설정
- `Import themes from Warp`: OS별 Warp theme directory 검색
- `Import from YAML`: 다른 폴더의 Warp-format `.yaml` 또는 `.yml`

Warp 기본 탐색 경로는 다음과 같습니다.

```text
macOS:   ~/.warp/themes
Linux:  $XDG_DATA_HOME/warp-terminal/themes
Windows: %APPDATA%\warp\Warp\data\themes
```

테마가 거의 맞고 특정 ANSI color만 불편하다면 `Color Overrides`에서 개별 색을 덮어쓴 뒤, 문제가 생겼을 때 `Reset all color overrides`로 되돌립니다. 처음부터 모든 색을 수동으로 바꾸면 light/dark 전환에서 대비가 깨졌는지 확인하기 어렵습니다.

### Cursor, pane, window

고급 설정에는 다음 항목이 있습니다.

| 묶음 | 옵션 |
| :--- | :--- |
| Cursor | `Bar / Block / Underline`, blinking, opacity `0–1` |
| Panes | inactive pane opacity `0–1`, divider thickness `1–32px` |
| Window | background opacity `0–1`, blur, horizontal/vertical padding, typing 중 mouse 숨김 |

`Window Blur`는 window 생성 옵션과 연결되므로 변경 후 Orca 재시작이 필요합니다. background opacity를 너무 낮추면 terminal ANSI color 대비도 함께 떨어집니다. 먼저 `0.9` 정도에서 확인한 뒤 조금씩 낮추는 편이 안전합니다.

pane을 많이 나눠 쓴다면 inactive opacity를 너무 낮추지 않는 편이 좋습니다. agent 출력은 색보다 text 변화로 상태를 판단하는 경우가 많아, 비활성 pane이 과하게 어두우면 질문 대기나 error를 놓치기 쉽습니다.

## 7. Pi를 Orca에 붙이기

Pi는 core를 작게 유지하고 TypeScript extension, skill, prompt template, theme, package로 확장하는 terminal coding harness입니다. Orca의 기본 지원 표에서는 `Auto-setup, hooks, status` 대상으로 표시됩니다.

Pi 공식 문서는 npm 설치를 다음처럼 안내합니다.

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

Linux/macOS installer를 사용할 수도 있습니다.

```bash
curl -fsSL https://pi.dev/install.sh | sh
```

설치 후 project directory에서 `pi`를 실행하고 `/login`으로 subscription provider를 인증하거나 필요한 API key를 설정합니다. 그 다음 Orca에서 확인합니다.

1. `Settings → Agents`를 엽니다.
2. Pi가 detected agent에 나타나는지 확인하고 enabled로 둡니다.
3. worktree의 agent combobox에서 `Pi`를 고릅니다.
4. working directory가 현재 worktree인지 첫 prompt 전에 확인합니다.
5. 상태 점이 갱신되는지 봅니다.

Pi가 shell에서는 실행되는데 Orca 목록에 없으면 Orca가 보는 `PATH`가 같은지 확인합니다. GUI로 실행한 앱은 login shell과 환경이 다를 수 있습니다. 이 경우 binary path를 명시한 custom agent를 만들 수도 있습니다.

## 8. Hermes를 Orca에 붙이기

Hermes Agent는 Nous Research의 CLI/TUI agent입니다. Orca에서는 `Auto-setup` 대상으로 표시됩니다. Linux, macOS, WSL2의 공식 설치 명령은 다음과 같습니다.

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

Windows native PowerShell에서는 다음 명령을 사용합니다.

```powershell
iex (irm https://hermes-agent.nousresearch.com/install.ps1)
```

설치 후 새 shell을 열고 먼저 Hermes 자체 setup을 끝냅니다.

```bash
hermes setup
hermes
```

그 다음 `Settings → Agents`에서 Hermes를 켜고 agent combobox에서 시작합니다. Hermes는 자체적으로 model, toolset, gateway, memory, cron 기능이 있는 agent이지만, Orca의 worktree와 terminal 상태를 기준으로 반복 실행하려면 아래의 Orca Scheduled automations를 별도 기능으로 봐야 합니다.

### Hermes와 Yolo 설정 주의

Orca는 새 supported agent launch에 permission bypass flag를 미리 채울 수 있습니다. `Settings → Agents → Agent Permissions`에서 uncustomized agent를 `Yolo` 또는 `Manual`로 전환합니다. Hermes의 Yolo launch는 `--yolo`를 사용합니다.

Hermes 자체 approval mode는 `manual`, `smart`, `off`가 있고, `--yolo` 또는 `HERMES_YOLO_MODE=1`은 현재 session의 dangerous-command approval을 우회합니다. Orca worktree가 분리돼 있어도 credential, network, home directory, 외부 서비스까지 자동으로 안전해지는 것은 아닙니다. 처음에는 `Manual`로 설치와 prompt를 검증하고, 삭제해도 되는 worktree와 제한된 credential에서만 Yolo를 검토하는 편이 좋습니다.

## 9. 목록에 없는 CLI agent 추가하기

Orca의 agent combobox는 결국 terminal에서 command를 실행하는 launcher입니다. 기본 목록에 없거나 custom wrapper를 쓰려면 다음 순서로 추가합니다.

1. `Settings → Agents`
2. `Add custom agent`
3. name과 binary path 또는 command 입력
4. 필요하면 default arguments 입력
5. 필요하면 startup hook 입력. 예: `source .envrc`

custom agent도 현재 worktree를 working directory로 사용하고, 종료되면 Restart chip을 표시합니다. 다만 CLI가 Orca가 인식하는 OSC title을 내보내지 않으면 상태 점은 나타나지 않습니다. 상태 점이 없다고 agent 실행 자체가 실패한 것은 아닙니다.

## 10. Scheduling: 반복 prompt를 안전하게 예약하기

Orca의 Scheduled automations는 정해진 시간에 prompt를 실행합니다. recurring issue triage, 하루 변경 요약, dependency 점검처럼 시작 조건이 시간인 작업에 맞습니다.

![Orca Scheduled automations의 disabled 생성 예시](/images/orca-ade/scheduled-automations.png)

*처음에는 `--disabled`로 만들고, 대상 repo와 prompt를 검토한 뒤 수동 실행하는 것이 공식 문서의 권장 흐름입니다.*

서울 시간 평일 오전 9시에 Codex가 issue를 점검하도록 만드는 예시는 다음과 같습니다.

```bash
orca automations create \
  --name "Weekday triage" \
  --trigger weekdays \
  --time 09:00 \
  --timezone Asia/Seoul \
  --prompt "새 issue를 분류하고 blocker만 요약한다. 파일은 수정하지 않는다." \
  --provider codex \
  --repo <repoSelector> \
  --disabled \
  --json
```

`--trigger`는 `hourly`, `daily`, `weekdays`, `weekly` preset뿐 아니라 5-field cron과 RRULE도 받을 수 있습니다. 서버나 remote runtime의 기본 timezone을 믿지 말고 일정이 중요한 작업에는 IANA timezone을 명시합니다.

실행 위치는 두 방식입니다.

| target | 동작 | 적합한 작업 |
| :--- | :--- | :--- |
| `--repo <selector>` | repository를 대상으로 run | 매번 분리된 변경 작업, triage |
| `--workspace <selector>` | 기존 Orca worktree에서 run | 같은 상태를 이어서 관찰하는 작업 |

기존 workspace를 쓰면서 이전 automation terminal 대화를 이어가려면 `--reuse-session`을 붙입니다.

```bash
orca automations create \
  --name "Hourly build watch" \
  --trigger hourly \
  --prompt "최근 build 실패만 확인하고 원인을 한 문단으로 기록한다." \
  --provider codex \
  --workspace active \
  --reuse-session \
  --disabled \
  --json
```

반대로 매번 깨끗한 context가 필요하면 `--fresh-session`으로 바꿉니다.

예약을 켜기 전에 목록, 설정, 수동 run을 확인합니다.

```bash
orca automations list --json
orca automations show <automationId> --json
orca automations run <automationId> --json
orca automations runs --id <automationId> --json
orca automations edit <automationId> --enabled --json
```

삭제 권한이나 외부 전송이 들어간 prompt를 처음부터 enabled로 만들지 않습니다. 먼저 read-only prompt와 `--disabled`로 target, timezone, provider, credential 범위를 확인합니다.

## 11. 자주 막히는 지점

### agent가 시작되지 않는다

plain terminal에서 agent binary를 직접 실행합니다. 여기서도 실패하면 CLI 설치나 인증 문제입니다. shell에서는 되는데 Orca에서만 안 되면 `Settings → Agents`의 detected path와 GUI app의 `PATH`를 확인합니다.

### agent는 움직이는데 상태 점이 없다

직접 command를 입력하지 말고 agent combobox에서 실행해 봅니다. custom CLI가 OSC title을 내보내지 않는다면 상태 점 없이도 terminal은 정상 동작할 수 있습니다.

### 두 agent가 같은 파일을 덮어쓴다

terminal split만 했는지 확인합니다. 서로 독립적으로 구현하게 할 목적이라면 terminal이 아니라 worktree를 분리해야 합니다.

### System theme인데 terminal 색이 이상하다

`Appearance → Theme`과 `Terminal → Theme`을 따로 확인합니다. 앱은 System인데 terminal의 Light용 theme만 대비가 약하거나, ANSI color override가 남아 있을 수 있습니다.

### automation이 엉뚱한 저장소에서 돈다

shell의 current directory 추론에 기대지 말고 `--repo` 또는 `--workspace` selector를 명시합니다. automation을 만들 때는 `--disabled`, 실행할 때는 `show`, `run`, `runs` 순서로 검증합니다.

## 시작할 때 적용할 최소 설정

처음부터 모든 기능을 켤 필요는 없습니다. 다음 순서면 Orca의 구조를 빠르게 익힐 수 있습니다.

1. repository 하나를 등록한다.
2. 같은 base ref에서 worktree 두 개를 만든다.
3. 한쪽에는 Codex, 다른 쪽에는 Pi 또는 Hermes를 연다.
4. `Appearance`는 `System`, `Terminal`은 익숙한 font와 dark/light theme으로 맞춘다.
5. 상태 점과 diff를 보며 두 agent의 결과를 비교한다.
6. 한 번 전달이면 `terminal send`, 완료 추적이 필요하면 Orchestration을 쓴다.
7. 반복 작업은 read-only prompt와 `--disabled` automation으로 시험한다.

Orca의 장점은 agent 수를 늘리는 데만 있지 않습니다. 어떤 branch에서 어떤 terminal이 일하고 있으며, 누가 기다리고 있고, 어떤 diff를 검토해야 하는지를 한 화면에 유지하는 데 있습니다. worktree와 terminal의 경계를 먼저 이해한 뒤 theme, Pi, Hermes, Orchestration, scheduling을 하나씩 얹는 편이 가장 덜 복잡합니다.

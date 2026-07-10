---
title: "OpenCode에서 Qwen 두 모델로 웹 분석과 UI 설계를 나누기"
description: "qwen3.6:35b와 qwen3.5:9b를 OpenCode agent와 command에 묶어 웹 분석, 변경사항 기반 Markdown 설계, UI 설계 검토를 분리하는 운영 예시."
published: "2026-07-10"
draft: false
category: "Developer Tools"
tags:
  - OpenCode
  - Qwen
  - Ollama
  - UI Design
  - Web Analysis
  - Agent Workflow
aiAssisted: true
sources:
  - title: "OpenCode docs, Agents"
    url: "https://opencode.ai/docs/agents/"
    accessed: "2026-07-10"
  - title: "OpenCode docs, Commands"
    url: "https://opencode.ai/docs/commands/"
    accessed: "2026-07-10"
  - title: "OpenCode docs, Providers"
    url: "https://opencode.ai/docs/providers/"
    accessed: "2026-07-10"
  - title: "Ollama library, qwen3.6"
    url: "https://ollama.com/library/qwen3.6"
    accessed: "2026-07-10"
  - title: "Ollama library, qwen3.6:35b"
    url: "https://ollama.com/library/qwen3.6:35b"
    accessed: "2026-07-10"
  - title: "Ollama library, qwen3.5"
    url: "https://ollama.com/library/qwen3.5"
    accessed: "2026-07-10"
  - title: "Ollama library, qwen3.5:9b"
    url: "https://ollama.com/library/qwen3.5:9b"
    accessed: "2026-07-10"
---

두 모델을 같이 쓸 때 목표는 "큰 모델을 아끼자"가 아니다. 실패 비용이 다른 작업을 분리하는 것이다.

웹 분석, 변경사항 요약, Markdown 기반 설계, UI 설계 검토를 한 agent에게 계속 맡기면 context가 섞인다. `qwen3.5:9b`가 충분히 할 수 있는 수집과 분류까지 `qwen3.6:35b`가 떠안고, 정작 화면 구조를 결정해야 할 때는 이전 로그와 후보 목록 때문에 답이 흐려진다.

내 기준은 이렇게 나눈다.

| 역할 | 모델 | 쓰는 지점 | 산출물 |
| --- | --- | --- | --- |
| web analyst | `qwen3.5:9b` | URL, 문서, 레퍼런스 화면에서 사실과 패턴을 뽑을 때 | `research/web-analysis.md` |
| change mapper | `qwen3.5:9b` | `git diff`, 최근 commit, 변경 파일을 읽어 설계 영향 범위를 정리할 때 | `design/change-map.md` |
| design architect | `qwen3.6:35b` | 분석과 변경 지도를 합쳐 Markdown 설계안을 만들 때 | `design/web-design.md` |
| UI reviewer | `qwen3.6:35b` | 정보 구조, 상태, component boundary, visual risk를 검토할 때 | `design/ui-review.md` |

`qwen3.5:9b`는 6.6GB tag와 256K context window가 붙어 있다. 작은 모델이지만 긴 자료를 읽고 표로 압축하는 역할에는 맞다. 반대로 `qwen3.6:35b`는 24GB tag라 가볍지는 않지만, Ollama 설명이 agentic coding, frontend workflow, repository-level reasoning을 직접 겨냥한다. 그래서 결정을 내리는 agent로 둔다.

## 먼저 provider를 명시한다

OpenCode provider 문서는 Ollama를 local OpenAI-compatible endpoint로 붙이는 예시를 제공한다. 여기에 두 모델만 모델 목록에 올려두면 command와 agent에서 같은 이름을 재사용할 수 있다.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "ollama": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Ollama (local)",
      "options": {
        "baseURL": "http://localhost:11434/v1"
      },
      "models": {
        "qwen3.6:35b": {
          "name": "Qwen3.6 35B local"
        },
        "qwen3.5:9b": {
          "name": "Qwen3.5 9B local"
        }
      }
    }
  }
}
```

모델 선택 문자열은 `ollama/qwen3.6:35b`, `ollama/qwen3.5:9b`처럼 `provider/model-id` 형태로 쓴다. `ollama launch opencode --model qwen3.6`나 `ollama launch opencode --model qwen3.5`로 시작하는 방식도 가능하지만, 여러 agent에 모델을 고정하려면 config에 모델 ID를 명시해두는 편이 추적하기 쉽다.

## agent는 권한으로 나눈다

분석 agent는 읽기만 해야 한다. 설계 agent도 Markdown 산출물을 만들 때만 쓰기 권한을 가진다. 이 차이를 모델 크기보다 먼저 고정한다.

`.opencode/agents/web-analyst.md`는 외부 레퍼런스와 기존 화면을 읽고 증거를 압축한다.

```markdown
---
description: Web reference analyst. Extracts facts, IA patterns, UI states, and source caveats without editing files.
mode: subagent
model: ollama/qwen3.5:9b
permission:
  edit: deny
  bash: ask
  webfetch: ask
  websearch: ask
---

Read the requested URLs, screenshots, docs, or local HTML.
Return only source-backed observations:
- page goal
- navigation and information architecture
- primary user tasks
- reusable UI patterns
- missing states
- unresolved claims

Do not propose final UI yet.
```

`.opencode/agents/change-mapper.md`는 변경사항을 설계 언어로 바꾼다.

```markdown
---
description: Maps git and file changes into design impact notes.
mode: subagent
model: ollama/qwen3.5:9b
permission:
  edit: deny
  bash:
    "git diff*": allow
    "git status*": allow
    "git log*": allow
    "*": ask
---

Inspect the provided diff and file list.
Return:
- changed routes or screens
- changed data shape
- user-visible behavior changes
- docs or Markdown files that must be updated
- UI risks caused by the change
```

`.opencode/agents/design-architect.md`는 최종 Markdown 설계안을 쓴다.

```markdown
---
description: Produces Markdown web and UI design specs from analysis packets.
mode: subagent
model: ollama/qwen3.6:35b
permission:
  edit: ask
  bash: ask
---

Use the web analysis and change map as inputs.
Write a Markdown design spec with:
- problem and target user
- screen inventory
- information architecture
- component boundaries
- states and empty/error/loading cases
- acceptance criteria
- unresolved decisions

Prefer concrete sections and tables over broad prose.
```

`.opencode/agents/ui-reviewer.md`는 설계안을 깨는 역할이다.

```markdown
---
description: Reviews Markdown UI specs for missing states, inconsistent IA, and implementation risk.
mode: subagent
model: ollama/qwen3.6:35b
permission:
  edit: deny
  bash: ask
---

Review the provided design spec.
Find problems only:
- unclear user flow
- missing responsive behavior
- missing loading, empty, error, permission, or destructive-action states
- component boundary that will be hard to implement
- claim not supported by source or diff evidence

Return severity, file/section, and a concrete fix.
```

큰 모델에게 처음부터 "좋은 UI 만들어줘"라고 시키지 않는다. 작은 모델이 자료를 압축하고, 큰 모델은 압축된 evidence packet을 바탕으로 결정을 내린다.

## command는 작업 진입점이다

OpenCode command는 Markdown 파일이나 config로 만들 수 있고, frontmatter에 `agent`와 `model`을 지정할 수 있다. `$ARGUMENTS`, `$1`, shell output, file reference도 prompt에 넣을 수 있다. 이 기능을 이용하면 "분석", "변경 지도", "설계", "리뷰"를 각각 짧은 command로 고정할 수 있다.

웹 분석 command는 URL이나 로컬 파일 경로를 인자로 받는다.

```markdown
---
description: Analyze web references for a design task
agent: web-analyst
model: ollama/qwen3.5:9b
subtask: true
---

Analyze this target:

$ARGUMENTS

Write the result as a concise evidence packet. If a claim is not visible in the target, mark it unresolved.
```

사용은 이렇게 한다.

```text
/web-analyze https://example.com/pricing
```

변경 지도 command는 현재 branch의 변경사항을 prompt에 주입한다.

```markdown
---
description: Convert current git changes into design impact notes
agent: change-mapper
model: ollama/qwen3.5:9b
subtask: true
---

Current status:
!`git status --short`

Changed files:
!`git diff --name-only`

Diff:
!`git diff -- . ':!package-lock.json' ':!dist/**'`

Map these changes into UI and Markdown design impact notes.
```

이 command는 변경 파일을 모두 고치지 않는다. 어떤 화면, 문서, 상태가 영향을 받는지만 뽑는다.

```text
/change-map
```

설계 command는 앞의 두 결과를 입력으로 받는다. 파일 참조를 쓰면 agent가 필요한 Markdown만 읽는다.

```markdown
---
description: Produce a Markdown web and UI design spec
agent: design-architect
model: ollama/qwen3.6:35b
subtask: true
---

Inputs:
- Web analysis: @research/web-analysis.md
- Change map: @design/change-map.md

Task:
Create or update @design/web-design.md.

Rules:
- Keep claims tied to the input files.
- Include screen inventory, component boundary, state matrix, and acceptance criteria.
- Do not invent product requirements that are not in the inputs.
- Put unresolved decisions in a final section.
```

```text
/md-web-design
```

마지막으로 리뷰 command를 둔다.

```markdown
---
description: Review Markdown UI design spec before implementation
agent: ui-reviewer
model: ollama/qwen3.6:35b
subtask: true
---

Review @design/web-design.md against:
- @research/web-analysis.md
- @design/change-map.md

Return blocking issues first.
Do not rewrite the whole document.
```

```text
/ui-design-review
```

## 실제 운영 순서

나는 이 순서를 기본값으로 둔다.

1. `/web-analyze <URL 또는 로컬 HTML>`로 레퍼런스 화면과 웹 자료를 읽힌다.
2. 결과를 `research/web-analysis.md`에 붙인다.
3. `/change-map`으로 현재 변경사항이 사용자 화면과 문서에 주는 영향을 뽑는다.
4. 결과를 `design/change-map.md`에 붙인다.
5. `/md-web-design`으로 `design/web-design.md`를 만든다.
6. `/ui-design-review`로 누락된 상태와 구현 위험을 잡는다.
7. 사람이 blocking issue만 반영하고, 이후 구현 agent나 직접 구현으로 넘어간다.

작업이 커지면 web analysis를 여러 개로 쪼갠다.

```text
/web-analyze https://example.com/
/web-analyze https://example.com/pricing
/web-analyze https://example.com/docs
```

각 결과는 하나의 큰 문서에 바로 섞지 말고 `research/web-analysis-home.md`, `research/web-analysis-pricing.md`처럼 나눈다. 그 다음 `design-architect`에게 필요한 파일만 `@`로 넘긴다. 작은 모델이 만든 evidence packet은 원본 자료의 압축본이고, 큰 모델에게 넘기는 prompt는 설계 입력이다. 이 둘을 같은 파일에 섞으면 나중에 무엇이 관찰이고 무엇이 결정인지 흐려진다.

## 역할 분리의 핵심 규칙

`qwen3.5:9b`에게 맡길 일은 다음처럼 검증 가능한 수집이다.

- URL이나 문서에서 headline, navigation, CTA, table, form, state를 뽑기
- `git diff`에서 변경 파일과 route 후보를 뽑기
- Markdown 문서의 중복 section과 빠진 acceptance criteria 찾기
- 여러 레퍼런스를 같은 표 형식으로 정리하기

`qwen3.6:35b`에게 맡길 일은 결정을 포함하는 합성이다.

- 어떤 정보 구조를 첫 화면에 둘지 결정하기
- 변경사항을 사용자 workflow와 component boundary로 바꾸기
- loading, empty, error, permission state를 빠짐없이 설계하기
- implementation handoff가 가능한 Markdown spec으로 정리하기
- 작은 모델이 놓친 모순과 unsupported claim을 잡기

가장 피해야 할 운영은 작은 모델에게 최종 디자인 결정을 맡긴 뒤 큰 모델에게 문장만 다듬게 하는 것이다. 그러면 더 비싼 모델을 proofreader로 쓰는 셈이다. 반대로 큰 모델이 모든 raw web 자료를 읽고 요약까지 하면 context가 낭비된다.

## 실패 조건

이 구조도 자동화가 아니다. command가 실행 순서를 기억해주는 것이지, 좋은 evidence packet을 보장하지는 않는다.

첫 번째 실패는 source와 decision이 섞이는 경우다. `web-analysis.md`에는 관찰만 두고, `web-design.md`에는 결정만 둬야 한다.

두 번째 실패는 diff를 너무 크게 넣는 경우다. `git diff` 전체가 길면 작은 모델도 핵심을 놓친다. 이때는 route, component, docs처럼 diff를 나눠서 command를 여러 번 실행한다.

세 번째 실패는 `qwen3.6:35b`를 항상 켜두는 경우다. UI 설계의 무거운 판단이 필요한 순간에만 쓴다. 나머지는 `qwen3.5:9b`가 만든 짧은 packet으로 충분하다.

마지막 실패는 tool call context다. OpenCode provider 문서도 Ollama에서 tool call이 안 맞으면 `num_ctx`를 16k-32k부터 올려보라고 안내한다. 두 모델 모두 256K context window를 갖는다고 해서 agent workflow 전체를 256K로 돌린다는 뜻은 아니다. command 단위로 입력을 줄이는 쪽이 먼저다.

## 가져갈 형태

디렉터리 형태는 이 정도면 충분하다.

```text
.opencode/
  agents/
    web-analyst.md
    change-mapper.md
    design-architect.md
    ui-reviewer.md
  commands/
    web-analyze.md
    change-map.md
    md-web-design.md
    ui-design-review.md
research/
  web-analysis.md
design/
  change-map.md
  web-design.md
  ui-review.md
```

작은 모델은 많이 읽고 짧게 남긴다. 큰 모델은 적게 읽고 결정한다. OpenCode command는 그 경계를 반복 가능한 entrypoint로 만든다. 이 구조가 있으면 "웹 분석해줘"와 "UI 설계해줘"가 한 prompt 안에서 섞이지 않고, 변경사항 기반 Markdown 설계도 실제 diff와 레퍼런스에서 출발한다.

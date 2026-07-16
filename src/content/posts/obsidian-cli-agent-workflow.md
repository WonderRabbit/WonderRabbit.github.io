---
title: "Obsidian CLI로 볼트를 관리하는 법: OpenCode, Claude Code, Codex 밀착 가이드"
description: "Obsidian CLI 설치부터 vault 선택, 검색·작성·속성·링크·작업 관리, OpenCode·Claude Code·Codex 권한 설정과 반복 워크플로까지 단계별로 정리합니다."
published: "2026-07-16"
draft: false
category: "Developer Tools"
tags:
  - Obsidian
  - CLI
  - OpenCode
  - Claude Code
  - Codex
lang: ko
aiAssisted: true
sources:
  - title: "Obsidian CLI 공식 안내"
    url: "https://obsidian.md/cli"
    accessed: "2026-07-16"
  - title: "Obsidian Help, Obsidian CLI"
    url: "https://obsidian.md/help/cli"
    accessed: "2026-07-16"
  - title: "OpenCode Rules"
    url: "https://opencode.ai/docs/rules/"
    accessed: "2026-07-16"
  - title: "OpenCode Permissions"
    url: "https://opencode.ai/docs/permissions/"
    accessed: "2026-07-16"
  - title: "OpenCode Commands"
    url: "https://opencode.ai/docs/commands/"
    accessed: "2026-07-16"
  - title: "OpenCode Agent Skills"
    url: "https://opencode.ai/docs/skills/"
    accessed: "2026-07-16"
  - title: "Claude Code, How Claude remembers your project"
    url: "https://code.claude.com/docs/en/memory"
    accessed: "2026-07-16"
  - title: "Claude Code, Configure permissions"
    url: "https://code.claude.com/docs/en/permissions"
    accessed: "2026-07-16"
  - title: "Claude Code CLI reference"
    url: "https://code.claude.com/docs/en/cli-usage"
    accessed: "2026-07-16"
  - title: "OpenAI Codex, Custom instructions with AGENTS.md"
    url: "https://developers.openai.com/codex/guides/agents-md"
    accessed: "2026-07-16"
  - title: "OpenAI Codex, Build skills"
    url: "https://developers.openai.com/codex/skills"
    accessed: "2026-07-16"
  - title: "OpenAI Codex CLI reference"
    url: "https://developers.openai.com/codex/cli/reference"
    accessed: "2026-07-16"
---

Obsidian 볼트를 코딩 에이전트에게 맡길 때 가장 먼저 정할 것은 도구가 아니라 **쓰기 경계**다. Markdown 본문은 파일로 직접 읽고 고칠 수 있지만, 속성 타입, 내부 링크 갱신, Daily notes, Bases, File Recovery, 플러그인 명령처럼 Obsidian이 해석해야 하는 작업은 공식 `obsidian` CLI를 통과시키는 편이 낫다.

내가 권하는 운영 방식은 다음 세 줄이다.

1. Markdown 파일을 원본 데이터로 둔다.
2. 읽기는 `obsidian search:context`, `read`, `properties`, `backlinks`로 좁힌다.
3. 쓰기는 `create`, `append`, `property:set`, `move`처럼 의도가 드러나는 명령으로 제한한다.

이 글은 2026년 7월 16일의 공식 문서를 기준으로 한다. 현재 공식 도움말은 Obsidian 1.12 installer가 필요하며, 문제 해결 항목에서는 installer `1.12.7+`를 확인하라고 안내한다. CLI와 에이전트 설정은 빠르게 바뀌므로 실제 환경에서는 먼저 `obsidian help`와 각 에이전트의 현재 버전을 확인하자.

## 먼저 알아둘 경계

공식 Obsidian CLI는 독립적인 headless Markdown 도구가 아니다. 데스크톱 Obsidian 앱이 실행 중이어야 하고, 앱이 꺼진 상태에서 첫 명령을 실행하면 앱을 시작한다. GUI 없이 서버에서 Sync만 돌리는 기능은 별도의 Obsidian Headless 경로다.

이 차이가 중요한 이유는 두 가지다.

- 로컬 노트 관리: 공식 `obsidian` CLI가 적합하다.
- GUI 없는 서버 자동화: 데스크톱 CLI가 아니라 Headless Sync와 별도 스크립트를 검토해야 한다.

또한 `vault=`에는 임의의 절대 경로가 아니라 Obsidian에 등록된 vault의 이름이나 ID를 넣는다. 코드 저장소에서 에이전트를 실행하면서 다른 폴더의 vault를 조작한다면, CLI에는 `vault="Work Notes"`를 주고 에이전트에는 해당 vault 디렉터리 접근 권한을 별도로 열어야 한다.

## 1단계: Obsidian CLI 설치

먼저 Obsidian을 최신 installer로 다시 설치한다. 앱 내부 업데이트만으로 installer 구성 요소가 갱신되지 않은 환경이 있을 수 있으므로, CLI 항목이 보이지 않으면 공식 다운로드 페이지의 installer를 사용한다.

설치 후 Obsidian에서 다음 순서로 활성화한다.

1. **Settings → General**을 연다.
2. **Command line interface**를 켠다.
3. 화면의 안내에 따라 CLI를 PATH에 등록한다.
4. 열려 있던 터미널을 종료하고 새로 연다.

OS별 등록 결과는 다르다.

| OS | 공식 등록 방식 | 확인할 점 |
| :--- | :--- | :--- |
| macOS | `/usr/local/bin/obsidian` symlink 생성 | 관리자 권한 요청 창이 뜰 수 있다. |
| Windows | `Obsidian.exe` 옆에 `Obsidian.com` redirector 추가 | GUI 앱과 터미널 호출을 연결하는 파일이다. |
| Linux | `~/.local/bin/obsidian`에 CLI 복사 | `~/.local/bin`이 PATH에 있어야 한다. |

새 터미널에서 다음 세 명령으로 상태를 확인한다.

```bash
obsidian version
obsidian help
obsidian
```

마지막 `obsidian`은 명령을 즉시 끝내는 대신 자동 완성과 기록 검색을 제공하는 TUI를 연다. 스크립트와 에이전트에서는 한 번에 끝나는 `obsidian <command>` 형식을 사용하면 된다.

### 설치가 안 잡힐 때

macOS와 Linux에서는 먼저 PATH를 확인한다.

```bash
command -v obsidian
printf '%s\n' "$PATH"
```

Windows PowerShell에서는 redirector를 찾는다.

```powershell
Get-Command obsidian
where.exe obsidian
```

명령이 없으면 앱 내부의 **Command line interface**를 한 번 껐다 켜고 다시 등록한다. 명령은 있는데 연결이 실패하면 Obsidian 앱을 직접 실행한 뒤 `obsidian version`을 다시 시도한다.

## 2단계: vault와 파일을 정확히 지정하기

터미널의 현재 디렉터리가 vault 내부라면 그 vault가 기본값이 된다. 그렇지 않으면 현재 Obsidian에서 활성화된 vault가 선택된다. 에이전트 자동화에서는 활성 창 상태에 기대지 말고 `vault=`를 항상 적는 편이 안전하다.

중요한 문법은 `vault=`가 command보다 앞에 온다는 점이다.

```bash
obsidian vault="Work Notes" files
obsidian vault="Work Notes" search query="회의록"
obsidian vault="Work Notes" daily:read
```

파일 지정에는 `file=`과 `path=` 두 방식이 있다.

- `file=회의록`은 wikilink와 같은 이름 해석을 사용한다. 확장자와 전체 경로를 생략할 수 있다.
- `path="10-projects/alpha/회의록.md"`는 vault root부터 시작하는 정확한 경로다.

동명 노트가 생길 수 있는 자동화에서는 `path=`를 사용한다.

```bash
obsidian vault="Work Notes" read file="회의록"
obsidian vault="Work Notes" read path="10-projects/alpha/회의록.md"
```

출력을 스크립트나 에이전트가 파싱할 때는 명령이 지원하는 `format=json`, `format=tsv`, `format=paths`를 고른다. `--copy`는 사람이 클립보드로 옮길 때 편하지만, 에이전트에는 표준 출력이 더 다루기 쉽다.

## 3단계: 최소 vault 구조 만들기

폴더를 지나치게 세분화하면 에이전트가 저장 위치를 추측한다. 처음에는 역할이 겹치지 않는 작은 구조가 낫다.

```text
Work Notes/
├── 00-inbox/
├── 10-active/
├── 20-evidence/
├── 30-topics/
├── 40-decisions/
├── 90-index/
├── templates/
├── AGENTS.md
└── CLAUDE.md
```

각 폴더의 책임은 다음처럼 한 문장으로 고정한다.

| 폴더 | 저장할 내용 |
| :--- | :--- |
| `00-inbox/` | 아직 분류하지 않은 캡처와 아이디어 |
| `10-active/` | 진행 중인 프로젝트와 현재 작업 문맥 |
| `20-evidence/` | URL, 로그, 실험 결과처럼 다시 확인할 근거 |
| `30-topics/` | 여러 근거를 합친 주제별 설명 |
| `40-decisions/` | 선택 이유와 되돌리는 조건을 적은 ADR |
| `90-index/` | 사람이 보거나 에이전트에 먼저 줄 짧은 색인 |
| `templates/` | 노트 유형별 frontmatter와 본문 골격 |

에이전트에게 매번 전체 vault를 읽히지 않는다. `90-index/current-context.md`와 관련 project note를 먼저 읽고, 링크를 따라 필요한 evidence만 추가로 가져오게 한다.

## 4단계: 공통 `AGENTS.md` 만들기

OpenCode와 Codex는 프로젝트의 `AGENTS.md`를 읽는다. Claude Code는 `CLAUDE.md`를 읽지만, 공식 문서가 안내하는 `@AGENTS.md` import를 쓰면 공통 규칙을 중복해서 관리하지 않아도 된다.

vault root의 `AGENTS.md`를 다음처럼 시작한다.

```md
# Obsidian vault operating rules

- Vault name: `Work Notes`
- Treat Markdown files as the durable source of truth.
- Start from `90-index/current-context.md`; do not scan the entire vault by default.
- Use exact vault-relative `path=` for writes.
- Use `obsidian search:context`, `read`, `properties`, `backlinks`, and `unresolved` for discovery.
- Use `obsidian create`, `append`, `property:set`, and `move` for writes that need Obsidian semantics.
- Never use `delete permanent`, `history:restore`, `plugin:install`, `plugin:uninstall`, or `eval` without explicit approval.
- Before overwriting a note, run `obsidian diff path="..."` and show the proposed change.
- Preserve YAML properties and wikilinks.
- After a write, read the target note and run `obsidian unresolved`.
```

Claude Code용 `CLAUDE.md`는 공통 규칙을 가져오고 Claude 전용 한 줄만 덧붙인다.

```md
@AGENTS.md

## Claude Code

- Use the Bash tool for `obsidian` commands and keep command output concise.
```

규칙 파일은 지시일 뿐 강제 장치가 아니다. 삭제 차단이나 외부 디렉터리 제한처럼 반드시 지켜야 하는 경계는 각 도구의 permission과 sandbox에도 넣어야 한다.

## 5단계: 읽기 명령 익히기

에이전트가 쓸 첫 명령은 전체 파일 목록이 아니라 검색이다. `search`는 일치한 파일 경로를 반환하고, `search:context`는 `path:line: text` 형식의 문맥까지 돌려준다.

```bash
obsidian vault="Work Notes" search query="oauth" limit=20
obsidian vault="Work Notes" search:context query="oauth" path="10-active" limit=20
obsidian vault="Work Notes" search query="status::active" format=json
```

후보가 정해지면 본문과 구조를 따로 읽는다.

```bash
obsidian vault="Work Notes" read path="10-active/project-alpha.md"
obsidian vault="Work Notes" outline path="10-active/project-alpha.md" format=json
obsidian vault="Work Notes" properties path="10-active/project-alpha.md" format=json
```

연결 상태를 점검할 때는 backlinks와 unresolved를 쓴다.

```bash
obsidian vault="Work Notes" backlinks path="30-topics/oauth.md" format=json
obsidian vault="Work Notes" links path="30-topics/oauth.md"
obsidian vault="Work Notes" unresolved verbose format=json
obsidian vault="Work Notes" orphans total
obsidian vault="Work Notes" deadends total
```

이 명령 조합이면 “oauth 관련 노트를 찾아 요약해줘”라는 요청을 전체 vault scan 없이 처리할 수 있다.

## 6단계: 안전하게 노트 쓰기

새 노트는 `create`로 만든다. 같은 경로가 이미 있을 때 `overwrite`를 생략하면 실수로 본문을 덮는 일을 피할 수 있다.

```bash
obsidian vault="Work Notes" create \
  path="00-inbox/2026-07-16-obsidian-cli.md" \
  content="# Obsidian CLI\n\n- 상태: 검토 전\n- 출처: [[20-evidence/obsidian-cli-docs]]"
```

기존 노트 끝에 진행 기록을 붙일 때는 `append`를 사용한다.

```bash
obsidian vault="Work Notes" append \
  path="10-active/project-alpha.md" \
  content="## 2026-07-16\n\n- [ ] CLI 권한 경계 검토"
```

frontmatter를 문자열 치환으로 고치지 말고 `property:set`을 사용한다. 속성 타입까지 명시할 수 있다.

```bash
obsidian vault="Work Notes" property:set \
  path="10-active/project-alpha.md" \
  name=status value=active type=text

obsidian vault="Work Notes" property:set \
  path="10-active/project-alpha.md" \
  name=reviewed value=false type=checkbox

obsidian vault="Work Notes" property:read \
  path="10-active/project-alpha.md" name=status
```

파일 이동과 이름 변경은 직접 `mv`를 쓰기보다 Obsidian CLI를 통과시킨다. vault 설정의 **Automatically update internal links**가 켜져 있으면 `move`와 `rename`이 내부 링크도 갱신한다.

```bash
obsidian vault="Work Notes" move \
  path="00-inbox/2026-07-16-obsidian-cli.md" \
  to="30-topics/obsidian-cli.md"
```

쓰기 직후에는 대상과 깨진 링크를 다시 읽는다.

```bash
obsidian vault="Work Notes" read path="30-topics/obsidian-cli.md"
obsidian vault="Work Notes" unresolved verbose format=json
```

## 7단계: Daily notes, 작업, Bases 활용하기

Daily notes core plugin을 쓰고 있다면 일일 기록은 파일 이름을 계산하지 않고 CLI에 맡긴다.

```bash
obsidian vault="Work Notes" daily:path
obsidian vault="Work Notes" daily:read
obsidian vault="Work Notes" daily:append content="- [ ] project-alpha 주간 정리"
obsidian vault="Work Notes" tasks daily
```

특정 project note의 task만 에이전트에게 넘길 때는 exact path로 범위를 좁힌다.

```bash
obsidian vault="Work Notes" tasks path="10-active/project-alpha.md" todo verbose format=json
```

Obsidian Bases를 쓰는 vault에서는 `.base` 파일의 view 결과를 구조화된 형식으로 받을 수 있다.

```bash
obsidian vault="Work Notes" bases
obsidian vault="Work Notes" base:views path="90-index/projects.base"
obsidian vault="Work Notes" base:query \
  path="90-index/projects.base" \
  view="Active" format=json
```

여기서 나온 JSON을 에이전트의 작업 후보로 쓰면 frontmatter를 매번 직접 파싱하는 것보다 입력 계약이 명확하다.

## 8단계: OpenCode 설정

OpenCode를 코드 저장소에서 실행하고 vault가 저장소 밖에 있다면 `opencode.json`의 `external_directory`를 vault 경로로 좁혀 연다. Bash는 기본 `ask`로 두고 `obsidian`만 허용한다.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "external_directory": {
      "~/Documents/Work Notes/**": "allow"
    },
    "bash": {
      "*": "ask",
      "obsidian *": "allow",
      "rm *": "deny"
    }
  }
}
```

OpenCode permission은 마지막으로 일치한 규칙이 이긴다. 따라서 catch-all `"*": "ask"`를 먼저 쓰고, 더 구체적인 allow와 deny를 뒤에 둔다. vault에 비밀 노트가 있다면 `external_directory` 전체를 열지 말고 에이전트용 vault를 따로 두는 편이 낫다.

반복 검색은 `.opencode/commands/vault-search.md`로 만든다.

````md
---
description: Search the Obsidian vault and summarize matching notes
---

다음 검색 결과만 먼저 검토하고, 필요한 파일을 `obsidian read path="..."`로 추가 확인해라.
근거와 해석을 구분하고 원문에 없는 사실을 만들지 마라.

!`obsidian vault="Work Notes" search:context query="$ARGUMENTS" limit=20`
````

OpenCode TUI에서 다음처럼 실행한다.

```text
/vault-search oauth token rotation
```

custom command의 shell output은 프롬프트에 그대로 들어간다. 검색어에 비밀이나 shell metacharacter를 넣지 말고, 복잡한 입력은 command injection 대신 대화에서 전달해 에이전트가 안전한 명령을 구성하게 한다.

## 9단계: Claude Code 설정

Claude Code를 vault root에서 실행하면 `CLAUDE.md`와 파일 접근 범위가 자연스럽게 맞는다.

```bash
cd "/Users/me/Documents/Work Notes"
claude
```

코드 저장소에서 작업하면서 vault도 함께 읽어야 한다면 `--add-dir`를 사용한다.

```bash
claude --add-dir "/Users/me/Documents/Work Notes"
```

지속 설정이 필요하면 `.claude/settings.local.json` 또는 사용자 설정에서 `permissions.additionalDirectories`를 쓸 수 있다. 팀 저장소에 개인 vault 절대 경로를 커밋하지 않도록 local 설정에 둔다.

```json
{
  "permissions": {
    "additionalDirectories": [
      "/Users/me/Documents/Work Notes"
    ],
    "allow": [
      "Bash(obsidian version)",
      "Bash(obsidian help *)",
      "Bash(obsidian vault=*)"
    ],
    "deny": [
      "Bash(obsidian * delete * permanent*)",
      "Bash(obsidian * eval *)"
    ]
  }
}
```

Claude Code의 permission은 deny가 ask와 allow보다 우선한다. 다만 Bash glob으로 모든 위험한 인자 조합을 완벽히 막을 수 있다고 생각하면 안 된다. 민감한 vault에서는 기본 모드를 유지하고, 쓰기 명령을 사람이 승인하는 방식이 더 안전하다.

`--add-dir`는 파일 접근 권한을 추가할 뿐, 그 디렉터리를 완전한 설정 root로 만들지는 않는다. vault 쪽 `CLAUDE.md`까지 불러오려면 vault에서 Claude Code를 시작하거나, 공식 문서의 `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` 동작을 이해한 뒤 사용한다.

실전 요청은 범위, 읽기 명령, 쓰기 승인 지점을 함께 준다.

```text
Work Notes vault에서 10-active의 status=active 프로젝트를 찾아라.
먼저 obsidian search:context와 properties만 사용해 후보를 보여줘.
내가 고른 프로젝트에만 오늘 진행 기록을 append하고,
마지막에 read와 unresolved로 검증해줘.
```

## 10단계: Codex 설정

Codex도 vault root에서 시작하는 구성이 가장 단순하다.

```bash
codex -C "/Users/me/Documents/Work Notes"
```

코드 저장소를 주 작업 공간으로 유지하면서 vault를 함께 쓰려면 `--add-dir`를 추가하고 sandbox를 `workspace-write`로 둔다.

```bash
codex \
  -C "/Users/me/Workspace/project-alpha" \
  --sandbox workspace-write \
  --add-dir "/Users/me/Documents/Work Notes"
```

공식 CLI reference도 추가 디렉터리가 필요할 때 `danger-full-access`로 넓히기보다 `--add-dir`를 선호하라고 안내한다. `--dangerously-bypass-approvals-and-sandbox`는 별도 격리 VM 같은 외부 보호 환경이 아니라면 쓰지 않는다.

Codex는 global에서 현재 디렉터리까지 `AGENTS.md` instruction chain을 만든다. vault root의 `AGENTS.md`에 읽기 순서와 금지 명령을 두면 세션마다 같은 경계를 적용할 수 있다.

반복 워크플로가 길어지면 `.agents/skills/obsidian-vault/SKILL.md`로 분리할 수 있다.

```md
---
name: obsidian-vault
description: Search, read, and update the Work Notes Obsidian vault through the official obsidian CLI.
---

1. Confirm the target vault and exact vault-relative path.
2. Search before reading whole notes.
3. Show the proposed write before overwrite, move, restore, or delete.
4. Prefer create, append, property:set, and move over raw file rewrites.
5. Verify the target with read, properties, and unresolved after writing.
6. Never use permanent delete, eval, plugin install, or history restore without explicit approval.
```

Codex에는 skill을 직접 이름으로 호출하거나, 설명과 맞는 요청을 주어 자동 선택하게 할 수 있다.

```text
$obsidian-vault 10-active에서 이번 주에 갱신되지 않은 프로젝트를 찾아 갱신 후보만 보여줘.
```

OpenCode도 `.agents/skills/<name>/SKILL.md`를 발견할 수 있다. 두 도구가 같은 규칙을 써야 한다면 이 경로가 유용하다. Claude Code에는 `CLAUDE.md`의 `@AGENTS.md` import만으로도 공통 경계를 전달할 수 있으므로, 처음부터 세 도구의 skill 디렉터리를 중복 생성할 필요는 없다.

## 11단계: 에이전트에게 맡길 실제 레시피

### 회의 메모를 project note에 반영하기

먼저 회의 메모와 project note를 좁혀 읽게 한다.

```text
1. obsidian search:context로 "project-alpha"와 오늘 날짜를 찾아라.
2. 00-inbox의 회의 메모와 10-active/project-alpha.md만 읽어라.
3. 결정, 할 일, 미확인 사항을 분리해 제안하라.
4. 승인 후 project note에 append하고 status 속성이 바뀌어야 하는지 물어라.
5. read, backlinks, unresolved로 검증하라.
```

### inbox를 정리하기

자동 분류보다 후보 제안과 승인 단계를 둔다.

```text
00-inbox 파일을 수정일 순으로 최대 20개만 확인해라.
각 노트를 evidence, topic, decision, active 중 하나로 분류하되 이동하지 마라.
목표 경로와 새 wikilink 후보를 표로 보여준 뒤 승인된 항목만 obsidian move로 옮겨라.
```

### 주간 리뷰 만들기

Daily notes 전체를 프롬프트에 넣지 말고 검색과 task 결과를 요약시킨다.

```bash
obsidian vault="Work Notes" search:context query="2026-07" path="daily" limit=50
obsidian vault="Work Notes" tasks path="10-active/project-alpha.md" todo verbose format=json
obsidian vault="Work Notes" base:query path="90-index/projects.base" view="Active" format=json
```

에이전트에는 세 출력에서 완료, 미완료, 막힘, 다음 주 우선순위만 뽑게 한다. 결과는 먼저 화면에 보여주고 승인 후 `30-topics/weekly/2026-W29.md`로 만든다.

### 속성 품질 점검하기

vault 전체 속성 이름과 사용 빈도를 확인한 뒤 잘못된 변형만 찾는다.

```bash
obsidian vault="Work Notes" properties counts sort=count format=json
obsidian vault="Work Notes" search query="statuz" format=json
```

대량 수정은 `eval` 한 줄로 밀어붙이지 않는다. 후보 파일을 JSON으로 남기고 파일별 `property:set`을 실행한 뒤 readback 결과를 기록한다.

## 12단계: 위험 명령과 승인 정책

다음 명령은 기본 자동 승인 목록에서 빼는 편이 좋다.

| 명령 | 위험 | 권장 처리 |
| :--- | :--- | :--- |
| `delete permanent` | trash를 건너뛴다. | 항상 사람 승인 |
| `history:restore` | 현재 본문을 과거 버전으로 교체한다. | 먼저 `diff`, 승인 후 실행 |
| `plugin:install`, `plugin:uninstall` | 실행 코드와 vault 환경을 바꾼다. | 별도 변경 작업으로 분리 |
| `eval` | Obsidian app 내부 JavaScript를 실행한다. | 기본 deny, 개발 vault에서만 제한 사용 |
| `create ... overwrite` | 기존 노트 전체를 덮을 수 있다. | read와 diff 후 승인 |
| 대량 `move`, `rename` | 링크와 폴더 계약을 넓게 바꾼다. | 작은 batch와 unresolved 검증 |

`eval`은 강력하지만 일상적인 노트 관리의 기본 도구가 아니다. 공식 CLI에 이미 있는 명령으로 표현할 수 없는 작업을 개발 vault에서 실험할 때만 고려한다.

## 13단계: Git과 백업 붙이기

Obsidian CLI의 File Recovery와 Sync history는 유용하지만 Git commit을 대신하지 않는다. 중요한 vault는 변경 전후를 텍스트 diff로 확인할 수 있게 Git이나 별도 백업을 붙인다.

```bash
git -C "/Users/me/Documents/Work Notes" status --short
git -C "/Users/me/Documents/Work Notes" diff --stat
```

에이전트가 note write와 Git push를 한 번에 하지 않게 한다. 권장 경계는 다음과 같다.

1. CLI로 note write
2. `read`, `properties`, `unresolved` 검증
3. 사람이 diff 검토
4. 별도 요청에서 commit
5. push 전 민감 정보 검사

개인 vault에는 API key, recovery code, 고객 원문처럼 모델과 원격 저장소에 보내면 안 되는 자료가 섞이기 쉽다. 그런 자료는 에이전트용 vault와 물리적으로 분리하는 것이 가장 확실하다.

## 문제 해결표

| 증상 | 먼저 볼 것 | 해결 방향 |
| :--- | :--- | :--- |
| `obsidian` command not found | CLI 활성화, PATH, 새 터미널 여부 | installer 갱신 후 CLI 재등록 |
| 첫 명령이 느리거나 앱이 열린다 | Obsidian 실행 상태 | 데스크톱 CLI의 정상 경계인지 확인 |
| 다른 vault가 검색된다 | 현재 디렉터리와 active vault | command 앞에 `vault="..."` 명시 |
| 동명 노트가 잘못 선택된다 | `file=` 사용 여부 | exact vault-relative `path=` 사용 |
| 에이전트가 vault를 못 읽는다 | workspace/additional directory | OpenCode `external_directory`, Claude/Codex `--add-dir` 확인 |
| 명령은 되지만 규칙을 안 따른다 | AGENTS.md/CLAUDE.md load 상태 | 실행 위치와 instruction chain 확인 |
| 이동 후 링크가 깨진다 | Automatically update internal links | 설정 확인 후 `unresolved verbose` 실행 |
| 자동화가 멈추지 않고 넓게 수정한다 | permission과 batch 크기 | 기본 ask, 최대 파일 수, 승인 checkpoint 추가 |
| 서버에서 GUI 없이 실패한다 | desktop CLI 사용 여부 | Obsidian Headless 또는 file-backed script 검토 |

## 처음 적용할 체크리스트

- [ ] 최신 installer로 Obsidian을 설치했다.
- [ ] Settings → General에서 Command line interface를 켰다.
- [ ] `obsidian version`과 `obsidian help`가 동작한다.
- [ ] 자동화 명령에 `vault="..."`를 명시했다.
- [ ] 쓰기에는 `file=`보다 exact `path=`를 사용한다.
- [ ] vault root에 `AGENTS.md`를 만들었다.
- [ ] Claude Code용 `CLAUDE.md`에서 `@AGENTS.md`를 import했다.
- [ ] 외부 vault 접근은 OpenCode `external_directory` 또는 Claude/Codex `--add-dir`로 좁혔다.
- [ ] `delete permanent`, `history:restore`, `plugin:*`, `eval`은 자동 승인하지 않았다.
- [ ] 쓰기 후 `read`, `properties`, `unresolved`를 실행한다.
- [ ] note write와 Git commit/push를 별도 승인 단계로 나눴다.

## 마무리

Obsidian CLI를 붙인다고 에이전트에게 vault 전체를 자유롭게 맡길 필요는 없다. 오히려 좋은 구성은 더 좁다. 짧은 index에서 시작하고, 검색으로 후보를 줄이고, 정확한 path에 한 번 쓰고, 바로 readback한다.

OpenCode, Claude Code, Codex의 차이는 지침 파일과 권한 문법에 있다. vault 운영 계약은 하나로 유지할 수 있다. `AGENTS.md`를 공통 원본으로 두고 Claude Code가 import하게 만들면 규칙이 갈라지지 않는다. 여기에 각 도구의 외부 디렉터리 권한과 위험 명령 deny를 겹치면, Obsidian은 보기 좋은 노트 앱을 넘어 사람이 검토할 수 있는 에이전트 지식 저장소가 된다.

---
title: "작은 모델에게 프로젝트 지도를 건네는 법 1부"
description: "서로 떨어진 프론트엔드와 백엔드 저장소를 하나의 작업 공간처럼 다루기 위해 path, URI prefix, 데이터 흐름 노트를 어떻게 적고 검색 도구와 연결할지 정리합니다."
published: "2026-07-01"
draft: false
category: "Developer Tools"
tags:
  - OpenCode
  - Obsidian
  - CodeGraph
  - ast-grep
  - Data Flow
  - Local LLM
aiAssisted: true
showSources: false
sources:
  - title: "Wonder Tinker local publishing note"
    url: "https://wonderrabbit.github.io/blog/"
    accessed: "2026-07-01"
---

작은 모델에게 큰 저장소를 맡기면 제일 먼저 무너지는 지점은 추론력이 아니라 방향 감각이다. 파일 하나를 못 읽어서 실패하는 것이 아니라, 어느 프로젝트의 어느 파일을 먼저 봐야 하는지 계속 잘못 짚는다. 그래서 지금까지는 프론트엔드 프로젝트를 열고 한 번 묻고, 백엔드 프로젝트로 옮겨가 다시 묻고, SQL을 찾으려면 또 다른 창을 열었다. 모델을 배려한다는 느낌은 있었지만, 실제로는 매번 같은 연결 관계를 사람 손으로 다시 설명하고 있었다.

최근에 작은 실험을 했다. Obsidian vault에 프론트엔드 source의 full local path, 프론트에서 호출하는 backend URI prefix, 그 backend의 full local path를 적었다. 그리고 화면과 API가 어떻게 이어지는지 별도 data flow 노트로 정리했다. 그 뒤 OpenCode에서 그 노트를 읽게 한 다음 "화면 A의 버튼을 클릭하면 어떤 backend에서 어떤 SQL이 실행되는지 출력해줘"라고 물었다. 기대보다 잘 찾았다. front 관련 data flow 분석 md까지 같이 읽으라고 했을 때는 더 안정적이었다.

결론은 단순하다. 작은 모델에게 꼭 모든 프로젝트를 한 번에 이해시킬 필요는 없다. 대신 프로젝트들의 연결 지도를 정확히 주면 된다. 모델은 똑똑한 아키텍트가 아니라, 잘 정리된 작업 지시서와 빠른 검색 도구를 가진 작업자에 가깝게 다루는 편이 낫다.

## 프로젝트 지도는 README가 아니라 인덱스다

여기서 말하는 지도는 "이 서비스는 React로 되어 있고 API 서버는 Spring입니다" 같은 설명문이 아니다. 모델이 바로 검색 범위를 줄일 수 있는 인덱스여야 한다.

최소 단위는 네 가지다.

```yaml
projects:
  front-admin:
    kind: frontend
    path: /work/legacy/admin-front
    routes:
      - /orders
      - /orders/:id
    apiClients:
      - prefix: /api/order
        backend: order-api
      - prefix: /api/member
        backend: member-api

  order-api:
    kind: backend
    path: /work/legacy/order-api
    framework: spring
    uriPrefixes:
      - /api/order
    database:
      name: legacy_order
      sqlLocations:
        - src/main/resources/mapper
        - src/main/java

  member-api:
    kind: backend
    path: /work/legacy/member-api
    framework: spring
    uriPrefixes:
      - /api/member
    database:
      name: legacy_member
      sqlLocations:
        - src/main/resources/mapper
```

중요한 것은 추상적인 서비스 이름보다 full local path다. 에이전트는 "order-api를 봐"보다 "`/work/legacy/order-api`에서 `/api/order`를 찾아"라는 지시를 훨씬 덜 낭비한다. 여기에 URI prefix를 붙이면 프론트의 호출 문자열과 백엔드의 controller, router, handler를 이어볼 수 있다.

저장 형식은 편한 것을 고르면 된다. 사람이 자주 읽고 고친다면 Markdown 표가 좋고, 스크립트와 함께 쓸 거라면 YAML이나 JSON이 낫다. 나는 보통 둘을 섞는다. Obsidian에서는 사람이 읽는 `project-map.md`를 유지하고, 기계가 읽기 쉬운 블록은 fenced YAML로 둔다.

````markdown
# Legacy system map

## Frontend

| name | path | note |
| --- | --- | --- |
| front-admin | /work/legacy/admin-front | 운영자 화면 |

## Backend prefixes

| frontend | prefix | backend | backend path |
| --- | --- | --- | --- |
| front-admin | /api/order | order-api | /work/legacy/order-api |
| front-admin | /api/member | member-api | /work/legacy/member-api |

## Machine map

```yaml
relations:
  - from: front-admin
    route: /orders/:id
    action: cancel button
    calls:
      - method: POST
        uri: /api/order/{orderId}/cancel
        backend: order-api
        likelyEntry:
          - OrderCancelController
          - OrderCommandService
```
````

이 정도만 있어도 모델의 첫 검색 범위가 달라진다. 전체 workspace에서 `cancel`을 찾는 대신 front path에서 버튼과 API client를 먼저 찾고, URI prefix로 backend path를 고른 뒤, 그 안에서 controller와 SQL mapper를 찾는다.

## 연결 관계는 별도 data flow 노트로 둔다

프로젝트 지도는 "어디를 볼지"를 알려준다. data flow 노트는 "어떤 순서로 볼지"를 알려준다. 이 둘을 한 파일에 모두 넣으면 노트가 금방 지저분해진다.

나는 화면 단위로 data flow를 끊는 쪽이 좋았다.

```markdown
# data-flow/admin-order-cancel.md

## Screen

- frontend: front-admin
- route: /orders/:id
- entry candidates:
  - src/pages/orders/[id].tsx
  - src/features/order/OrderDetail.tsx

## User action

- label: cancel button
- event candidates:
  - onCancelOrder
  - handleCancel

## API

- method: POST
- uri: /api/order/{orderId}/cancel
- backend: order-api
- backend path: /work/legacy/order-api

## Backend trace

- controller candidates:
  - OrderCancelController
  - OrderController
- service candidates:
  - OrderCancelService
  - OrderCommandService
- SQL candidates:
  - OrderCancelMapper.xml
  - order_cancel.sql

## Output request

When asked, answer in this order:

1. frontend file and handler
2. API method and URI
3. backend controller and service
4. SQL id or SQL text
5. unresolved assumptions
```

이 노트의 목적은 정답을 미리 써두는 것이 아니다. 후보와 순서를 적어두는 것이다. 특히 legacy repository에서는 이름이 일정하지 않다. 버튼 이름은 `cancel`, API는 `voidOrder`, SQL id는 `updateStatusToC`일 수 있다. 그래서 "정확한 파일"보다 "찾는 순서"가 더 중요하다.

## 모델에게 줄 첫 프롬프트

이런 지도와 data flow 노트가 있으면 프롬프트도 짧아진다.

```text
Read these notes first:
- /Users/me/Obsidian/Work/project-map.md
- /Users/me/Obsidian/Work/data-flow/admin-order-cancel.md

Task:
When the cancel button on /orders/:id is clicked, trace the flow from frontend handler to backend SQL.

Rules:
- Search only the paths declared in the notes unless evidence requires expanding.
- Start from frontend route and event handler.
- Use URI prefix mapping to choose backend path.
- Return file paths, function/class names, SQL id/text, and unresolved assumptions.
- Do not summarize the whole repository.
```

여기서 핵심은 "검색 범위를 제한하라"는 규칙이다. 작은 모델은 열린 공간에서 더 똑똑해지지 않는다. 오히려 선택지가 많아질수록 그럴듯한 파일명을 지어내거나, 이름이 비슷한 다른 프로젝트로 새기 쉽다.

## 검색 순서는 이렇게 잡는다

지도 파일을 읽은 뒤 실제 검색은 네 단계로 줄인다.

1. 프론트 path 안에서 화면 route, 버튼 label, handler 이름을 찾는다.
2. 같은 path 안에서 API client 호출 문자열을 찾는다.
3. URI prefix로 backend path를 고른다.
4. backend path 안에서 controller, service, repository, mapper, SQL을 좁힌다.

도구는 역할을 나눠야 한다.

| 질문 | 먼저 쓸 도구 | 이유 |
| --- | --- | --- |
| 문자열, URI, 파일명 찾기 | `rg` | 가장 빠르고 설명이 적다. |
| JSX/TSX 버튼, hook, 함수 호출 구조 찾기 | `ast-grep` | 텍스트가 아니라 코드 구조로 좁힌다. |
| 함수 호출자, 영향 범위, 파일 간 관계 | `codegraph` | 반복적인 read/search를 줄인다. |
| Markdown 노트에서 섹션 뽑기 | `mdq` | 노트 전체를 모델에 던지지 않아도 된다. |
| JSON 설정, lock, API schema 보기 | `jq` | 필요한 필드만 뽑는다. |
| YAML map, CI, Helm, OpenAPI 보기 | `yq` | prefix와 path를 기계적으로 꺼낸다. |

예를 들어 Obsidian 노트에서 backend mapping만 꺼내고 싶다면 `mdq`로 해당 섹션만 잘라 모델에게 넘긴다.

```bash
mdq '# Backend prefixes' /Users/me/Obsidian/Work/project-map.md
```

YAML block을 별도 파일로 뒀다면 `yq`가 더 낫다.

```bash
yq '.projects.front-admin.apiClients[] | select(.prefix == "/api/order")' project-map.yaml
```

백엔드가 OpenAPI나 JSON route manifest를 가지고 있으면 `jq`로 URI만 좁힌다.

```bash
jq '.paths | keys[] | select(startswith("/api/order"))' openapi.json
```

프론트에서 버튼 handler를 찾을 때는 `rg`로 시작한다.

```bash
rg -n "cancel|취소|/api/order" /work/legacy/admin-front/src
```

후보가 너무 많으면 `ast-grep`로 구조를 건다.

```bash
ast-grep run -p '<button $$$ onClick={$HANDLER} $$$>$TEXT</button>' --lang tsx /work/legacy/admin-front/src
ast-grep run -p '$CLIENT.post($URL, $$$)' --lang ts /work/legacy/admin-front/src
```

백엔드에서는 프레임워크별 entry 모양을 먼저 잡는다.

```bash
rg -n '"/api/order|/api/order|cancel"' /work/legacy/order-api/src
ast-grep run -p '@PostMapping($PATH)' --lang java /work/legacy/order-api/src
ast-grep run -p 'router.post($PATH, $HANDLER)' --lang ts /work/legacy/order-api/src
```

그리고 SQL 위치만 따로 본다.

```bash
rg -n "cancel|status|order_id|update" /work/legacy/order-api/src/main/resources/mapper
```

이 순서를 지키면 모델에게 들어가는 context가 크게 줄어든다. 전체 controller 파일과 mapper 파일을 다 읽기 전에, URI prefix와 구조 검색이 후보를 줄여주기 때문이다.

## 수정까지 시킬 때는 map을 작업 단위로 바꾼다

분석만 할 때는 project map이 느슨해도 된다. 하지만 파일 수정을 맡길 때는 map에 ownership을 넣는 편이 안전하다.

```yaml
workUnits:
  order-cancel-copy-change:
    intent: "cancel confirmation copy update"
    read:
      - project: front-admin
        path: /work/legacy/admin-front
        allow:
          - src/features/order/**
          - src/shared/api/**
      - project: order-api
        path: /work/legacy/order-api
        allow:
          - src/main/java/**/order/**
          - src/main/resources/mapper/**/Order*.xml
    write:
      - project: front-admin
        allow:
          - src/features/order/OrderDetail.tsx
    verify:
      - npm test -- OrderDetail
      - npm run typecheck
```

작은 모델에게는 "필요하면 알아서 고쳐"보다 "읽을 수 있는 곳과 쓸 수 있는 곳"을 분리해주는 것이 낫다. 특히 여러 독립 repository가 한 workspace에 있을 때는 더 그렇다. backend를 읽어 원인을 확인할 수는 있지만, 이번 작업의 write scope는 frontend 하나로 제한할 수 있다.

반대로 SQL까지 바꾸는 작업이면 write scope에 mapper와 migration만 명시한다. 이렇게 하면 모델이 우연히 unrelated service를 건드리는 일이 줄어든다.

## 토큰을 줄이는 진짜 방법

토큰 절약은 "요약을 잘하자"가 아니다. 모델이 읽을 필요가 없는 것을 애초에 안 주는 것이다.

내 기준의 우선순위는 이렇다.

1. path map으로 검색 공간을 줄인다.
2. URI prefix로 backend 후보를 하나로 줄인다.
3. `rg`, `jq`, `yq`, `mdq`로 필요한 조각만 뽑는다.
4. `ast-grep`로 코드 구조 후보를 줄인다.
5. `codegraph`로 호출 관계와 영향 범위를 한 번에 본다.
6. 마지막에만 실제 파일을 읽는다.

이 순서가 중요한 이유는 작은 모델이 긴 파일을 읽고도 핵심을 놓치는 경우가 많기 때문이다. 파일을 잘 읽게 만드는 것보다, 읽는 파일 수를 줄이는 쪽이 더 안정적이다.

예를 들어 "화면 A 버튼이 어떤 SQL을 실행하나"라는 질문에 전체 workspace를 넘기지 않는다. 모델에게는 다음 정도면 충분하다.

```text
Context packet:
- project map에서 front-admin, order-api 관계만 발췌
- data-flow/admin-order-cancel.md
- rg 결과 20줄 이하
- ast-grep 결과 5개 이하
- backend controller/service 후보 파일 2~4개
- mapper 후보 파일 1~3개
```

이렇게 만든 packet은 큰 모델에게도 좋지만, 작은 모델에게 특히 잘 맞는다. 작은 모델은 모든 것을 읽고 추론하는 데 약하지만, 제한된 후보 안에서 비교하고 연결하는 작업은 꽤 잘한다.

## codegraph는 프로젝트 내부 지도, project map은 프로젝트 사이 지도

`codegraph` 같은 도구는 한 repository 안에서 강하다. 함수 호출, import, symbol, 영향 범위를 미리 인덱싱해두면 에이전트가 매번 파일 탐색을 반복하지 않아도 된다.

다만 여러 repository가 느슨하게 연결된 legacy 환경에서는 codegraph만으로 부족하다. 프론트의 `/api/order`가 어느 backend의 어느 local path로 이어지는지는 코드 그래프보다 운영 지식에 가깝다. 그래서 두 지도를 분리해서 생각하는 편이 좋다.

- project map: repository 사이의 관계를 적는다.
- codegraph: 한 repository 안의 symbol 관계를 찾는다.
- data flow note: 특정 화면이나 기능의 추적 순서를 적는다.

이 셋이 합쳐지면 모델은 다음처럼 움직일 수 있다.

```text
project map으로 backend path 선택
-> codegraph 또는 rg로 backend entry 찾기
-> codegraph callers/callees로 service 흐름 좁히기
-> rg로 mapper id와 SQL 찾기
-> data flow note의 출력 순서대로 답하기
```

이 방식은 "거대한 monorepo처럼 모든 것을 한 인덱스에 넣자"와 다르다. 독립 프로젝트는 독립 프로젝트로 둔다. 대신 프로젝트 사이의 다리만 사람이 명시한다.

## map 파일도 낡는다

이 방법의 약점은 map이 stale해진다는 점이다. URI prefix가 바뀌었는데 노트가 그대로면 모델은 더 자신 있게 틀린다. 그래서 지도 파일에는 검증 명령을 붙여야 한다.

```yaml
checks:
  front-admin:
    - rg -n '"/api/order|/api/order' /work/legacy/admin-front/src
  order-api:
    - rg -n '"/api/order|/api/order' /work/legacy/order-api/src
```

정교하게 하려면 스크립트를 하나 만든다.

```bash
yq -r '.projects[].path' project-map.yaml | while read -r path; do
  test -d "$path" || echo "missing path: $path"
done
```

또는 prefix별로 front/backend 양쪽에 흔적이 있는지 검사한다.

```bash
yq -r '.projects.front-admin.apiClients[].prefix' project-map.yaml |
while read -r prefix; do
  rg -n "$prefix" /work/legacy/admin-front/src >/dev/null || echo "front missing: $prefix"
done
```

검증은 완벽할 필요가 없다. stale map을 빨리 의심하게 해주면 충분하다.

## 좋은 답변 형식까지 map에 넣는다

분석 결과를 매번 산문으로 받으면 비교가 어렵다. data flow 노트에 출력 형식을 넣어두면 좋다.

```markdown
## Expected answer shape

| layer | evidence |
| --- | --- |
| screen | route, component file, handler |
| request | method, URI, request payload |
| backend entry | controller/router file, method |
| business logic | service/usecase file, method |
| persistence | repository/mapper file |
| SQL | SQL id and SQL text summary |
| unknown | unresolved assumptions |
```

모델에게 "자세히 설명해줘"라고 하면 긴 글이 나온다. "이 표를 채워"라고 하면 빠진 칸이 보인다. 작은 모델을 쓸수록 출력 형식은 더 엄격한 편이 낫다.

## 운영 규칙

실제로 써보면 규칙은 몇 개로 수렴한다.

첫째, map에는 감상이 아니라 연결 키를 적는다. full local path, URI prefix, route, event handler 후보, backend entry 후보, SQL 위치처럼 검색 가능한 값을 우선한다.

둘째, 분석 노트와 수정 지시를 분리한다. data flow 노트는 읽기용이다. 수정 작업에는 write scope, verify command, 금지 영역을 따로 적는다.

셋째, 처음부터 모든 것을 자동화하려 하지 않는다. Obsidian 노트 하나와 `rg`만으로도 효과가 난다. 그 다음 `mdq`, `yq`, `jq`, `ast-grep`, `codegraph`를 붙이면 된다.

넷째, 모델에게 "모르면 모른다고 써라"를 출력 형식에 넣는다. legacy repository에서는 이름이 비슷한 함수와 SQL이 많다. 확실하지 않은 연결은 unresolved assumption으로 남기는 편이 나중에 훨씬 싸다.

다섯째, 작은 모델을 작게 쓰지 말고 좁게 쓴다. 작은 모델에게 부담을 줄이는 가장 좋은 방법은 프로젝트를 계속 옮겨 다니는 것이 아니라, 연결 관계와 검색 범위를 먼저 좁혀주는 것이다.

## 다음에 붙일 것

1부에서는 사람이 관리하는 project map과 data flow 노트가 중심이다. 다음 단계는 이 map을 실제 명령으로 더 많이 끌어내리는 것이다. 예를 들어 Obsidian 노트의 YAML block을 추출해 각 repository의 존재 여부를 검사하고, URI prefix별 `rg` 결과를 자동으로 만들고, codegraph가 있는 프로젝트에서는 symbol 후보까지 한 번에 묶는 방식이다.

그 정도가 되면 프롬프트는 더 짧아진다. "이 노트를 읽어"에서 "이 map으로 context packet을 만들어"로 바뀐다. 작은 모델에게 필요한 것은 더 많은 말이 아니라, 더 좋은 입구다.

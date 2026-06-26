---
title: "20GB 로컬 모델"
description: "KV cache까지 포함해 20GB 안쪽에서 OpenCode에 붙일 Ollama 모델을 모델 이용자 관점에서 고르는 기준과 추천 순위."
published: "2026-06-26"
draft: false
category: "AI 모델 운영"
tags:
  - Ollama
  - OpenCode
  - Local LLM
  - Coding agent
  - KV cache
aiAssisted: true
sources:
  - title: "Ollama docs, OpenCode integration"
    url: "https://docs.ollama.com/integrations/opencode"
    accessed: "2026-06-26"
  - title: "Ollama docs, OpenAI compatibility"
    url: "https://docs.ollama.com/api/openai-compatibility"
    accessed: "2026-06-26"
  - title: "Ollama docs, Context length"
    url: "https://docs.ollama.com/context-length"
    accessed: "2026-06-26"
  - title: "OpenCode docs, Providers"
    url: "https://opencode.ai/docs/providers"
    accessed: "2026-06-26"
  - title: "Ollama library, gpt-oss"
    url: "https://ollama.com/library/gpt-oss"
    accessed: "2026-06-26"
  - title: "Ollama library, qwen3.5"
    url: "https://ollama.com/library/qwen3.5"
    accessed: "2026-06-26"
  - title: "Ollama library, qwen3"
    url: "https://ollama.com/library/qwen3"
    accessed: "2026-06-26"
  - title: "Ollama library, deepseek-coder-v2"
    url: "https://ollama.com/library/deepseek-coder-v2"
    accessed: "2026-06-26"
  - title: "Ollama library, qwen2.5-coder"
    url: "https://ollama.com/library/qwen2.5-coder"
    accessed: "2026-06-26"
  - title: "Ollama library, devstral"
    url: "https://ollama.com/library/devstral"
    accessed: "2026-06-26"
  - title: "Ollama library, codestral"
    url: "https://ollama.com/library/codestral"
    accessed: "2026-06-26"
  - title: "Ollama library, qwen3-coder-next"
    url: "https://ollama.com/library/qwen3-coder-next"
    accessed: "2026-06-26"
  - title: "Ollama library, qwen3-coder"
    url: "https://ollama.com/library/qwen3-coder"
    accessed: "2026-06-26"
---

OpenCode를 로컬 모델로 쓰려는 사람에게 제일 먼저 필요한 질문은 "어떤 모델이 제일 똑똑한가"가 아니다. 실제 질문은 더 좁다.

내 컴퓨터에서 Ollama로 띄웠을 때, 모델 가중치와 KV cache를 합쳐 20GB 안쪽에 남고, OpenCode가 파일을 읽고 고치고 명령을 실행하는 동안 버틸 수 있는가.

이 글은 그 기준으로 이전 리서치를 다시 정리한 선택 가이드다. 여기서 `%`는 벤치마크 점수나 정답률이 아니라, 20GB 미만 로컬 OpenCode 에이전트로 쓸 때의 실용 추천도다.

## 결론부터

1. `gpt-oss:20b` - 92%, 32k-64k. 먼저 깔아볼 일반 에이전트 모델.
2. `qwen3.5:9b` - 90%, 64k. 가볍고 긴 context를 원하는 경우.
3. `qwen3:14b` - 87%, 40k. coding, reasoning, tool-use 균형형.
4. `deepseek-coder-v2:16b` - 84%, 32k-64k. 코드 특화 성능을 우선할 때.
5. `qwen2.5-coder:14b` - 82%, 32k. 안정적인 전용 coder 선택지.
6. `codestral:22b` - 78%, 16k-32k. code generation과 FIM 중심.
7. `devstral:24b` - 76%, 16k-32k. agentic coding은 강하지만 메모리 여유가 작다.
8. `qwen2.5-coder:7b` - 74%, 32k. 빠르고 안전한 보급형 coder.
9. `starcoder2:15b` - 70%, 16k. 구형이지만 코드 전용 baseline.
10. `granite-code:8b` - 68%, 32k-64k. 작은 code-intelligence baseline.
11. `phi4:14b` - 63%, 16k. reasoning fallback.
12. `gemma3:12b` - 60%, 32k. 범용 모델, code agent 1순위는 아니다.
13. `deepseek-coder:6.7b` - 58%, 16k. 오래됐지만 가볍고 code-specific.
14. `llama3.1:8b` - 52%, 32k-64k. 범용 baseline.
15. `granite-code:3b` - 48%, 64k. 초경량 실험용.

내가 지금 한 대만 고른다면 `gpt-oss:20b`를 먼저 쓴다. 14GB급 Ollama tag, agentic task와 developer use case를 직접 겨냥한 설명, OpenCode launch 예시가 한 번에 맞기 때문이다. 코드 특화가 더 중요하고 일반 reasoning보다 에디팅 루프를 우선한다면 `qwen3.5:9b`, `qwen3:14b`, `deepseek-coder-v2:16b`, `qwen2.5-coder:14b` 순서로 내려가며 비교한다.

## Ollama 연결 방식

Ollama는 OpenCode 통합을 공식 문서에 올려두고, `ollama launch opencode`로 시작하는 흐름을 안내한다. 수동 설정도 단순하다. OpenCode 쪽 provider에 `@ai-sdk/openai-compatible`를 쓰고, `baseURL`을 `http://localhost:11434/v1`로 둔다. Ollama의 OpenAI compatibility 문서도 같은 로컬 `/v1` 엔드포인트를 기준으로 설명한다.

즉 이 글의 모델들은 "OpenCode에 붙일 수 있나"보다 "붙였을 때 메모리와 context가 버티나"가 핵심이다.

설정값은 네 줄만 기억하면 된다.

- provider 이름: `ollama`
- npm adapter: `@ai-sdk/openai-compatible`
- base URL: `http://localhost:11434/v1`
- model name: `gpt-oss`, `qwen3.5`, `deepseek-coder-v2`처럼 Ollama model id와 맞춘다.

Ollama 통합을 그대로 쓰면 더 짧다.

```bash
ollama launch opencode --model gpt-oss
```

## 20GB 기준에서 가장 자주 틀리는 부분

Ollama library의 `Size`는 중요한 힌트지만, 그것만으로 "20GB 안에 든다"고 말하면 위험하다. OpenCode 같은 coding agent는 긴 prompt, repository context, tool result, patch history를 계속 들고 간다. 이때 context length가 커질수록 KV cache 메모리도 같이 커진다.

Ollama 문서는 context length가 모델이 메모리에서 접근하는 token 수라고 설명하고, agents와 coding tools는 적어도 64000 tokens로 설정하라고 권한다. 동시에 더 큰 context length는 더 많은 메모리를 요구한다고 경고한다. 그래서 이 글은 전체 context를 무조건 최대로 쓰는 대신, 20GB 미만 운용을 위해 모델마다 context cap을 둔다.

실제 확인은 이 명령으로 끝내야 한다.

먼저 `OLLAMA_CONTEXT_LENGTH=64000 ollama serve`로 serve context를 잡고, 다른 터미널에서 `ollama ps`를 실행한다.

`ollama ps`에서 볼 것은 세 가지다.

- `SIZE`가 20GB 아래인지
- `PROCESSOR`가 원치 않게 CPU offload로 밀리지 않는지
- `CONTEXT`가 내가 의도한 cap으로 잡혔는지

## 추천 모델별 사용감

### `gpt-oss:20b`

추천도 92%. `gpt-oss:20b`는 Ollama에서 14GB, 128K context로 노출된다. Ollama의 model card는 reasoning, agentic tasks, developer use cases를 직접 언급하고, OpenCode 실행 예시도 제공한다. 20GB 제한에서 가장 균형이 좋다.

단, 128K를 그대로 쓰는 모델이 아니라 32k-64k부터 시작하는 모델로 보는 게 맞다. 64k에서 `ollama ps`가 20GB를 넘으면 32k로 낮춘다.

### `qwen3.5:9b`

추천도 90%. 6.6GB tag에 256K context window가 붙어 있다. 이 조합은 20GB 제한에서 상당히 매력적이다. 다만 256K를 다 쓰자는 뜻은 아니다. 긴 context 잠재력이 있는 작은 모델로 보고 64k cap에서 시작하는 편이 낫다.

코드 전용 모델은 아니지만, Qwen3.5 설명은 reasoning, coding, agents를 함께 다룬다. 작은 모델에서 tool-heavy workflow를 시험하려면 `gpt-oss:20b` 다음 후보로 둘 만하다.

### `qwen3:14b`

추천도 87%. Ollama에서 `qwen3:14b`는 9.3GB, 40K context로 잡힌다. 이 모델은 64k 요구를 엄격히 맞추려는 OpenCode 기준에서는 context가 아쉽지만, 20GB 미만 안정성은 좋다.

Repository 전체를 길게 먹이는 agent보다 중간 크기 코드 수정, 명령 실행, 설명, 작은 refactor에 적합하다.

### `deepseek-coder-v2:16b`

추천도 84%. 8.9GB, 160K context로 보이는 코드 특화 MoE 모델이다. Ollama card는 code-specific task에서 GPT-4-Turbo급 성능에 가까운 모델이라고 설명한다.

다만 160K를 그대로 쓰면 20GB 제한과 충돌할 가능성이 크다. 이 모델은 "가중치가 작으니 full context도 괜찮겠지"가 아니라, 32k-64k로 묶고 코드 성능을 뽑는 쪽이 맞다.

### `qwen2.5-coder:14b`

추천도 82%. 9.0GB, 32K context다. 순위가 아주 위는 아니지만 안정성이 좋다. Qwen2.5 Coder family는 code generation, code reasoning, code fixing 개선을 전면에 둔 전용 coder 계열이다.

OpenCode가 꼭 64k 이상이어야 한다는 기준을 강하게 적용하면 감점이 있지만, 실제 작은 repo나 좁은 작업 단위에서는 실용성이 높다.

### `codestral:22b`와 `devstral:24b`

둘 다 매력적이지만 20GB 미만에서는 조심해야 한다.

`codestral:22b`는 13GB, 32K context다. code generation과 fill-in-the-middle 계열 작업에는 좋지만, modern agent loop에서는 `qwen3.5`, `gpt-oss`, `deepseek-coder-v2`보다 먼저 고를 이유가 약하다.

`devstral:24b`는 agentic coding만 보면 훨씬 유혹적이다. Ollama card는 Devstral을 coding agents용 모델로 설명하고, SWE-Bench Verified 46.8%도 제시한다. 하지만 14GB weight와 128K context 조합은 20GB 안쪽에서 여유가 작다. 쓴다면 16k-32k로 낮춰서 "강한데 좁게 쓰는" 모델로 다루는 게 현실적이다.

## 강하지만 이번 조건에서는 제외한 모델

가장 흔한 실수는 강한 모델을 보고 "조금만 줄이면 되겠지"라고 생각하는 것이다. 이번 조건은 "모델 파일이 20GB 근처"가 아니라 "KV cache까지 포함해서 20GB 미만"이다.

- `qwen3-coder:30b`: 19GB weight에 256K context라 KV cache 전부터 여유가 거의 없다.
- `qwen3-coder-next`: OpenCode에 잘 맞는 agentic coding 모델이지만 Ollama local tag가 52GB다.
- `qwen3:30b`: 19GB weight와 256K context 조합이라 안정적인 20GB 미만 운용이 어렵다.
- `qwen3.5:27b`: 17GB weight와 256K context라 짧은 실험 이상으로 추천하기 어렵다.
- `gemma3:27b`: 17GB급 128K 계열이라 여유가 부족하다.
- `granite-code:34b`: 19GB weight라 이번 조건에서는 과하다.
- 70B 이상, 120B, 480B tag: 로컬 20GB 기준이 아니라 cloud 또는 대용량 메모리 장비 기준이다.

`qwen3-coder-next`는 특히 아깝다. Ollama 설명만 보면 OpenCode 같은 agentic coding workflow와 잘 맞지만, 52GB local tag는 이 글의 제약을 바로 벗어난다. 이 모델은 20GB 미만 로컬 후보가 아니라 cloud 또는 큰 unified memory 장비 후보로 분리하는 편이 낫다.

## 상황별로 고르면

로컬 OpenCode를 처음 붙여보는 목적이면 `gpt-oss:20b`로 시작한다. 실패 원인이 모델 품질인지, context cap인지, provider 설정인지 분리하기 쉽다.

작은 메모리에서 긴 작업을 자주 한다면 `qwen3.5:9b`가 좋다. 6.6GB tag라 context cap을 올려볼 여지가 있고, OpenCode launch 예시도 있다.

코드 수정 품질을 우선하면 `deepseek-coder-v2:16b`나 `qwen2.5-coder:14b`를 본다. 전자는 코드 특화 MoE 성능 기대치가 높고, 후자는 더 보수적인 32K 전용 coder다.

SWE-Bench류 agentic coding 홍보 문구를 가장 중시하면 `devstral:24b`가 눈에 띈다. 다만 이 글의 20GB 제약에서는 "최강 후보"가 아니라 "짧게 cap을 걸었을 때만 쓰는 경계선 후보"다.

## 내 기본 설정

처음에는 이렇게 시작한다.

첫 실행은 `OLLAMA_CONTEXT_LENGTH=64000 ollama serve`와 `ollama launch opencode --model gpt-oss` 조합으로 시작한다.

그리고 OpenCode에서 큰 repo를 열기 전에 별도 터미널에서 확인한다.

확인은 `ollama ps`로 한다.

20GB를 넘거나 CPU offload가 보이면 context를 낮춘다.

필요하면 `OLLAMA_CONTEXT_LENGTH=32000 ollama serve`로 낮춘다.

그 다음 모델을 바꾼다.

- `ollama launch opencode --model qwen3.5`
- `ollama launch opencode --model deepseek-coder-v2`
- `ollama launch opencode --model qwen2.5-coder:14b`

## 마지막 판단 기준

20GB 미만 로컬 coding agent는 "최고 모델"을 고르는 문제가 아니다. 속도, memory headroom, context cap, tool calling, OpenCode provider 안정성을 같이 보는 문제다.

내 기준은 이렇다.

1. `ollama ps`에서 20GB 아래로 안정적으로 남는가.
2. OpenCode가 요구하는 64k급 context를 최소 한 번은 시도할 수 있는가.
3. 64k가 안 되면 32k로 낮췄을 때도 작업 단위가 자연스럽게 쪼개지는가.
4. 모델 설명이 coding, agents, tool use 중 최소 하나를 직접 겨냥하는가.
5. 실패했을 때 더 작은 후보로 내려가는 경로가 있는가.

이 기준을 적용하면 2026년 6월 현재의 첫 선택은 `gpt-oss:20b`다. 그 다음은 `qwen3.5:9b`, `qwen3:14b`, `deepseek-coder-v2:16b`, `qwen2.5-coder:14b` 순서로 보는 게 가장 덜 위험하다.

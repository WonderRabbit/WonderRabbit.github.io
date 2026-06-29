---
title: "내 git 예쁘게 꾸미기"
description: "GitHub 저장소와 프로필을 더 신뢰감 있게 보이게 만드는 README 구성 요소를 첫 화면, 배지, 표, 코드블록, 링크 동선 기준으로 정리합니다."
published: "2026-06-29"
draft: false
category: "GitHub 운영"
tags:
  - Git
  - GitHub
  - README
  - Markdown
  - 오픈소스
aiAssisted: true
sources:
  - title: "GitHub Docs, About READMEs"
    url: "https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes"
    accessed: "2026-06-29"
  - title: "GitHub Docs, Basic writing and formatting syntax"
    url: "https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax"
    accessed: "2026-06-29"
  - title: "GitHub Docs, About your profile"
    url: "https://docs.github.com/en/account-and-profile/concepts/about-your-profile"
    accessed: "2026-06-29"
  - title: "GitHub Docs, Classifying your repository with topics"
    url: "https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics"
    accessed: "2026-06-29"
  - title: "Shields.io, Endpoint badges"
    url: "https://shields.io/badges/endpoint-badge"
    accessed: "2026-06-29"
---

GitHub에서 예뻐 보이는 저장소는 대체로 화려한 것보다 읽는 순서가 분명합니다. 처음 들어온 사람이 10초 안에 이 저장소가 무엇인지, 지금 쓸 수 있는지, 어디로 가야 하는지 판단할 수 있어야 합니다.

그래서 "내 git 예쁘게 꾸미기"의 핵심은 장식이 아니라 정보의 배치입니다. 아래 항목을 순서대로 적용하면 개인 프로젝트, 오픈소스 라이브러리, 포트폴리오 저장소 모두 훨씬 정돈되어 보입니다.

## 1. 첫 화면은 로고보다 한 문장

README 첫 화면에는 프로젝트 이름, 한 줄 설명, 바로 실행할 수 있는 명령을 둡니다. 긴 철학이나 배경은 아래로 내립니다.

좋은 첫 화면은 이런 구조입니다.

````md
# 프로젝트 이름

짧고 구체적인 한 문장 설명.

```bash
npm create my-app
```
````

저장소의 목적이 도구라면 설치 명령을, 문서라면 읽기 시작할 링크를, 포트폴리오라면 대표 결과물을 먼저 보여줍니다. 첫 화면의 역할은 설득이 아니라 방향 안내입니다.

## 2. 배지는 상태만 고릅니다

배지는 많이 붙일수록 예쁜 것이 아닙니다. 너무 많으면 README가 광고판처럼 보입니다. 처음에는 아래 4개 정도면 충분합니다.

| 배지 | 보여주는 것 | 추천 위치 |
| :--- | :--- | :--- |
| Release | 지금 배포된 최신 버전 | 제목 바로 아래 |
| Build | main branch가 깨졌는지 | Release 옆 |
| License | 사용 조건 | 상태 배지 묶음 끝 |
| Docs | 문서가 어디 있는지 | 설치 섹션 앞 |

예를 들면 이런 식입니다.

```md
![GitHub release](https://img.shields.io/github/v/release/owner/repo?style=flat-square)
![GitHub Actions](https://img.shields.io/github/actions/workflow/status/owner/repo/ci.yml?style=flat-square)
![License](https://img.shields.io/github/license/owner/repo?style=flat-square)
```

색상도 한두 가지 톤으로 맞추는 편이 좋습니다. `style=flat-square`, `labelColor=black`처럼 형식을 통일하면 배지가 많은 저장소도 덜 산만해 보입니다.

## 3. 콜아웃은 공지, 경고, 빠른 시작에만 씁니다

GitHub Markdown은 `[!NOTE]`, `[!TIP]`, `[!WARNING]` 같은 콜아웃을 지원합니다. 이 블록은 눈에 잘 띄기 때문에 남용하면 본문 전체의 리듬을 망칩니다.

추천 용도는 세 가지입니다.

- `NOTE`: 현재 지원 상태, rename, migration 같은 공지
- `TIP`: 가장 짧은 시작 방법
- `WARNING`: 깨질 수 있는 설정, 유료 API, destructive command

````md
> [!TIP]
> 처음 실행이라면 아래 명령 하나로 시작하세요.
>
> ```bash
> npm create my-app
> ```
````

콜아웃 안에는 한 가지 메시지만 넣습니다. 공지, 설치, 철학, 링크를 한 블록에 다 넣으면 아무것도 강조되지 않습니다.

## 4. TL;DR 표를 만든 뒤 자세한 설명을 씁니다

README를 처음 보는 사람은 전체 문서를 정독하지 않습니다. 그래서 선택지가 둘 이상이면 표가 필요합니다.

```md
| 원하는 것 | 실행할 명령 | 결과 |
| :--- | :--- | :--- |
| 빠른 설치 | `npm create my-app` | 기본 프로젝트 생성 |
| 수동 설치 | `npm install my-package` | 기존 프로젝트에 추가 |
| 문서 확인 | `npm run docs` | 로컬 문서 서버 실행 |
```

표는 "내가 무엇을 고르면 되는가"를 해결할 때 가장 강합니다. 반대로 긴 설명문을 억지로 표에 넣으면 가독성이 떨어집니다. 열은 3개에서 4개 사이로 유지하고, 모바일에서도 한 줄이 너무 길어지지 않게 씁니다.

## 5. 코드블록은 복사 가능한 단위로 쪼갭니다

사용자가 그대로 복사할 명령은 설명 문단 안에 묻지 말고 코드블록으로 분리합니다.

나쁜 예:

```md
설치하려면 npm install my-package를 실행하고 설정 파일을 만든 뒤 npm run dev를 실행하세요.
```

좋은 예:

````md
```bash
npm install my-package
npm run dev
```
````

설정 파일은 언어를 정확히 붙입니다.

```json
{
  "name": "my-project",
  "private": true
}
```

`bash`, `json`, `yaml`, `ts`, `tsx`처럼 fence language를 넣으면 GitHub에서 syntax highlight가 적용됩니다. 작은 차이지만 문서가 훨씬 정돈되어 보입니다.

## 6. 기능 목록은 매트릭스로 바꿉니다

기능이 많아질수록 bullet list는 힘이 약해집니다. 기능, 대상, 설명을 나눈 표로 바꾸면 사용자가 훨씬 빨리 판단합니다.

```md
| 기능 | 대상 | 설명 |
| :--- | :--- | :--- |
| CLI | 개발자 | 터미널에서 프로젝트를 생성합니다 |
| Docs | 사용자 | 설치와 설정 방법을 제공합니다 |
| Templates | 팀 | 반복되는 파일 구조를 자동 생성합니다 |
```

이 표에는 marketing 문구보다 사용 조건을 넣는 편이 좋습니다. "강력함"보다 "어디에 쓰는지"가 더 유용합니다.

## 7. 링크 동선을 README 안에 고정합니다

저장소가 커지면 README는 모든 내용을 담는 파일이 아니라 안내판이 되어야 합니다.

최소 링크는 이렇게 둡니다.

- 설치: `docs/installation.md`
- 사용법: `docs/usage.md`
- 설정: `docs/configuration.md`
- 변경 이력: `CHANGELOG.md`
- 기여: `CONTRIBUTING.md`
- 라이선스: `LICENSE`

링크 이름은 "여기", "문서"보다 구체적으로 씁니다. `설치 가이드`, `설정 레퍼런스`, `기여 방법`처럼 목적이 보이면 클릭 전에 판단할 수 있습니다.

## 8. 이미지와 스크린샷은 실제 결과만 보여줍니다

히어로 이미지를 넣을 수는 있습니다. 다만 저장소가 도구라면 추상적인 배경 이미지보다 실제 UI, 터미널 출력, 생성 결과가 더 낫습니다.

```md
<p align="center">
  <img src="./.github/assets/preview.png" alt="실행 결과 미리보기" width="720" />
</p>
```

이미지를 넣을 때는 세 가지를 지킵니다.

- `alt`를 비워 두지 않습니다.
- repository 안의 상대 경로를 씁니다.
- 너무 큰 이미지는 `width`로 화면 폭을 제한합니다.

README의 이미지는 작품이 아니라 증거입니다. 사용자가 "아, 이게 이런 결과물이구나"라고 바로 이해해야 합니다.

## 9. 언어 링크와 토픽으로 찾기 쉽게 만듭니다

여러 언어 README를 둘 때는 첫 화면 아래에 짧게 둡니다.

```md
[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md)
```

저장소 설정의 topics도 중요합니다. GitHub는 topic으로 저장소를 분류하고 탐색할 수 있게 합니다. `cli`, `typescript`, `astro`, `developer-tools`처럼 실제 기술과 용도를 넣습니다. README 안에서 아무리 설명해도 topic이 비어 있으면 발견성이 떨어집니다.

## 10. 신뢰 신호는 최신성에서 나옵니다

예쁘게 꾸민 README가 오히려 신뢰를 잃는 순간은 내용이 오래됐을 때입니다. 아래 항목은 주기적으로 맞춰야 합니다.

- 설치 명령이 실제 package name과 같은가
- 배지의 branch와 workflow 파일명이 현재 저장소와 같은가
- 문서 링크가 404가 아닌가
- 스크린샷이 현재 UI와 같은가
- README의 지원 범위와 실제 코드가 같은가

릴리스가 잦은 저장소라면 README 상단에 "현재 상태"를 짧게 두는 것도 좋습니다. 단, 긴 공지는 issue나 discussion으로 빼고 README에는 링크만 둡니다.

## 바로 적용할 체크리스트

처음부터 완벽한 README를 만들 필요는 없습니다. 아래 순서로 고치면 효과가 큽니다.

1. 제목 아래 한 문장 설명을 다시 쓴다.
2. 설치 또는 실행 명령을 첫 화면에 둔다.
3. 상태 배지를 3개에서 5개로 제한한다.
4. 선택지가 있는 부분은 TL;DR 표로 만든다.
5. 복사할 명령은 독립된 코드블록으로 둔다.
6. 기능 bullet을 기능 매트릭스로 바꾼다.
7. 설치, 사용법, 설정, 기여 문서 링크를 고정한다.
8. 실제 결과를 보여주는 스크린샷을 하나 넣는다.
9. topics를 채운다.
10. 한 달에 한 번 배지, 링크, 설치 명령을 확인한다.

결국 GitHub 꾸미기는 "화려하게 보이기"보다 "처음 온 사람이 헤매지 않게 하기"에 가깝습니다. README 첫 화면에서 목적, 상태, 다음 행동이 보이면 저장소는 이미 절반 이상 예뻐진 것입니다.

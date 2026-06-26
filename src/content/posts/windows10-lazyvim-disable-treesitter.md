---
title: "Windows 10 LazyVim에서 Tree-sitter 끄는 위치와 설정"
description: "PowerShell 7.6에서 LazyVim의 nvim-treesitter를 꺼야 할 때 수정할 Windows 경로, Lua 설정 파일, 전체 비활성화와 기능별 비활성화의 차이를 정리합니다."
published: "2026-06-26"
draft: false
category: "Windows 개발 환경"
tags:
  - Windows 10
  - PowerShell 7.6
  - Neovim
  - LazyVim
  - LazyVim 설정
  - nvim-treesitter
  - Tree-sitter
aiAssisted: true
sources:
  - title: "LazyVim Configuration"
    url: "https://www.lazyvim.org/configuration"
    accessed: "2026-06-26"
  - title: "LazyVim Plugins Configuration"
    url: "https://www.lazyvim.org/configuration/plugins"
    accessed: "2026-06-26"
  - title: "LazyVim Installation"
    url: "https://www.lazyvim.org/installation"
    accessed: "2026-06-26"
  - title: "LazyVim TreeSitter source"
    url: "https://github.com/LazyVim/LazyVim/blob/459a4c3b1059671e766a46c7cc223827dc67e3d0/lua/lazyvim/plugins/treesitter.lua"
    accessed: "2026-06-26"
  - title: "LazyVim Starter lazy.lua"
    url: "https://github.com/LazyVim/starter/blob/803bc181d7c0d6d5eeba9274d9be49b287294d99/lua/config/lazy.lua"
    accessed: "2026-06-26"
  - title: "lazy.nvim Plugin Spec"
    url: "https://lazy.folke.io/spec"
    accessed: "2026-06-26"
  - title: "Neovim standard paths"
    url: "https://neovim.io/doc/user/starting.html#base-directories"
    accessed: "2026-06-26"
  - title: "Neovim stdpath()"
    url: "https://neovim.io/doc/user/builtin.html#stdpath()"
    accessed: "2026-06-26"
  - title: "PowerShell 7.6 environment variables"
    url: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables?view=powershell-7.6"
    accessed: "2026-06-26"
  - title: "PowerShell 7.6 New-Item"
    url: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.management/new-item?view=powershell-7.6"
    accessed: "2026-06-26"
  - title: "nvim-treesitter README"
    url: "https://github.com/nvim-treesitter/nvim-treesitter/blob/4916d6592ede8c07973490d9322f187e07dfefac/README.md"
    accessed: "2026-06-26"
  - title: "nvim-ts-autotag README"
    url: "https://github.com/windwp/nvim-ts-autotag/blob/88c1453db4ba7dd24131086fe51fdf74e587d275/README.md"
    accessed: "2026-06-26"
---

LazyVim을 Windows 10에 기본 방식으로 설치했다면, 먼저 볼 곳은 Neovim config root입니다. PowerShell에서는 아래 경로를 열면 됩니다.

```text
$env:LOCALAPPDATA\nvim\lua\plugins\treesitter.lua
```

사용자 이름까지 포함해 풀면 보통 이런 형태입니다.

```text
C:\Users\<UserName>\AppData\Local\nvim\lua\plugins\treesitter.lua
```

LazyVim의 Windows 설치 문서는 starter를 `$env:LOCALAPPDATA\nvim`에 clone하도록 안내합니다. LazyVim 설정 문서도 사용자 플러그인 스펙을 `lua/plugins/` 아래에 두면 lazy.nvim이 자동으로 읽는다고 설명합니다. 그래서 Tree-sitter를 끄는 파일도 `$env:LOCALAPPDATA\nvim\lua\plugins\treesitter.lua`에 두면 됩니다.

## 전체 비활성화

Tree-sitter를 아예 쓰지 않으려는 목적이라면 아래 설정이 가장 깔끔합니다.

```powershell
$target = "$env:LOCALAPPDATA\nvim\lua\plugins\treesitter.lua"

New-Item -ItemType Directory -Force -Path (Split-Path $target) | Out-Null
New-Item -ItemType File -Force -Path $target | Out-Null
nvim $target
```

파일에는 이렇게 적습니다.

```lua
return {
  { "nvim-treesitter/nvim-treesitter", enabled = false },
  { "nvim-treesitter/nvim-treesitter-textobjects", enabled = false },
  { "windwp/nvim-ts-autotag", enabled = false },
}
```

첫 번째 줄이 핵심입니다. lazy.nvim에서 `enabled = false`는 해당 플러그인을 최종 spec에 포함하지 않는다는 뜻입니다. LazyVim 문서도 플러그인을 끄려면 같은 플러그인 이름으로 spec을 하나 추가하고 `enabled = false`를 넣으라고 안내합니다.

나머지 두 줄은 같이 정리해 두는 용도입니다. LazyVim의 TreeSitter source를 보면 `nvim-treesitter`, `nvim-treesitter-textobjects`, `nvim-ts-autotag`가 같은 파일에 있긴 하지만 서로 별도 top-level 플러그인 spec으로 선언되어 있습니다. `nvim-treesitter`만 꺼도 textobjects나 autotag가 자동으로 같이 꺼지는 구조는 아닙니다. Tree-sitter 기능 자체를 쓰지 않겠다면 세 개를 같이 끄는 쪽이 나중에 다시 봐도 덜 헷갈립니다.

## 기능만 끄는 설정은 따로 있습니다

가끔은 플러그인 자체를 빼려는 게 아니라 Tree-sitter highlight, indent, fold만 끄고 싶을 때가 있습니다. 그럴 때는 `enabled = false` 대신 LazyVim의 TreeSitter options만 바꿉니다.

```lua
return {
  {
    "nvim-treesitter/nvim-treesitter",
    opts = {
      highlight = { enable = false },
      indent = { enable = false },
      folds = { enable = false },
    },
  },
}
```

이 설정은 플러그인을 남겨 둡니다. `:TSInstall`, `:TSUpdate`, `:TSUninstall` 같은 명령과 parser 관리 흐름도 그대로 남습니다. LazyVim source에서 `TS.setup(opts)`를 호출하고, `opts.ensure_installed`에 있는 parser 중 누락된 것을 설치하는 흐름도 계속 살아 있습니다.

따라서 Windows에서 compiler, parser build, Tree-sitter plugin 자체를 피하려는 목적이라면 이 방식보다 앞의 `enabled = false` 방식이 맞습니다. 반대로 나중에 다시 켤 수 있게 parser 관리 기능은 남겨 두고 화면 기능만 끄고 싶다면 이 방식이 더 알맞습니다.

## 경로를 확인하는 명령

PowerShell에서 현재 Neovim이 보고 있는 config/data 경로를 직접 확인하려면 다음을 실행합니다.

```powershell
nvim --headless +"lua print(vim.fn.stdpath('config'))" +q
nvim --headless +"lua print(vim.fn.stdpath('data'))" +q
```

기본 Windows 설치라면 config는 `$env:LOCALAPPDATA\nvim`, data는 `$env:LOCALAPPDATA\nvim-data` 쪽으로 나옵니다. Neovim 문서는 Windows의 config 기본값을 `~/AppData/Local/nvim`, data와 state 기본값을 `~/AppData/Local/nvim-data`로 둡니다.

LazyVim 설치 문서도 같은 구분을 씁니다. config는 `$env:LOCALAPPDATA\nvim`, plugin과 parser 같은 데이터는 `$env:LOCALAPPDATA\nvim-data` 아래로 갑니다.

## 적용 후 확인

파일을 저장한 뒤에는 Neovim을 완전히 종료하고 다시 실행합니다. 그 다음 `:Lazy`를 열어 `nvim-treesitter`, `nvim-treesitter-textobjects`, `nvim-ts-autotag`가 active spec으로 잡히지 않는지 확인합니다.

설치 전체 상태는 `:LazyHealth`로 확인하면 됩니다. LazyVim도 설치 후 `:LazyHealth` 실행을 권장합니다.

이미 받아 둔 플러그인 파일이나 parser 파일이 디스크에 남아 있을 수는 있습니다. 이건 설정이 실패했다는 뜻은 아닙니다. `enabled = false`는 활성 spec에서 제외하는 설정이지, 기존 파일을 자동 삭제하는 명령은 아닙니다. 디스크까지 정리하려면 `:Lazy` UI에서 clean 관련 동작을 별도로 확인하는 편이 안전합니다.

## 요약

Windows 10 + PowerShell 7.6에서 LazyVim의 Tree-sitter를 사용하지 않게 만드는 파일은 다음입니다.

```text
$env:LOCALAPPDATA\nvim\lua\plugins\treesitter.lua
```

완전히 끄려면 다음 세 spec을 둡니다.

```lua
return {
  { "nvim-treesitter/nvim-treesitter", enabled = false },
  { "nvim-treesitter/nvim-treesitter-textobjects", enabled = false },
  { "windwp/nvim-ts-autotag", enabled = false },
}
```

`highlight`, `indent`, `folds`만 끄는 설정은 플러그인을 남기는 별도 선택지입니다. Windows에서 Tree-sitter parser 설치나 build 문제를 피하려는 목적이면 plugin-level disable을 쓰는 것이 더 직접적입니다.

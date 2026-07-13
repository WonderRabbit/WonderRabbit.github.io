---
title: "tmux 설정 해보기"
description: "tmux 3.7b 기준으로 기본 설정을 만들고, TPM과 navigator plugin을 이용해 LazyVim split과 tmux pane 사이를 같은 키로 이동하는 방법을 정리합니다."
published: "2026-07-13"
draft: false
category: "Developer Tools"
tags:
  - tmux
  - Neovim
  - LazyVim
  - TPM
  - 터미널
lang: ko
aiAssisted: true
sources:
  - title: "tmux 3.7b release"
    url: "https://github.com/tmux/tmux/releases/latest"
    accessed: "2026-07-13"
  - title: "Homebrew Formulae, tmux"
    url: "https://formulae.brew.sh/formula/tmux"
    accessed: "2026-07-13"
  - title: "tmux example configuration"
    url: "https://github.com/tmux/tmux/blob/master/example_tmux.conf"
    accessed: "2026-07-13"
  - title: "tmux Getting Started"
    url: "https://github.com/tmux/tmux/wiki/Getting-Started"
    accessed: "2026-07-13"
  - title: "tmux Recipes"
    url: "https://github.com/tmux/tmux/wiki/Recipes"
    accessed: "2026-07-13"
  - title: "Tmux Plugin Manager"
    url: "https://github.com/tmux-plugins/tpm"
    accessed: "2026-07-13"
  - title: "Vim Tmux Navigator"
    url: "https://github.com/christoomey/vim-tmux-navigator"
    accessed: "2026-07-13"
  - title: "LazyVim Keymaps"
    url: "https://www.lazyvim.org/keymaps"
    accessed: "2026-07-13"
  - title: "LazyVim Plugins Configuration"
    url: "https://www.lazyvim.org/configuration/plugins"
    accessed: "2026-07-13"
  - title: "Neovim Terminal Documentation"
    url: "https://neovim.io/doc/user/terminal/"
    accessed: "2026-07-13"
  - title: "How To Use and Configure Tmux Alongside Neovim"
    url: "https://www.josean.com/posts/tmux-setup"
    accessed: "2026-07-13"
---

터미널 하나에서 편집기, 개발 서버, 로그를 번갈아 보려니 창 전환이 작업보다 더 자주 일어났습니다. tmux를 붙이면 터미널 연결이 끊겨도 session은 남고, 하나의 window를 여러 pane으로 나눠 같은 프로젝트를 계속 볼 수 있습니다. 문제는 tmux와 LazyVim이 각자 화면 분할을 관리한다는 점입니다.

제가 원하는 결과는 단순합니다.

- `Ctrl-a`를 tmux prefix로 쓴다.
- `|`와 `-`로 현재 경로를 유지한 pane을 연다.
- `Ctrl-h/j/k/l`로 LazyVim split과 tmux pane을 구분하지 않고 이동한다.
- 설정을 바꾼 뒤 tmux를 재시작하지 않고 다시 읽는다.

확인 시점은 2026년 7월 13일입니다. tmux upstream latest release와 Homebrew stable은 모두 `3.7b`를 가리켰습니다. 배포판 package는 이보다 늦을 수 있으므로 숫자를 맞추려고 소스 빌드하기보다, 먼저 실제 설치 버전을 확인하는 편이 낫습니다.

```bash
tmux -V
```

## 설치하고 설정 파일 열기

macOS에서는 Homebrew로 설치합니다.

```bash
brew install tmux
tmux -V
```

Debian과 Ubuntu에서는 배포판 package를 먼저 써도 충분합니다.

```bash
sudo apt update
sudo apt install tmux
tmux -V
```

이 글에서는 XDG 경로인 `~/.config/tmux/tmux.conf`를 사용합니다. 홈 디렉터리의 `~/.tmux.conf`도 쓸 수 있지만, Neovim 설정과 함께 `~/.config` 아래에서 관리하면 dotfiles 구조가 단순해집니다.

```bash
mkdir -p ~/.config/tmux
nvim ~/.config/tmux/tmux.conf
```

## 먼저 plugin 없는 기본 설정 만들기

처음부터 theme와 plugin을 여러 개 넣지 않았습니다. pane을 만들고, 옮기고, 크기를 바꾸는 동작부터 고정해야 나중에 문제가 생겨도 tmux 설정과 plugin 설정을 나눠서 볼 수 있습니다.

```text
# ~/.config/tmux/tmux.conf

# terminal capability
set -g default-terminal "tmux-256color"
set-option -sa terminal-features ",xterm*:RGB"

# prefix: C-b -> C-a
unbind C-b
set -g prefix C-a
bind C-a send-prefix

# basic behavior
set -g mouse on
set -g base-index 1
setw -g pane-base-index 1
set -g renumber-windows on
set -g history-limit 50000

# split while keeping the current pane's directory
unbind %
bind | split-window -h -c "#{pane_current_path}"
unbind '"'
bind - split-window -v -c "#{pane_current_path}"

# reload this file with prefix + r
unbind r
bind r source-file ~/.config/tmux/tmux.conf \; display-message "tmux.conf reloaded"

# resize with prefix + H/J/K/L; -r allows key repeat
bind -r H resize-pane -L 5
bind -r J resize-pane -D 5
bind -r K resize-pane -U 5
bind -r L resize-pane -R 5

# zoom or restore the active pane with prefix + m
bind m resize-pane -Z
```

예전 설정에서 자주 보이는 `screen-256color` 대신 `tmux-256color`를 사용했습니다. 2026년 현재 tmux 공식 example도 `default-terminal`을 `tmux-256color`로 두고, RGB color는 `terminal-features`에 추가합니다. 다만 현재 terminal의 terminfo가 `tmux-256color`를 모르면 색이 오히려 깨질 수 있습니다. 그런 경우 아래 명령으로 항목이 있는지 먼저 확인합니다.

```bash
infocmp tmux-256color >/dev/null && echo "tmux-256color available"
```

설정을 읽은 뒤 새 session을 만듭니다.

```bash
tmux source-file ~/.config/tmux/tmux.conf
tmux new -s dev
```

이제 `Ctrl-a` 다음에 `|`를 누르면 좌우 pane, `Ctrl-a` 다음에 `-`를 누르면 상하 pane이 열립니다. 두 명령에 `-c "#{pane_current_path}"`를 넣었기 때문에 새 pane은 홈 디렉터리가 아니라 기존 pane의 현재 디렉터리에서 시작합니다.

## TPM으로 plugin 관리하기

tmux 설정만으로도 pane 작업은 끝납니다. LazyVim 경계를 넘는 이동을 붙이기 위해 TPM과 `vim-tmux-navigator`만 추가하겠습니다.

먼저 TPM을 clone합니다.

```bash
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm
```

아래 plugin block은 `tmux.conf`의 맨 아래에 둡니다. TPM의 `run` 줄보다 아래에 plugin 선언을 추가하면 초기화 순서가 뒤집힙니다.

```text
# plugins
set -g @plugin 'tmux-plugins/tpm'
set -g @plugin 'tmux-plugins/tmux-sensible'
set -g @plugin 'christoomey/vim-tmux-navigator'

# TPM initialization must stay at the bottom
run '~/.tmux/plugins/tpm/tpm'
```

`Ctrl-a r`로 설정을 다시 읽고 `Ctrl-a I`를 누릅니다. 여기서 `I`는 대문자입니다. TPM은 선언된 plugin을 `~/.tmux/plugins/` 아래에 설치합니다. 나중에 update할 때는 `Ctrl-a U`, 설정에서 뺀 plugin을 정리할 때는 `Ctrl-a Alt-u`를 사용합니다.

## LazyVim 쪽 navigator 설정

LazyVim은 normal mode에서 이미 `Ctrl-h/j/k/l`을 Neovim window 이동에 사용합니다. tmux가 같은 키를 무조건 가로채면 Neovim split 안에서 움직일 수 없고, Neovim만 키를 처리하면 바깥 tmux pane으로 나갈 수 없습니다.

`vim-tmux-navigator`는 현재 pane의 process가 Vim/Neovim인지 판별해 키를 Neovim에 보내거나 tmux의 `select-pane`으로 처리합니다. LazyVim 사용자 plugin spec은 `lua/plugins/*.lua` 아래에 두면 자동으로 읽힙니다.

```bash
nvim ~/.config/nvim/lua/plugins/tmux-navigator.lua
```

파일에는 upstream이 안내하는 lazy.nvim spec을 넣습니다.

```lua
return {
  {
    "christoomey/vim-tmux-navigator",
    cmd = {
      "TmuxNavigateLeft",
      "TmuxNavigateDown",
      "TmuxNavigateUp",
      "TmuxNavigateRight",
      "TmuxNavigatePrevious",
      "TmuxNavigatorProcessList",
    },
    keys = {
      { "<c-h>", "<cmd><C-U>TmuxNavigateLeft<cr>", desc = "Go to left pane" },
      { "<c-j>", "<cmd><C-U>TmuxNavigateDown<cr>", desc = "Go to lower pane" },
      { "<c-k>", "<cmd><C-U>TmuxNavigateUp<cr>", desc = "Go to upper pane" },
      { "<c-l>", "<cmd><C-U>TmuxNavigateRight<cr>", desc = "Go to right pane" },
      { "<c-\\>", "<cmd><C-U>TmuxNavigatePrevious<cr>", desc = "Go to previous pane" },
    },
  },
}
```

Neovim을 다시 열면 lazy.nvim이 plugin을 설치합니다. `:Lazy`에서 `vim-tmux-navigator`가 보이는지 확인한 뒤, Neovim 안에서 `:vsplit`과 `:split`을 만들고 바깥쪽에 tmux pane도 하나 엽니다. 이제 `Ctrl-h/j/k/l`은 경계가 Neovim split인지 tmux pane인지와 관계없이 같은 방향으로 이동해야 합니다.

## 자주 막히는 지점

### 색이 다르거나 italic이 사라진다

tmux 밖에서는 정상인데 안에서만 색이 달라지면 세 값을 비교합니다.

```bash
printf 'outside TERM=%s\n' "$TERM"
tmux display-message -p 'inside TERM=#{client_termname}, default=#{default-terminal}'
infocmp tmux-256color >/dev/null
```

terminal 이름이 `xterm-256color`가 아닐 수도 있습니다. WezTerm, Ghostty, kitty처럼 다른 이름을 쓴다면 실제 `$TERM`에 맞춰 `terminal-features` pattern을 조정합니다. 무조건 `xterm*`을 추가했다고 모든 terminal의 RGB 문제가 해결되는 것은 아닙니다.

### `Ctrl-h/j/k/l`이 tmux pane에서만 움직인다

tmux plugin은 설치됐지만 Neovim plugin이 load되지 않았을 가능성이 큽니다. LazyVim에서 다음을 확인합니다.

```vim
:Lazy
:checkhealth
:verbose nmap <C-h>
```

`verbose nmap` 결과가 다른 설정 파일을 가리키면 그 mapping이 navigator를 다시 덮은 것입니다. LazyVim 문서의 원칙대로 같은 mode와 같은 lhs를 가진 mapping을 찾아 plugin spec에서 조정해야 합니다.

### Neovim terminal에서 키가 shell로 들어간다

Neovim terminal mode는 대부분의 키를 실행 중인 process에 전달합니다. 기본 탈출 키는 `Ctrl-\\ Ctrl-n`입니다. 먼저 normal mode로 나온 다음 `Ctrl-h/j/k/l`이 작동하는지 확인하면 terminal-mode mapping 문제인지 tmux 감지 문제인지 구분할 수 있습니다.

```text
Ctrl-\\ Ctrl-n
```

### `Ctrl-l`로 화면을 지울 수 없다

`Ctrl-l`은 오른쪽 이동에 사용했으므로 shell의 clear-screen과 충돌합니다. navigator는 prefix를 붙인 `Ctrl-l`로 원래 동작을 복구하는 설정을 안내합니다.

```text
bind C-l send-keys 'C-l'
```

이 줄을 추가하면 `Ctrl-a Ctrl-l`로 현재 pane의 화면을 지울 수 있습니다.

### SSH 안에 tmux를 또 열었다

nested tmux에서는 어느 session이 `Ctrl-h/j/k/l`을 처리해야 하는지 모호합니다. `vim-tmux-navigator` 문서도 이 구성을 별도 예외로 다룹니다. 로컬 tmux 안에서 원격 tmux를 자주 중첩한다면 두 session의 prefix를 다르게 쓰거나, 바깥 session을 잠시 통과 모드로 바꾸는 설계를 먼저 정하는 편이 낫습니다.

## 제가 남긴 최소 구성

처음부터 status line theme, session restore, clipboard plugin까지 넣으면 무엇이 기본 tmux 동작인지 알기 어렵습니다. 지금 구성에서 매일 쓰는 키는 여섯 묶음뿐입니다.

| 키 | 동작 |
| :--- | :--- |
| `Ctrl-a \|` | 현재 경로에서 좌우 pane 분할 |
| `Ctrl-a -` | 현재 경로에서 상하 pane 분할 |
| `Ctrl-h/j/k/l` | LazyVim split과 tmux pane 사이 이동 |
| `Ctrl-a H/J/K/L` | pane 크기 조절 |
| `Ctrl-a m` | 현재 pane zoom 전환 |
| `Ctrl-a r` | `tmux.conf` 다시 읽기 |

여기까지 안정적으로 동작한 뒤에야 `tmux-resurrect`, `tmux-continuum`, status theme 같은 선택지를 검토할 만합니다. 먼저 tmux의 session/window/pane 모델과 LazyVim의 window 이동을 한 손에 묶어 두면, 나머지 설정은 필요가 생길 때 한 줄씩 추가할 수 있습니다.

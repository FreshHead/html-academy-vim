# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser extension that automatically activates Vim mode in ACE Editor instances on the HTML Academy website (htmlacademy.ru). The extension uses Manifest V3 and consists of minimal, focused components.

## Architecture

### Core Components
- **manifest.json**: Extension configuration targeting htmlacademy.ru with minimal permissions
- **content.js**: Content script that injects the main logic into page context
- **inject.js**: Main functionality including editor detection, Vim activation, and mode synchronization

### Key Design Patterns
- **Two-stage injection**: Content script injects main script to access page's ACE editor instances
- **Observer-based detection**: Uses MutationObserver to detect new editors dynamically
- **Retry mechanism**: Attempts activation up to 40 times with 500ms intervals
- **Mode synchronization**: Keeps all editor instances in sync (normal/insert mode)

## Development Workflow

### No Build Process Required
This extension has zero build dependencies - all files are ready for direct browser loading:

```bash
# Load extension in Chrome
# 1. Go to chrome://extensions/
# 2. Enable Developer Mode
# 3. Click "Load unpacked" and select this directory
```

### Testing
Test directly on htmlacademy.ru by:
1. Loading the extension
2. Navigating to any HTML Academy exercise with code editors
3. Verify Vim mode activates automatically
4. Test Shift+Space shortcut to go to next step

### Debugging
- Use browser DevTools on htmlacademy.ru pages
- Check console for `[Vim Mode]` log messages
- Extension popup debugging via chrome://extensions/

## Key Functionality

### Editor Management
- Automatically detects `.ace_editor` elements
- Configures ACE with Vim keyboard handler from unpkg CDN
- Maintains `editors` Set to track all active instances
- Handles editor resets and new editor creation

### Global Keybindings
- **Shift+H**: Click theory button (`.course-theory`)
- **Shift+Space**: Click next step button (`.course-goals__button--next`)
- **Shift+J**: Focus ace editor inside `#html-editor` element
- **Shift+K**: Focus ace editor inside `#css-editor` element
- **Shift+L**: Focus ace editor inside `#js-editor` element

### Mode Synchronization
- Intercepts keyboard events via `onCommandKey` override
- Synchronizes insert/normal mode across all editors
- Uses CodeMirror.Vim.handleKey for mode transitions

### User Feedback
- Animated notifications for activation status
- Console logging for debugging editor detection

## External Dependencies

- **ACE Editor**: Must be present on target pages
- **ACE Builds CDN**: `https://unpkg.com/ace-builds@1.15.2/src-noconflict/`
- **CodeMirror Vim**: Accessed through ACE's vim keyboard handler

## File Modification Guidelines

### inject.js
- Main logic is in IIFE for isolation
- `editors` Set tracks all editor instances globally
- `currentMode` tracks synchronized state across editors
- New global keybindings should be added to `setupGlobalKeyBindings()`

### Extension Permissions
- Currently restricted to htmlacademy.ru domain only
- Manifest V3 format with minimal permissions
- Any domain changes require manifest.json update

## Common Modifications

### Adding New Shortcuts
Add keyboard handlers in `setupGlobalKeyBindings()` function within inject.js

### Editor Detection Changes
Modify `.ace_editor` selector in `activateVimMode()` and MutationObserver callback

### Target Site Changes
Update `matches` pattern in manifest.json content script configuration
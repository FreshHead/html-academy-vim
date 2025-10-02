// HTML Academy Vim Mode Activator - Injected Script
(function () {
  "use strict";

  console.log("[Vim Mode] Injected script started");

  // Хранилище для всех редакторов
  const editors = new Set();
  let currentMode = "normal"; // 'normal' или 'insert' (начинаем с normal)

  function activateVimMode() {
    // Проверяем наличие ace
    if (typeof ace === "undefined") {
      return false;
    }

    // Ищем все редакторы
    const editorElements = document.querySelectorAll(".ace_editor");
    if (editorElements.length === 0) {
      return false;
    }

    let activatedCount = 0;

    editorElements.forEach((editorElement) => {
      const editor = editorElement.env?.editor;
      if (!editor) {
        return;
      }

      // Проверяем, не активирован ли уже Vim mode для этого редактора
      const handlers = editor.keyBinding?.$handlers;
      if (handlers && handlers.some((h) => h.$id === "ace/keyboard/vim")) {
        editors.add(editor);
        return; // Уже активирован
      }

      console.log("[Vim Mode] Activating for editor:", editor.id || "unknown");

      // Настраиваем basePath (только один раз)
      if (activatedCount === 0) {
        ace.config.set(
          "basePath",
          "https://unpkg.com/ace-builds@1.15.2/src-noconflict/",
        );
      }

      // Отключаем read only режим
      editor.setReadOnly(false);

      // Устанавливаем Vim keyboard handler
      editor.setKeyboardHandler("ace/keyboard/vim");

      // Добавляем в набор редакторов
      editors.add(editor);

      // Устанавливаем обработчик для отслеживания изменения режима
      setupModeSync(editor);

      activatedCount++;
    });

    if (activatedCount > 0) {
      console.log(
        `[Vim Mode] ✓ Activated Vim mode for ${activatedCount} editor(s)`,
      );

      // Показываем уведомление (редакторы остаются в normal mode)
      setTimeout(function () {
        showNotification(
          `✓ Vim mode активирован для ${editors.size} редактора(ов)!`,
        );
      }, 200);

      return true;
    }

    return false;
  }

  function setupModeSync(editor) {
    // Отслеживаем изменения режима через события клавиатуры
    const originalHandleKeyboard = editor.keyBinding.onCommandKey.bind(
      editor.keyBinding,
    );

    editor.keyBinding.onCommandKey = function (e, hashId, keyCode) {
      const result = originalHandleKeyboard(e, hashId, keyCode);

      // Проверяем текущий режим
      setTimeout(() => {
        const vimState = editor.state?.cm?.state?.vim;
        if (vimState) {
          const newMode = vimState.insertMode ? "insert" : "normal";

          // Если режим изменился, синхронизируем все редакторы
          if (newMode !== currentMode) {
            console.log("[Vim Mode] Mode changed to:", newMode);
            currentMode = newMode;
            syncModeToAll(editor);
          }
        }
      }, 0);

      return result;
    };
  }

  function syncModeToAll(sourceEditor) {
    const vimState = sourceEditor.state?.cm?.state?.vim;
    if (!vimState) return;

    const targetInsertMode = vimState.insertMode;

    editors.forEach((editor) => {
      if (editor === sourceEditor) return; // Пропускаем источник

      const editorVimState = editor.state?.cm?.state?.vim;
      if (!editorVimState) return;

      // Синхронизируем режим
      if (editorVimState.insertMode !== targetInsertMode) {
        try {
          const CodeMirror = editor.state.cm.constructor;
          if (targetInsertMode) {
            // Входим в insert mode
            CodeMirror.Vim.handleKey(editor.state.cm, "i");
          } else {
            // Выходим в normal mode (ESC)
            CodeMirror.Vim.handleKey(editor.state.cm, "<Esc>");
          }
        } catch (e) {
          console.error("[Vim Mode] Sync error:", e);
        }
      }
    });
  }

  function enterInsertModeAll() {
    let successCount = 0;

    editors.forEach((editor) => {
      try {
        const CodeMirror = editor.state?.cm?.constructor;
        if (CodeMirror?.Vim) {
          CodeMirror.Vim.handleKey(editor.state.cm, "i");
          successCount++;
        }
      } catch (e) {
        console.error("[Vim Mode] Error entering insert mode:", e);
      }
    });

    if (successCount > 0) {
      currentMode = "insert";
      console.log(
        `[Vim Mode] ✓ Entered INSERT mode for ${successCount} editor(s)`,
      );
    }
  }

  function showNotification(message) {
    const notification = document.createElement("div");
    notification.textContent = message;
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            animation: slideIn 0.3s ease-out;
        `;

    if (!document.getElementById("vim-mode-style")) {
      const style = document.createElement("style");
      style.id = "vim-mode-style";
      style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.transition = "opacity 0.3s";
      notification.style.opacity = "0";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Пытаемся активировать с повторными попытками
  let attempts = 0;
  const maxAttempts = 40;
  const retryInterval = 500;

  const tryActivate = setInterval(function () {
    attempts++;

    if (activateVimMode()) {
      clearInterval(tryActivate);
    } else if (attempts >= maxAttempts) {
      console.log("[Vim Mode] Failed after", maxAttempts, "attempts");
      clearInterval(tryActivate);
    }
  }, retryInterval);

  // Устанавливаем глобальные клавиатурные сочетания (отложенно)
  setTimeout(setupGlobalKeyBindings, 1000);

  // Глобальный обработчик клавиш для фокуса на редакторе
  function setupGlobalKeyBindings() {
    document.addEventListener('keydown', function(e) {
      // Shift + H - клик по теории
      if (e.shiftKey && e.key === 'H' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        
        const theoryButton = document.querySelector('.course-theory');
        if (theoryButton) {
          theoryButton.click();
        }
        return;
      }
      
      // Shift + Enter - клик по кнопке "Далее"
      if (e.shiftKey && e.key === 'Enter' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        
        const nextButton = document.querySelector('.course-goals__button--next');
        if (nextButton) {
          nextButton.click();
        }
        return;
      }
      
      // Shift + J - фокус на html-editor
      if (e.shiftKey && e.key === 'J' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        
        const htmlEditorContainer = document.getElementById('html-editor');
        if (htmlEditorContainer) {
          // Сам контейнер может быть ace editor
          if (htmlEditorContainer.classList.contains('ace_editor') && htmlEditorContainer.env && htmlEditorContainer.env.editor) {
            htmlEditorContainer.env.editor.focus();
            return;
          }
          
          // Или ищем внутри контейнера
          const aceEditor = htmlEditorContainer.querySelector('.ace_editor');
          if (aceEditor && aceEditor.env && aceEditor.env.editor) {
            aceEditor.env.editor.focus();
            return;
          }
        }
      }
      
      // Shift + K - фокус на css-editor
      if (e.shiftKey && e.key === 'K' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        
        const cssEditorContainer = document.getElementById('css-editor');
        if (cssEditorContainer) {
          // Сам контейнер может быть ace editor
          if (cssEditorContainer.classList.contains('ace_editor') && cssEditorContainer.env && cssEditorContainer.env.editor) {
            cssEditorContainer.env.editor.focus();
            return;
          }
          
          // Или ищем внутри контейнера
          const aceEditor = cssEditorContainer.querySelector('.ace_editor');
          if (aceEditor && aceEditor.env && aceEditor.env.editor) {
            aceEditor.env.editor.focus();
            return;
          }
        }
      }
    }, true); // Capture phase
  }

  // Следим за изменениями DOM (новые редакторы)
  const observer = new MutationObserver(function () {
    const editorElements = document.querySelectorAll(".ace_editor");

    editorElements.forEach((editorElement) => {
      const editorId = editorElement.id;
      const editor = editorElement.env?.editor;
      if (!editor) return;

      // Если редактор новый, активируем Vim mode
      if (!editors.has(editor)) {
        console.log("[Vim Mode] New editor detected, activating...");
        setTimeout(activateVimMode, 100);
      } else {
        // Проверяем, не сбросился ли Vim mode
        const handlers = editor.keyBinding?.$handlers;
        if (handlers && !handlers.some((h) => h.$id === "ace/keyboard/vim")) {
          console.log("[Vim Mode] Vim mode was reset, reactivating...");
          editors.delete(editor);
          setTimeout(activateVimMode, 100);
        }
      }
    });
  });

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  } else {
    window.addEventListener("load", function () {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }
})();

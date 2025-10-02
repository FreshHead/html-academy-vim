// HTML Academy Vim Mode Activator - Content Script
(function() {
    'use strict';
    
    console.log('[Vim Mode] Content script loaded');
    
    // Внедряем inject.js в контекст страницы
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject.js');
    script.onload = function() {
        this.remove();
        console.log('[Vim Mode] Inject script loaded');
    };
    
    (document.head || document.documentElement).appendChild(script);
    
})();

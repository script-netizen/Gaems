class Versant {
    constructor() {
        this.isVisible = false;
        this.createShadowContainer();
        this.injectHTML();
        
        this.container = this.shadowRoot.getElementById('versant-container');
        this.codeEditor = this.shadowRoot.getElementById('code-editor');
        this.outputContainer = this.shadowRoot.getElementById('output-container');
        this.runBtn = this.shadowRoot.getElementById('run-btn');
        this.clearBtn = this.shadowRoot.getElementById('clear-btn');
        this.closeBtn = this.shadowRoot.getElementById('close-btn');
        this.tabs = this.shadowRoot.querySelectorAll('.tab');
        this.tabContents = this.shadowRoot.querySelectorAll('.tab-content');
        
        this.originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info
        };
        
        this.initEventListeners();
        this.interceptConsole();
        this.registerUtilityFunctions();
    }
    
    createShadowContainer() {
        // Create host element for shadow DOM
        this.hostElement = document.createElement('div');
        this.hostElement.id = 'versant-host';
        this.hostElement.style.position = 'fixed';
        this.hostElement.style.top = '0';
        this.hostElement.style.left = '0';
        this.hostElement.style.width = '100vw';
        this.hostElement.style.height = '100vh';
        this.hostElement.style.pointerEvents = 'none';
        this.hostElement.style.zIndex = '10000';
        document.body.appendChild(this.hostElement);
        
        // Create shadow DOM with better isolation
        this.shadowRoot = this.hostElement.attachShadow({ mode: 'open' });
        
        // Add styles to shadow DOM
        this.injectStyles();
    }
    
    injectStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            :host {
                all: initial;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            :root {
                --primary-color: rgba(199, 44, 65, 0.9);
                --primary-dark: rgba(128, 19, 54, 0.9);
                --primary-light: rgba(238, 69, 64, 0.9);
                --bg-color: rgba(45, 20, 44, 0.85);
                --text-color: #003366;
                --secondary-bg: rgba(81, 10, 50, 0.85);
                --border-color: rgba(128, 19, 54, 0.8);
            }
            
            #versant-container {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 80%;
                max-width: 900px;
                height: 70%;
                max-height: 700px;
                background-color: var(--bg-color);
                border: 2px solid var(--primary-color);
                border-radius: 8px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                transition: all 0.3s ease;
                pointer-events: all;
                z-index: 10001;
                backdrop-filter: blur(5px);
            }
            
            #versant-container.hidden {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.9);
                pointer-events: none;
            }
            
            .versant-header {
                display: flex;
                padding: 10px 15px;
                background-color: var(--primary-color);
                color: var(--text-color);
                align-items: center;
                border-bottom: 1px solid var(--border-color);
                backdrop-filter: blur(5px);
            }
            
            .versant-title {
                font-size: 18px;
                font-weight: bold;
                margin-right: 20px;
            }
            
            .versant-tabs {
                display: flex;
                flex: 1;
                gap: 5px;
            }
            
            .tab {
                padding: 5px 15px;
                border-radius: 5px 5px 0 0;
                cursor: pointer;
                transition: background 0.2s;
                user-select: none;
                color: var(--text-color);
            }
            
            .tab:hover {
                background-color: rgba(255, 255, 255, 0.1);
            }
            
            .tab.active {
                background-color: var(--primary-dark);
            }
            
            .versant-controls {
                display: flex;
                gap: 8px;
            }
            
            .versant-controls button {
                background-color: var(--primary-dark);
                color: var(--text-color);
                border: none;
                border-radius: 4px;
                padding: 5px 10px;
                cursor: pointer;
                transition: background 0.2s;
                font-family: inherit;
            }
            
            .versant-controls button:hover {
                background-color: var(--secondary-bg);
            }
            
            #close-btn {
                font-size: 18px;
                font-weight: bold;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .versant-content {
                flex: 1;
                display: flex;
                overflow: hidden;
            }
            
            .tab-content {
                display: none;
                width: 100%;
                height: 100%;
                overflow: auto;
            }
            
            .tab-content.active {
                display: block;
            }
            
            #code-editor {
                width: 100%;
                height: 100%;
                background-color: var(--bg-color);
                color: var(--text-color);
                border: none;
                padding: 15px;
                resize: none;
                outline: none;
                font-family: monospace;
                font-size: 14px;
                line-height: 1.5;
                backdrop-filter: blur(5px);
            }
            
            #output-container {
                padding: 15px;
                color: var(--text-color);
                background-color: var(--bg-color);
                min-height: 100%;
                white-space: pre-wrap;
                font-family: monospace;
                overflow-x: auto;
            }
            
            .help-text {
                padding: 20px;
                color: var(--text-color);
                line-height: 1.6;
            }
            
            .help-text h2 {
                color: var(--primary-light);
                margin-bottom: 15px;
            }
            
            .help-text ul {
                margin-left: 20px;
                margin-bottom: 15px;
            }
            
            kbd {
                background-color: var(--secondary-bg);
                border-radius: 3px;
                border: 1px solid var(--border-color);
                padding: 2px 5px;
                font-size: 0.9em;
            }
            
            .output-item {
                margin-bottom: 10px;
                padding: 5px 0;
                border-bottom: 1px dashed var(--border-color);
            }
            
            .output-error {
                color: #ff4d4d;
            }
            
            .output-log {
                color: #003366;
            }
            
            .output-info {
                color: #004080;
            }
            
            .output-warn {
                color: #ff9900;
            }
            
            .function-list {
                display: flex;
                flex-direction: column;
                gap: 20px;
                margin-top: 15px;
            }
            
            .function-item {
                padding: 15px;
                background-color: var(--secondary-bg);
                border-radius: 5px;
                border-left: 3px solid var(--primary-color);
            }
            
            .function-item h3 {
                color: var(--primary-light);
                margin-bottom: 8px;
                font-family: monospace;
            }
            
            .function-item pre {
                background-color: rgba(0, 0, 0, 0.2);
                padding: 8px;
                border-radius: 4px;
                overflow-x: auto;
                margin-top: 8px;
            }
            
            .function-item code {
                font-family: monospace;
                color: #003366;
            }
        `;
        this.shadowRoot.appendChild(styleElement);
    }
    
    injectHTML() {
        const html = `
            <div id="versant-container" class="hidden">
                <div class="versant-header">
                    <div class="versant-title">Versant</div>
                    <div class="versant-tabs">
                        <div class="tab active" data-tab="js">JavaScript</div>
                        <div class="tab" data-tab="output">Output</div>
                        <div class="tab" data-tab="functions">Functions</div>
                        <div class="tab" data-tab="info">Info</div>
                        <div class="tab" data-tab="help">Help</div>
                    </div>
                    <div class="versant-controls">
                        <button id="run-btn" title="Run (Ctrl+Enter)">Run</button>
                        <button id="clear-btn" title="Clear">Clear</button>
                        <button id="close-btn" title="Close (Alt+G)">×</button>
                    </div>
                </div>
                <div class="versant-content">
                    <div class="tab-content active" id="js-content">
                        <textarea id="code-editor" placeholder="// Enter your JavaScript code here..."></textarea>
                    </div>
                    <div class="tab-content" id="output-content">
                        <div id="output-container"></div>
                    </div>
                    <div class="tab-content" id="functions-content">
                        <div class="help-text">
                            <h2>Custom Functions</h2>
                            <p>These utility functions are available for you to use in your code:</p>
                            <div class="function-list">
                                <div class="function-item">
                                    <h3>$prettyPrint(obj)</h3>
                                    <p>Formats and prints objects with syntax highlighting</p>
                                    <pre><code>$prettyPrint({name: "John", age: 30});</code></pre>
                                </div>
                                <div class="function-item">
                                    <h3>$fetchJSON(url)</h3>
                                    <p>Fetches and parses JSON from a URL (returns a Promise)</p>
                                    <pre><code>let data = await $fetchJSON('https://jsonplaceholder.typicode.com/todos/1');</code></pre>
                                </div>
                                <div class="function-item">
                                    <h3>$delay(ms)</h3>
                                    <p>Creates a promise that resolves after specified milliseconds</p>
                                    <pre><code>await $delay(1000); // Pauses execution for 1 second</code></pre>
                                </div>
                                <div class="function-item">
                                    <h3>$dom(selector)</h3>
                                    <p>Simple DOM selector and manipulator</p>
                                    <pre><code>$dom('body').style.background = 'red';</code></pre>
                                </div>
                                <div class="function-item">
                                    <h3>$random(min, max)</h3>
                                    <p>Generates a random number between min and max (inclusive)</p>
                                    <pre><code>let num = $random(1, 100); // Random number between 1 and 100</code></pre>
                                </div>
                                <div class="function-item">
                                    <h3>$uuid()</h3>
                                    <p>Generates a UUID for unique identifiers</p>
                                    <pre><code>let id = $uuid(); // e.g. "a1b2c3d4-e5f6-..."</code></pre>
                                </div>
                                <div class="function-item">
                                    <h3>$debounce(func, wait)</h3>
                                    <p>Creates a debounced function</p>
                                    <pre><code>const debouncedFn = $debounce(() => console.log("Executed once"), 300);</code></pre>
                                </div>
                                <div class="function-item">
                                    <h3>$storage(key, value)</h3>
                                    <p>Get or set localStorage with automatic JSON parsing/stringifying</p>
                                    <pre><code>$storage('user', {name: 'John'}); // Set
const user = $storage('user'); // Get</code></pre>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tab-content" id="info-content">
                        <div class="help-text">
                            <h2>About Versant</h2>
                            <p>Versant is a lightweight JavaScript executor that allows you to quickly run code snippets directly in your browser.</p>
                            <p><strong>Features:</strong></p>
                            <ul>
                                <li>Instant JavaScript execution</li>
                                <li>Console output capture</li>
                                <li>Custom utility functions</li>
                                <li>Markdown support in output</li>
                                <li>Keyboard shortcuts for productivity</li>
                            </ul>
                            <p><strong>Version:</strong> 1.0.0</p>
                            <p>Press <kbd>Alt</kbd> + <kbd>G</kbd> to toggle Versant at any time.</p>
                        </div>
                    </div>
                    <div class="tab-content" id="help-content">
                        <div class="help-text">
                            <h2>Versant JS Executor</h2>
                            <p><strong>Keyboard Shortcuts:</strong></p>
                            <ul>
                                <li><kbd>Alt</kbd> + <kbd>G</kbd>: Toggle Versant</li>
                                <li><kbd>Ctrl</kbd> + <kbd>Enter</kbd>: Run code</li>
                                <li><kbd>Ctrl</kbd> + <kbd>L</kbd>: Clear output</li>
                            </ul>
                            <p>Versant allows you to quickly execute JavaScript code and see the results.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const container = document.createElement('div');
        container.innerHTML = html;
        this.shadowRoot.appendChild(container.firstElementChild);
    }
    
    initEventListeners() {
        // Toggle visibility with Alt+G
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 'g') {
                this.toggleVisibility();
                e.preventDefault();
            }
            
            // Run code with Ctrl+Enter when editor is focused
            if (e.ctrlKey && e.key === 'Enter' && this.isVisible && document.activeElement === this.codeEditor) {
                this.executeCode();
                e.preventDefault();
            }
            
            // Clear output with Ctrl+L when visible
            if (e.ctrlKey && e.key === 'l' && this.isVisible) {
                this.clearOutput();
                e.preventDefault();
            }
        });
        
        // Tab switching
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });
        
        // Button actions
        this.runBtn.addEventListener('click', () => this.executeCode());
        this.clearBtn.addEventListener('click', () => this.clearOutput());
        this.closeBtn.addEventListener('click', () => this.toggleVisibility());
    }
    
    toggleVisibility() {
        this.isVisible = !this.isVisible;
        this.container.classList.toggle('hidden', !this.isVisible);
        
        if (this.isVisible) {
            this.codeEditor.focus();
        }
    }
    
    switchTab(tabId) {
        this.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}-content`);
        });
    }
    
    executeCode() {
        const code = this.codeEditor.value.trim();
        if (!code) return;
        
        this.switchTab('output');
        
        try {
            // Create a new div for this execution's output
            const outputItem = document.createElement('div');
            outputItem.className = 'output-item';
            
            // Add a timestamp
            const timestamp = document.createElement('div');
            timestamp.textContent = `[${new Date().toLocaleTimeString()}]`;
            timestamp.style.color = '#999';
            timestamp.style.fontSize = '0.8em';
            outputItem.appendChild(timestamp);
            
            // Execute the code
            const result = eval(code);
            
            // Display the result if it's not undefined
            if (result !== undefined) {
                this.appendOutput(outputItem, 'Result: ', String(result), 'output-info');
            }
            
            this.outputContainer.appendChild(outputItem);
            this.outputContainer.scrollTop = this.outputContainer.scrollHeight;
        } catch (error) {
            this.appendOutput(null, 'Error: ', error.message, 'output-error');
        }
    }
    
    appendOutput(parent, prefix, message, className) {
        const outputElement = document.createElement('div');
        outputElement.className = className;
        
        if (prefix) {
            const prefixSpan = document.createElement('span');
            prefixSpan.textContent = prefix;
            prefixSpan.style.fontWeight = 'bold';
            outputElement.appendChild(prefixSpan);
        }
        
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        outputElement.appendChild(messageSpan);
        
        if (parent) {
            parent.appendChild(outputElement);
        } else {
            const outputItem = document.createElement('div');
            outputItem.className = 'output-item';
            outputItem.appendChild(outputElement);
            this.outputContainer.appendChild(outputItem);
            this.outputContainer.scrollTop = this.outputContainer.scrollHeight;
        }
    }
    
    clearOutput() {
        this.outputContainer.innerHTML = '';
    }
    
    interceptConsole() {
        const self = this;
        
        // Override console methods
        console.log = function(...args) {
            self.handleConsoleMethod('log', args);
            self.originalConsole.log.apply(console, args);
        };
        
        console.error = function(...args) {
            self.handleConsoleMethod('error', args);
            self.originalConsole.error.apply(console, args);
        };
        
        console.warn = function(...args) {
            self.handleConsoleMethod('warn', args);
            self.originalConsole.warn.apply(console, args);
        };
        
        console.info = function(...args) {
            self.handleConsoleMethod('info', args);
            self.originalConsole.info.apply(console, args);
        };
    }
    
    handleConsoleMethod(method, args) {
        if (!this.isVisible) return;
        
        const outputItem = document.createElement('div');
        outputItem.className = 'output-item';
        
        const message = args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 2);
                } catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');
        
        this.appendOutput(outputItem, `console.${method}: `, message, `output-${method}`);
        this.outputContainer.appendChild(outputItem);
        this.outputContainer.scrollTop = this.outputContainer.scrollHeight;
    }
    
    registerUtilityFunctions() {
        // Pretty print objects with formatting
        window.$prettyPrint = (obj) => {
            console.log(JSON.stringify(obj, null, 2));
            return obj;
        };
        
        // Fetch and parse JSON
        window.$fetchJSON = async (url) => {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.error(`$fetchJSON error: ${error.message}`);
                throw error;
            }
        };
        
        // Create a delay/timeout promise
        window.$delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        
        // Simple DOM manipulation
        window.$dom = (selector) => {
            const elements = document.querySelectorAll(selector);
            return elements.length === 1 ? elements[0] : elements;
        };
        
        // Generate random number between min and max (inclusive)
        window.$random = (min, max) => {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        };
        
        // Generate UUID
        window.$uuid = () => {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };
        
        // Debounce function
        window.$debounce = (func, wait = 300) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        };
        
        // Storage helper (localStorage with JSON parsing)
        window.$storage = (key, value) => {
            if (value === undefined) {
                const storedValue = localStorage.getItem(key);
                try {
                    return storedValue ? JSON.parse(storedValue) : null;
                } catch (e) {
                    return storedValue;
                }
            } else {
                localStorage.setItem(key, JSON.stringify(value));
                return value;
            }
        };
    }
    
    // Restore original console methods
    restoreConsole() {
        console.log = this.originalConsole.log;
        console.error = this.originalConsole.error;
        console.warn = this.originalConsole.warn;
        console.info = this.originalConsole.info;
    }
}

// Initialize Versant immediately
window.versant = new Versant();

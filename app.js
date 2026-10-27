/**
 * KDPsych Study Platform — Frontend Engine
 * Complete interactive question bank with keyboard shortcuts, persistence,
 * flagging, and dynamic JSON import.
 */

'use strict';

class StudyApp {
  constructor() {
    this.currentMode = 'qalam'; // 'qalam', 'chapters', or 'mocks'
    this.qalamCatalog = [];
    this.chaptersCatalog = [];
    this.mocksCatalog = [];
    this.catalog = [];
    this.currentSubjectFilter = 'ALL';
    this.currentChapterMeta = null;
    this.currentChapterData = null;
    this.activeQuestionsList = []; // filtered questions
    this.currentQuestionIdx = 0;
    this.selectedOptionId = null;
    this.currentFilter = 'all'; // 'all', 'unanswered', 'incorrect', 'flagged'

    // Storage keys
    this.STORAGE_ANSWERS = 'kd_study_answers_v1';
    this.STORAGE_FLAGS = 'kd_study_flags_v1';
    this.STORAGE_POSITION = 'kd_study_pos_v1';
    this.STORAGE_THEME = 'kd_study_theme_v1';
    this.STORAGE_CUSTOM_CHAPTERS = 'kd_custom_chapters_v1';
    this.STORAGE_GITHUB_TOKEN = 'kd_study_github_token_v1';
    this.GITHUB_GIST_ID = '69d373f22f501f120ca5ee2f83bef366';

    this.answers = this._loadJson(this.STORAGE_ANSWERS, {});
    this.flags = this._loadJson(this.STORAGE_FLAGS, {});
    this.customChapters = this._loadJson(this.STORAGE_CUSTOM_CHAPTERS, []);
    this.githubToken = localStorage.getItem(this.STORAGE_GITHUB_TOKEN) || '';

    this._cacheDom();
    this._bindEvents();
    this._initTheme();
    this._initSync();
    this._loadCatalog();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DOM Caching
  // ──────────────────────────────────────────────────────────────────────────
  _cacheDom() {
    this.dom = {
      app: document.getElementById('app'),
      sidebar: document.getElementById('sidebar'),
      sidebarToggleBtn: document.getElementById('sidebar-toggle-btn'),
      sidebarCloseBtn: document.getElementById('sidebar-close-btn'),
      chapterList: document.getElementById('chapter-list'),
      chapterSearch: document.getElementById('chapter-search'),
      currentSubject: document.getElementById('current-subject'),
      currentChapterTitle: document.getElementById('current-chapter-title'),
      
      // Mode Tabs & Filters
      tabQalam: document.getElementById('tab-qalam'),
      tabChapters: document.getElementById('tab-chapters'),
      tabMocks: document.getElementById('tab-mocks'),
      subjectFilter: document.getElementById('subject-filter'),
      subjectFilterContainer: document.getElementById('subject-filter-container'),
      questionTableContainer: document.getElementById('question-table-container'),
      navSectionTitle: document.getElementById('nav-section-title'),
      progressScopeLabel: document.getElementById('progress-scope-label'),

      // Global Progress
      globalProgressPct: document.getElementById('global-progress-pct'),
      globalProgressBar: document.getElementById('global-progress-bar'),
      globalAnsweredCount: document.getElementById('global-answered-count'),
      globalTotalCount: document.getElementById('global-total-count'),

      // Question Header
      questionIndexLabel: document.getElementById('question-index-label'),
      questionDifficulty: document.getElementById('question-difficulty'),
      questionType: document.getElementById('question-type'),
      flagBtn: document.getElementById('flag-btn'),
      flagBtnText: document.getElementById('flag-btn-text'),

      // Question Card
      contentScrollable: document.querySelector('.content-scrollable'),
      questionCard: document.getElementById('question-card'),
      questionStem: document.getElementById('question-stem'),
      questionImageContainer: document.getElementById('question-image-container'),
      questionImage: document.getElementById('question-image'),
      optionsContainer: document.getElementById('options-container'),

      // Explanation
      explanationPanel: document.getElementById('explanation-panel'),
      explanationStatusHeader: document.getElementById('explanation-status-header'),
      explanationStatusIcon: document.getElementById('explanation-status-icon'),
      explanationStatusText: document.getElementById('explanation-status-text'),
      explanationText: document.getElementById('explanation-text'),
      explanationImageContainer: document.getElementById('explanation-image-container'),
      explanationImage: document.getElementById('explanation-image'),

      // Navigation Buttons
      prevBtn: document.getElementById('prev-btn'),
      nextBtn: document.getElementById('next-btn'),
      submitBtn: document.getElementById('submit-btn'),
      submitBtnText: document.getElementById('submit-btn-text'),
      themeToggleBtn: document.getElementById('theme-toggle-btn'),
      filterBtns: document.querySelectorAll('.filter-btn'),
      resetChapterBtn: document.getElementById('reset-chapter-btn'),

      // Sidebar Backdrop
      sidebarBackdrop: document.getElementById('sidebar-backdrop'),

      // Import Modal
      importBtn: document.getElementById('import-btn'),
      importModal: document.getElementById('import-modal'),
      modalCloseBtn: document.getElementById('modal-close-btn'),
      dropZone: document.getElementById('drop-zone'),
      fileInput: document.getElementById('file-input'),
      importStatus: document.getElementById('import-status'),

      // Cross-Device Sync
      syncIndicator: document.getElementById('sync-indicator'),
      syncText: document.getElementById('sync-text'),
      openSyncBtn: document.getElementById('open-sync-btn'),
      syncModal: document.getElementById('sync-modal'),
      syncModalCloseBtn: document.getElementById('sync-modal-close-btn'),
      githubSyncTokenInput: document.getElementById('github-sync-token-input'),
      saveSyncTokenBtn: document.getElementById('save-sync-token-btn'),
      syncModalStatus: document.getElementById('sync-modal-status'),
      exportBackupBtn: document.getElementById('export-backup-btn'),
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Event Binding
  // ──────────────────────────────────────────────────────────────────────────
  _bindEvents() {
    // Mode Switcher Tabs
    if (this.dom.tabQalam) {
      this.dom.tabQalam.addEventListener('click', () => this.switchMode('qalam'));
    }
    if (this.dom.tabChapters) {
      this.dom.tabChapters.addEventListener('click', () => this.switchMode('chapters'));
    }
    if (this.dom.tabMocks) {
      this.dom.tabMocks.addEventListener('click', () => this.switchMode('mocks'));
    }

    // Book / Subject Filter Dropdown
    if (this.dom.subjectFilter) {
      this.dom.subjectFilter.addEventListener('change', (e) => this.filterBySubject(e.target.value));
    }

    // Sidebar toggle
    this.dom.sidebarToggleBtn.addEventListener('click', () => this.toggleSidebar());
    this.dom.sidebarCloseBtn.addEventListener('click', () => this.toggleSidebar(false));
    if (this.dom.sidebarBackdrop) {
      this.dom.sidebarBackdrop.addEventListener('click', () => this.toggleSidebar(false));
    }

    // Chapter Search
    this.dom.chapterSearch.addEventListener('input', (e) => this._filterChapterList(e.target.value));

    // Navigation Buttons
    this.dom.prevBtn.addEventListener('click', () => this.prevQuestion());
    this.dom.nextBtn.addEventListener('click', () => this.nextQuestion());
    this.dom.submitBtn.addEventListener('click', () => this.submitAnswer());

    // Flag toggle
    this.dom.flagBtn.addEventListener('click', () => this.toggleFlag());

    // Reset Chapter
    this.dom.resetChapterBtn.addEventListener('click', () => this.resetCurrentChapter());

    // Filter Buttons
    this.dom.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.dom.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setFilter(btn.dataset.filter);
      });
    });

    // Theme toggle
    this.dom.themeToggleBtn.addEventListener('click', () => this.toggleTheme());

    // Import modal
    this.dom.importBtn.addEventListener('click', () => this._openImportModal(true));
    this.dom.modalCloseBtn.addEventListener('click', () => this._openImportModal(false));
    this.dom.importModal.addEventListener('click', (e) => {
      if (e.target === this.dom.importModal) this._openImportModal(false);
    });

    // GitHub Cloud Sync modal
    if (this.dom.openSyncBtn) {
      this.dom.openSyncBtn.addEventListener('click', () => this._openSyncModal(true));
    }
    if (this.dom.syncIndicator) {
      this.dom.syncIndicator.addEventListener('click', () => this._openSyncModal(true));
      this.dom.syncIndicator.title = 'Click to configure 24/7 Cloud Sync';
    }
    if (this.dom.syncModalCloseBtn) {
      this.dom.syncModalCloseBtn.addEventListener('click', () => this._openSyncModal(false));
    }
    if (this.dom.syncModal) {
      this.dom.syncModal.addEventListener('click', (e) => {
        if (e.target === this.dom.syncModal) this._openSyncModal(false);
      });
    }
    if (this.dom.saveSyncTokenBtn) {
      this.dom.saveSyncTokenBtn.addEventListener('click', () => this._handleSaveSyncToken());
    }
    if (this.dom.exportBackupBtn) {
      this.dom.exportBackupBtn.addEventListener('click', () => this._exportBackup());
    }

    // File Drag & Drop
    this.dom.dropZone.addEventListener('click', () => this.dom.fileInput.click());
    this.dom.fileInput.addEventListener('change', (e) => this._handleFileImport(e.target.files[0]));

    this.dom.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dom.dropZone.classList.add('dragover');
    });
    this.dom.dropZone.addEventListener('dragleave', () => this.dom.dropZone.classList.remove('dragover'));
    this.dom.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dom.dropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        this._handleFileImport(e.dataTransfer.files[0]);
      }
    });

    // Touch Swipe Navigation for Mobile (Swipe left = Next, Swipe right = Prev)
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    const scrollArea = document.querySelector('.content-scrollable');

    if (scrollArea) {
      scrollArea.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          touchStartTime = Date.now();
        }
      }, { passive: true });

      scrollArea.addEventListener('touchend', (e) => {
        if (e.changedTouches.length === 1) {
          const deltaX = e.changedTouches[0].clientX - touchStartX;
          const deltaY = e.changedTouches[0].clientY - touchStartY;
          const deltaTime = Date.now() - touchStartTime;

          // Require clear horizontal flick of at least 70px, dominant over vertical (2x), within 350ms
          if (Math.abs(deltaX) > 70 && Math.abs(deltaX) > Math.abs(deltaY) * 2.0 && deltaTime < 350) {
            if (deltaX < 0) {
              // Swipe Left -> Next Question
              if (navigator.vibrate) {
                try { navigator.vibrate(15); } catch(err){}
              }
              this.nextQuestion();
            } else {
              // Swipe Right -> Previous Question
              if (navigator.vibrate) {
                try { navigator.vibrate(15); } catch(err){}
              }
              this.prevQuestion();
            }
          }
        }
      }, { passive: true });
    }

    // Global Keyboard Listeners
    window.addEventListener('keydown', (e) => this._handleKeyboard(e));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Keyboard Shortcut Handler
  // ──────────────────────────────────────────────────────────────────────────
  _handleKeyboard(e) {
    // Ignore keyboard shortcuts when typing in an input
    const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea') return;

    const key = e.key;

    // Numbers 1 to 9: Select option
    if (/^[1-9]$/.test(key)) {
      const optIndex = parseInt(key, 10) - 1;
      this._selectOptionByIndex(optIndex);
      return;
    }

    // Enter: Submit or Advance
    if (key === 'Enter') {
      e.preventDefault();
      const currentQ = this._getCurrentQuestion();
      if (!currentQ) return;
      const ans = this._getAnswer(currentQ.question_id);
      if (!ans) {
        this.submitAnswer();
      } else {
        this.nextQuestion();
      }
      return;
    }

    // Arrow Left or '<' or ',' : Previous
    if (key === 'ArrowLeft' || key === '<' || key === ',') {
      e.preventDefault();
      this.prevQuestion();
      return;
    }

    // Arrow Right or '>' or '.' : Next
    if (key === 'ArrowRight' || key === '>' || key === '.') {
      e.preventDefault();
      this.nextQuestion();
      return;
    }

    // 'f' or 'F' : Toggle Flag
    if (key === 'f' || key === 'F') {
      e.preventDefault();
      this.toggleFlag();
      return;
    }

    // 'm' or 'M' : Toggle Sidebar
    if (key === 'm' || key === 'M') {
      e.preventDefault();
      this.toggleSidebar();
      return;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Theme Toggle
  // ──────────────────────────────────────────────────────────────────────────
  _initTheme() {
    const savedTheme = localStorage.getItem(this.STORAGE_THEME) || 'theme-light';
    document.body.className = savedTheme;
    this.dom.themeToggleBtn.textContent = savedTheme === 'theme-light' ? '🌙' : '☀️';
  }

  toggleTheme() {
    const isLight = document.body.classList.contains('theme-light');
    const newTheme = isLight ? 'theme-dark' : 'theme-light';
    document.body.className = newTheme;
    this.dom.themeToggleBtn.textContent = newTheme === 'theme-light' ? '🌙' : '☀️';
    localStorage.setItem(this.STORAGE_THEME, newTheme);
  }

  toggleSidebar(forceState) {
    let isOpen;
    if (typeof forceState === 'boolean') {
      this.dom.sidebar.classList.toggle('collapsed', !forceState);
      isOpen = forceState;
    } else {
      this.dom.sidebar.classList.toggle('collapsed');
      isOpen = !this.dom.sidebar.classList.contains('collapsed');
    }
    if (this.dom.sidebarBackdrop) {
      this.dom.sidebarBackdrop.classList.toggle('active', isOpen && window.innerWidth < 900);
    }
  }


  // ──────────────────────────────────────────────────────────────────────────
  // Mode Switcher (Qalam vs KDPsych vs Mock Exams)
  // ──────────────────────────────────────────────────────────────────────────
  switchMode(mode, autoLoadFirst = true) {
    if (mode !== 'qalam' && mode !== 'chapters' && mode !== 'mocks') return;
    this.currentMode = mode;
    this.currentSubjectFilter = 'ALL';

    if (this.dom.tabQalam) {
      this.dom.tabQalam.classList.toggle('active', mode === 'qalam');
      this.dom.tabQalam.setAttribute('aria-selected', mode === 'qalam' ? 'true' : 'false');
    }
    if (this.dom.tabChapters) {
      this.dom.tabChapters.classList.toggle('active', mode === 'chapters');
      this.dom.tabChapters.setAttribute('aria-selected', mode === 'chapters' ? 'true' : 'false');
    }
    if (this.dom.tabMocks) {
      this.dom.tabMocks.classList.toggle('active', mode === 'mocks');
      this.dom.tabMocks.setAttribute('aria-selected', mode === 'mocks' ? 'true' : 'false');
    }

    if (mode === 'qalam') {
      this.catalog = this.qalamCatalog;
      if (this.dom.navSectionTitle) this.dom.navSectionTitle.textContent = 'QALAM PSYCHIATRY BANKS';
      if (this.dom.progressScopeLabel) this.dom.progressScopeLabel.textContent = 'Qalam Banks Progress:';
    } else if (mode === 'chapters') {
      this.catalog = [...this.chaptersCatalog, ...this.customChapters];
      if (this.dom.navSectionTitle) this.dom.navSectionTitle.textContent = 'KDPSYCH CHAPTERS';
      if (this.dom.progressScopeLabel) this.dom.progressScopeLabel.textContent = 'KDPsych Progress:';
    } else {
      this.catalog = this.mocksCatalog;
      if (this.dom.navSectionTitle) this.dom.navSectionTitle.textContent = 'TIMED MOCK EXAMS';
      if (this.dom.progressScopeLabel) this.dom.progressScopeLabel.textContent = 'Mock Exams Progress:';
    }

    this._populateSubjectFilter();
    this._renderCatalog();
    this._updateGlobalProgress();

    if (autoLoadFirst && this.catalog.length > 0) {
      this.loadChapter(0, 0);
    }
  }

  filterBySubject(subject) {
    this.currentSubjectFilter = subject || 'ALL';
    this._renderCatalog();
  }

  _populateSubjectFilter() {
    if (!this.dom.subjectFilter) return;
    if (this.currentMode === 'mocks') {
      if (this.dom.subjectFilterContainer) this.dom.subjectFilterContainer.style.display = 'none';
      return;
    }
    if (this.dom.subjectFilterContainer) this.dom.subjectFilterContainer.style.display = 'block';

    const subjects = new Map();
    this.catalog.forEach(ch => {
      const s = ch.subject || 'General';
      subjects.set(s, (subjects.get(s) || 0) + 1);
    });

    const isQalam = this.currentMode === 'qalam';
    const labelPrefix = isQalam ? 'All Books & Question Banks' : 'All Subjects';
    let optsHtml = `<option value="ALL">${labelPrefix} (${this.catalog.length} chapters)</option>`;

    for (const [subj, count] of subjects.entries()) {
      const selected = this.currentSubjectFilter === subj ? 'selected' : '';
      optsHtml += `<option value="${this._escape(subj)}" ${selected}>${this._escape(subj)} (${count} ch)</option>`;
    }
    this.dom.subjectFilter.innerHTML = optsHtml;
  }

  _getChapterId() {
    if (!this.currentChapterData) {
      return this.currentChapterMeta ? this.currentChapterMeta.id : null;
    }
    if (this.currentChapterData.mock_id) {
      return `mock_${this.currentChapterData.mock_id}`;
    }
    if (this.currentChapterData.chapter_id) {
      return this.currentChapterData.chapter_id;
    }
    return this.currentChapterMeta ? this.currentChapterMeta.id : 'unknown';
  }

  _isMobile() {
    return window.innerWidth < 768 || 
      (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) || 
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches && window.innerWidth <= 1024);
  }


  // ──────────────────────────────────────────────────────────────────────────
  // Data Loading & Catalog
  // ──────────────────────────────────────────────────────────────────────────
  async _loadCatalog() {
    try {
      const resp = await fetch('data/catalog.json');
      const data = await resp.json();
      
      this.qalamCatalog = data.qalam_chapters || [];
      this.chaptersCatalog = data.chapters || [];
      this.mocksCatalog = data.mock_exams || [];

      // Update button text with counts
      if (this.dom.tabQalam) {
        this.dom.tabQalam.innerHTML = `<span>📖 Qalam (${this.qalamCatalog.length})</span>`;
      }
      if (this.dom.tabChapters) {
        this.dom.tabChapters.innerHTML = `<span>🧠 KDPsych (${this.chaptersCatalog.length})</span>`;
      }
      if (this.dom.tabMocks) {
        this.dom.tabMocks.innerHTML = `<span>🎯 Mocks (${this.mocksCatalog.length})</span>`;
      }

      // Restore last position & mode or load default
      const savedPos = this._loadJson(this.STORAGE_POSITION, null);
      const initialMode = (savedPos && savedPos.mode) ? savedPos.mode : 'qalam';
      this.switchMode(initialMode, false);

      if (window.innerWidth < 768) {
        this.toggleSidebar(false);
      }

      if (savedPos && savedPos.chapterIndex !== undefined && this.catalog[savedPos.chapterIndex]) {
        this.loadChapter(savedPos.chapterIndex, savedPos.questionIndex || 0);
      } else {
        this.loadChapter(0, 0);
      }
    } catch (err) {
      console.error('Failed to load catalog.json:', err);
      this.dom.currentChapterTitle.textContent = 'Error loading catalog. Make sure local server is running.';
    }
  }

  _renderCatalog() {
    if (this.currentMode === 'mocks') {
      let html = '<div class="subject-group" data-subject="Mock Exams"><div class="subject-title">OFFICIAL MRCPsych PAPER B MOCKS</div>';
      this.catalog.forEach((m, idx) => {
        const stats = this._getChapterStats(m.id, m.total_questions);
        const isActive = this.currentChapterMeta && this.currentChapterMeta.id === m.id;
        html += `
          <div class="chapter-item ${isActive ? 'active' : ''}" 
               data-idx="${idx}" 
               onclick="window.studyApp.loadChapter(${idx}, 0)">
            <span class="chapter-name">${idx + 1}. ${this._escape(m.name)}</span>
            <div class="mock-badges-wrap">
              <span class="mock-meta-pill">⏱️ ${m.time_limit_minutes}m</span>
              <span class="mock-meta-pill">Pass: ${m.pass_percentage}%</span>
              <span class="chapter-badge">${stats.answered}/${m.total_questions}</span>
            </div>
          </div>`;
      });
      html += '</div>';
      this.dom.chapterList.innerHTML = html;
      return;
    }

    // Group chapters by Subject / Book
    const grouped = {};
    this.catalog.forEach((ch, idx) => {
      const subj = ch.subject || 'General';
      if (this.currentSubjectFilter && this.currentSubjectFilter !== 'ALL' && subj !== this.currentSubjectFilter) {
        return;
      }
      if (!grouped[subj]) grouped[subj] = [];
      grouped[subj].push({ ...ch, originalIdx: idx });
    });

    let html = '';
    for (const [subject, chList] of Object.entries(grouped)) {
      html += `<div class="subject-group" data-subject="${this._escape(subject)}">
        <div class="subject-title">${this._escape(subject)} (${chList.length} Ch)</div>`;
      
      chList.forEach(ch => {
        const stats = this._getChapterStats(ch.id, ch.total_questions);
        const isActive = this.currentChapterMeta && this.currentChapterMeta.id === ch.id;
        html += `
          <div class="chapter-item ${isActive ? 'active' : ''}" 
               data-idx="${ch.originalIdx}" 
               onclick="window.studyApp.loadChapter(${ch.originalIdx}, 0)">
            <span class="chapter-name">${ch.index}. ${this._escape(ch.name)}</span>
            <span class="chapter-badge">${stats.answered}/${ch.total_questions}</span>
          </div>`;
      });
      html += `</div>`;
    }

    this.dom.chapterList.innerHTML = html;
  }

  _filterChapterList(query) {
    const q = query.toLowerCase().trim();
    const groups = this.dom.chapterList.querySelectorAll('.subject-group');
    groups.forEach(grp => {
      let anyMatch = false;
      const items = grp.querySelectorAll('.chapter-item');
      items.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (!q || text.includes(q)) {
          item.classList.remove('hidden');
          anyMatch = true;
        } else {
          item.classList.add('hidden');
        }
      });
      grp.classList.toggle('hidden', !anyMatch);
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Chapter & Question Loading
  // ──────────────────────────────────────────────────────────────────────────
  async loadChapter(chapterIdx, targetQuestionIdx = 0) {
    if (!this.catalog[chapterIdx]) return;
    this.currentChapterMeta = this.catalog[chapterIdx];

    // Highlight active chapter in sidebar
    this.dom.chapterList.querySelectorAll('.chapter-item').forEach(el => {
      el.classList.toggle('active', parseInt(el.dataset.idx, 10) === chapterIdx);
    });

    const isMock = !!(this.currentChapterMeta && (this.currentChapterMeta.mock_id || this.currentMode === 'mocks'));
    if (this.dom.resetChapterBtn) {
      const btnSpan = this.dom.resetChapterBtn.querySelector('span');
      if (btnSpan) btnSpan.textContent = isMock ? '↺ Reset Current Mock Exam' : '↺ Reset Current Chapter';
    }

    this.dom.currentSubject.textContent = this.currentChapterMeta.subject || (isMock ? 'Mock Exam' : 'Subject');
    this.dom.currentChapterTitle.textContent = this.currentChapterMeta.name;
    this.dom.questionStem.textContent = 'Loading questions...';
    this.dom.optionsContainer.innerHTML = '';
    this.dom.explanationPanel.classList.add('hidden');

    try {
      let chapterData = null;
      if (this.currentChapterMeta.isCustom) {
        chapterData = this.currentChapterMeta.data;
      } else {
        const resp = await fetch(this.currentChapterMeta.file);
        chapterData = await resp.json();
      }

      this.currentChapterData = chapterData;
      this.setFilter(this.currentFilter, targetQuestionIdx);

      // Auto-close sidebar on smaller screens
      if (window.innerWidth < 900) {
        this.toggleSidebar(false);
      }
    } catch (err) {
      console.error('Failed to load chapter file:', err);
      this.dom.questionStem.textContent = 'Failed to load chapter data. Please try again.';
    }
  }

  setFilter(filterName, desiredIndex = 0) {
    this.currentFilter = filterName;
    if (!this.currentChapterData) return;

    const allQ = this.currentChapterData.questions || [];
    const cid = this._getChapterId();
    const chAnswers = this.answers[cid] || {};
    const chFlags = new Set(this.flags[cid] || []);

    if (filterName === 'all') {
      this.activeQuestionsList = allQ;
    } else if (filterName === 'unanswered') {
      this.activeQuestionsList = allQ.filter(q => !chAnswers[q.question_id]);
    } else if (filterName === 'incorrect') {
      this.activeQuestionsList = allQ.filter(q => chAnswers[q.question_id] && !chAnswers[q.question_id].isCorrect);
    } else if (filterName === 'flagged') {
      this.activeQuestionsList = allQ.filter(q => chFlags.has(q.question_id));
    }

    if (this.activeQuestionsList.length === 0) {
      this._renderEmptyFilter();
      return;
    }

    // Clamp index
    this.currentQuestionIdx = Math.max(0, Math.min(desiredIndex, this.activeQuestionsList.length - 1));
    this._renderQuestion();
  }

  _renderEmptyFilter() {
    this.dom.questionIndexLabel.textContent = `0 of 0 questions`;
    this.dom.questionStem.innerHTML = `<div style="text-align: center; padding: 40px 20px;">
      <p style="font-size: 1.2rem; color: var(--text-muted); margin-bottom: 12px;">No questions match filter "${this.currentFilter.toUpperCase()}".</p>
      <button class="btn btn-secondary" onclick="window.studyApp.setFilter('all', 0)">View All Questions</button>
    </div>`;
    this.dom.optionsContainer.innerHTML = '';
    this.dom.explanationPanel.classList.add('hidden');
    this.dom.prevBtn.disabled = true;
    this.dom.nextBtn.disabled = true;
    this.dom.submitBtn.disabled = true;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Question Rendering
  // ──────────────────────────────────────────────────────────────────────────
  _getCurrentQuestion() {
    if (!this.activeQuestionsList || !this.activeQuestionsList.length) return null;
    return this.activeQuestionsList[this.currentQuestionIdx];
  }

  _renderQuestion() {
    const q = this._getCurrentQuestion();
    if (!q) return;

    const cid = this._getChapterId();
    const answeredState = this._getAnswer(q.question_id);
    const isFlagged = this._isFlagged(q.question_id);

    // Save position
    this._savePosition();

    // Reset scroll to top when opening an unanswered question
    if (!answeredState && this.dom.contentScrollable) {
      this.dom.contentScrollable.scrollTop = 0;
    }

    // Question Meta
    this.dom.questionIndexLabel.textContent = `Question ${this.currentQuestionIdx + 1} of ${this.activeQuestionsList.length}`;
    this.dom.questionDifficulty.textContent = (q.difficulty || 'Medium').toUpperCase();
    this.dom.questionType.textContent = (q.question_type || 'MCQ').toUpperCase();

    // Flag button state
    const isMobile = this._isMobile();
    this.dom.flagBtn.classList.toggle('flagged', isFlagged);
    if (isMobile) {
      this.dom.flagBtnText.textContent = isFlagged ? 'Flagged 🚩' : 'Flag';
    } else {
      this.dom.flagBtnText.textContent = isFlagged ? 'Flagged 🚩' : 'Flag for Review';
    }

    // Question Stem
    this.dom.questionStem.textContent = q.question_text || '';

    // Render Clinical Investigation Table if present
    if (this.dom.questionTableContainer) {
      if (q.table && typeof q.table === 'object' && Object.keys(q.table).length > 0) {
        let tableHtml = '<table class="clinical-table">';
        const isClinical = Object.values(q.table).some(v => v && typeof v === 'object' && ('value' in v || 'reference_range' in v));
        if (isClinical) {
          tableHtml += '<thead><tr><th>Investigation / Test</th><th>Result</th><th>Reference Range</th></tr></thead><tbody>';
          for (const [k, v] of Object.entries(q.table)) {
            const val = (v && typeof v === 'object') ? (v.value || '') : (v || '');
            const ref = (v && typeof v === 'object') ? (v.reference_range || '') : '';
            tableHtml += `<tr><td><strong>${this._escape(k)}</strong></td><td>${this._escape(String(val))}</td><td>${this._escape(String(ref))}</td></tr>`;
          }
        } else {
          tableHtml += '<thead><tr><th>Parameter</th><th>Value</th></tr></thead><tbody>';
          for (const [k, v] of Object.entries(q.table)) {
            const val = typeof v === 'object' ? JSON.stringify(v) : String(v);
            tableHtml += `<tr><td><strong>${this._escape(k)}</strong></td><td>${this._escape(val)}</td></tr>`;
          }
        }
        tableHtml += '</tbody></table>';
        this.dom.questionTableContainer.innerHTML = tableHtml;
        this.dom.questionTableContainer.classList.remove('hidden');
      } else {
        this.dom.questionTableContainer.innerHTML = '';
        this.dom.questionTableContainer.classList.add('hidden');
      }
    }

    // Question Image
    if (q.image_url) {
      this.dom.questionImage.src = q.image_url;
      this.dom.questionImageContainer.classList.remove('hidden');
    } else {
      this.dom.questionImageContainer.classList.add('hidden');
    }

    // Render Options
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    let optionsHtml = '';
    const hasAnswered = !!answeredState;

    (q.options || []).forEach((opt, idx) => {
      const letter = opt.letter || letters[idx] || (idx + 1);
      const optId = opt.option_id || opt.id;
      const isSelected = hasAnswered 
        ? (String(answeredState.selectedOptionId) === String(optId)) 
        : (String(this.selectedOptionId) === String(optId));
      
      let cardClass = 'option-card';
      if (hasAnswered) {
        cardClass += ' locked submitted';
        if (opt.is_correct) cardClass += ' correct';
        else if (isSelected) cardClass += ' incorrect';
      } else if (isSelected) {
        cardClass += ' selected';
      }

      optionsHtml += `
        <div class="${cardClass}" 
             data-opt-id="${optId}" 
             data-idx="${idx}"
             onclick="window.studyApp.selectOption('${optId}')">
          <div class="option-indicator">${letter}</div>
          <div class="option-text">${this._escape(opt.text)}</div>
          <div class="option-hotkey">[${idx + 1}]</div>
        </div>`;
    });

    this.dom.optionsContainer.innerHTML = optionsHtml;

    // Render Explanation if answered
    if (hasAnswered) {
      this._renderExplanation(answeredState.isCorrect, q);
      const label = isMobile ? 'Next Question →' : 'Next Question → [Enter]';
      if (this.dom.submitBtnText) this.dom.submitBtnText.textContent = label;
      else this.dom.submitBtn.textContent = label;
      this.dom.submitBtn.className = 'btn btn-secondary footer-submit-btn';
    } else {
      this.dom.explanationPanel.classList.add('hidden');
      const label = isMobile ? 'Tap an Option to Answer' : 'Submit Answer [Enter]';
      if (this.dom.submitBtnText) this.dom.submitBtnText.textContent = label;
      else this.dom.submitBtn.textContent = label;
      this.dom.submitBtn.className = 'btn btn-primary footer-submit-btn';
    }

    // Prev / Next button state
    this.dom.prevBtn.disabled = this.currentQuestionIdx <= 0;
    this.dom.nextBtn.disabled = this.currentQuestionIdx >= this.activeQuestionsList.length - 1;
    this.dom.submitBtn.disabled = false;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Option Selection & Submissions
  // ──────────────────────────────────────────────────────────────────────────
  _selectOptionByIndex(idx) {
    const q = this._getCurrentQuestion();
    if (!q || !q.options || this._getAnswer(q.question_id)) return;
    if (idx >= 0 && idx < q.options.length) {
      const optId = q.options[idx].option_id || q.options[idx].id;
      this.selectOption(optId);
    }
  }

  selectOption(optId) {
    const q = this._getCurrentQuestion();
    if (!q || this._getAnswer(q.question_id)) return; // Locked if already submitted

    this.selectedOptionId = optId;

    // Haptic tick for phone
    if (navigator.vibrate) {
      try { navigator.vibrate(12); } catch (e) {}
    }

    // Re-render selection highlight
    this.dom.optionsContainer.querySelectorAll('.option-card').forEach(el => {
      el.classList.toggle('selected', String(el.dataset.optId) === String(optId));
    });

    // In phone version: immediately submit upon tapping an answer!
    // In web version: wait for manual Submit click or Enter key.
    if (this._isMobile()) {
      this.submitAnswer();
    }
  }

  submitAnswer() {
    const q = this._getCurrentQuestion();
    if (!q) return;

    const qid = q.question_id;
    const existing = this._getAnswer(qid);

    // If already answered, advance to next question
    if (existing) {
      this.nextQuestion();
      return;
    }

    if (!this.selectedOptionId) {
      // Flash options with slight shake/notice
      this.dom.optionsContainer.style.transform = 'translateX(-4px)';
      setTimeout(() => this.dom.optionsContainer.style.transform = 'translateX(4px)', 80);
      setTimeout(() => this.dom.optionsContainer.style.transform = 'none', 160);
      return;
    }

    const cid = this._getChapterId();
    const correctOpt = (q.options || []).find(o => o.is_correct);
    const correctId = correctOpt ? (correctOpt.option_id || correctOpt.id) : (q.correct_answer ? q.correct_answer.option_id : null);
    const isCorrect = (String(this.selectedOptionId) === String(correctId));

    // Persist answer
    if (!this.answers[cid]) this.answers[cid] = {};
    this.answers[cid][qid] = {
      selectedOptionId: this.selectedOptionId,
      isCorrect: isCorrect,
      timestamp: Date.now()
    };
    this._saveJson(this.STORAGE_ANSWERS, this.answers);

    // Haptic vibration feedback for Samsung
    if (navigator.vibrate) {
      try { navigator.vibrate(isCorrect ? [25, 35, 25] : 70); } catch (e) {}
    }

    // Update UI immediately
    this.selectedOptionId = null;
    this._renderQuestion();
    this._updateCatalogItemProgress(cid);
    this._updateGlobalProgress();

    // Auto smooth scroll to explanation
    setTimeout(() => {
      if (this.dom.explanationPanel && !this.dom.explanationPanel.classList.contains('hidden')) {
        const scrollArea = this.dom.contentScrollable || document.querySelector('.content-scrollable');
        if (scrollArea) {
          const panelTop = this.dom.explanationPanel.offsetTop;
          scrollArea.scrollTo({
            top: Math.max(0, panelTop - 20),
            behavior: 'smooth'
          });
        }
      }
    }, 120);
  }


  _renderExplanation(isCorrect, q) {
    this.dom.explanationStatusHeader.className = `explanation-header ${isCorrect ? 'correct' : 'incorrect'}`;
    this.dom.explanationStatusIcon.textContent = isCorrect ? '✓' : '✗';
    this.dom.explanationStatusText.textContent = isCorrect ? 'Correct Answer!' : 'Incorrect';

    this.dom.explanationText.textContent = q.explanation || 'No explanation provided.';

    if (q.explanation_image_url) {
      this.dom.explanationImage.src = q.explanation_image_url;
      this.dom.explanationImageContainer.classList.remove('hidden');
    } else {
      this.dom.explanationImageContainer.classList.add('hidden');
    }

    this.dom.explanationPanel.classList.remove('hidden');

    // Render Math with KaTeX if formula delimiters exist
    if (window.renderMathInElement) {
      window.renderMathInElement(this.dom.explanationText, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ]
      });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────────────────────────────────
  prevQuestion() {
    if (this.currentQuestionIdx > 0) {
      this.selectedOptionId = null;
      this.currentQuestionIdx--;
      this._renderQuestion();
    }
  }

  nextQuestion() {
    if (this.currentQuestionIdx < this.activeQuestionsList.length - 1) {
      this.selectedOptionId = null;
      this.currentQuestionIdx++;
      this._renderQuestion();
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Flagging
  // ──────────────────────────────────────────────────────────────────────────
  toggleFlag() {
    const q = this._getCurrentQuestion();
    if (!q || !this.currentChapterData) return;

    const cid = this._getChapterId();
    const qid = q.question_id;

    if (!this.flags[cid]) this.flags[cid] = [];
    const idx = this.flags[cid].indexOf(qid);

    if (idx >= 0) {
      this.flags[cid].splice(idx, 1);
    } else {
      this.flags[cid].push(qid);
    }

    this._saveJson(this.STORAGE_FLAGS, this.flags);

    const isFlagged = idx < 0;
    const isMobile = window.innerWidth < 768;
    this.dom.flagBtn.classList.toggle('flagged', isFlagged);
    if (isMobile) {
      this.dom.flagBtnText.textContent = isFlagged ? 'Flagged 🚩' : 'Flag';
    } else {
      this.dom.flagBtnText.textContent = isFlagged ? 'Flagged 🚩' : 'Flag for Review';
    }

    if (navigator.vibrate) {
      try { navigator.vibrate(20); } catch (e) {}
    }
  }


  _isFlagged(qid) {
    if (!this.currentChapterData) return false;
    const cid = this._getChapterId();
    return !!(this.flags[cid] && this.flags[cid].includes(qid));
  }

  _getAnswer(qid) {
    if (!this.currentChapterData) return null;
    const cid = this._getChapterId();
    return this.answers[cid] ? this.answers[cid][qid] : null;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Progress & Stats
  // ──────────────────────────────────────────────────────────────────────────
  _getChapterStats(cid, total) {
    const chAns = this.answers[cid] || {};
    const answered = Object.keys(chAns).length;
    return {
      answered: Math.min(answered, total),
      total: total,
      pct: total > 0 ? Math.round((answered / total) * 100) : 0
    };
  }

  _updateCatalogItemProgress(cid) {
    const item = this.dom.chapterList.querySelector(`.chapter-item[data-idx="${this.catalog.findIndex(c => c.id === cid)}"]`);
    if (item && this.currentChapterMeta) {
      const stats = this._getChapterStats(cid, this.currentChapterMeta.total_questions);
      const badge = item.querySelector('.chapter-badge');
      if (badge) badge.textContent = `${stats.answered}/${stats.total}`;
    }
  }

  _updateGlobalProgress() {
    let totalQ = 0;
    let totalAns = 0;

    this.catalog.forEach(ch => {
      totalQ += ch.total_questions || 0;
      const chAns = this.answers[ch.id] || {};
      totalAns += Object.keys(chAns).length;
    });

    const pct = totalQ > 0 ? Math.round((totalAns / totalQ) * 100) : 0;
    this.dom.globalProgressPct.textContent = `${pct}%`;
    this.dom.globalProgressBar.style.width = `${pct}%`;
    this.dom.globalAnsweredCount.textContent = totalAns.toLocaleString();
    this.dom.globalTotalCount.textContent = totalQ.toLocaleString();
  }

  resetCurrentChapter() {
    if (!this.currentChapterData) return;
    const cid = this._getChapterId();
    const isMock = this.currentMode === 'mocks' || !!this.currentChapterData.mock_id;
    const cname = this.currentChapterData.mock_name || this.currentChapterData.chapter_name || (this.currentChapterMeta ? this.currentChapterMeta.name : 'this item');
    const label = isMock ? 'Mock Exam' : 'Chapter';

    if (!confirm(`Reset all answers for ${label} "${cname}"? Progress will be cleared.`)) return;

    if (this.answers[cid]) {
      delete this.answers[cid];
      this._saveJson(this.STORAGE_ANSWERS, this.answers);
    }
    if (this.flags[cid]) {
      delete this.flags[cid];
      this._saveJson(this.STORAGE_FLAGS, this.flags);
    }

    this.selectedOptionId = null;
    this.currentQuestionIdx = 0;
    this._renderQuestion();
    this._updateCatalogItemProgress(cid);
    this._updateGlobalProgress();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Import Modal & Dynamic JSON Importer
  // ──────────────────────────────────────────────────────────────────────────
  _openImportModal(show) {
    this.dom.importModal.classList.toggle('hidden', !show);
    this.dom.importStatus.classList.add('hidden');
    this.dom.fileInput.value = '';
  }

  async _handleFileImport(file) {
    if (!file) return;
    const status = this.dom.importStatus;
    status.className = 'import-status';
    status.classList.remove('hidden');
    status.textContent = `Reading ${file.name}...`;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      let questions = [];
      let chapterName = file.name.replace(/\.json$/i, '');
      let subjectName = 'Imported';
      let chapterId = Date.now();

      if (data.questions && Array.isArray(data.questions)) {
        questions = data.questions;
        chapterName = data.chapter_name || chapterName;
        subjectName = data.subject_name || subjectName;
        chapterId = data.chapter_id || chapterId;
      } else if (Array.isArray(data)) {
        questions = data;
      } else {
        throw new Error('Unrecognized JSON structure: Missing "questions" array.');
      }

      if (questions.length === 0) {
        throw new Error('No questions found in JSON file.');
      }

      const newChapter = {
        id: chapterId,
        index: this.catalog.length + 1,
        name: chapterName,
        subject: subjectName,
        total_questions: questions.length,
        isCustom: true,
        data: {
          chapter_id: chapterId,
          chapter_name: chapterName,
          subject_name: subjectName,
          total_questions: questions.length,
          questions: questions
        }
      };

      this.customChapters.push(newChapter);
      this._saveJson(this.STORAGE_CUSTOM_CHAPTERS, this.customChapters);
      this.catalog.push(newChapter);

      this._renderCatalog();
      this._updateGlobalProgress();

      status.className = 'import-status success';
      status.textContent = `✓ Successfully imported "${chapterName}" (${questions.length} questions)!`;

      setTimeout(() => {
        this._openImportModal(false);
        this.loadChapter(this.catalog.length - 1, 0);
      }, 1200);

    } catch (err) {
      status.className = 'import-status error';
      status.textContent = `Error importing file: ${err.message}`;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Storage Helpers
  // ──────────────────────────────────────────────────────────────────────────
  _savePosition() {
    if (!this.currentChapterMeta) return;
    const pos = {
      mode: this.currentMode,
      chapterIndex: this.catalog.findIndex(c => c.id === this.currentChapterMeta.id),
      questionIndex: this.currentQuestionIdx
    };
    this._saveJson(this.STORAGE_POSITION, pos);
  }

  _loadJson(key, defaultVal) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  _saveJson(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      if (key === this.STORAGE_ANSWERS || key === this.STORAGE_FLAGS) {
        this._pushSync();
      }
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GitHub Cloud Sync & Backup Modal
  // ──────────────────────────────────────────────────────────────────────────
  _openSyncModal(show) {
    if (!this.dom.syncModal) return;
    if (show) {
      if (this.dom.githubSyncTokenInput) {
        this.dom.githubSyncTokenInput.value = this.githubToken || '';
      }
      if (this.dom.syncModalStatus) {
        if (this.githubToken) {
          this.dom.syncModalStatus.className = 'import-status success';
          this.dom.syncModalStatus.textContent = '🟢 Connected: Syncing 24/7 with your private GitHub Gist.';
          this.dom.syncModalStatus.classList.remove('hidden');
        } else {
          this.dom.syncModalStatus.className = 'import-status info';
          this.dom.syncModalStatus.textContent = 'Paste your GitHub token to enable cross-device sync between your phone and Mac.';
          this.dom.syncModalStatus.classList.remove('hidden');
        }
      }
      this.dom.syncModal.classList.remove('hidden');
    } else {
      this.dom.syncModal.classList.add('hidden');
    }
  }

  async _handleSaveSyncToken() {
    const token = (this.dom.githubSyncTokenInput ? this.dom.githubSyncTokenInput.value : '').trim();
    const statusEl = this.dom.syncModalStatus;

    if (!token) {
      if (this.githubToken) {
        this.githubToken = '';
        localStorage.removeItem(this.STORAGE_GITHUB_TOKEN);
        this._setSyncStatus('offline');
        if (statusEl) {
          statusEl.className = 'import-status info';
          statusEl.textContent = 'Disconnected from GitHub Cloud Sync.';
          statusEl.classList.remove('hidden');
        }
        return;
      }
      if (statusEl) {
        statusEl.className = 'import-status error';
        statusEl.textContent = 'Please enter a valid GitHub token.';
        statusEl.classList.remove('hidden');
      }
      return;
    }

    if (statusEl) {
      statusEl.className = 'import-status info';
      statusEl.textContent = 'Connecting to GitHub...';
      statusEl.classList.remove('hidden');
    }

    try {
      const resp = await fetch(`https://api.github.com/gists/${this.GITHUB_GIST_ID}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json'
        }
      });

      if (!resp.ok) {
        throw new Error(`GitHub returned HTTP ${resp.status}. Please make sure the token has 'gist' permission.`);
      }

      const gist = await resp.json();
      this.githubToken = token;
      localStorage.setItem(this.STORAGE_GITHUB_TOKEN, token);

      // Merge remote progress
      const file = gist.files && gist.files['progress.json'];
      if (file && file.content) {
        try {
          const remoteProgress = JSON.parse(file.content);
          this._mergeProgressData(remoteProgress);
        } catch (err) {
          console.warn('Error parsing remote progress:', err);
        }
      }

      // Immediately push local progress to cloud so both sides are unified
      await this._pushGitHubSyncImmediate();

      this._setSyncStatus('online');
      if (statusEl) {
        statusEl.className = 'import-status success';
        statusEl.textContent = '✓ Connected successfully! Your progress is now synced across all devices.';
      }

      setTimeout(() => {
        this._openSyncModal(false);
      }, 1200);

    } catch (err) {
      if (statusEl) {
        statusEl.className = 'import-status error';
        statusEl.textContent = `Connection failed: ${err.message}`;
        statusEl.classList.remove('hidden');
      }
    }
  }

  _exportBackup() {
    const data = {
      answers: this.answers,
      flags: this.flags,
      exported_at: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyapp_progress_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  _mergeProgressData(remoteProgress) {
    if (!remoteProgress) return false;
    let merged = false;
    if (remoteProgress.answers) {
      for (const cid in remoteProgress.answers) {
        if (!this.answers[cid]) this.answers[cid] = {};
        for (const qid in remoteProgress.answers[cid]) {
          const rAns = remoteProgress.answers[cid][qid];
          const lAns = this.answers[cid][qid];
          if (!lAns || (rAns.timestamp && (!lAns.timestamp || rAns.timestamp > lAns.timestamp))) {
            this.answers[cid][qid] = rAns;
            merged = true;
          }
        }
      }
    }
    if (remoteProgress.flags) {
      for (const cid in remoteProgress.flags) {
        const rFlags = remoteProgress.flags[cid] || [];
        const lFlags = new Set(this.flags[cid] || []);
        const countBefore = lFlags.size;
        rFlags.forEach(qid => lFlags.add(qid));
        if (lFlags.size !== countBefore) {
          merged = true;
        }
        this.flags[cid] = Array.from(lFlags);
      }
    }
    if (merged) {
      localStorage.setItem(this.STORAGE_ANSWERS, JSON.stringify(this.answers));
      localStorage.setItem(this.STORAGE_FLAGS, JSON.stringify(this.flags));
      this._updateGlobalProgress();
      if (this.currentChapterData) {
        this._renderQuestion();
      }
    }
    return merged;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Cross-Device Sync Engine
  // ──────────────────────────────────────────────────────────────────────────
  async _initSync() {
    this._syncTimer = null;

    if (this.githubToken) {
      await this._pullGitHubSync(true);
      // Periodic background pull every 20 seconds
      setInterval(() => this._pullGitHubSync(false), 20000);
      return;
    }

    // Fallback: Check if local Python server is running (e.g. localhost)
    try {
      const resp = await fetch('/api/progress');
      if (resp.ok) {
        const serverProgress = await resp.json();
        this._mergeProgressData(serverProgress);
        this._setSyncStatus('online');
        setInterval(() => this._silentPullSync(), 20000);
        return;
      }
    } catch (e) {
      // Local server not running
    }

    this._setSyncStatus('offline');
  }

  async _pullGitHubSync(isInitial = false) {
    if (!this.githubToken) return;
    try {
      const resp = await fetch(`https://api.github.com/gists/${this.GITHUB_GIST_ID}`, {
        headers: {
          'Authorization': `Bearer ${this.githubToken.trim()}`,
          'Accept': 'application/vnd.github+json'
        }
      });
      if (resp.ok) {
        const gist = await resp.json();
        const file = gist.files && gist.files['progress.json'];
        if (file && file.content) {
          try {
            const remoteProgress = JSON.parse(file.content);
            this._mergeProgressData(remoteProgress);
            if (isInitial && Object.keys(this.answers).length > 0) {
              this._pushGitHubSyncImmediate();
            }
          } catch (err) {}
        }
        this._setSyncStatus('online');
      } else if (resp.status === 401 || resp.status === 403) {
        this._setSyncStatus('offline');
      }
    } catch (e) {
      this._setSyncStatus('offline');
    }
  }

  _pushSync() {
    if (this.githubToken) {
      this._pushGitHubSync();
      return;
    }
    this._pushLocalServerSync();
  }

  _pushGitHubSync() {
    if (!this.githubToken) return;
    this._setSyncStatus('syncing');
    clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(async () => {
      const success = await this._pushGitHubSyncImmediate();
      this._setSyncStatus(success ? 'online' : 'offline');
    }, 500);
  }

  async _pushGitHubSyncImmediate() {
    if (!this.githubToken) return false;
    try {
      const payload = {
        answers: this.answers,
        flags: this.flags,
        last_updated: Date.now()
      };
      const resp = await fetch(`https://api.github.com/gists/${this.GITHUB_GIST_ID}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.githubToken.trim()}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: 'KDPsych Study Progress',
          files: {
            'progress.json': {
              content: JSON.stringify(payload)
            }
          }
        })
      });
      return resp.ok;
    } catch (e) {
      return false;
    }
  }

  _pushLocalServerSync() {
    this._setSyncStatus('syncing');
    clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(async () => {
      try {
        const payload = {
          answers: this.answers,
          flags: this.flags,
          last_updated: Date.now()
        };
        const resp = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        this._setSyncStatus(resp.ok ? 'online' : 'offline');
      } catch (e) {
        this._setSyncStatus('offline');
      }
    }, 400);
  }

  async _silentPullSync() {
    try {
      const resp = await fetch('/api/progress');
      if (resp.ok) {
        const serverProgress = await resp.json();
        this._mergeProgressData(serverProgress);
        this._setSyncStatus('online');
      }
    } catch (e) {
      this._setSyncStatus('offline');
    }
  }

  _setSyncStatus(status) {
    if (!this.dom.syncIndicator) return;
    if (status === 'online') {
      this.dom.syncIndicator.className = 'sync-badge';
      this.dom.syncText.textContent = this.githubToken ? 'GitHub Synced' : 'Live Sync';
    } else if (status === 'syncing') {
      this.dom.syncIndicator.className = 'sync-badge syncing';
      this.dom.syncText.textContent = 'Syncing...';
    } else {
      this.dom.syncIndicator.className = 'sync-badge offline';
      this.dom.syncText.textContent = this.githubToken ? 'Sync Offline' : 'Offline Mode';
    }
  }

  _escape(str) {
    return String(str || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
}

// Dynamically sync --app-height with the exact visible window on mobile browsers
function updateViewportHeight() {
  const vh = window.innerHeight;
  document.documentElement.style.setProperty('--app-height', `${vh}px`);
}
window.addEventListener('resize', updateViewportHeight);
window.addEventListener('orientationchange', updateViewportHeight);
updateViewportHeight();

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  updateViewportHeight();
  window.studyApp = new StudyApp();
});


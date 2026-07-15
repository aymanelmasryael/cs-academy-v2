/**
 * AEL CS Academy V2 Engine
 * Pure Vanilla JS (ES6) with Client-Side DOM Virtualization / Pagination
 */

class AcademyEngine {
    constructor(data) {
        this.allData = data || [];
        this.filteredData = this.allData;
        this.bookmarks = JSON.parse(localStorage.getItem('aelCSBookmarksV2')) || [];
        
        this.state = {
            page: 1,
            limit: 50,
            searchQuery: '',
            difficulty: 'All',
            type: 'All',
            showOnlyBookmarks: false
        };

        // Cache DOM elements
        this.dom = {
            contentArea: document.getElementById('content-area'),
            searchInput: document.getElementById('search-input'),
            diffFilter: document.getElementById('filter-difficulty'),
            typeFilter: document.getElementById('filter-type'),
            resetBtn: document.getElementById('reset-filters'),
            bookmarkBtn: document.getElementById('show-bookmarks-btn'),
            bookmarkCount: document.getElementById('bookmark-count'),
            statTotal: document.getElementById('stat-total'),
            currentPageSpan: document.getElementById('current-page'),
            pageInfo: document.getElementById('page-info'),
            viewTitle: document.getElementById('current-view-title'),
            btnPrev: [document.getElementById('prev-page'), document.getElementById('prev-page-footer')],
            btnNext: [document.getElementById('next-page'), document.getElementById('next-page-footer')]
        };

        this.debounceTimer = null;
        this.init();
    }

    init() {
        this.updateBookmarkCount();
        this.bindEvents();
        this.applyFilters();
    }

    bindEvents() {
        this.dom.searchInput.addEventListener('input', (e) => {
            this.state.searchQuery = e.target.value.toLowerCase();
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => this.applyFilters(), 150);
        });

        this.dom.diffFilter.addEventListener('change', (e) => {
            this.state.difficulty = e.target.value;
            this.applyFilters();
        });

        this.dom.typeFilter.addEventListener('change', (e) => {
            this.state.type = e.target.value;
            this.applyFilters();
        });

        this.dom.resetBtn.addEventListener('click', () => {
            this.dom.searchInput.value = '';
            this.dom.diffFilter.value = 'All';
            this.dom.typeFilter.value = 'All';
            this.state = { ...this.state, searchQuery: '', difficulty: 'All', type: 'All', showOnlyBookmarks: false, page: 1 };
            this.dom.viewTitle.innerText = "Page";
            this.applyFilters();
        });

        this.dom.bookmarkBtn.addEventListener('click', () => {
            this.state.showOnlyBookmarks = !this.state.showOnlyBookmarks;
            this.dom.viewTitle.innerText = this.state.showOnlyBookmarks ? "Bookmarks" : "Page";
            this.applyFilters();
        });

        this.dom.btnNext.forEach(btn => btn.addEventListener('click', () => this.changePage(1)));
        this.dom.btnPrev.forEach(btn => btn.addEventListener('click', () => this.changePage(-1)));

        // Global click delegation for dynamically injected HTML5 semantic cards
        this.dom.contentArea.addEventListener('click', (e) => {
            const cardHeader = e.target.closest('.qa-header');
            if (cardHeader && !e.target.closest('.action-btn')) {
                const card = cardHeader.parentElement;
                card.classList.toggle('expanded');
                
                // ARIA accessibility updates
                const expanded = card.classList.contains('expanded');
                cardHeader.setAttribute('aria-expanded', expanded);
            }

            const bookmarkBtn = e.target.closest('.bookmark-toggle');
            if (bookmarkBtn) {
                const id = bookmarkBtn.dataset.id;
                this.toggleBookmark(id, bookmarkBtn);
            }
        });
    }

    escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.innerText = str;
        return div.innerHTML;
    }

    updateBookmarkCount() {
        this.dom.bookmarkCount.innerText = this.bookmarks.length;
        localStorage.setItem('aelCSBookmarksV2', JSON.stringify(this.bookmarks));
    }

    toggleBookmark(id, btnElement) {
        const idx = this.bookmarks.indexOf(id);
        if (idx > -1) {
            this.bookmarks.splice(idx, 1);
            btnElement.classList.remove('active-bookmark');
        } else {
            this.bookmarks.push(id);
            btnElement.classList.add('active-bookmark');
        }
        
        this.updateBookmarkCount();
        if (this.state.showOnlyBookmarks) this.applyFilters();
    }

    applyFilters() {
        this.state.page = 1; // Reset to page 1 on new filter
        
        // Ultra-fast array filter (O(n) on 10,000 items is ~2ms in modern JS)
        this.filteredData = this.allData.filter(q => {
            const matchQ = q.question.toLowerCase().includes(this.state.searchQuery) || q.detailedAnswer.toLowerCase().includes(this.state.searchQuery);
            const matchD = this.state.difficulty === 'All' || q.difficulty === this.state.difficulty;
            const matchT = this.state.type === 'All' || q.type === this.state.type;
            const matchB = this.state.showOnlyBookmarks ? this.bookmarks.includes(q.id) : true;
            return matchQ && matchD && matchT && matchB;
        });

        this.dom.statTotal.innerText = this.filteredData.length.toLocaleString();
        this.renderDOM();
    }

    changePage(direction) {
        const totalPages = Math.ceil(this.filteredData.length / this.state.limit);
        if (direction === 1 && this.state.page < totalPages) {
            this.state.page++;
            this.renderDOM();
            window.scrollTo(0, 0);
        } else if (direction === -1 && this.state.page > 1) {
            this.state.page--;
            this.renderDOM();
            window.scrollTo(0, 0);
        }
    }

    renderDOM() {
        this.dom.contentArea.innerHTML = '';
        
        if (this.filteredData.length === 0) {
            this.dom.contentArea.innerHTML = '<p style="color:var(--text-dim); text-align:center;">No scenarios found matching your semantic criteria.</p>';
            this.updatePaginationUI();
            return;
        }

        const startIndex = (this.state.page - 1) * this.state.limit;
        const endIndex = startIndex + this.state.limit;
        const itemsToRender = this.filteredData.slice(startIndex, endIndex);

        // DocumentFragment for performance
        const fragment = document.createDocumentFragment();

        itemsToRender.forEach(item => {
            const isBookmarked = this.bookmarks.includes(item.id);
            
            // HTML5 Semantic Article for each Q&A pair
            const article = document.createElement('article');
            article.className = 'qa-card';
            article.id = item.id;
            
            article.innerHTML = `
                <header class="qa-header" tabindex="0" role="button" aria-expanded="false">
                    <div class="qa-title-wrapper">
                        <h3 class="qa-question">\${this.escapeHTML(item.question)}</h3>
                        <div class="qa-meta-tags">
                            <mark class="meta-tag meta-diff">\${item.difficulty}</mark>
                            <mark class="meta-tag meta-type">\${item.type}</mark>
                            <mark class="meta-tag meta-time">⏱ \${item.estimatedReadingTime}</mark>
                            <mark class="meta-tag" style="background:rgba(255,255,255,0.1)">ID: \${item.id}</mark>
                        </div>
                    </div>
                    <div class="qa-actions">
                        <button class="action-btn bookmark-toggle \${isBookmarked ? 'active-bookmark' : ''}" data-id="\${item.id}" aria-label="Bookmark this scenario">🔖</button>
                        <button class="action-btn" aria-label="Expand Scenario">🔽</button>
                    </div>
                </header>
                
                <section class="qa-body">
                    <div class="qa-section s-answer">
                        <h4>✅ Detailed Answer</h4>
                        <p>\${this.escapeHTML(item.detailedAnswer)}</p>
                    </div>
                    
                    <div class="qa-section-grid">
                        <div class="qa-section s-correct">
                            <h4>🎯 Why Correct</h4>
                            <p>\${this.escapeHTML(item.whyCorrect)}</p>
                        </div>
                        <div class="qa-section s-incorrect">
                            <h4>❌ Why Incorrect</h4>
                            <p>\${this.escapeHTML(item.whyIncorrect)}</p>
                        </div>
                    </div>

                    <div class="qa-section s-example">
                        <h4>🌍 Real-World Implementation</h4>
                        <pre class="code-box"><code>\${this.escapeHTML(item.realWorldExample)}</code></pre>
                    </div>

                    <div class="qa-section-grid">
                        <div class="qa-section s-mistakes">
                            <h4>⚠️ Common Pitfalls</h4>
                            <p>\${this.escapeHTML(item.commonMistakes)}</p>
                        </div>
                        <div class="qa-section s-best">
                            <h4>⭐ Best Practices</h4>
                            <p>\${this.escapeHTML(item.bestPractices)}</p>
                        </div>
                    </div>
                    
                    <div class="qa-section s-rels">
                        <h4>🔗 Curriculum Relationships</h4>
                        <aside class="rel-box">
                            <strong>Outcome:</strong> \${this.escapeHTML(item.relationships.learningOutcome)}<br>
                            <strong>Exercise:</strong> \${this.escapeHTML(item.relationships.exercise)}<br>
                            <strong>Challenge:</strong> \${this.escapeHTML(item.relationships.challenge)}<br>
                            <strong>Interview:</strong> \${this.escapeHTML(item.relationships.interview)}
                        </aside>
                    </div>
                </section>
            `;
            fragment.appendChild(article);
        });

        this.dom.contentArea.appendChild(fragment);
        this.updatePaginationUI();
    }

    updatePaginationUI() {
        const totalItems = this.filteredData.length;
        const totalPages = Math.ceil(totalItems / this.state.limit) || 1;
        
        this.dom.currentPageSpan.innerText = this.state.page;
        this.dom.pageInfo.innerText = `Page \${this.state.page} of \${totalPages}`;
        
        const canPrev = this.state.page > 1;
        const canNext = this.state.page < totalPages;
        
        this.dom.btnPrev.forEach(btn => btn.disabled = !canPrev);
        this.dom.btnNext.forEach(btn => btn.disabled = !canNext);
    }
}

// Bootstrap Engine once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // window.academyData is loaded synchronously from data.js
    if (window.academyData) {
        window.academyApp = new AcademyEngine(window.academyData);
    } else {
        document.getElementById('content-area').innerHTML = '<h3 style="color:var(--red);">Error: data.js not found or corrupted.</h3>';
    }
});

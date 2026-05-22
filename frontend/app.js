const API_PREFIX = window.location.protocol === 'file:'
  ? 'http://localhost:8000/api/v1'
  : '/api/v1';

const AUTH_PREFIX = window.location.protocol === 'file:'
  ? 'http://localhost:8000/api/auth'
  : '/api/auth';

const CLIENT_ID_KEY = 'promptClientId';

const state = {
  masterSchema: null,
  currentNiche: null,
  selection: {},
  history: [],
  blogs: {
    items: [],
    page: 1,
    pageSize: 6,
    total: 0,
    pages: 1,
    search: '',
    current: null,
    editingId: null,
    adminToken: window.localStorage.getItem('blogAdminToken') || '',
    source: 'local',
    wordpressAdminUrl: '',
  },
};

const el = {
  appShell: document.querySelector('.app-shell'),
  blogView: document.getElementById('blog-view'),
  contactView: document.getElementById('contact-view'),
  nicheList: document.getElementById('niche-list'),
  schemaArea: document.getElementById('schema-area'),
  nicheTitle: document.getElementById('niche-title'),
  context: document.getElementById('context'),
  output: document.getElementById('output'),
  resultMeta: document.getElementById('result-meta'),
  schemaStatus: document.getElementById('schema-status'),
  selectionCount: document.getElementById('selection-count'),
  historyList: document.getElementById('history-list'),
  toast: document.getElementById('toast'),
  optionDialog: document.getElementById('option-dialog'),
  optionForm: document.getElementById('option-form'),
  optionField: document.getElementById('option-field'),
  optionValue: document.getElementById('option-value'),
  nicheDialog: document.getElementById('niche-dialog'),
  nicheForm: document.getElementById('niche-form'),
  nicheLabel: document.getElementById('niche-label'),
  nicheDescription: document.getElementById('niche-description'),
  blogPageTitle: document.getElementById('blog-page-title'),
  blogListView: document.getElementById('blog-list-view'),
  blogDetailView: document.getElementById('blog-detail-view'),
  blogAdminView: document.getElementById('blog-admin-view'),
  blogList: document.getElementById('blog-list'),
  blogSearch: document.getElementById('blog-search'),
  blogAdminOpen: document.getElementById('blog-admin-open'),
  blogPrev: document.getElementById('blog-prev'),
  blogNext: document.getElementById('blog-next'),
  blogPageMeta: document.getElementById('blog-page-meta'),
  blogDetail: document.getElementById('blog-detail'),
  blogDetailEdit: document.getElementById('blog-detail-edit'),
  blogLoginForm: document.getElementById('blog-login-form'),
  blogAdminUsername: document.getElementById('blog-admin-username'),
  blogAdminPassword: document.getElementById('blog-admin-password'),
  blogForm: document.getElementById('blog-form'),
  blogFormTitle: document.getElementById('blog-form-title'),
  blogTitle: document.getElementById('blog-title'),
  blogSummary: document.getElementById('blog-summary'),
  blogImageUrl: document.getElementById('blog-image-url'),
  blogAuthor: document.getElementById('blog-author'),
  blogContent: document.getElementById('blog-content'),
  blogPublished: document.getElementById('blog-published'),
  blogDelete: document.getElementById('blog-delete'),
  blogAdminLogout: document.getElementById('blog-admin-logout'),
  contactForm: document.getElementById('contact-form'),
  contactName: document.getElementById('contact-name'),
  contactEmail: document.getElementById('contact-email'),
  contactSubject: document.getElementById('contact-subject'),
  contactMessage: document.getElementById('contact-message'),
};

function createClientId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  if (window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function getClientId() {
  const existing = window.localStorage.getItem(CLIENT_ID_KEY);

  if (/^[a-zA-Z0-9._:-]{8,120}$/.test(existing || '')) {
    return existing;
  }

  const clientId = createClientId();
  window.localStorage.setItem(CLIENT_ID_KEY, clientId);
  return clientId;
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add('show');
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    el.toast.classList.remove('show');
  }, 2400);
}

async function apiJson(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };

  if (String(path).startsWith(API_PREFIX)) {
    headers['X-Client-Id'] = getClientId();
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail.map((item) => item.msg || item.detail || 'Invalid field').join(', ')
      : data.detail || 'Request failed';
    throw new Error(detail);
  }

  return data;
}

function adminHeaders(includeJson = false) {
  const headers = includeJson ? { 'Content-Type': 'application/json' } : {};

  // Blog mutations are protected by the backend's configured admin login.
  if (state.blogs.adminToken) {
    headers.Authorization = `Bearer ${state.blogs.adminToken}`;
  }

  return headers;
}

function blogUsesWordPress() {
  return state.blogs.source === 'wordpress';
}

function renderBlogSourceControls() {
  if (!el.blogAdminOpen) return;

  if (blogUsesWordPress()) {
    el.blogAdminOpen.innerHTML = `
      <i data-lucide="external-link"></i>
      WordPress
    `;
    el.blogAdminOpen.title = 'Open WordPress dashboard';
  } else {
    el.blogAdminOpen.innerHTML = `
      <i data-lucide="shield"></i>
      Admin
    `;
    el.blogAdminOpen.title = 'Open blog admin';
  }

  refreshIcons();
}

async function loadBlogSource() {
  try {
    const data = await apiJson(`${API_PREFIX}/blogs/source`);
    state.blogs.source = data.source || 'local';
    state.blogs.wordpressAdminUrl = data.wordpress_admin_url || '';
  } catch (error) {
    state.blogs.source = 'local';
    state.blogs.wordpressAdminUrl = '';
  }

  renderBlogSourceControls();
}

function setStatus(text, isError = false) {
  el.schemaStatus.textContent = text;
  el.schemaStatus.classList.toggle('error', isError);
}

function selectedCount() {
  return Object.values(state.selection).reduce((count, value) => {
    if (Array.isArray(value)) return count + value.length;
    return value ? count + 1 : count;
  }, 0);
}

function updateSelectionCount() {
  const count = selectedCount();
  el.selectionCount.textContent = `${count} selected`;
}

async function loadMaster() {
  setStatus('Loading');

  try {
    state.masterSchema = await apiJson(`${API_PREFIX}/ui-schema/`);
    setStatus('Live');
    renderNicheList();

    const niches = state.masterSchema.niches || [];
    if (!state.currentNiche && niches.length) {
      await loadNiche(niches[0].id);
    }
  } catch (error) {
    setStatus('Error', true);
    showToast(error.message);
  }
}

function renderNicheList() {
  const niches = state.masterSchema?.niches || [];
  el.nicheList.innerHTML = '';

  if (!niches.length) {
    el.nicheList.innerHTML = '<div class="empty-state">No niches</div>';
    return;
  }

  niches.forEach((niche) => {
    const button = document.createElement('button');
    const optionCount =
      (niche.tasks?.length || 0) +
      (niche.constraints?.length || 0) +
      (niche.output_formats?.length || 0);

    button.type = 'button';
    button.className = 'niche-button';
    button.classList.toggle('active', state.currentNiche?.id === niche.id);
    button.title = niche.description || `${optionCount} selectable options`;
    button.setAttribute('aria-label', `${niche.label}, ${optionCount} selectable options`);
    button.innerHTML = `
      <strong class="niche-name">${escapeHtml(niche.label)}</strong>
      <span class="niche-count">
        <b>${optionCount}</b>
        <small>options</small>
      </span>
    `;
    button.onclick = () => loadNiche(niche.id);
    el.nicheList.appendChild(button);
  });
}

async function loadNiche(nicheId) {
  try {
    state.currentNiche = await apiJson(`${API_PREFIX}/ui-schema/niches/${encodeURIComponent(nicheId)}`);
    state.selection = {};
    el.nicheTitle.textContent = state.currentNiche.label || 'Prompt Builder';
    renderNicheList();
    renderSchemaArea();
    updateSelectionCount();
    await loadHistory();
  } catch (error) {
    showToast(error.message);
  }
}

function optionGroup(title, items, key, mode = 'single') {
  if (!items?.length) return '';

  const buttons = items.map((item) => {
    const selected = mode === 'multi'
      ? (state.selection[key] || []).includes(item)
      : state.selection[key] === item;
    return `
      <button class="choice-button ${selected ? 'selected' : ''}" type="button" data-key="${key}" data-value="${escapeAttr(item)}" data-mode="${mode}">
        ${escapeHtml(item)}
      </button>
    `;
  }).join('');

  return `
    <div class="option-group">
      <div class="section-kicker">${title}</div>
      <div class="option-row">${buttons}</div>
    </div>
  `;
}

function segmentGroup(title, items, key) {
  if (!items?.length) return '';

  const buttons = items.map((item) => {
    const selected = state.selection[key] === item.id;
    return `
      <button class="segment-button ${selected ? 'selected' : ''}" type="button" data-key="${key}" data-value="${escapeAttr(item.id)}" data-mode="single">
        ${escapeHtml(item.label)}
      </button>
    `;
  }).join('');

  return `
    <div class="option-group">
      <div class="section-kicker">${title}</div>
      <div class="segment-row">${buttons}</div>
    </div>
  `;
}

function renderSchemaArea() {
  const niche = state.currentNiche;
  if (!niche) {
    el.schemaArea.innerHTML = '<div class="empty-state">No schema selected</div>';
    return;
  }

  const globalTones = state.masterSchema?.global?.tones || [];
  const globalLengths = state.masterSchema?.global?.lengths || [];
  const practices = niche.best_practices?.length
    ? `
      <div class="option-group">
        <div class="section-kicker">Best Practices</div>
        <div class="readonly-chips">
          ${niche.best_practices.map((item) => `<span class="readonly-chip">${escapeHtml(item)}</span>`).join('')}
        </div>
      </div>
    `
    : '';

  el.schemaArea.innerHTML = [
    optionGroup('Tasks', niche.tasks, 'task'),
    optionGroup('Target Audience', niche.target_audience, 'target_audience'),
    optionGroup('Platform', niche.platforms, 'platform'),
    optionGroup('Goal', niche.goal_types, 'goal_type'),
    optionGroup('Constraints', niche.constraints, 'constraints', 'multi'),
    optionGroup('Output Format', niche.output_formats, 'output_format'),
    segmentGroup('Tone', globalTones, 'tone'),
    segmentGroup('Length', globalLengths, 'length'),
    practices,
  ].join('');

  el.schemaArea.querySelectorAll('[data-key]').forEach((button) => {
    button.addEventListener('click', () => {
      updateSelection(button.dataset.key, button.dataset.value, button.dataset.mode);
    });
  });
}

function updateSelection(key, value, mode) {
  if (mode === 'multi') {
    const values = new Set(state.selection[key] || []);
    if (values.has(value)) {
      values.delete(value);
    } else {
      values.add(value);
    }
    state.selection[key] = [...values];
  } else {
    state.selection[key] = state.selection[key] === value ? null : value;
  }

  renderSchemaArea();
  updateSelectionCount();
  refreshIcons();
}

async function generatePrompt() {
  if (!state.currentNiche) {
    showToast('No niche selected');
    return;
  }

  const button = document.getElementById('generate');
  button.disabled = true;
  el.resultMeta.textContent = 'Generating';
  el.output.textContent = '';

  const payload = {
    niche_id: state.currentNiche.id,
    selection: state.selection,
    context: el.context.value || '',
    tone: state.selection.tone || null,
    length: state.selection.length || null,
    extra: {},
  };

  try {
    const data = await apiJson(`${API_PREFIX}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    el.output.textContent = data.optimized_prompt || '';
    el.resultMeta.textContent = data.cached ? 'Cached' : 'Fresh';
    await loadHistory();
  } catch (error) {
    el.resultMeta.textContent = 'Error';
    el.output.textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

async function copyOutput(text = el.output.textContent) {
  if (!text.trim()) {
    showToast('Nothing to copy');
    return;
  }

  await navigator.clipboard.writeText(text);
  showToast('Copied');
}

function clearWorkspace() {
  state.selection = {};
  el.context.value = '';
  el.output.textContent = '';
  el.resultMeta.textContent = 'Ready';
  renderSchemaArea();
  updateSelectionCount();
}

async function loadHistory() {
  try {
    const data = await apiJson(`${API_PREFIX}/history/?limit=8`);
    state.history = data.history || [];
    renderHistory();
  } catch (error) {
    state.history = [];
    renderHistory();
  }
}

function renderHistory() {
  if (!state.history.length) {
    el.historyList.innerHTML = '<div class="empty-state">No history</div>';
    return;
  }

  el.historyList.innerHTML = state.history.map((item, index) => {
    const date = item.created_at ? new Date(item.created_at).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) : '';

    return `
      <article class="history-item">
        <div class="history-meta">
          <span>${escapeHtml(item.niche_id || 'niche')}</span>
          <span>${escapeHtml(date)}</span>
        </div>
        <p class="history-text">${escapeHtml(item.optimized_prompt || '')}</p>
        <div class="history-actions">
          <button class="mini-button" type="button" data-history-view="${index}">
            <i data-lucide="eye"></i>
            View
          </button>
          <button class="mini-button" type="button" data-history-copy="${index}">
            <i data-lucide="copy"></i>
            Copy
          </button>
        </div>
      </article>
    `;
  }).join('');

  el.historyList.querySelectorAll('[data-history-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const item = state.history[Number(button.dataset.historyView)];
      el.output.textContent = item.optimized_prompt || '';
      el.resultMeta.textContent = item.cached ? 'Cached' : 'History';
    });
  });

  el.historyList.querySelectorAll('[data-history-copy]').forEach((button) => {
    button.addEventListener('click', () => {
      const item = state.history[Number(button.dataset.historyCopy)];
      copyOutput(item.optimized_prompt || '');
    });
  });

  refreshIcons();
}

async function saveCustomOption(event) {
  event.preventDefault();

  if (!state.currentNiche) {
    showToast('No niche selected');
    return;
  }

  const field = el.optionField.value;
  const option = el.optionValue.value.trim();
  if (!option) {
    showToast('Option is empty');
    return;
  }

  try {
    await apiJson(`${API_PREFIX}/ui-schema/niches/${encodeURIComponent(state.currentNiche.id)}/add-option`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field, option }),
    });

    el.optionDialog.close();
    el.optionValue.value = '';
    const currentId = state.currentNiche.id;
    await loadMaster();
    await loadNiche(currentId);
    showToast('Option saved');
  } catch (error) {
    showToast(error.message);
  }
}

async function saveCustomNiche(event) {
  event.preventDefault();

  const label = el.nicheLabel.value.trim();
  const description = el.nicheDescription.value.trim();

  if (!label) {
    showToast('Niche name is empty');
    return;
  }

  try {
    const niche = await apiJson(`${API_PREFIX}/ui-schema/niches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, description }),
    });

    el.nicheDialog.close();
    el.nicheLabel.value = '';
    el.nicheDescription.value = '';
    await loadMaster();
    await loadNiche(niche.id);
    showToast('Niche saved');
  } catch (error) {
    showToast(error.message);
  }
}

function parseRoute() {
  const raw = window.location.hash.replace(/^#\/?/, '').replace(/\/$/, '');
  return raw || 'home';
}

function navigate(route) {
  const nextHash = !route || route === 'home' ? '#/' : `#/${route}`;

  if (window.location.hash === nextHash) {
    handleRoute();
    return;
  }

  window.location.hash = nextHash;
}

function setActiveNav(action) {
  document.querySelectorAll('[data-nav-action]').forEach((button) => {
    button.classList.toggle('active', button.dataset.navAction === action);
  });
}

function showHomeRoute() {
  setActiveNav('home');
  el.appShell.hidden = false;
  el.blogView.hidden = true;
  el.contactView.hidden = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showBlogShell() {
  setActiveNav('blogs');
  el.appShell.hidden = true;
  el.blogView.hidden = false;
  el.contactView.hidden = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showContactRoute() {
  setActiveNav('contact');
  el.appShell.hidden = true;
  el.blogView.hidden = true;
  el.contactView.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  refreshIcons();
}

function showBlogListView() {
  el.blogPageTitle.textContent = 'Insights';
  el.blogListView.hidden = false;
  el.blogDetailView.hidden = true;
  el.blogAdminView.hidden = true;
  renderBlogList();
}

function showBlogDetailView() {
  el.blogPageTitle.textContent = 'Article';
  el.blogListView.hidden = true;
  el.blogDetailView.hidden = false;
  el.blogAdminView.hidden = true;
}

function showBlogAdminView() {
  el.blogPageTitle.textContent = 'Blog Admin';
  el.blogListView.hidden = true;
  el.blogDetailView.hidden = true;
  el.blogAdminView.hidden = false;
  renderBlogAdminAuth();
  refreshIcons();
}

function handleRoute() {
  const route = parseRoute();

  if (route === 'home') {
    showHomeRoute();
    return;
  }

  if (route === 'blogs') {
    showBlogShell();
    showBlogListView();
    loadBlogs(state.blogs.page);
    return;
  }

  if (route === 'blogs/admin') {
    if (blogUsesWordPress()) {
      showBlogShell();
      showBlogListView();
      loadBlogs(state.blogs.page);
      showToast('Use WordPress to manage blog posts');
      return;
    }

    showBlogShell();
    showBlogAdminView();
    return;
  }

  if (route.startsWith('blogs/')) {
    showBlogShell();
    loadBlogDetail(decodeURIComponent(route.replace('blogs/', '')));
    return;
  }

  if (route === 'contact') {
    showContactRoute();
    return;
  }

  showHomeRoute();
}

function handleNav(action) {
  if (action === 'home') {
    navigate('home');
    return;
  }

  if (action === 'blogs') {
    navigate('blogs');
    return;
  }

  if (action === 'contact') {
    navigate('contact');
  }
}

function submitContactForm(event) {
  event.preventDefault();

  const subject = el.contactSubject.value.trim();
  const body = [
    `Name: ${el.contactName.value.trim()}`,
    `Email: ${el.contactEmail.value.trim()}`,
    '',
    el.contactMessage.value.trim(),
  ].join('\n');
  const mailto = `mailto:muhammadahmed520026@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  window.location.href = mailto;
  showToast('Opening your email app');
}

function clearContactForm() {
  el.contactForm.reset();
}

async function loadBlogs(page = 1) {
  state.blogs.page = page;
  renderBlogLoading();

  const params = new URLSearchParams({
    page: String(page),
    page_size: String(state.blogs.pageSize),
  });

  if (state.blogs.search) {
    params.set('search', state.blogs.search);
  }

  if (state.blogs.adminToken && !blogUsesWordPress()) {
    params.set('include_unpublished', 'true');
  }

  try {
    const data = await apiJson(`${API_PREFIX}/blogs?${params.toString()}`, {
      headers: adminHeaders(),
    });
    state.blogs.items = data.items || [];
    state.blogs.total = data.total || 0;
    state.blogs.pages = data.pages || 1;
    state.blogs.page = data.page || page;
    renderBlogList();
  } catch (error) {
    el.blogList.innerHTML = `<div class="empty-state">Could not load blogs: ${escapeHtml(error.message)}</div>`;
    el.blogPageMeta.textContent = 'Unavailable';
    showToast(error.message);
  }
}

function renderBlogLoading() {
  el.blogList.innerHTML = Array.from({ length: 3 }).map(() => `
    <article class="blog-card skeleton-card">
      <div class="blog-card-media"></div>
      <div class="blog-card-body">
        <span></span>
        <strong></strong>
        <p></p>
      </div>
    </article>
  `).join('');
  el.blogPageMeta.textContent = 'Loading';
  el.blogPrev.disabled = true;
  el.blogNext.disabled = true;
}

function renderBlogList() {
  const blogs = state.blogs.items;

  if (!blogs.length) {
    el.blogList.innerHTML = '<div class="empty-state">No blogs found</div>';
  } else {
    el.blogList.innerHTML = blogs.map((blog) => blogCard(blog)).join('');
  }

  el.blogPageMeta.textContent = `Page ${state.blogs.page} of ${state.blogs.pages}`;
  el.blogPrev.disabled = state.blogs.page <= 1;
  el.blogNext.disabled = state.blogs.page >= state.blogs.pages;

  el.blogList.querySelectorAll('[data-blog-read]').forEach((button) => {
    button.addEventListener('click', () => navigate(`blogs/${encodeURIComponent(button.dataset.blogRead)}`));
  });

  el.blogList.querySelectorAll('[data-blog-edit]').forEach((button) => {
    button.addEventListener('click', () => editBlogBySlug(button.dataset.blogEdit));
  });

  el.blogList.querySelectorAll('[data-blog-delete]').forEach((button) => {
    button.addEventListener('click', () => deleteBlog(Number(button.dataset.blogDelete)));
  });

  el.blogList.querySelectorAll('img').forEach((image) => {
    image.addEventListener('error', () => {
      image.hidden = true;
      image.parentElement.classList.add('image-error');
    });
  });

  refreshIcons();
}

function blogCard(blog) {
  const date = formatDate(blog.created_at);
  const draft = !blog.published ? '<span class="draft-pill">Draft</span>' : '';
  const adminActions = state.blogs.adminToken && !blogUsesWordPress()
    ? `
      <div class="blog-card-admin">
        <button class="mini-button" type="button" data-blog-edit="${escapeAttr(blog.slug)}">
          <i data-lucide="pencil"></i>
          Edit
        </button>
        <button class="mini-button danger-mini" type="button" data-blog-delete="${blog.id}">
          <i data-lucide="trash-2"></i>
          Delete
        </button>
      </div>
    `
    : '';
  const image = blog.image_url
    ? `<img src="${escapeAttr(blog.image_url)}" alt="${escapeAttr(blog.title)}">`
    : '';

  return `
    <article class="blog-card">
      <div class="blog-card-media ${blog.image_url ? '' : 'image-error'}">
        ${image}
      </div>
      <div class="blog-card-body">
        <div class="blog-card-meta">
          <span>${escapeHtml(blog.author || 'Prompt Studio Team')}</span>
          <span>${escapeHtml(date)}</span>
          ${draft}
        </div>
        <h2>${escapeHtml(blog.title)}</h2>
        <p>${escapeHtml(blog.summary)}</p>
        <div class="blog-card-actions">
          <button class="primary-button" type="button" data-blog-read="${escapeAttr(blog.slug)}">
            Read More
            <i data-lucide="arrow-right"></i>
          </button>
          ${adminActions}
        </div>
      </div>
    </article>
  `;
}

async function fetchBlogBySlug(slug, includeUnpublished = false) {
  const params = includeUnpublished ? '?include_unpublished=true' : '';
  return apiJson(`${API_PREFIX}/blogs/${encodeURIComponent(slug)}${params}`, {
    headers: adminHeaders(),
  });
}

async function loadBlogDetail(slug) {
  showBlogDetailView();
  el.blogDetail.innerHTML = '<div class="empty-state">Loading article</div>';
  el.blogDetailEdit.hidden = true;

  try {
    const blog = await fetchBlogBySlug(slug, Boolean(state.blogs.adminToken));
    state.blogs.current = blog;
    renderBlogDetail(blog);
  } catch (error) {
    el.blogDetail.innerHTML = `<div class="empty-state">Could not load article: ${escapeHtml(error.message)}</div>`;
    showToast(error.message);
  }
}

function renderBlogDetail(blog) {
  const date = formatDate(blog.created_at);
  const updated = formatDate(blog.updated_at);
  const image = blog.image_url
    ? `<div class="blog-detail-hero"><img src="${escapeAttr(blog.image_url)}" alt="${escapeAttr(blog.title)}"></div>`
    : '<div class="blog-detail-hero image-error"></div>';

  el.blogPageTitle.textContent = blog.title;
  el.blogDetailEdit.hidden = !state.blogs.adminToken || blogUsesWordPress();
  el.blogDetail.innerHTML = `
    ${image}
    <div class="blog-detail-body">
      <div class="blog-detail-meta">
        <span>${escapeHtml(blog.author)}</span>
        <span>${escapeHtml(date)}</span>
        ${blog.updated_at !== blog.created_at ? `<span>Updated ${escapeHtml(updated)}</span>` : ''}
        ${blog.published ? '' : '<span class="draft-pill">Draft</span>'}
      </div>
      <h1>${escapeHtml(blog.title)}</h1>
      <p class="blog-detail-summary">${escapeHtml(blog.summary)}</p>
      <div class="markdown-body">${renderBlogContent(blog)}</div>
    </div>
  `;

  el.blogDetail.querySelectorAll('img').forEach((imageNode) => {
    imageNode.addEventListener('error', () => {
      imageNode.hidden = true;
      imageNode.parentElement.classList.add('image-error');
    });
  });

  refreshIcons();
}

function renderBlogAdminAuth() {
  const loggedIn = Boolean(state.blogs.adminToken);
  el.blogLoginForm.hidden = loggedIn;
  el.blogForm.hidden = !loggedIn;
  el.blogAdminLogout.hidden = !loggedIn;
  document.getElementById('blog-new').disabled = !loggedIn;

  if (loggedIn && !state.blogs.editingId) {
    resetBlogForm();
  }
}

async function loginBlogAdmin(event) {
  event.preventDefault();

  try {
    const data = await apiJson(`${AUTH_PREFIX}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: el.blogAdminUsername.value,
        password: el.blogAdminPassword.value,
      }),
    });

    state.blogs.adminToken = data.access_token;
    window.localStorage.setItem('blogAdminToken', data.access_token);
    el.blogAdminPassword.value = '';
    renderBlogAdminAuth();
    await loadBlogs(1);
    showToast('Admin logged in');
  } catch (error) {
    showToast(error.message);
  }
}

function logoutBlogAdmin() {
  state.blogs.adminToken = '';
  state.blogs.editingId = null;
  window.localStorage.removeItem('blogAdminToken');
  renderBlogAdminAuth();
  loadBlogs(1);
  showToast('Logged out');
}

function resetBlogForm() {
  state.blogs.editingId = null;
  el.blogFormTitle.textContent = 'Create Blog';
  el.blogForm.reset();
  el.blogAuthor.value = 'Prompt Studio Team';
  el.blogPublished.checked = true;
  el.blogDelete.hidden = true;
  refreshIcons();
}

function fillBlogForm(blog) {
  state.blogs.editingId = blog.id;
  el.blogFormTitle.textContent = 'Edit Blog';
  el.blogTitle.value = blog.title || '';
  el.blogSummary.value = blog.summary || '';
  el.blogImageUrl.value = blog.image_url || '';
  el.blogAuthor.value = blog.author || 'Prompt Studio Team';
  el.blogContent.value = blog.content || '';
  el.blogPublished.checked = Boolean(blog.published);
  el.blogDelete.hidden = false;
  refreshIcons();
}

async function editBlogBySlug(slug) {
  if (!state.blogs.adminToken) {
    navigate('blogs/admin');
    showToast('Admin login required');
    return;
  }

  showBlogShell();
  showBlogAdminView();
  window.location.hash = '#/blogs/admin';

  try {
    const blog = await fetchBlogBySlug(slug, true);
    fillBlogForm(blog);
  } catch (error) {
    showToast(error.message);
  }
}

async function saveBlog(event) {
  event.preventDefault();

  const payload = {
    title: el.blogTitle.value.trim(),
    summary: el.blogSummary.value.trim(),
    image_url: el.blogImageUrl.value.trim(),
    author: el.blogAuthor.value.trim() || 'Prompt Studio Team',
    content: el.blogContent.value.trim(),
    published: el.blogPublished.checked,
  };
  const isEditing = Boolean(state.blogs.editingId);

  try {
    const blog = await apiJson(
      isEditing
        ? `${API_PREFIX}/blogs/${state.blogs.editingId}`
        : `${API_PREFIX}/blogs`,
      {
        method: isEditing ? 'PUT' : 'POST',
        headers: adminHeaders(true),
        body: JSON.stringify(payload),
      },
    );

    fillBlogForm(blog);
    await loadBlogs(1);
    showToast(isEditing ? 'Blog updated' : 'Blog created');
  } catch (error) {
    showToast(error.message);
  }
}

async function deleteBlog(blogId = state.blogs.editingId) {
  if (!blogId) return;

  const confirmed = window.confirm('Delete this blog post?');
  if (!confirmed) return;

  try {
    await apiJson(`${API_PREFIX}/blogs/${blogId}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    });

    if (state.blogs.editingId === blogId) {
      resetBlogForm();
    }

    if (state.blogs.current?.id === blogId) {
      state.blogs.current = null;
      navigate('blogs');
    }

    await loadBlogs(1);
    showToast('Blog deleted');
  } catch (error) {
    showToast(error.message);
  }
}

function renderBlogContent(blog) {
  if (blog.content_html) {
    return sanitizeContentHtml(blog.content_html);
  }

  return markdownToHtml(blog.content || '');
}

function sanitizeContentHtml(source) {
  const template = document.createElement('template');
  template.innerHTML = String(source || '');

  const allowedTags = new Set([
    'A',
    'B',
    'BLOCKQUOTE',
    'BR',
    'CODE',
    'EM',
    'FIGCAPTION',
    'FIGURE',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'HR',
    'I',
    'IMG',
    'LI',
    'OL',
    'P',
    'PRE',
    'STRONG',
    'TABLE',
    'TBODY',
    'TD',
    'TH',
    'THEAD',
    'TR',
    'UL',
  ]);

  const cleanUrl = (value, image = false) => {
    try {
      const url = new URL(value, window.location.origin);
      const allowedProtocols = image
        ? ['http:', 'https:']
        : ['http:', 'https:', 'mailto:', 'tel:'];

      return allowedProtocols.includes(url.protocol) ? url.href : '';
    } catch (error) {
      return '';
    }
  };

  const sanitizeNode = (node) => {
    [...node.children].forEach(sanitizeNode);

    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(...node.childNodes);
      return;
    }

    const originalHref = node.getAttribute('href') || '';
    const originalSrc = node.getAttribute('src') || '';
    const originalAlt = node.getAttribute('alt') || '';

    [...node.attributes].forEach((attribute) => {
      node.removeAttribute(attribute.name);
    });

    if (node.tagName === 'A') {
      const href = cleanUrl(originalHref);
      if (href) {
        node.setAttribute('href', href);
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noreferrer');
      }
    }

    if (node.tagName === 'IMG') {
      const src = cleanUrl(originalSrc, true);
      if (src) {
        node.setAttribute('src', src);
        node.setAttribute('alt', originalAlt);
        node.setAttribute('loading', 'lazy');
      } else {
        node.remove();
      }
    }
  };

  [...template.content.children].forEach(sanitizeNode);
  return template.innerHTML;
}

function markdownToHtml(source) {
  // Render trusted author markdown without allowing raw HTML injection.
  const lines = String(source || '').replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let paragraph = [];
  let listType = null;
  let inCode = false;

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      flushParagraph();
      closeList();

      if (inCode) {
        html.push('</code></pre>');
        inCode = false;
      } else {
        html.push('<pre><code>');
        inCode = true;
      }
      return;
    }

    if (inCode) {
      html.push(`${escapeHtml(line)}\n`);
      return;
    }

    if (!trimmed) {
      flushParagraph();
      closeList();
      return;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      return;
    }

    const unordered = trimmed.match(/^[-*]\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      if (listType !== 'ul') {
        closeList();
        html.push('<ul>');
        listType = 'ul';
      }
      html.push(`<li>${inlineMarkdown(unordered[1])}</li>`);
      return;
    }

    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      if (listType !== 'ol') {
        closeList();
        html.push('<ol>');
        listType = 'ol';
      }
      html.push(`<li>${inlineMarkdown(ordered[1])}</li>`);
      return;
    }

    const quote = trimmed.match(/^>\s+(.+)$/);
    if (quote) {
      flushParagraph();
      closeList();
      html.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`);
      return;
    }

    closeList();
    paragraph.push(trimmed);
  });

  flushParagraph();
  closeList();

  if (inCode) {
    html.push('</code></pre>');
  }

  return html.join('');
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function formatDate(value) {
  if (!value) return '';

  return new Date(value).toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(value) {
  return escapeHtml(value);
}

document.getElementById('generate').addEventListener('click', generatePrompt);
document.getElementById('copy').addEventListener('click', () => copyOutput());
document.getElementById('clear').addEventListener('click', clearWorkspace);
document.getElementById('refresh').addEventListener('click', loadMaster);
document.getElementById('refresh-history').addEventListener('click', loadHistory);
document.querySelectorAll('[data-nav-action]').forEach((button) => {
  button.addEventListener('click', () => handleNav(button.dataset.navAction));
});
document.getElementById('add-option').addEventListener('click', () => {
  el.optionDialog.showModal();
  el.optionValue.focus();
});
document.getElementById('add-niche').addEventListener('click', () => {
  el.nicheDialog.showModal();
  el.nicheLabel.focus();
});
document.getElementById('close-dialog').addEventListener('click', () => el.optionDialog.close());
document.getElementById('cancel-option').addEventListener('click', () => el.optionDialog.close());
document.getElementById('close-niche-dialog').addEventListener('click', () => el.nicheDialog.close());
document.getElementById('cancel-niche').addEventListener('click', () => el.nicheDialog.close());
el.optionForm.addEventListener('submit', saveCustomOption);
el.nicheForm.addEventListener('submit', saveCustomNiche);

el.blogAdminOpen.addEventListener('click', () => {
  if (blogUsesWordPress()) {
    if (state.blogs.wordpressAdminUrl) {
      window.open(state.blogs.wordpressAdminUrl, '_blank', 'noopener,noreferrer');
    } else {
      showToast('WordPress URL is not configured');
    }
    return;
  }

  navigate('blogs/admin');
});
document.getElementById('blog-back').addEventListener('click', () => navigate('blogs'));
document.getElementById('blog-new').addEventListener('click', resetBlogForm);
el.blogDetailEdit.addEventListener('click', () => {
  if (state.blogs.current) {
    editBlogBySlug(state.blogs.current.slug);
  }
});
el.blogLoginForm.addEventListener('submit', loginBlogAdmin);
el.blogForm.addEventListener('submit', saveBlog);
el.blogAdminLogout.addEventListener('click', logoutBlogAdmin);
document.getElementById('blog-cancel-edit').addEventListener('click', resetBlogForm);
el.blogDelete.addEventListener('click', () => deleteBlog());
el.blogPrev.addEventListener('click', () => loadBlogs(state.blogs.page - 1));
el.blogNext.addEventListener('click', () => loadBlogs(state.blogs.page + 1));
el.contactForm.addEventListener('submit', submitContactForm);
document.getElementById('contact-clear').addEventListener('click', clearContactForm);
el.blogSearch.addEventListener('input', () => {
  window.clearTimeout(el.blogSearch.timeoutId);
  el.blogSearch.timeoutId = window.setTimeout(() => {
    state.blogs.search = el.blogSearch.value.trim();
    navigate('blogs');
    loadBlogs(1);
  }, 260);
});
window.addEventListener('hashchange', handleRoute);

refreshIcons();
loadMaster();
loadBlogSource().finally(handleRoute);

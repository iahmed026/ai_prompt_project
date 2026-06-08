import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useReducedMotion,
} from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  Clipboard,
  Cloud,
  Copy,
  Eraser,
  GraduationCap,
  Home,
  Mail,
  Menu,
  Plus,
  Rocket,
  Send,
  ShoppingCart,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import './styles.css';

const API_PREFIX = window.location.port === '5173'
  ? 'http://127.0.0.1:8000/api/v1'
  : '/api/v1';

const motionTokens = {
  fastHover: {
    duration: 0.16,
    ease: [0.22, 1, 0.36, 1],
  },
  micro: {
    duration: 0.18,
    ease: [0.2, 0.8, 0.2, 1],
  },
  page: {
    duration: 0.42,
    ease: [0.22, 1, 0.36, 1],
  },
  modal: {
    duration: 0.32,
    ease: [0.16, 1, 0.3, 1],
  },
  drawerSpring: {
    type: 'spring',
    stiffness: 360,
    damping: 36,
    mass: 0.88,
  },
};

const fallbackSchema = {
  global: {
    tones: [
      { id: 'professional', label: 'Professional' },
      { id: 'friendly', label: 'Friendly' },
      { id: 'direct', label: 'Direct' },
      { id: 'creative', label: 'Creative' },
      { id: 'technical', label: 'Technical' },
      { id: 'encouraging', label: 'Encouraging' },
      { id: 'minimal', label: 'Minimal' },
      { id: 'persuasive', label: 'Persuasive' },
    ],
    lengths: [
      { id: 'short', label: 'Short' },
      { id: 'medium', label: 'Medium' },
      { id: 'detailed', label: 'Detailed' },
      { id: 'comprehensive', label: 'Comprehensive' },
    ],
  },
  niches: [
    {
      id: 'marketing',
      label: 'Marketing',
      description: 'Campaigns, conversion copy, content, and brand messaging.',
      tasks: [
        'Write Ad Copy',
        'Create landing Page',
        'Generate Email Campaign',
        'Create lead Magnet',
        'Digital Marketing',
        'Write Video Script',
        'Create Marketing Hooks',
        'Write SEO Blog Outline',
        'Write Product Description',
        'Write brand Messaging',
        'Make an Email Marketing Add',
        'Generate CTA Variations',
        'Generate Social Media Captions',
        'Create Campaign Strategy',
      ],
      target_audience: [
        'Startup Founders',
        'Small Business Owners',
        'Creators',
        'Agencies',
        'Enterprise Buyers',
        'Students',
        'Freelancers',
      ],
      platforms: ['Instagram', 'linkedin', 'Twitter/X', 'Facebook', 'Tiktok', 'Youtube', 'Email', 'Google Ads'],
      goal_types: ['Increase Conversions', 'Generate leads', 'Improve Engagement', 'Boost Awareness', 'Drive Signups', 'Increase Retention'],
      constraints: ['Avoid Hype', 'Keep Claims Realistic', 'Include CTA', 'Write for Mobile', 'Use Simple Wording'],
      output_formats: ['Bullet list', 'Email Draft', 'Table', 'Script', 'linkedin post', 'Twitter/X Thread', 'A/B Test Variations', 'Carousel Content', 'landing Page Sections', 'Campaign Brief', 'Short Form Captions'],
      best_practices: [
        'lead with the customer outcome',
        'Highlight Transformation',
        'Focus on one core message',
        'Keep the CTA clear',
        'Write skimmable content',
        'Address Objection early',
        'Use audience-specific language',
        'Include urgency naturally',
      ],
    },
    {
      id: 'saas',
      label: 'SaaS',
      description: 'Product, onboarding, support, documentation, and release workflows.',
      tasks: ['Write onboarding flow', 'Generate release notes', 'Create product documentation', 'Write feature announcement', 'Draft customer support response', 'Create onboarding checklist', 'Generate feature comparison'],
      target_audience: ['Product managers', 'Enterprise users', 'Non-technical users', 'Customer support teams'],
      platforms: ['Web App', 'Dashboard', 'API', 'Admin Panel', 'Chrome extension'],
      goal_types: ['Improve onboarding', 'Reduce churn', 'Increase activation', 'Reduce support tickets', 'Improve Retention'],
      constraints: ['Prioritize clarity', 'Use consistent terminology', 'Explain edge cases'],
      output_formats: ['Checklist', 'FAQ', 'Release note', 'Step-by-step guide', 'Product spec'],
      best_practices: ['Describe before and after states', 'Clarify user roles', 'Reduce ambiguity'],
    },
    {
      id: 'education',
      label: 'Education',
      description: 'Teaching, study guides, learning objectives, and exercises.',
      tasks: ['Create lesson plan', 'Generate quiz questions', 'Explain a concept', 'Create flashcards', 'Design study guide'],
      target_audience: ['Teachers', 'Students', 'Self-learners', 'Parents'],
      platforms: ['Classroom', 'Online course', 'Workshop', 'Learning management system'],
      goal_types: ['Improve understanding', 'Increase engagement', 'Prepare for exams'],
      constraints: ['Use age-appropriate language', 'Include examples', 'Use step-by-step explanations'],
      output_formats: ['Lesson outline', 'Quiz', 'Worksheet', 'Flashcards', 'Study guide'],
      best_practices: ['State learning objectives clearly', 'Build from simple to advanced', 'Encourage curiosity'],
    },
    {
      id: 'e-commerce',
      label: 'E-Commerce',
      description: 'Product copy, store flows, checkout, offers, and marketplace listings.',
      tasks: ['Write product description', 'Create product title variations', 'Write abandoned cart email', 'Generate product launch campaign'],
      target_audience: ['Online shoppers', 'First-time buyers', 'Returning customers', 'Premium buyers'],
      platforms: ['Shopify', 'WooCommerce', 'Amazon', 'Etsy', 'Instagram Shop'],
      goal_types: ['Increase conversions', 'Reduce cart abandonment', 'Boost repeat purchases'],
      constraints: ['Keep claims accurate', 'Include trust signals', 'Match the brand voice'],
      output_formats: ['Product page copy', 'Email draft', 'FAQ', 'Comparison table'],
      best_practices: ['Translate features into benefits', 'Make the offer easy to understand', 'Optimize for quick scanning'],
    },
    {
      id: 'real-estate',
      label: 'Real Estate',
      description: 'Listings, open houses, buyer/seller outreach, and market updates.',
      tasks: ['Write property listing description', 'Create open house announcement', 'Generate real estate ad copy', 'Create neighborhood guide'],
      target_audience: ['Home buyers', 'Home sellers', 'Real estate investors', 'First-time buyers'],
      platforms: ['Zillow', 'MLS', 'Facebook', 'Instagram', 'Email'],
      goal_types: ['Promote a listing', 'Attract buyer inquiries', 'Build agent credibility'],
      constraints: ['Keep claims accurate', 'Use compliant language', 'Avoid misleading urgency'],
      output_formats: ['Listing description', 'Email draft', 'Social media post', 'Checklist'],
      best_practices: ['Use specific details instead of vague adjectives', 'Make the next action obvious', 'Keep compliance and accuracy in mind'],
    },
  ],
};

const pageVariants = {
  initial: { opacity: 0, y: 26, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -18, filter: 'blur(4px)' },
};

const sectionReveal = {
  initial: { opacity: 0, y: 34 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: motionTokens.page,
};

function App() {
  const prefersReducedMotion = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState(getRouteFromHash());
  const [schema, setSchema] = useState(fallbackSchema);
  const [schemaStatus, setSchemaStatus] = useState('Loading');
  const [currentNicheId, setCurrentNicheId] = useState('marketing');
  const [selection, setSelection] = useState({});
  const [context, setContext] = useState('launch a new Ai writing tool for small Saas teams');
  const [output, setOutput] = useState('');
  const [outputState, setOutputState] = useState('empty');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);

  const transition = prefersReducedMotion ? { duration: 0.01 } : motionTokens.page;

  const currentNiche = useMemo(
    () => schema.niches.find((niche) => niche.id === currentNicheId) || schema.niches[0],
    [schema, currentNicheId],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 950);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(getRouteFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    loadSchema();
    loadHistory();
  }, []);

  async function loadSchema() {
    setSchemaStatus('Loading');
    try {
      const data = await apiJson(`${API_PREFIX}/ui-schema/`);
      setSchema(normalizeSchema(data));
      setSchemaStatus('Live');
    } catch (error) {
      setSchemaStatus('Local');
      showToast('Using local prompt schema');
    }
  }

  async function loadHistory() {
    try {
      const data = await apiJson(`${API_PREFIX}/history/?limit=6`);
      setHistory(data.history || []);
    } catch (error) {
      setHistory([]);
    }
  }

  function showToast(message, tone = 'success') {
    setToast({ message, tone, id: Date.now() });
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast(null), 2400);
  }

  function navigate(nextRoute) {
    const hash = nextRoute === 'home' ? '#home' : `#${nextRoute}`;
    if (window.location.hash === hash) {
      setRoute(nextRoute);
      return;
    }
    window.location.hash = hash;
  }

  function handleNav(action) {
    if (action === 'services' || action === 'how' || action === 'contact') {
      const targetId = action === 'services'
        ? 'services'
        : action === 'how'
          ? 'how-it-works'
          : 'contact-footer';
      if (route !== 'home') {
        navigate('home');
        window.setTimeout(() => smoothScrollTo(targetId), 80);
      } else {
        smoothScrollTo(targetId);
      }
      return;
    }

    navigate(action);
  }

  function smoothScrollTo(id) {
    const target = document.getElementById(id);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - 88;
    if (prefersReducedMotion) {
      window.scrollTo(0, top);
      return;
    }
    animate(window.scrollY, top, {
      duration: 0.74,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (value) => window.scrollTo(0, value),
    });
  }

  function chooseNiche(nicheId) {
    setCurrentNicheId(nicheId);
    setSelection({});
    setOutput('');
    setOutputState('empty');
  }

  function updateSelection(key, value, mode = 'single') {
    setSelection((current) => {
      if (mode === 'multi') {
        const values = new Set(current[key] || []);
        if (values.has(value)) values.delete(value);
        else values.add(value);
        return { ...current, [key]: [...values] };
      }
      return { ...current, [key]: current[key] === value ? null : value };
    });
  }

  async function generatePrompt() {
    setOutputState('loading');
    setOutput('');

    const payload = {
      niche_id: currentNiche.id,
      selection,
      context,
      tone: selection.tone || null,
      length: selection.length || null,
      extra: {},
    };

    const minDelay = delay(850);
    try {
      const [data] = await Promise.all([
        apiJson(`${API_PREFIX}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
        minDelay,
      ]);
      setOutput(data.optimized_prompt || localPrompt(currentNiche, selection, context));
      setOutputState('output');
      showToast(data.cached ? 'Cached prompt loaded' : 'Prompt generated');
      loadHistory();
    } catch (error) {
      await minDelay;
      setOutput(localPrompt(currentNiche, selection, context));
      setOutputState('output');
      showToast('Generated locally', 'success');
    }
  }

  function clearBuilder() {
    setSelection({});
    setContext('');
    setOutput('');
    setOutputState('empty');
    showToast('Workspace cleared');
  }

  function copyOutput() {
    if (!output.trim()) {
      showToast('Nothing to copy', 'error');
      return;
    }
    navigator.clipboard?.writeText(output);
    showToast('Prompt copied');
  }

  function saveCustomOption(field, value) {
    const trimmed = value.trim();
    if (!trimmed) {
      showToast('Option is required', 'error');
      return;
    }
    setSchema((current) => ({
      ...current,
      niches: current.niches.map((niche) => (
        niche.id === currentNiche.id
          ? { ...niche, [field]: [...(niche[field] || []), trimmed] }
          : niche
      )),
    }));
    setModal(null);
    showToast('Option added');
  }

  const selectedCount = Object.values(selection).reduce((count, value) => {
    if (Array.isArray(value)) return count + value.length;
    return value ? count + 1 : count;
  }, 0);

  return (
    <MotionConfig transition={prefersReducedMotion ? { duration: 0.01 } : motionTokens.micro}>
      <AnimatePresence mode="wait">
        {loading ? <AppLoader key="loader" /> : null}
      </AnimatePresence>

      {!loading && (
        <>
          <AppHeader route={route} onNav={handleNav} onBuilder={() => navigate('builder')} />
          <AnimatePresence mode="wait">
            {route === 'home' && (
              <motion.main
                key="home"
                className="page landing-page"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transition}
              >
                <LandingPage onScroll={smoothScrollTo} onBuilder={() => navigate('builder')} />
              </motion.main>
            )}

            {route === 'builder' && (
              <motion.main
                key="builder"
                className="page builder-page"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transition}
              >
                <BuilderPage
                  schema={schema}
                  schemaStatus={schemaStatus}
                  currentNiche={currentNiche}
                  currentNicheId={currentNicheId}
                  drawerOpen={drawerOpen}
                  selection={selection}
                  selectedCount={selectedCount}
                  context={context}
                  output={output}
                  outputState={outputState}
                  onDrawerToggle={() => setDrawerOpen((value) => !value)}
                  onDrawerClose={() => setDrawerOpen(false)}
                  onChooseNiche={chooseNiche}
                  onSelect={updateSelection}
                  onContext={setContext}
                  onGenerate={generatePrompt}
                  onClear={clearBuilder}
                  onCopy={copyOutput}
                  onModal={setModal}
                />
              </motion.main>
            )}

            {route === 'history' && (
              <motion.main
                key="history"
                className="page simple-page"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transition}
              >
                <HistoryPage history={history} onBuilder={() => navigate('builder')} />
              </motion.main>
            )}

            {route === 'blogs' && (
              <motion.main
                key="blogs"
                className="page simple-page"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transition}
              >
                <BlogsPage />
              </motion.main>
            )}

            {route === 'contact' && (
              <motion.main
                key="contact"
                className="page simple-page"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transition}
              >
                <ContactPage onToast={showToast} />
              </motion.main>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {modal === 'option' && (
              <OptionModal
                key="option-modal"
                currentNiche={currentNiche}
                onClose={() => setModal(null)}
                onSave={saveCustomOption}
              />
            )}
          </AnimatePresence>

          <Toast toast={toast} />
        </>
      )}
    </MotionConfig>
  );
}

function AppLoader() {
  return (
    <motion.div
      className="app-loader"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.32 }}
    >
      <motion.div
        className="loader-orbit"
        animate={{ rotate: 360, scale: [1, 0.9, 1] }}
        transition={{
          rotate: { duration: 1.15, repeat: Infinity, ease: 'linear' },
          scale: { duration: 0.7, repeat: Infinity, ease: 'easeInOut' },
        }}
      />
    </motion.div>
  );
}

function AppHeader({ route, onNav, onBuilder }) {
  const nav = [
    ['home', 'Home'],
    ['services', 'Services'],
    ['how', 'How it works'],
    ['contact', 'Contact us'],
  ];

  return (
    <motion.header
      className={`app-header ${route === 'home' ? 'home-header' : 'sub-header'}`}
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionTokens.page}
    >
      <button className="logo-button" type="button" onClick={() => onNav('home')} aria-label="Home">
        <LogoMark />
      </button>
      <nav className="top-nav" aria-label="Primary">
        {nav.map(([id, label]) => (
          <MotionButton
            key={id}
            className={`nav-link ${route === id ? 'active' : ''}`}
            onClick={() => onNav(id)}
          >
            {label}
          </MotionButton>
        ))}
      </nav>
      <MotionButton className="demo-button" onClick={onBuilder}>
        <span>{route === 'home' ? 'Book a Demo' : 'Open Builder'}</span>
      </MotionButton>
    </motion.header>
  );
}

function LogoMark() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <span className="logo-p">P</span>
      <Zap size={28} strokeWidth={3.2} />
    </span>
  );
}

function LandingPage({ onScroll, onBuilder }) {
  const services = [
    [Sparkles, 'AI Prompt Builder', 'Turn rough instructions into structured prompts with audience, tone, constraints, and output format already aligned.'],
    [Rocket, 'Fast Generation', 'Move from brief to usable prompt in seconds without losing context or clarity.'],
    [Clipboard, 'Reusable History', 'Keep high-performing prompts ready for campaigns, product work, and client delivery.'],
    [BarChart3, 'Prompt Scoring', 'Check clarity, relevance, specificity, and completeness before sending the prompt to an AI tool.'],
  ];

  return (
    <>
      <section className="hero-section">
        <div className="hero-ambient" />
        <PromptOptimizationScene />
        <div className="hero-pink-panel" />
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, x: -42 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...motionTokens.page, delay: 0.12 }}
        >
          <h1><span>AI-Powered</span> Prompt Enhancement</h1>
          <p>Transform rough instructions into structured, context-aware prompts optimized for better AI responses. Get clearer outputs, reduce revisions, and achieve higher-quality results across every project.</p>
          <div className="hero-actions">
            <motion.span
              className="hero-orb"
              animate={{ scale: [1, 1.08, 1], rotate: [0, 8, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <LogoMark />
            </motion.span>
            <MotionButton className="gradient-button hero-cta" onClick={onBuilder}>Book a Call</MotionButton>
          </div>
        </motion.div>
        <HeroShowcaseCard />
        <PromptMemoryCard />
        <div className="hero-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>

      <section id="services" className="services-section">
        <motion.div className="section-kicker" {...sectionReveal}>
          <span>Services</span>
          <h2>AI Prompt Generator Services</h2>
        </motion.div>
        <div className="service-grid">
        {services.map(([Icon, title, body], index) => (
          <motion.article
            key={title}
            className="service-card"
            {...sectionReveal}
            transition={{ ...motionTokens.page, delay: index * 0.06 }}
            whileHover={{ y: -7, scale: 1.012 }}
          >
            <motion.div
              className="service-visual"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3 + index * 0.18, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Icon size={46} />
            </motion.div>
            <div>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          </motion.article>
        ))}
        </div>
      </section>

      <section id="how-it-works" className="process-section">
        <motion.div className="process-title" {...sectionReveal}>
          <h2>This is how <span>AI Prompt Generator</span> Works</h2>
        </motion.div>
        <div className="process-list">
          {[
            ['01', 'Select Your Niche', 'Choose the category that best matches your objective, such as marketing, content creation, coding, design, or business.'],
            ['02', 'Fill Out the Form', 'Provide key details about your goal, audience, tone, and context through a simple dynamic form.'],
            ['03', 'Generate Prompt', 'Click Generate and let the AI transform your inputs into a professionally structured prompt.'],
            ['04', 'Copy & Use', 'Review the generated prompt, make adjustments if needed, and copy it with a single click.'],
          ].map(([num, title, body], index) => (
            <motion.article
              className="process-card"
              key={num}
              {...sectionReveal}
              transition={{ ...motionTokens.page, delay: index * 0.05 }}
              whileHover={{ y: -5, scale: 1.01 }}
            >
              <span>{num}</span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
              <div className="process-shape" />
            </motion.article>
          ))}
        </div>
      </section>

      <motion.section className="cta-band" {...sectionReveal}>
        <div>
          <h2>Start Creating <span>Better</span><br />AI Prompts Today</h2>
          <MotionButton className="gradient-button" onClick={onBuilder}>Get Started</MotionButton>
        </div>
        <motion.div className="cta-code-card" whileHover={{ y: -8, scale: 1.015 }}>
          <MiniPromptWorkspace />
        </motion.div>
      </motion.section>

      <ContactBand onScroll={onScroll} />
    </>
  );
}

function PromptOptimizationScene() {
  const analysis = ['Intent Detection', 'Context Understanding', 'Keyword Enhancement', 'Structure Improvement', 'Clarity Boost'];
  const bars = [78, 72, 82, 86];

  return (
    <div className="prompt-scene" aria-hidden="true">
      <motion.div
        className="analysis-panel"
        initial={{ opacity: 0, x: -80, rotate: -4 }}
        animate={{ opacity: 1, x: 0, rotate: -2 }}
        transition={{ ...motionTokens.page, delay: 0.2 }}
      >
        <h3>AI Analysis</h3>
        {analysis.map((item, index) => (
          <motion.div
            className="analysis-item"
            key={item}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...motionTokens.fastHover, delay: 0.38 + index * 0.08 }}
          >
            <Check size={17} />
            <span>{item}</span>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="dashboard-board"
        initial={{ opacity: 0, y: 46, rotate: -1.4, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, rotate: -1.4, scale: 1 }}
        transition={{ ...motionTokens.page, delay: 0.06 }}
      >
        <div className="dashboard-heading">
          <Sparkles size={42} />
          <strong>Smart Prompt Optimization</strong>
        </div>
        <div className="prompt-flow">
          <div className="prompt-glass-panel raw-panel">
            <span>Raw Prompt</span>
            <p>write a blog about productivity.</p>
          </div>
          <motion.div
            className="flow-arrow"
            animate={{ x: [0, 12, 0], opacity: [0.68, 1, 0.68] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ArrowRight size={58} />
          </motion.div>
          <div className="prompt-glass-panel optimized-panel">
            <span>Optimized Prompt</span>
            <p>Write a detailed, engaging, and SEO-friendly blog post about productivity. Include practical tips, real-life examples, and actionable insights.</p>
            <div className="prompt-tags">
              <i>Detailed</i>
              <i>Engaging</i>
              <i>SEO Friendly</i>
              <i>Actionable</i>
            </div>
          </div>
          <div className="score-panel">
            <span>Prompt Score</span>
            <div className="score-ring"><strong>92%</strong></div>
            <small>Excellent</small>
            {bars.map((width, index) => (
              <div className="score-bar" key={width}>
                <em>{['Clarity', 'Relevance', 'Specificity', 'Completeness'][index]}</em>
                <b style={{ width: `${width}%` }} />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function HeroShowcaseCard() {
  return (
    <motion.div
      className="hero-showcase-card"
      initial={{ opacity: 0, x: 70, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ ...motionTokens.page, delay: 0.2 }}
      whileHover={{ y: -8, scale: 1.015 }}
    >
      <MiniPromptWorkspace compact />
    </motion.div>
  );
}

function PromptMemoryCard() {
  return (
    <motion.div
      className="memory-card"
      initial={{ opacity: 0, x: 90, rotate: 3 }}
      animate={{ opacity: 1, x: 0, rotate: 2 }}
      transition={{ ...motionTokens.page, delay: 0.28 }}
      whileHover={{ y: -8, rotate: 0 }}
      aria-hidden="true"
    >
      <div className="hourglass">
        <span>Past<br />Prompts</span>
        <small>Better<br />Results</small>
      </div>
      <div className="memory-lines">
        <b>My Best Prompts</b>
        <i>Lead Generation Prompt</i>
        <i>Product Launch Post</i>
        <i>Newsletter Template</i>
      </div>
    </motion.div>
  );
}

function MiniPromptWorkspace({ compact = false }) {
  return (
    <div className={`mini-workspace ${compact ? 'compact' : ''}`}>
      <div className="mini-toolbar">
        <span />
        <span />
        <span />
        <b>Prompt Studio</b>
      </div>
      <div className="mini-grid">
        <div className="mini-editor">
          <small>Raw Prompt</small>
          <p>write a blog about productivity</p>
        </div>
        <ArrowRight size={compact ? 28 : 36} />
        <div className="mini-editor highlighted">
          <small>Optimized Prompt</small>
          <p>Create a structured, practical productivity article with examples, tone, and CTA.</p>
        </div>
        <div className="mini-score">
          <strong>92%</strong>
          <span>Prompt Score</span>
        </div>
      </div>
      <div className="mini-footer">
        <span>Saves Time</span>
        <span>Better Accuracy</span>
        <span>Higher Productivity</span>
      </div>
    </div>
  );
}

function ContactBand({ onScroll }) {
  const stats = [
    ['50+', 'Successful Projects', BarChart3],
    ['100+', 'Happy Clients', Sparkles],
    ['10+', 'Years of Experience', Zap],
    ['20+', 'Experienced Team', BookOpen],
  ];

  return (
    <section className="landing-contact">
      <motion.div className="contact-card-large" {...sectionReveal}>
        <div className="contact-form-preview">
          <h2><span>Transforming</span> Vision into Reality</h2>
          <p>Submit your information to take success to the next level.</p>
          {['Full Name', 'Email', 'Contact Number', 'Enter your preferred tech stack'].map((item) => (
            <div className="fake-input" key={item}>{item}</div>
          ))}
          <div className="fake-textarea">Tell us how we can help you?</div>
          <MotionButton className="outline-send" onClick={() => onScroll('contact-footer')}>
            Send Message <span><ArrowRight size={22} /></span>
          </MotionButton>
        </div>
        <div className="stats-panel">
          <h3>Company's Statistics</h3>
          <div className="stats-grid">
            {stats.map(([value, label, Icon]) => (
              <motion.div className="stat-card" key={label} whileHover={{ y: -5, scale: 1.02 }}>
                <Icon size={42} />
                <strong>{value}</strong>
                <span>{label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
      <footer id="contact-footer" className="pink-footer">
        <div>
          <h3>Quick Links</h3>
          <button type="button" onClick={() => onScroll('services')}>Home</button>
          <button type="button" onClick={() => onScroll('services')}>Services</button>
          <button type="button" onClick={() => onScroll('how-it-works')}>How it Works</button>
        </div>
        <div>
          <h3>Contact</h3>
          <a href="tel:+923060711235">+92 3060711235</a>
          <a href="tel:+923294781121">+92 3294781121</a>
          <a href="mailto:info@dagenticx.com">info@dagenticx.com</a>
        </div>
      </footer>
    </section>
  );
}

function BuilderPage(props) {
  const {
    schema,
    schemaStatus,
    currentNiche,
    currentNicheId,
    drawerOpen,
    selection,
    selectedCount,
    context,
    output,
    outputState,
    onDrawerToggle,
    onDrawerClose,
    onChooseNiche,
    onSelect,
    onContext,
    onGenerate,
    onClear,
    onCopy,
    onModal,
  } = props;

  return (
    <div className="builder-shell">
      <NicheDrawer
        niches={schema.niches}
        currentNicheId={currentNicheId}
        schemaStatus={schemaStatus}
        open={drawerOpen}
        onToggle={onDrawerToggle}
        onClose={onDrawerClose}
        onChoose={onChooseNiche}
      />
      <section className="builder-workspace">
        <div className="builder-main">
          <div className="builder-title-row">
            <div>
              <h1>{currentNiche.label}</h1>
              <p>Prompt Brief</p>
            </div>
            <div className="builder-actions">
              <MotionButton className="soft-action" onClick={onClear}><Eraser size={20} />Clear</MotionButton>
              <MotionButton className="soft-action" onClick={() => onModal('option')}><Plus size={21} />Add Option</MotionButton>
            </div>
          </div>

          <SchemaForm
            schema={schema}
            niche={currentNiche}
            selection={selection}
            selectedCount={selectedCount}
            context={context}
            onSelect={onSelect}
            onContext={onContext}
            onGenerate={onGenerate}
            outputState={outputState}
          />
        </div>

        <OutputPanel output={output} state={outputState} onCopy={onCopy} />
      </section>
    </div>
  );
}

function NicheDrawer({ niches, currentNicheId, schemaStatus, open, onToggle, onClose, onChoose }) {
  return (
    <motion.aside
      className={`niche-drawer ${open ? 'open' : 'collapsed'}`}
      animate={{ width: open ? 322 : 58 }}
      transition={motionTokens.drawerSpring}
    >
      <div className="drawer-inner">
        <button className="drawer-logo" type="button" onClick={onToggle} aria-label="Toggle niche drawer">
          <LogoMark />
          <AnimatePresence>
            {open && (
              <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
                AI Prompt Generator
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <button className="drawer-close" type="button" onClick={open ? onClose : onToggle}>
          {open ? <ArrowLeft size={25} /> : <Menu size={25} />}
          <AnimatePresence>
            {open && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Close</motion.span>}
          </AnimatePresence>
        </button>

        <div className="drawer-status">{schemaStatus}</div>

        <div className="niche-stack">
          {niches.map((niche) => {
            const Icon = nicheIcon(niche.id);
            const count = optionCount(niche);
            return (
              <motion.button
                type="button"
                className={`drawer-niche ${niche.id === currentNicheId ? 'active' : ''}`}
                key={niche.id}
                onClick={() => onChoose(niche.id)}
                whileHover={{ x: open ? 4 : 0, scale: open ? 1 : 1.08 }}
                whileTap={{ scale: 0.97 }}
              >
                <Icon size={25} />
                <AnimatePresence>
                  {open && (
                    <motion.span
                      className="drawer-label"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                    >
                      <strong>{niche.label}</strong>
                      <small>{count} Options</small>
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.aside>
  );
}

function SchemaForm({ schema, niche, selection, selectedCount, context, onSelect, onContext, onGenerate, outputState }) {
  const sections = [
    ['Tasks', 'tasks', niche.tasks, 'single'],
    ['Target Audience', 'target_audience', niche.target_audience, 'single'],
    ['Platform', 'platform', niche.platforms, 'single'],
    ['Goal', 'goal_type', niche.goal_types, 'single'],
    ['Constraints', 'constraints', niche.constraints, 'multi'],
    ['Output Format', 'output_format', niche.output_formats, 'single'],
    ['Tone', 'tone', (schema.global.tones || []).map((item) => item.label || item), 'single'],
    ['Length', 'length', (schema.global.lengths || []).map((item) => item.label || item), 'single'],
  ];

  return (
    <div className="schema-form">
      <span className={`selection-pill ${selectedCount ? 'active' : ''}`}>{selectedCount} selected</span>
      {sections.map(([title, key, items, mode]) => (
        <OptionSection
          key={key}
          title={title}
          keyName={key}
          items={items || []}
          mode={mode}
          selection={selection}
          onSelect={onSelect}
        />
      ))}

      <div className="option-section best-practice-section">
        <h2>Best Practices</h2>
        <div className="chip-row">
          {(niche.best_practices || []).map((item) => (
            <motion.span
              className="best-chip"
              key={item}
              whileHover={{ y: -3, scale: 1.02 }}
            >
              {item}
            </motion.span>
          ))}
        </div>
      </div>

      <div className="option-section">
        <h2>Context</h2>
        <MotionField>
          <textarea
            rows={7}
            value={context}
            onChange={(event) => onContext(event.target.value)}
            placeholder="launch a new Ai writing tool for small Saas teams"
          />
        </MotionField>
      </div>

      <div className="generate-row">
        <MotionButton className="gradient-button" onClick={onGenerate} disabled={outputState === 'loading'}>
          <Sparkles size={20} />
          {outputState === 'loading' ? 'Generating' : 'Generate Prompt'}
        </MotionButton>
      </div>
    </div>
  );
}

function OptionSection({ title, keyName, items, mode, selection, onSelect }) {
  if (!items.length) return null;

  return (
    <motion.section className="option-section" layout>
      <h2>{title}</h2>
      <div className="chip-row">
        {items.map((item) => {
          const value = String(item);
          const selected = mode === 'multi'
            ? (selection[keyName] || []).includes(value)
            : selection[keyName] === value;
          return (
            <Chip
              key={value}
              selected={selected}
              onClick={() => onSelect(keyName, value, mode)}
            >
              {value}
            </Chip>
          );
        })}
      </div>
    </motion.section>
  );
}

function OutputPanel({ output, state, onCopy }) {
  return (
    <motion.aside
      className="output-panel"
      initial={{ opacity: 0, x: 36 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...motionTokens.page, delay: 0.1 }}
    >
      <div className="output-head">
        <div>
          <p>Output</p>
          <h2>Optimized Prompt</h2>
        </div>
        <IconMotionButton onClick={onCopy} ariaLabel="Copy optimized prompt">
          <Copy size={28} />
        </IconMotionButton>
      </div>
      <div className="output-box">
        <AnimatePresence mode="wait">
          {state === 'loading' && <SkeletonLoader key="loader" />}
          {state === 'empty' && (
            <motion.p
              key="empty"
              className="output-empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              Select Options, add context the<br />generate an optimized prompt
            </motion.p>
          )}
          {state === 'output' && (
            <motion.pre
              key="output"
              className="prompt-result"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {output}
            </motion.pre>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}

function SkeletonLoader() {
  return (
    <motion.div
      className="skeleton-loader"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {[34, 92, 78, 64, 48, 100, 86, 72].map((width, index) => (
        <span className="skeleton-line" style={{ width: `${width}%` }} key={index}>
          <motion.i
            animate={{ x: ['-120%', '120%'] }}
            transition={{ duration: 1.12, repeat: Infinity, ease: 'linear', delay: index * 0.05 }}
          />
        </span>
      ))}
    </motion.div>
  );
}

function OptionModal({ currentNiche, onClose, onSave }) {
  const [field, setField] = useState('tasks');
  const [value, setValue] = useState('');

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.form
        className="modal-card"
        initial={{ opacity: 0, y: 32, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={motionTokens.modal}
        onSubmit={(event) => {
          event.preventDefault();
          onSave(field, value);
        }}
      >
        <div className="modal-head">
          <h2>Add Option</h2>
          <IconMotionButton onClick={onClose} ariaLabel="Close add option modal" type="button">
            <X size={24} />
          </IconMotionButton>
        </div>
        <label className="field-label">
          <span>Field</span>
          <MotionField>
            <select value={field} onChange={(event) => setField(event.target.value)}>
              <option value="tasks">Tasks</option>
              <option value="target_audience">Target audience</option>
              <option value="platforms">Platform</option>
              <option value="goal_types">Goal</option>
              <option value="constraints">Constraints</option>
              <option value="output_formats">Output format</option>
            </select>
          </MotionField>
        </label>
        <label className="field-label">
          <span>Option</span>
          <MotionField>
            <input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={`Add a ${currentNiche.label} option`}
            />
          </MotionField>
        </label>
        <div className="modal-actions">
          <MotionButton className="soft-action" type="button" onClick={onClose}>Cancel</MotionButton>
          <MotionButton className="gradient-button" type="submit"><Check size={20} />Save</MotionButton>
        </div>
      </motion.form>
    </motion.div>
  );
}

function HistoryPage({ history, onBuilder }) {
  return (
    <section className="simple-shell">
      <div className="simple-head">
        <h1>History</h1>
        <p>Recent prompts stay close at hand for reuse and refinement.</p>
      </div>
      <div className="history-grid">
        {(history.length ? history : demoHistory).map((item, index) => (
          <motion.article
            className="history-card"
            key={item.id || index}
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...motionTokens.page, delay: index * 0.04 }}
            whileHover={{ y: -5, scale: 1.01 }}
          >
            <h2>{item.niche_id || item.title || 'Marketing Prompt'}</h2>
            <p>{item.optimized_prompt || item.body}</p>
            <div className="history-actions">
              <MotionButton className="soft-action" onClick={onBuilder}>Open Builder</MotionButton>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function BlogsPage() {
  return (
    <section className="simple-shell">
      <div className="simple-head">
        <h1>Blogs</h1>
        <p>Prompt strategy notes, AI writing examples, and reusable workflow ideas.</p>
      </div>
      <div className="blog-grid">
        {['Prompt Clarity Framework', 'Better AI Outputs', 'Reusable Briefs'].map((title, index) => (
          <motion.article
            className="blog-card"
            key={title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...motionTokens.page, delay: index * 0.05 }}
            whileHover={{ y: -6, scale: 1.012 }}
          >
            <div className="blog-art"><Sparkles size={52} /></div>
            <h2>{title}</h2>
            <p>Practical guidance for turning broad instructions into precise prompt systems.</p>
            <MotionButton className="soft-action">Read More <ArrowRight size={18} /></MotionButton>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function ContactPage({ onToast }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  return (
    <section className="simple-shell contact-page">
      <div className="simple-head">
        <h1>Contact us</h1>
        <p>Share your prompt workflow, automation goal, or product idea with Dagenticx.</p>
      </div>
      <motion.form
        className="contact-motion-card"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={(event) => {
          event.preventDefault();
          onToast('Message prepared');
        }}
      >
        <label className="field-label">
          <span>Full Name</span>
          <MotionField>
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Full Name" />
          </MotionField>
        </label>
        <label className="field-label">
          <span>Email</span>
          <MotionField>
            <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email" />
          </MotionField>
        </label>
        <label className="field-label">
          <span>Message</span>
          <MotionField>
            <textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Tell us how we can help you?" />
          </MotionField>
        </label>
        <MotionButton className="gradient-button" type="submit"><Send size={20} />Send Email</MotionButton>
      </motion.form>
    </section>
  );
}

function MotionButton({ children, className = '', disabled = false, type = 'button', ...props }) {
  return (
    <motion.button
      type={type}
      className={className}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.035, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.975 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

function IconMotionButton({ children, ariaLabel, type = 'button', ...props }) {
  return (
    <motion.button
      type={type}
      className="icon-motion-button"
      aria-label={ariaLabel}
      whileHover={{ scale: 1.08, y: -1 }}
      whileTap={{ scale: 0.94 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

function Chip({ children, selected, onClick }) {
  return (
    <motion.button
      type="button"
      className={`chip ${selected ? 'selected' : ''}`}
      onClick={onClick}
      layout
      whileHover={{ y: -3, scale: 1.025 }}
      whileTap={{ scale: 0.965 }}
    >
      {children}
    </motion.button>
  );
}

function MotionField({ children }) {
  const [focused, setFocused] = useState(false);
  return (
    <motion.div
      className="motion-field"
      animate={{
        borderColor: focused ? '#b75b7d' : '#e7e5e7',
        boxShadow: focused ? '0 10px 28px rgba(176, 77, 115, 0.18)' : '0 5px 12px rgba(21, 21, 24, 0.08)',
      }}
      transition={motionTokens.fastHover}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
    >
      {children}
    </motion.div>
  );
}

function Toast({ toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          className={`toast ${toast.tone === 'error' ? 'error' : ''}`}
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={motionTokens.fastHover}
        >
          {toast.tone === 'error' ? <X size={18} /> : <Check size={18} />}
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function getRouteFromHash() {
  const route = window.location.hash.replace(/^#\/?/, '').replace(/\/$/, '');
  if (['builder', 'blogs', 'history', 'contact'].includes(route)) return route;
  return 'home';
}

async function apiJson(path, options = {}) {
  const response = await fetch(path, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(data.detail || 'Request failed');
  return data;
}

function normalizeSchema(data) {
  if (!data?.niches?.length) return fallbackSchema;
  return {
    ...data,
    niches: data.niches.map((niche) => ({
      ...niche,
      label: normalizeLabel(niche.label),
      tasks: titleList(niche.tasks),
      target_audience: titleList(niche.target_audience),
      platforms: titleList(niche.platforms),
      goal_types: titleList(niche.goal_types),
      constraints: titleList(niche.constraints),
      output_formats: titleList(niche.output_formats),
    })),
  };
}

function normalizeLabel(label) {
  if (!label) return 'Prompt';
  if (label.toLowerCase() === 'saas') return 'SaaS';
  if (label.toLowerCase() === 'real estate') return 'Real Estate';
  if (label.toLowerCase() === 'e-commerce') return 'E-Commerce';
  return label;
}

function titleList(items = []) {
  return items.map((item) => String(item).replace(/\b\w/g, (char) => char.toUpperCase()).replace('Ai ', 'AI '));
}

function optionCount(niche) {
  return ['tasks', 'constraints', 'output_formats', 'target_audience', 'platforms', 'goal_types']
    .reduce((count, key) => count + (niche[key]?.length || 0), 0);
}

function nicheIcon(id) {
  if (id === 'marketing') return BarChart3;
  if (id === 'saas') return Cloud;
  if (id === 'education') return GraduationCap;
  if (id === 'e-commerce') return ShoppingCart;
  if (id === 'real-estate') return Home;
  return Sparkles;
}

function localPrompt(niche, selection, context) {
  const lines = [
    `Act as an expert ${niche.label} prompt strategist.`,
    '',
    `Create a ${selection.length || 'Detailed'} prompt for: ${selection.task || 'a focused project brief'}.`,
    `Audience: ${selection.target_audience || 'the intended users'}.`,
    `Platform: ${selection.platform || 'the best-fit channel'}.`,
    `Goal: ${selection.goal_type || 'clearer, higher-quality output'}.`,
    `Tone: ${selection.tone || 'Professional'}.`,
    `Format: ${selection.output_format || 'Structured sections with actionable detail'}.`,
  ];

  if (selection.constraints?.length) {
    lines.push(`Constraints: ${selection.constraints.join(', ')}.`);
  }

  if (context?.trim()) {
    lines.push('', `Context: ${context.trim()}`);
  }

  lines.push('', 'Return the final prompt with clear instructions, useful context, and practical guardrails.');
  return lines.join('\n');
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

const demoHistory = [
  { title: 'Marketing Prompt', body: 'Launch a new AI writing tool for small SaaS teams with clear CTA variations.' },
  { title: 'Education Prompt', body: 'Create a lesson plan with learning objectives, examples, and review questions.' },
  { title: 'Real Estate Prompt', body: 'Write a compliant listing description with location benefits and next steps.' },
];

createRoot(document.getElementById('root')).render(<App />);

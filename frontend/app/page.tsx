"use client";

import { useMemo, useState } from "react";

type Product = {
  id: number;
  category: string;
  family: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  image: string;
  tag?: string;
};

type Intervention = {
  id: "clarify" | "value" | "trust" | "fit";
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  customerMessage: string;
};

type AnalysisResult = {
  barrier: string;
  confidence: number;
  diagnosis: string;
  evidence: string[];
  interventionId: Intervention["id"];
};

type PageName = "home" | "products" | "cart" | "payments";
type Outcome = "positive" | "uncertain" | "unresolved" | null;
type RevealStep = 0 | 1 | 2 | 3 | 4;

const products: Product[] = [
  { id: 1, category: "Computers", family: "laptop", name: "ProBook Ultra 15", description: "16GB RAM, 512GB SSD and a powerful all-day processor.", price: 65000, rating: 4.8, image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=88", tag: "Popular choice" },
  { id: 2, category: "Computers", family: "laptop", name: "ProBook Air 14", description: "16GB RAM, 512GB SSD in a lighter everyday design.", price: 54999, rating: 4.7, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=88", tag: "Better value" },
  { id: 3, category: "Computers", family: "laptop", name: "ProBook Core 14", description: "8GB RAM, 512GB SSD for work, study and daily productivity.", price: 46999, rating: 4.6, image: "https://images.unsplash.com/photo-1504707748692-419802cf939d?auto=format&fit=crop&w=1200&q=88", tag: "Budget pick" },
  { id: 4, category: "Smartphones", family: "phone", name: "Nova X Pro", description: "AMOLED display, 12GB RAM and a professional camera system.", price: 42000, rating: 4.7, image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=88", tag: "Best seller" },
  { id: 5, category: "Smartphones", family: "phone", name: "Nova X", description: "Bright display, reliable cameras and smooth daily performance.", price: 34999, rating: 4.6, image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=88", tag: "Better value" },
  { id: 6, category: "Smartphones", family: "phone", name: "Nova Lite", description: "Balanced performance and camera quality at a lower price.", price: 26999, rating: 4.5, image: "https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&w=1200&q=88", tag: "Budget pick" },
  { id: 7, category: "Audio", family: "headphones", name: "Studio Max Headphones", description: "Active noise cancellation and premium immersive sound.", price: 12999, rating: 4.6, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=88", tag: "Top rated" },
  { id: 8, category: "Audio", family: "headphones", name: "Studio Air Headphones", description: "Comfortable wireless audio with long battery life.", price: 9999, rating: 4.5, image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=88", tag: "Better fit" },
  { id: 9, category: "Audio", family: "headphones", name: "Studio Go Headphones", description: "Clean sound and everyday comfort at a lower price.", price: 6999, rating: 4.4, image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=88", tag: "Lower price" },
  { id: 10, category: "Wearables", family: "watch", name: "Pulse Pro Watch", description: "GPS, health tracking and advanced fitness insights.", price: 18999, rating: 4.5, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=88", tag: "Popular choice" },
  { id: 11, category: "Wearables", family: "watch", name: "Pulse Fit Watch", description: "Essential health tracking and workout features.", price: 13999, rating: 4.4, image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=1200&q=88", tag: "Great value" },
  { id: 12, category: "Photography", family: "camera", name: "Vision Pro Camera", description: "4K recording, advanced autofocus and precision controls.", price: 58999, rating: 4.9, image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=88", tag: "Creator pick" },
  { id: 13, category: "Photography", family: "camera", name: "Vision Air Camera", description: "Sharp photos, 4K video and an easier everyday setup.", price: 44999, rating: 4.7, image: "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=1200&q=88", tag: "Better value" },
  { id: 14, category: "Workspace", family: "monitor", name: "UltraView Pro Monitor", description: "4K display, HDR and smooth high-refresh visuals.", price: 24999, rating: 4.7, image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=88", tag: "Work setup" },
  { id: 15, category: "Workspace", family: "monitor", name: "UltraView Essential", description: "Crisp 2K workspace display for work and study.", price: 17999, rating: 4.5, image: "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=1200&q=88", tag: "Lower price" },
];

const interventions: Intervention[] = [
  { id: "clarify", eyebrow: "Clarify", title: "Clarify what matters most", description: "Ask one focused question before making assumptions about the hesitation.", action: "Collect the missing context needed to recommend the most useful next step.", customerMessage: "Tell me which part of this decision matters most to you right now." },
  { id: "value", eyebrow: "Show value", title: "Connect features to your needs", description: "Explain the product through the practical value it provides for the customer.", action: "Highlight only the features that directly connect to the customer's stated needs.", customerMessage: "I can show you which features are most useful for your needs and why." },
  { id: "trust", eyebrow: "Build confidence", title: "Reduce uncertainty", description: "Use relevant reliability, review and protection information to make the choice clearer.", action: "Provide the evidence needed to make the purchase feel more confident.", customerMessage: "I can show you reliability details, reviews and protection information before you decide." },
  { id: "fit", eyebrow: "Better fit", title: "Find a better match", description: "Compare similar products that better fit the customer's budget or priorities.", action: "Show suitable alternatives instead of repeatedly pushing the same product.", customerMessage: "I can help you compare suitable options and find one that better matches your budget and requirements." },
];

const formatPrice = (price: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

const featureNeedMap: Record<string, Array<{ feature: string; need: string }>> = {
  laptop: [
    { feature: "16GB RAM", need: "Useful for multitasking, study and heavier everyday workloads." },
    { feature: "512GB SSD", need: "Gives you fast access to files, apps and enough everyday storage." },
    { feature: "All-day performance", need: "Supports longer work sessions without focusing only on benchmark numbers." },
  ],
  phone: [
    { feature: "Bright / AMOLED display", need: "Useful when screen clarity matters for media, reading and everyday use." },
    { feature: "Camera system", need: "Useful when photography or video is one of your priorities." },
    { feature: "Smooth daily performance", need: "Useful for apps, communication and regular multitasking." },
  ],
  headphones: [
    { feature: "Noise cancellation", need: "Useful when you want fewer distractions while listening or working." },
    { feature: "Wireless comfort", need: "Useful for longer everyday listening without cable management." },
    { feature: "Long battery life", need: "Useful when you want fewer charging interruptions." },
  ],
  watch: [
    { feature: "Health tracking", need: "Useful when everyday health awareness is a priority." },
    { feature: "Workout features", need: "Useful when you want activity data while exercising." },
    { feature: "GPS", need: "Useful for location-aware workouts and outdoor activity." },
  ],
  camera: [
    { feature: "4K recording", need: "Useful when high-resolution video is important to your work or content." },
    { feature: "Autofocus", need: "Useful when you want easier, faster subject capture." },
    { feature: "Precision controls", need: "Useful when you want more control over how you create images." },
  ],
  monitor: [
    { feature: "High-resolution display", need: "Useful when text, visuals and workspace clarity matter." },
    { feature: "HDR visuals", need: "Useful when richer contrast and visual detail are important." },
    { feature: "Smooth refresh", need: "Useful when you want a more fluid everyday screen experience." },
  ],
};

function getFeatureNeedPairs(product: Product) {
  return featureNeedMap[product.family] ?? [
    { feature: product.description.split(".")[0], need: "Connect this specification to the customer's actual priority." },
    { feature: "Everyday usability", need: "Focus on how the product supports the customer's real use case." },
    { feature: "Overall fit", need: "Compare the practical benefit with what the customer said they need." },
  ];
}

function getTrustSignals(product: Product) {
  return [
    { label: "Customer rating", value: `${product.rating}/5`, detail: "A visible review signal to consider before committing." },
    { label: "Product information", value: "Clear specs", detail: product.description },
    { label: "Decision control", value: "Reassess anytime", detail: "The customer can compare, ask AI again or change direction before payment." },
  ];
}


function getAnalysis(text: string, product: Product): AnalysisResult {
  const value = text.toLowerCase();
  const budget = ["expensive", "price", "cost", "budget", "afford", "cheap", "costly", "₹", "rupees", "money"];
  const trust = ["trust", "reliable", "review", "warranty", "quality", "safe", "risk", "durable", "worried"];
  const worth = ["worth", "value", "need", "feature", "useful", "benefit", "why", "overpriced"];

  if (budget.some((word) => value.includes(word))) {
    return {
      barrier: "Budget concern", confidence: 92,
      diagnosis: `You still appear interested in ${product.name}, but ${formatPrice(product.price)} may not fit comfortably within your budget. A similar lower-cost option is more useful than automatically pushing a discount.`,
      evidence: ["Price or affordability language was detected.", "Interest in the product is still present.", "Financial fit appears to be the strongest hesitation."],
      interventionId: "fit",
    };
  }
  if (trust.some((word) => value.includes(word))) {
    return {
      barrier: "Confidence concern", confidence: 89,
      diagnosis: `You seem to need more confidence before committing to ${product.name}. Relevant reliability, review or protection information may make the decision clearer.`,
      evidence: ["Uncertainty or reliability-related language was detected.", "The hesitation is about confidence rather than product discovery.", "Additional evidence may reduce the concern."],
      interventionId: "trust",
    };
  }
  if (worth.some((word) => value.includes(word))) {
    return {
      barrier: "Value concern", confidence: 86,
      diagnosis: `The practical value of ${product.name} is not yet fully clear. Connecting the most relevant features to your actual needs is the most useful next step.`,
      evidence: ["The message questions usefulness or value.", "The product's features should be connected to the customer's needs.", "A focused explanation may help more than a generic sales response."],
      interventionId: "value",
    };
  }
  return {
    barrier: "More context needed", confidence: 74,
    diagnosis: "There is not enough information to confidently assume one exact reason. One focused question is safer than giving an unrelated recommendation.",
    evidence: ["The message does not strongly match one concern category.", "More than one reason may be contributing.", "One focused question can make the recommendation more precise."],
    interventionId: "clarify",
  };
}

export default function Page() {
  const [activePage, setActivePage] = useState<PageName>("home");
  const [darkMode, setDarkMode] = useState(false);
  const [cart, setCart] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(products[0]);
  const [concern, setConcern] = useState("I like this laptop, but ₹65,000 feels expensive for my budget.");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [recommendedIntervention, setRecommendedIntervention] = useState<Intervention | null>(null);
  const [activeIntervention, setActiveIntervention] = useState<Intervention | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [revealStep, setRevealStep] = useState<RevealStep>(0);
  const [customerResponse, setCustomerResponse] = useState("");
  const [isResponseAnalyzing, setIsResponseAnalyzing] = useState(false);
  const [responseAnalysis, setResponseAnalysis] = useState("");
  const [responseOutcome, setResponseOutcome] = useState<Outcome>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentPin, setPaymentPin] = useState("");
  const [clarifyFocus, setClarifyFocus] = useState("");

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price, 0), [cart]);

  const alternatives = useMemo(() => {
    if (!selectedProduct) return [];
    const familyProducts = products
      .filter((product) => product.family === selectedProduct.family && product.id !== selectedProduct.id)
      .sort((a, b) => a.price - b.price);
    const lower = familyProducts.filter((product) => product.price < selectedProduct.price).sort((a, b) => b.price - a.price);
    const close = familyProducts.filter((product) => product.price >= selectedProduct.price);
    const result = [...lower.slice(0, 3), ...close.slice(0, 1)].slice(0, 3);
    return result.length ? result : products.filter((product) => product.id !== selectedProduct.id).slice(0, 3);
  }, [selectedProduct]);

  function goTo(page: PageName) {
    setActivePage(page);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  }

  function addToCart(product: Product) {
    setCart((current) => current.some((item) => item.id === product.id) ? current : [...current, product]);
    setSelectedProduct(product);
  }

  function buyNow(product: Product) {
    setSelectedProduct(product);
    setCart((current) => current.some((item) => item.id === product.id) ? current : [...current, product]);
    goTo("payments");
  }

  function removeFromCart(id: number) {
    setCart((current) => current.filter((item) => item.id !== id));
  }

  function askAI(product: Product) {
    setSelectedProduct(product);
    setConcern(`I like ${product.name}, but ${formatPrice(product.price)} feels expensive for my budget.`);
    setAnalysis(null);
    setRecommendedIntervention(null);
    setActiveIntervention(null);
    setRevealStep(0);
    goTo("cart");
    setTimeout(() => document.getElementById("decision-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
  }

  function startDecision(product?: Product) {
    if (product) askAI(product);
    else goTo("cart");
  }

  function chooseAlternative(product: Product, openAI = false) {
    setSelectedProduct(product);
    addToCart(product);
    setConcern(`I am considering ${product.name}. Help me understand if it is a better fit for my needs and budget.`);
    if (openAI) askAI(product);
  }

  function analyzeConcern() {
    if (!selectedProduct || !concern.trim()) return;
    setAnalysis(null);
    setRecommendedIntervention(null);
    setActiveIntervention(null);
    setCustomerResponse("");
    setResponseAnalysis("");
    setResponseOutcome(null);
    setRevealStep(0);
    setIsAnalyzing(true);

    const result = getAnalysis(concern, selectedProduct);
    const intervention = interventions.find((item) => item.id === result.interventionId) ?? interventions[0];

    setTimeout(() => {
      setAnalysis(result);
      setIsAnalyzing(false);
      setRevealStep(1);
      setTimeout(() => setRevealStep(2), 500);
      setTimeout(() => {
        setRecommendedIntervention(intervention);
        setRevealStep(3);
      }, 1100);
      setTimeout(() => {
        setActiveIntervention(intervention);
        setRevealStep(4);
      }, 1650);
    }, 1200);
  }

  function chooseIntervention(item: Intervention) {
    setActiveIntervention(item);
    setCustomerResponse("");
    setResponseAnalysis("");
    setResponseOutcome(null);
    setClarifyFocus("");
  }

  function chooseClarifyFocus(focus: string) {
    setClarifyFocus(focus);
    setCustomerResponse(`The main thing that matters most to me is ${focus.toLowerCase()}.`);
    setResponseAnalysis("");
    setResponseOutcome(null);
  }

  function analyzeResponse() {
    const value = customerResponse.toLowerCase().trim();
    if (!value) return;
    setIsResponseAnalyzing(true);
    setResponseAnalysis("");
    setResponseOutcome(null);

    setTimeout(() => {
      const unresolvedWords = ["still", "expensive", "too much", "not sure", "worried", "problem", "cannot", "can't", "dont", "don't"];
      const positiveWords = ["helped", "helpful", "better", "ready", "buy", "purchase", "works", "good", "okay", "yes", "comfortable", "satisfied", "clear", "resolved", "happy"];
      if (unresolvedWords.some((word) => value.includes(word))) {
        setResponseOutcome("unresolved");
        setResponseAnalysis("The concern is still active. Reassessing the decision or trying another suitable option is more useful than repeating the same intervention.");
      } else if (positiveWords.some((word) => value.includes(word))) {
        setResponseOutcome("positive");
        setResponseAnalysis("Good progress. The concern appears to have reduced, so you can continue confidently or make one final comparison before payment.");
      } else {
        setResponseOutcome("uncertain");
        setResponseAnalysis("Your response adds useful context, but one more detail may help the system recommend the most precise next step.");
      }
      setIsResponseAnalyzing(false);
    }, 1000);
  }

  function selectPayment(method: string) {
    setPaymentMethod(method);
    setShowCheckout(true);
    setPaymentSuccess(false);
    setPaymentPin("");
  }

  function completeDemoPayment() {
    setPaymentSuccess(true);
  }

  return (
    <main className={`app ${darkMode ? "dark" : ""}`}>
      <header className="topbar">
        <div className="container nav">
          <button className="brand" onClick={() => goTo("home")} aria-label="DecisionCommerce home">
            <span className="brand-mark">✦</span>
            <span>Decision<span>Commerce</span></span>
          </button>

          <nav className="nav-links" aria-label="Primary navigation">
            {([["home", "Home"], ["products", "Products"], ["cart", "Decision Space"], ["payments", "Payments"]] as [PageName, string][]).map(([page, label]) => (
              <button key={page} className={`nav-link ${activePage === page ? "active" : ""}`} onClick={() => goTo(page)}>{label}</button>
            ))}
          </nav>

          <button className="theme-button" onClick={() => setDarkMode((value) => !value)} aria-label="Toggle dark mode">
            <span>{darkMode ? "☀" : "◐"}</span>
          </button>
        </div>
      </header>

      {activePage === "home" && (
        <>
          <section className="hero">
            <div className="hero-wash wash-one" />
            <div className="hero-wash wash-two" />
            <div className="container hero-grid">
              <div className="hero-copy">
                <p className="eyebrow">AI-ASSISTED DECISION COMMERCE</p>
                <h1>Shop with more <span>clarity.</span></h1>
                <p className="hero-description">DecisionCommerce helps customers understand why a purchase feels difficult, then recommends the most useful next step instead of automatically pushing a discount.</p>
                <div className="hero-actions">
                  <button className="primary-button" onClick={() => goTo("products")}>Explore products <span>→</span></button>
                  <button className="secondary-button" onClick={() => startDecision(products[0])}>Try decision support <span>✦</span></button>
                </div>
                <div className="hero-stats">
                  <div><strong>15</strong><span>Curated products</span></div>
                  <div><strong>AI</strong><span>Decision support</span></div>
                  <div><strong>Smart</strong><span>Better-match guidance</span></div>
                </div>
              </div>

              <div className="hero-visual">
                <div className="orb orb-one" />
                <div className="orb orb-two" />
                <article className="preview-card">
                  <div className="preview-top">
                    <div><span className="preview-label">DECISION ASSISTANT</span><h2>What can help you decide?</h2></div>
                    <span className="status-dot">Ready</span>
                  </div>
                  <div className="preview-steps">
                    <div><span>01</span><p>Share what is making the decision difficult</p></div>
                    <div><span>02</span><p>Understand the likely concern and evidence</p></div>
                    <div><span>03</span><p>Choose the minimum useful next step</p></div>
                  </div>
                </article>
                <div className="floating-insight"><span className="mini-dot" />Diagnose before acting.</div>
                <div className="floating-chip chip-pink">Better decisions</div>
                <div className="floating-chip chip-blue">Evidence first</div>
              </div>
            </div>
          </section>

          <section className="section approach-section">
            <div className="container home-value-panel">
              <div className="section-heading">
                <div><p className="eyebrow">BUILT FOR CLEARER PURCHASES</p><h2>Products, support and a better next step.</h2></div>
                <p>Explore attractive products, understand the reason behind hesitation and move forward with a recommendation that actually fits the customer.</p>
              </div>
              <div className="approach-grid home-highlights">
                {[["15", "Explore products", "A polished collection with realistic visuals, ratings, prices and meaningful alternatives."], ["AI", "Understand the concern", "See the likely hesitation, confidence and evidence before choosing an intervention."], ["✓", "Move forward clearly", "Find a better match, check progress and continue naturally to checkout when ready."]].map(([number, title, description]) => (
                  <article className="approach-card" key={title}><span className="step-number">{number}</span><h3>{title}</h3><p>{description}</p></article>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {activePage === "products" && (
        <section className="section products-section">
          <div className="container">
            <div className="section-heading product-heading">
              <div><p className="eyebrow">PRODUCT DISCOVERY</p><h2>Find what fits you.</h2><p>Browse 15 products with similar alternatives at different price points.</p></div>
              <button className="cart-pill" onClick={() => goTo("cart")}>🛒 {cart.length} {cart.length === 1 ? "item" : "items"}</button>
            </div>

            <div className="product-grid">
              {products.map((product) => {
                const inCart = cart.some((item) => item.id === product.id);
                return (
                  <article key={product.id} className={`product-card ${selectedProduct?.id === product.id ? "selected" : ""}`} onClick={() => setSelectedProduct(product)}>
                    <div className="product-media">
                      <img src={product.image} alt={product.name} loading="lazy" />
                      {product.tag && <span className="product-tag">{product.tag}</span>}
                      <span className="rating-badge">★ {product.rating}</span>
                    </div>
                    <div className="product-body">
                      <p className="product-category">{product.category}</p>
                      <h3>{product.name}</h3>
                      <p className="product-description">{product.description}</p>
                      <div className="product-footer">
                        <strong>{formatPrice(product.price)}</strong>
                        <div className="product-actions">
                          <button className={`small-button ${inCart ? "added" : ""}`} onClick={(event) => { event.stopPropagation(); addToCart(product); }}>{inCart ? "Added ✓" : "Add to cart"}</button>
                          <button className="small-button" onClick={(event) => { event.stopPropagation(); buyNow(product); }}>Buy →</button>
                          <button className="ask-button" onClick={(event) => { event.stopPropagation(); askAI(product); }}>Ask AI ✦</button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {activePage === "cart" && (
        <section className="section decision-section">
          <div className="container">
            <div className="section-heading decision-heading">
              <div><p className="eyebrow">YOUR DECISION SPACE</p><h2>Take your time. Decide with clarity.</h2><p>Review what you are considering and explain what is making the decision difficult.</p></div>
            </div>

            <div className="cart-layout">
              <section className="cart-panel">
                {cart.length === 0 ? (
                  <div className="empty-cart"><span>🛒</span><h3>Your cart is ready when you are.</h3><p>Add a product, then use Decision Support to understand any hesitation.</p><button className="secondary-button" onClick={() => goTo("products")}>Explore products</button></div>
                ) : cart.map((product) => (
                  <article className="cart-item" key={product.id}>
                    <img src={product.image} alt="" />
                    <div><p>{product.category}</p><h3>{product.name}</h3><strong>{formatPrice(product.price)}</strong></div>
                    <div className="cart-item-actions"><button className="text-button" onClick={() => askAI(product)}>Get support</button><button className="small-button" onClick={() => buyNow(product)}>Buy →</button><button className="remove-button" onClick={() => removeFromCart(product.id)} aria-label={`Remove ${product.name}`}>×</button></div>
                  </article>
                ))}
              </section>

              <aside className="cart-summary">
                <p className="summary-label">DECISION SUMMARY</p>
                <h3>{selectedProduct ? selectedProduct.name : "Choose a product"}</h3>
                <strong className="summary-price">{selectedProduct ? formatPrice(selectedProduct.price) : formatPrice(total)}</strong>
                <p>Before payment, use the decision assistant to understand and resolve what is making the purchase difficult.</p>
                <button className="primary-button full-width" onClick={() => selectedProduct && askAI(selectedProduct)}>Get decision support <span>→</span></button>
                <button className="secondary-button full-width" onClick={() => selectedProduct && goTo("payments")}>Continue to payment <span>→</span></button>
              </aside>
            </div>

            <section id="decision-workspace" className="ai-workspace">
              <div className="workspace-header">
                <div><p className="eyebrow">DECISION ASSISTANT</p><h2>What is making this decision difficult?</h2><p>Share your concern. The system will understand the likely reason, show supporting evidence and recommend the minimum useful intervention.</p></div>
                {selectedProduct && <article className="selected-product-card"><img src={selectedProduct.image} alt="" /><div><p>Currently reviewing</p><strong>{selectedProduct.name}</strong><b>{formatPrice(selectedProduct.price)}</b></div></article>}
              </div>

              <div className="concern-card">
                <label htmlFor="concern">Your concern</label>
                <textarea id="concern" rows={5} value={concern} onChange={(event) => setConcern(event.target.value)} />
                <div className="concern-footer"><span>Describe what is making the decision difficult in your own words.</span><button className="primary-button" disabled={!selectedProduct || !concern.trim() || isAnalyzing} onClick={analyzeConcern}>{isAnalyzing ? <><span className="button-spinner" />Understanding your concern...</> : <>Understand my concern <span>→</span></>}</button></div>
              </div>

              {isAnalyzing && <div className="analysis-loading"><span className="loader-ring" /><div><strong>Understanding your concern...</strong><p>Reading the product context and looking for the strongest decision signal.</p></div></div>}

              {analysis && (
                <div id="ai-result" className="analysis-results">
                  <section className={`result-block concern-result ${revealStep >= 1 ? "visible" : ""}`}>
                    <div className="result-icon">AI</div>
                    <div className="result-main"><p className="result-kicker">WHAT WE UNDERSTOOD</p><span className="muted-label">Likely decision concern</span><h3>{analysis.barrier}</h3><div className="confidence-row"><strong>{analysis.confidence}%</strong><span>confidence estimate</span><div className="confidence-track"><i style={{ width: `${analysis.confidence}%` }} /></div></div></div>
                    <p className="diagnosis-copy">{analysis.diagnosis}</p>
                  </section>

                  <section className={`result-block evidence-block ${revealStep >= 2 ? "visible" : ""}`}>
                    <div className="evidence-heading"><div><p className="result-kicker">WHY WE THINK THIS</p><h3>Signals from your message</h3></div><span>EVIDENCE</span></div>
                    <div className="evidence-list">{analysis.evidence.map((item, index) => <div key={item} style={{ animationDelay: `${index * 110}ms` }}><span>✓</span>{item}</div>)}</div>
                  </section>

                  {recommendedIntervention && <section className={`result-block recommendation ${revealStep >= 3 ? "visible" : ""}`}>
                    <div><p className="result-kicker">AI RECOMMENDATION</p><span className="intervention-eyebrow">{recommendedIntervention.eyebrow}</span><h3>{recommendedIntervention.title}</h3><p>{recommendedIntervention.description}</p></div>
                    <div className="recommendation-reason"><span>Why this intervention?</span><p>{recommendedIntervention.action}</p></div>
                  </section>}

                  <section className={`intervention-stage ${revealStep >= 4 ? "visible" : ""}`}>
                    <div className="stage-heading"><p className="eyebrow">CHOOSE THE NEXT ACTION</p><h2>You stay in control.</h2><p>The AI recommendation is highlighted, but you can choose another intervention if it makes more sense.</p></div>
                    <div className="intervention-grid">
                      {interventions.map((item) => <button key={item.id} className={`intervention-card ${item.id === recommendedIntervention?.id ? "recommended" : ""} ${item.id === activeIntervention?.id ? "active" : ""} accent-${item.id}`} onClick={() => chooseIntervention(item)}><div><span>{item.eyebrow}</span>{item.id === recommendedIntervention?.id && <b>AI pick</b>}</div><h3>{item.title}</h3><p>{item.description}</p></button>)}
                    </div>
                  </section>

                  {activeIntervention && <section className="apply-stage">
                    <div className="next-step-copy"><p className="result-kicker">YOUR NEXT STEP</p><h3>{activeIntervention.title}</h3><p>{activeIntervention.action}</p></div>
                    <div className="suggested-response"><span>SUGGESTED RESPONSE</span><p>“{activeIntervention.customerMessage}”</p></div>

                    {activeIntervention.id === "clarify" && (
                      <div className="alternative-list">
                        <div className="alternative-heading">
                          <div><p className="result-kicker">CLARIFY THE DECISION</p><h3>What matters most right now?</h3></div>
                          <p>Instead of guessing what is blocking the purchase, DecisionCommerce asks for one focused piece of context.</p>
                        </div>
                        <div className="alternative-grid">
                          {[
                            ["Budget fit", "How comfortably the purchase fits your budget."],
                            ["Performance", "Whether the product meets the performance you actually need."],
                            ["Confidence", "Whether you need more certainty before committing."],
                          ].map(([title, detail]) => (
                            <article key={title} className={`alternative-card ${clarifyFocus === title ? "selected" : ""}`} style={{ padding: "22px" }}>
                              <small style={{ color: "var(--primary)", fontWeight: 800 }}>FOCUSED CONTEXT</small>
                              <h4>{title}</h4>
                              <p style={{ margin: "0 0 16px", color: "var(--muted)", lineHeight: 1.6 }}>{detail}</p>
                              <button onClick={() => chooseClarifyFocus(title)}>
                                {clarifyFocus === title ? "Selected ✓" : "Choose this"}
                              </button>
                            </article>
                          ))}
                        </div>
                        {clarifyFocus && (
                          <div className="progress-result positive" style={{ marginTop: 18 }}>
                            <span>CONTEXT CAPTURED</span>
                            <p>The decision is now more specific: <strong>{clarifyFocus}</strong>. The system can use this context instead of making a broad assumption about the customer&apos;s hesitation.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeIntervention.id === "value" && selectedProduct && (
                      <div className="alternative-list">
                        <div className="alternative-heading">
                          <div><p className="result-kicker">FEATURE → NEED</p><h3>Why these features matter to you.</h3></div>
                          <p>DecisionCommerce translates product specifications into practical reasons that connect to the customer&apos;s needs.</p>
                        </div>
                        <div className="alternative-grid">
                          {getFeatureNeedPairs(selectedProduct).map((item) => (
                            <article key={item.feature} className="alternative-card" style={{ padding: "22px" }}>
                              <small style={{ color: "var(--blue)", fontWeight: 800 }}>PRODUCT FEATURE</small>
                              <h4>{item.feature}</h4>
                              <p style={{ margin: "0", color: "var(--muted)", lineHeight: 1.6 }}>{item.need}</p>
                            </article>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeIntervention.id === "trust" && selectedProduct && (
                      <div className="alternative-list">
                        <div className="alternative-heading">
                          <div><p className="result-kicker">CONFIDENCE EVIDENCE</p><h3>See the signals before you decide.</h3></div>
                          <p>The goal here is not to persuade the customer, but to give them relevant evidence they can use to decide with more confidence.</p>
                        </div>
                        <div className="alternative-grid">
                          {getTrustSignals(selectedProduct).map((item) => (
                            <article key={item.label} className="alternative-card" style={{ padding: "22px" }}>
                              <small style={{ color: "var(--green)", fontWeight: 800 }}>{item.label}</small>
                              <h4>{item.value}</h4>
                              <p style={{ margin: "0", color: "var(--muted)", lineHeight: 1.6 }}>{item.detail}</p>
                            </article>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeIntervention.id === "fit" && alternatives.length > 0 && <div className="alternative-list">
                      <div className="alternative-heading"><div><p className="result-kicker">BETTER-PRICED OPTIONS</p><h3>Similar products that may fit better.</h3></div><p>These suggestions stay within the same product family and prioritize a lower price when budget is the concern.</p></div>
                      <div className="alternative-grid">
                        {alternatives.map((product) => {
                          const savings = selectedProduct ? Math.max(0, selectedProduct.price - product.price) : 0;
                          return <article key={product.id} className="alternative-card">
                            <div className="alternative-image"><img src={product.image} alt={product.name} /><span>★ {product.rating}</span></div>
                            <div className="alternative-info"><small>{product.category}</small><h4>{product.name}</h4><strong>{formatPrice(product.price)}</strong>{savings > 0 && <p className="savings">Save {formatPrice(savings)} vs current choice</p>}<div className="alternative-actions"><button onClick={() => chooseAlternative(product)}>Select</button><button onClick={() => addToCart(product)}>Add to cart</button><button className="outline" onClick={() => askAI(product)}>Ask AI</button></div></div>
                          </article>;
                        })}
                      </div>
                    </div>}

                    <section className="progress-stage">
                      <p className="eyebrow">CUSTOMER CHECK-IN</p>
                      <h2>How does the decision feel now?</h2>
                      <p>Tell us what changed after the recommendation. Your response helps decide whether the concern has reduced or the decision should be reassessed.</p>
                      <textarea rows={4} value={customerResponse} onChange={(event) => setCustomerResponse(event.target.value)} placeholder="Example: That helped. The lower-priced option feels like a better fit for me." />
                      <button className="secondary-button" disabled={!customerResponse.trim() || isResponseAnalyzing} onClick={analyzeResponse}>{isResponseAnalyzing ? <><span className="button-spinner dark-spinner" />Checking progress...</> : <>Check progress <span>→</span></>}</button>

                      {responseAnalysis && <div className={`progress-result ${responseOutcome ?? ""}`}><span>DECISION UPDATE</span><p>{responseAnalysis}</p>
                        {responseOutcome === "positive" && <div className="decision-actions"><button className="primary-button" onClick={() => goTo("payments")}>Continue to payment <span>→</span></button><button className="secondary-button" onClick={() => goTo("products")}>Reassess decision</button></div>}
                        {responseOutcome === "unresolved" && <div className="decision-actions"><button className="primary-button" onClick={() => { chooseIntervention(interventions.find((item) => item.id === "fit")!); document.getElementById("decision-workspace")?.scrollIntoView({ behavior: "smooth" }); }}>Find another option <span>→</span></button><button className="secondary-button" onClick={() => goTo("products")}>Reassess decision</button><button className="text-action" onClick={() => goTo("payments")}>Continue to payment</button></div>}
                        {responseOutcome === "uncertain" && <div className="decision-actions"><button className="primary-button" onClick={() => goTo("payments")}>Continue to payment <span>→</span></button><button className="secondary-button" onClick={() => chooseIntervention(interventions.find((item) => item.id === "clarify")!)}>Clarify one more thing</button><button className="secondary-button" onClick={() => goTo("products")}>Reassess decision</button></div>}
                      </div>}
                    </section>
                  </section>}
                </div>
              )}
            </section>

            <div className="process-strip">
              {[["01", "Share", "Explain what feels difficult."], ["02", "Understand", "See the likely concern and evidence."], ["03", "Support", "Choose the most useful intervention."], ["04", "Continue", "Checkout or reassess the decision."]].map(([number, title, description]) => <div key={number}><span>{number}</span><strong>{title}</strong><p>{description}</p></div>)}
            </div>
          </div>
        </section>
      )}

      {activePage === "payments" && (
        <section className="section payment-section">
          <div className="container">
            <div className="section-heading"><div><p className="eyebrow">SECURE CHECKOUT</p><h2>Complete your purchase.</h2><p>{selectedProduct ? `${selectedProduct.name} · ${formatPrice(selectedProduct.price)}` : "Select your preferred payment method to continue."}</p></div></div>
            <div className="payment-layout">
              {[ ["UPI", "Pay quickly with your preferred UPI app.", "◫"], ["Card payment", "Use a debit or credit card for a secure checkout experience.", "▣"], ["Net banking", "Continue securely through your bank.", "⌂"] ].map(([title, description, icon]) => <button key={title} className={`payment-card ${paymentMethod === title ? "selected" : ""}`} onClick={() => selectPayment(title)}><span className="payment-icon">{icon}</span><h3>{title}</h3><p>{description}</p><span>{paymentMethod === title ? "Selected ✓" : "Select →"}</span></button>)}
            </div>

            {showCheckout && <section className="checkout-summary">
              <div className="checkout-intro"><p className="result-kicker">READY TO PAY</p><h3>Review your purchase.</h3><p>Your product, payment method and final amount are ready below.</p></div>
              <div className="checkout-grid"><div><span>Product</span><strong>{selectedProduct?.name ?? "No product selected"}</strong></div><div><span>Payment method</span><strong>{paymentMethod}</strong></div><div><span>Product price</span><strong>{formatPrice(selectedProduct?.price ?? total)}</strong></div><div><span>Discount</span><strong>₹0</strong></div><div className="total-box"><span>Total amount</span><strong>{formatPrice(selectedProduct?.price ?? total)}</strong></div></div>
              {!paymentSuccess ? <div className="payment-confirm"><label><span>Payment PIN</span><input value={paymentPin} onChange={(event) => setPaymentPin(event.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" maxLength={4} placeholder="Enter 4-digit PIN" /></label><button className="primary-button pay-button" disabled={!selectedProduct || paymentPin.length < 4} onClick={completeDemoPayment}>Pay {formatPrice(selectedProduct?.price ?? total)} <span>→</span></button></div> : <div className="payment-success"><span>✓</span><div><p>PAYMENT SUCCESSFUL</p><h3>Purchase completed.</h3><small>Your order confirmation is ready.</small></div></div>}
            </section>}
          </div>
        </section>
      )}

      <footer className="footer"><div className="container footer-inner"><span>DecisionCommerce</span><p>AI-assisted decision support for clearer purchase journeys.</p></div></footer>
    </main>
  );
}

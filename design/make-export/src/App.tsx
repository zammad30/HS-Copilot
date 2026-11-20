import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileSearch,
  FileText,
  FolderSearch2,
  History,
  Home,
  Info,
  Keyboard,
  Library,
  ListFilter,
  LoaderCircle,
  LogOut,
  Menu,
  MoreHorizontal,
  PanelRight,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
  XCircle,
} from "lucide-react";

type Screen =
  | "landing"
  | "methodology"
  | "auth"
  | "home"
  | "new"
  | "result"
  | "upload"
  | "batch"
  | "library"
  | "settings"
  | "states"
  | "privacy"
  | "terms"
  | "waking"
  | "notfound"
  | "error";

type Status = "Approved" | "Rejected" | "Needs review" | "Pending";
type Product = {
  product: string;
  code: string;
  confidence: number;
  status: Status;
  date: string;
  alternatives: [string, string];
  citations: [string, string, string];
  tariffText: string;
  reasoning: [string, string, string, string];
  ruling: string;
  rulingRef: string;
  overridden?: boolean;
};

function sampleProduct(
  product: string,
  code: string,
  confidence: number,
  status: Status,
  date: string,
  alternatives: [string, string],
  subject: string,
): Product {
  return {
    product,
    code,
    confidence,
    status,
    date,
    alternatives,
    citations: [`HTS heading ${code.split(".")[0]}`, "GRI 1 and 6", `${subject} chapter notes`],
    tariffText: `${subject} described by its material, construction, and principal function under subheading ${code}.`,
    reasoning: [
      `The description establishes the product as ${subject.toLowerCase()}.`,
      `Heading ${code.split(".")[0]} directly covers its principal material and use.`,
      `The relevant section and chapter notes do not direct it to another heading.`,
      `Comparable reviewed merchandise supports subheading ${code}.`,
    ],
    ruling: `A materially similar ${subject.toLowerCase()} was classified under ${code} after review of its essential character and principal use.`,
    rulingRef: `HQ ${code.replace(".", "")}-26`,
  };
}

const products: Product[] = [
  sampleProduct(
    "Men's 100% cotton knitted crew-neck T-shirt",
    "6109.10",
    96,
    "Approved",
    "Today",
    ["6109.90", "6110.20"],
    "Knitted cotton apparel",
  ),
  sampleProduct(
    "Wireless Bluetooth earbuds with charging case",
    "8518.30",
    88,
    "Needs review",
    "Today",
    ["8518.22", "8527.13"],
    "Wireless earphones",
  ),
  sampleProduct(
    "Stainless steel vacuum insulated bottle, 750 ml",
    "9617.00",
    94,
    "Approved",
    "Yesterday",
    ["7323.93", "3924.10"],
    "Vacuum vessels",
  ),
  sampleProduct(
    "Woven nylon travel backpack, 28 litre",
    "4202.92",
    72,
    "Rejected",
    "Yesterday",
    ["4202.12", "6307.90"],
    "Travel bags",
  ),
  sampleProduct(
    "Ceramic tableware set, glazed stoneware",
    "6912.00",
    81,
    "Pending",
    "7 Nov 2026",
    ["6911.10", "6914.90"],
    "Ceramic tableware",
  ),
  sampleProduct(
    "LED desk lamp with adjustable arm",
    "9405.21",
    91,
    "Approved",
    "Today",
    ["9405.42", "8539.52"],
    "Electric table lamps",
  ),
  sampleProduct(
    "Roasted Arabica coffee beans, 1 kg",
    "0901.21",
    93,
    "Approved",
    "Yesterday",
    ["0901.11", "2101.11"],
    "Roasted coffee",
  ),
  sampleProduct(
    "Women's textile running shoes with rubber sole",
    "6404.11",
    86,
    "Needs review",
    "7 Nov 2026",
    ["6404.19", "6402.99"],
    "Sports footwear",
  ),
  sampleProduct(
    "Solid oak dining table, seats six",
    "9403.60",
    89,
    "Pending",
    "7 Nov 2026",
    ["9403.20", "4419.90"],
    "Wooden furniture",
  ),
  sampleProduct(
    "Monocrystalline photovoltaic solar panel, 450 W",
    "8541.43",
    95,
    "Approved",
    "Today",
    ["8501.72", "8541.42"],
    "Photovoltaic modules",
  ),
  sampleProduct(
    "Stackable polypropylene storage bins with lids",
    "3924.90",
    78,
    "Needs review",
    "Yesterday",
    ["3923.10", "3926.90"],
    "Plastic household articles",
  ),
  sampleProduct(
    "Women's woven wool overcoat",
    "6201.11",
    84,
    "Pending",
    "7 Nov 2026",
    ["6101.10", "6201.20"],
    "Woven wool outerwear",
  ),
  sampleProduct(
    "Moulded silicone smartphone protective case",
    "3926.90",
    82,
    "Needs review",
    "Yesterday",
    ["4202.32", "3923.10"],
    "Plastic protective articles",
  ),
  sampleProduct(
    "Stainless steel kitchen chef's knife, 20 cm",
    "8211.92",
    97,
    "Approved",
    "Today",
    ["8211.91", "8208.30"],
    "Fixed-blade kitchen knives",
  ),
];

function Button({
  children,
  variant = "primary",
  icon,
  onClick,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "approve" | "reject" | "ghost";
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      className={`button button--${variant}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

function TextInput({
  label,
  placeholder,
  defaultValue,
  error,
  type = "text",
}: {
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  error?: string;
  type?: "text" | "number" | "email";
}) {
  return (
    <label className="field">
      {label && <span className="field__label">{label}</span>}
      <input type={type} placeholder={placeholder} defaultValue={defaultValue} />
      {error && <span className="field__error">{error}</span>}
    </label>
  );
}

function SelectField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <span className="select-wrap">
        <select>{children}</select>
        <ChevronDown />
      </span>
    </label>
  );
}

function StatusChip({ status }: { status: Status }) {
  const icons = {
    Approved: <Check size={14} />,
    Rejected: <X size={14} />,
    "Needs review": <AlertCircle size={14} />,
    Pending: <Clock3 size={14} />,
  };
  return (
    <span className={`status status--${status.toLowerCase().replace(" ", "-")}`}>
      {icons[status]}
      {status}
    </span>
  );
}

function Confidence({ value }: { value: number }) {
  return (
    <div className="confidence" aria-label={`${value}% confidence`}>
      <span className="mono">{value}%</span>
      <span className="confidence__track">
        <span style={{ width: `${value}%` }} />
      </span>
    </div>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-header__description">{description}</p>}
      </div>
      {action}
    </header>
  );
}

function Modal({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [onClose]);
  return (
    <div className="modal-layer" role="presentation" onMouseDown={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal__heading">
          <div>
            <h2 id="modal-title">{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function PortalMenu({
  anchor,
  children,
  onClose,
}: {
  anchor: DOMRect;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const menuHeight = 260;
  const top =
    anchor.bottom + menuHeight + 8 > window.innerHeight
      ? Math.max(8, anchor.top - menuHeight - 4)
      : anchor.bottom + 4;
  const left = Math.max(8, Math.min(anchor.right - 184, window.innerWidth - 192));
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [onClose]);
  return createPortal(
    <div ref={ref} className="row-menu row-menu--portal" style={{ top, left }}>
      {children}
    </div>,
    document.body,
  );
}

function ProductTable({
  items,
  compact = false,
  selectable = false,
  selected = [],
  onSelectedChange,
  onOpen,
  onStatusChange,
  onDelete,
  showToast,
}: {
  items: Product[];
  compact?: boolean;
  selectable?: boolean;
  selected?: string[];
  onSelectedChange?: (selected: string[]) => void;
  onOpen: (item: Product) => void;
  onStatusChange?: (product: string, status: Status) => void;
  onDelete?: (product: string) => void;
  showToast?: ShowToast;
}) {
  const [openMenu, setOpenMenu] = useState<{ product: string; anchor: DOMRect } | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Product | null>(null);
  const toggleSelected = (product: string) => {
    onSelectedChange?.(
      selected.includes(product)
        ? selected.filter((item) => item !== product)
        : [...selected, product],
    );
  };
  const runAction = (item: Product, action: string) => {
    setOpenMenu(null);
    if (action === "open" || action === "override") onOpen(item);
    if (action === "approve") {
      onStatusChange?.(item.product, "Approved");
      showToast?.("Classification approved", "success");
    }
    if (action === "rerun") showToast?.("Research queued");
    if (action === "copy") {
      void navigator.clipboard?.writeText(item.code);
      showToast?.("HS code copied");
    }
    if (action === "reject") {
      onStatusChange?.(item.product, "Rejected");
      showToast?.("Classification rejected");
    }
    if (action === "delete") setDeleteCandidate(item);
  };
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {selectable && (
              <th className="checkbox-cell">
                <input
                  type="checkbox"
                  aria-label="Select all visible rows"
                  checked={
                    items.length > 0 && items.every((item) => selected.includes(item.product))
                  }
                  onChange={() =>
                    onSelectedChange?.(
                      items.every((item) => selected.includes(item.product))
                        ? selected.filter((value) => !items.some((item) => item.product === value))
                        : Array.from(new Set([...selected, ...items.map((item) => item.product)])),
                    )
                  }
                />
              </th>
            )}
            <th>Product</th>
            <th>Suggested code</th>
            <th>Confidence</th>
            <th>Status</th>
            {!compact && <th>Updated</th>}
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.product}
              className={[
                item.status === "Needs review" ? "review-row" : "",
                selected.includes(item.product) ? "selected-row" : "",
              ].join(" ")}
              onClick={() => onOpen(item)}
            >
              {selectable && (
                <td className="checkbox-cell" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    aria-label={`Select ${item.product}`}
                    checked={selected.includes(item.product)}
                    onChange={() => toggleSelected(item.product)}
                  />
                </td>
              )}
              <td className="product-cell">{item.product}</td>
              <td className="mono">{item.code}</td>
              <td>
                <Confidence value={item.confidence} />
              </td>
              <td>
                <StatusChip status={item.status} />
              </td>
              {!compact && <td className="muted">{item.date}</td>}
              <td className="row-menu-cell" onClick={(event) => event.stopPropagation()}>
                <button
                  className="icon-button"
                  aria-label={`Actions for ${item.product}`}
                  onClick={(event) =>
                    setOpenMenu(
                      openMenu?.product === item.product
                        ? null
                        : {
                            product: item.product,
                            anchor: event.currentTarget.getBoundingClientRect(),
                          },
                    )
                  }
                >
                  <MoreHorizontal />
                </button>
                {openMenu?.product === item.product && (
                  <PortalMenu anchor={openMenu.anchor} onClose={() => setOpenMenu(null)}>
                    <button onClick={() => runAction(item, "open")}>Open</button>
                    <button onClick={() => runAction(item, "approve")}>Approve</button>
                    <button onClick={() => runAction(item, "override")}>Override code</button>
                    <button className="danger" onClick={() => runAction(item, "reject")}>
                      <XCircle /> Reject
                    </button>
                    <button onClick={() => runAction(item, "rerun")}>
                      <RefreshCw /> Re-run research
                    </button>
                    <button onClick={() => runAction(item, "copy")}>
                      <Copy /> Copy code
                    </button>
                    <button className="danger" onClick={() => runAction(item, "delete")}>
                      <Trash2 /> Delete
                    </button>
                  </PortalMenu>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {deleteCandidate && (
        <Modal
          title="Delete classification?"
          description={`This removes “${deleteCandidate.product}” from the workspace.`}
          onClose={() => setDeleteCandidate(null)}
        >
          <div className="modal__actions">
            <Button variant="secondary" onClick={() => setDeleteCandidate(null)}>
              Cancel
            </Button>
            <Button
              variant="reject"
              onClick={() => {
                onDelete?.(deleteCandidate.product);
                setDeleteCandidate(null);
              }}
            >
              Delete
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Logo({ onClick }: { onClick: () => void }) {
  return (
    <button className="logo" onClick={onClick} aria-label="HS Copilot home">
      <span>HS</span> Copilot
    </button>
  );
}

function Landing({
  go,
  openTypedProduct,
}: {
  go: (screen: Screen) => void;
  openTypedProduct: (description: string, source: Screen) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tryText, setTryText] = useState("Men's 100% cotton knitted crew-neck T-shirt");
  return (
    <div className="public-page">
      <nav className="public-nav shell-width">
        <Logo onClick={() => go("landing")} />
        <div className="public-nav__links">
          <button onClick={() => go("methodology")}>Methodology</button>
          <button onClick={() => go("auth")}>Sign in</button>
          <Button onClick={() => go("home")}>Open demo</Button>
        </div>
        <button className="mobile-menu" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
          <Menu />
        </button>
      </nav>
      {menuOpen && (
        <div className="public-mobile-menu">
          <div>
            <Logo onClick={() => setMenuOpen(false)} />
            <button
              className="icon-button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <X />
            </button>
          </div>
          <nav>
            <button onClick={() => go("methodology")}>Methodology</button>
            <button onClick={() => go("auth")}>Sign in</button>
            <button onClick={() => go("privacy")}>Privacy</button>
            <button onClick={() => go("terms")}>Terms</button>
          </nav>
          <Button onClick={() => go("home")}>Open demo workspace</Button>
        </div>
      )}

      <main>
        <section className="hero shell-width">
          <p className="eyebrow">Human-reviewed tariff classification</p>
          <h1>
            Classify with evidence.
            <br />
            Decide with confidence.
          </h1>
          <p className="hero__copy">
            HS Copilot researches tariff codes, explains its reasoning, and keeps a human reviewer
            in control of every final decision.
          </p>
          <form
            className="try-box"
            onSubmit={(event) => {
              event.preventDefault();
              openTypedProduct(tryText, "landing");
            }}
          >
            <label htmlFor="try-product">Try one product</label>
            <div className="try-box__row">
              <input
                id="try-product"
                value={tryText}
                onChange={(event) => setTryText(event.target.value)}
              />
              <Button type="submit" icon={<ArrowRight />}>
                Classify
              </Button>
            </div>
            <p>No account required. Results are suggestions, not legal advice.</p>
          </form>
        </section>

        <section className="how shell-width section-block">
          <div className="section-heading">
            <p className="eyebrow">How it works</p>
            <h2>From product detail to a reviewable decision</h2>
          </div>
          <div className="steps">
            {[
              ["01", "Describe", "Add the product, material, intended use, and origin when known."],
              [
                "02",
                "Research",
                "The agent compares tariff text, rules, and relevant past rulings.",
              ],
              ["03", "Review", "Approve, override, or ask for more information before finalizing."],
            ].map(([number, title, body]) => (
              <article className="step" key={number}>
                <span className="step__number">{number}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="accuracy section-block">
          <div className="shell-width accuracy__inner">
            <div className="section-heading">
              <p className="eyebrow">Measured, not assumed</p>
              <h2>Accuracy you can inspect</h2>
              <p>
                Evaluated against a held-out set of reviewed classifications across 47 chapters.{" "}
                <span className="sample-label">Sample data</span>
              </p>
              <button className="text-link" onClick={() => go("methodology")}>
                Read our methodology <ArrowRight />
              </button>
            </div>
            <div className="stats-wrap">
              <span className="sample-label">Sample data</span>
              <div className="stat-grid">
                <div>
                  <strong>92.4%</strong>
                  <span>Top-3 code recall</span>
                </div>
                <div>
                  <strong>84.1%</strong>
                  <span>Top-1 exact match</span>
                </div>
                <div>
                  <strong>3,200</strong>
                  <span>Reviewed test cases</span>
                </div>
                <div>
                  <strong>100%</strong>
                  <span>Human-controlled finals</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="faq shell-width section-block">
          <div className="section-heading">
            <p className="eyebrow">Important context</p>
            <h2>Designed to support professional judgment</h2>
          </div>
          <div className="faq-list">
            {[
              [
                "Is a suggested code final?",
                "No. Every output remains a suggestion until a designated reviewer approves it.",
              ],
              [
                "Does this replace a customs broker?",
                "No. HS Copilot organizes research and evidence; your qualified team owns the decision.",
              ],
              [
                "Which jurisdictions are supported?",
                "The demo uses the US HTS. Additional national tariff schedules can be configured by workspace.",
              ],
            ].map(([question, answer]) => (
              <details key={question}>
                <summary>
                  {question}
                  <Plus />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer>
        <div className="shell-width footer__inner">
          <Logo onClick={() => go("landing")} />
          <p>AI-assisted research. Human-reviewed decisions.</p>
          <div>
            <button onClick={() => go("methodology")}>Methodology</button>
            <button onClick={() => go("privacy")}>Privacy</button>
            <button onClick={() => go("terms")}>Terms</button>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Methodology({ go }: { go: (screen: Screen) => void }) {
  const chapters = [
    ["61", "Knitted apparel", 94],
    ["85", "Electrical equipment", 89],
    ["42", "Leather & travel goods", 87],
    ["73", "Articles of iron or steel", 85],
    ["39", "Plastics", 78],
  ];
  return (
    <div className="public-page">
      <nav className="public-nav shell-width">
        <Logo onClick={() => go("landing")} />
        <div className="public-nav__links">
          <Button variant="secondary" onClick={() => go("landing")} icon={<ArrowLeft />}>
            Back home
          </Button>
        </div>
      </nav>
      <main className="article-page shell-width">
        <PageHeader
          eyebrow="Methodology & accuracy"
          title="A transparent process, built for review."
          description="We evaluate the classifier on product records it has not seen during development, and publish the limits alongside the results."
        />
        <div className="method-grid">
          <section className="prose">
            <h2>How the agent works</h2>
            {[
              [
                "1",
                "Extracts product facts",
                "Identifies composition, function, construction, and presentation from the description and attachments.",
              ],
              [
                "2",
                "Builds a candidate set",
                "Retrieves relevant heading text, section notes, explanatory notes, and analogous rulings.",
              ],
              [
                "3",
                "Applies classification rules",
                "Tests candidates against the General Rules of Interpretation and jurisdiction-specific guidance.",
              ],
              [
                "4",
                "Surfaces uncertainty",
                "Returns ranked suggestions, evidence, confidence, and questions where decisive facts are missing.",
              ],
            ].map(([n, title, body]) => (
              <div className="method-step" key={n}>
                <span>{n}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </section>
          <Card className="test-set">
            <p className="eyebrow">
              Current evaluation <span className="sample-label">Sample data</span>
            </p>
            <strong className="big-number">3,200</strong>
            <p>
              expert-reviewed records, stratified across 47 tariff chapters and withheld from prompt
              and retrieval tuning.
            </p>
            <dl>
              <div>
                <dt>Snapshot</dt>
                <dd>US HTS 2026 rev. 12</dd>
              </div>
              <div>
                <dt>Top-1 exact</dt>
                <dd>84.1%</dd>
              </div>
              <div>
                <dt>Top-3 recall</dt>
                <dd>92.4%</dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd>7 Nov 2026</dd>
              </div>
            </dl>
          </Card>
        </div>
        <section className="chart-section">
          <div className="section-heading">
            <p className="eyebrow">By tariff chapter</p>
            <h2>
              Top-3 recall <span className="sample-label">Sample data</span>
            </h2>
          </div>
          <div className="bar-chart">
            {chapters.map(([code, name, value]) => (
              <div className="bar-row" key={code}>
                <span className="mono">{code}</span>
                <span>{name}</span>
                <div>
                  <i style={{ width: `${value}%` }} />
                </div>
                <strong>{value}%</strong>
              </div>
            ))}
          </div>
          <p className="caption">
            Accuracy varies by product detail and chapter complexity. Confidence is calibrated
            separately and should not substitute for review.
          </p>
        </section>
      </main>
    </div>
  );
}

function Auth({ go }: { go: (screen: Screen) => void }) {
  const [signUp, setSignUp] = useState(false);
  const [reset, setReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  const [loading, setLoading] = useState(false);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = {
      ...(signUp && !name.trim() ? { name: "Enter your full name." } : {}),
      ...(!email.includes("@") ? { email: "Enter a valid work email." } : {}),
      ...(!reset && password.length < 8
        ? { password: "Password must be at least 8 characters." }
        : {}),
    };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      if (reset) setReset(false);
      else go("home");
    }, 600);
  };
  return (
    <div className="auth-page">
      <header>
        <Logo onClick={() => go("landing")} />
        <button className="text-link" onClick={() => go("landing")}>
          <ArrowLeft /> Back home
        </button>
      </header>
      <Card className="auth-card">
        <p className="eyebrow">
          {reset ? "Reset password" : signUp ? "Create account" : "Welcome back"}
        </p>
        <h1>
          {reset
            ? "Reset your password"
            : signUp
              ? "Start your workspace"
              : "Sign in to HS Copilot"}
        </h1>
        <p>
          {reset
            ? "We’ll send a reset link to your work email."
            : signUp
              ? "Set up a review-ready classification workspace."
              : "Continue to your classifications and reviews."}
        </p>
        <form onSubmit={submit}>
          {signUp && !reset && (
            <label className="field">
              <span className="field__label">Full name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Alex Morgan"
              />
              {errors.name && <span className="field__error">{errors.name}</span>}
            </label>
          )}
          <label className="field">
            <span className="field__label">Work email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="alex@company.com"
            />
            {errors.email && <span className="field__error">{errors.email}</span>}
          </label>
          {!reset && (
            <label className="field">
              <span className="field__label">Password</span>
              <span className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </span>
              {errors.password && <span className="field__error">{errors.password}</span>}
            </label>
          )}
          {!signUp && !reset && (
            <button type="button" className="text-link forgot-link" onClick={() => setReset(true)}>
              Forgot password?
            </button>
          )}
          <Button type="submit" disabled={loading}>
            {loading
              ? "Please wait…"
              : reset
                ? "Send reset link"
                : signUp
                  ? "Create account"
                  : "Sign in"}
          </Button>
        </form>
        {!reset && (
          <div className="auth-card__switch">
            <span>{signUp ? "Already have an account?" : "New to HS Copilot?"}</span>
            <button className="text-link" onClick={() => setSignUp(!signUp)}>
              {signUp ? "Sign in" : "Create account"}
            </button>
          </div>
        )}
        {reset && (
          <button className="demo-link" onClick={() => setReset(false)}>
            <ArrowLeft /> Back to sign in
          </button>
        )}
        {!reset && (
          <button className="demo-link" onClick={() => go("home")}>
            Try demo workspace <ArrowRight />
          </button>
        )}
      </Card>
      <p className="auth-note">
        <ShieldCheck /> Suggestions require human approval before they are final.
      </p>
    </div>
  );
}

const navItems: { screen: Screen; label: string; icon: ReactNode }[] = [
  { screen: "home", label: "Workspace", icon: <Home /> },
  { screen: "new", label: "New classification", icon: <Plus /> },
  { screen: "batch", label: "Batch review", icon: <FileSearch /> },
  { screen: "library", label: "Library", icon: <Library /> },
];

function SideNavigation({
  screen,
  go,
  onNavigate,
}: {
  screen: Screen;
  go: (screen: Screen) => void;
  onNavigate?: () => void;
}) {
  const navigate = (next: Screen) => {
    go(next);
    onNavigate?.();
  };

  return (
    <>
      <nav>
        {navItems.map((item) => (
          <button
            key={item.screen}
            className={screen === item.screen ? "active" : ""}
            onClick={() => navigate(item.screen)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar__bottom">
        <button
          className={screen === "settings" ? "active" : ""}
          onClick={() => navigate("settings")}
        >
          <Settings />
          Settings & team
        </button>
        <button onClick={() => navigate("landing")}>
          <LogOut />
          Sign out
        </button>
      </div>
    </>
  );
}

function AppShell({
  screen,
  go,
  children,
}: {
  screen: Screen;
  go: (screen: Screen) => void;
  children: ReactNode;
}) {
  const [activeMenu, setActiveMenu] = useState<"workspace" | "help" | "profile" | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState("Northwind Imports");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest("[data-menu-root]")) {
        setActiveMenu(null);
        setMobileOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveMenu(null);
        setMobileOpen(false);
      }
    };
    const shortcuts = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if (!typing && event.key.toLowerCase() === "n") {
        event.preventDefault();
        go("new");
      }
      if (!typing && event.key === "/") {
        event.preventDefault();
        (document.querySelector("[data-global-search]") as HTMLInputElement | null)?.focus();
      }
    };
    document.addEventListener("mousedown", closeMenus);
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("keydown", shortcuts);
    return () => {
      document.removeEventListener("mousedown", closeMenus);
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("keydown", shortcuts);
    };
  }, []);

  const openMenu = (menu: "workspace" | "help" | "profile") => {
    setActiveMenu((current) => (current === menu ? null : menu));
  };
  const navigate = (next: Screen) => {
    setActiveMenu(null);
    setMobileOpen(false);
    go(next);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <Logo onClick={() => go("home")} />
        </div>
        <SideNavigation screen={screen} go={go} />
      </aside>
      {mobileOpen && (
        <div className="mobile-drawer-layer" data-menu-root>
          <button
            className="mobile-drawer-backdrop"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="mobile-drawer">
            <div className="sidebar__brand">
              <Logo onClick={() => navigate("home")} />
              <button
                className="icon-button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
              >
                <X />
              </button>
            </div>
            <SideNavigation screen={screen} go={go} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
      <div className="app-main">
        <header className="topbar">
          <div className="topbar__start">
            <button
              className="topbar__menu-toggle"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu />
            </button>
            <div className="menu-anchor" data-menu-root>
              <button
                className="workspace-switcher"
                onClick={() => openMenu("workspace")}
                aria-expanded={activeMenu === "workspace"}
              >
                <span className="workspace-mark">
                  {activeWorkspace === "Northwind Imports" ? "NW" : "HC"}
                </span>
                <strong>{activeWorkspace}</strong>
                <ChevronDown />
              </button>
              {activeMenu === "workspace" && (
                <div className="popover workspace-menu" role="menu">
                  {["Northwind Imports", "Harbor & Co. (demo)"].map((workspace) => (
                    <button
                      key={workspace}
                      className="menu-item"
                      onClick={() => {
                        setActiveWorkspace(workspace);
                        setActiveMenu(null);
                      }}
                      role="menuitem"
                    >
                      <span>{workspace}</span>
                      {activeWorkspace === workspace && <Check />}
                    </button>
                  ))}
                  <div className="menu-divider" />
                  <button className="menu-item" onClick={() => navigate("settings")}>
                    <Plus />
                    <span>Create workspace</span>
                  </button>
                  <button className="menu-item" onClick={() => navigate("settings")}>
                    <Settings />
                    <span>Workspace settings</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="topbar__actions">
            <div className="menu-anchor" data-menu-root>
              <button
                className="help-button"
                onClick={() => openMenu("help")}
                aria-expanded={activeMenu === "help"}
              >
                <CircleHelp /> Help
              </button>
              {activeMenu === "help" && (
                <div className="popover help-menu" role="menu">
                  <button className="menu-item" onClick={() => navigate("methodology")}>
                    <FileSearch />
                    <span>How classification works</span>
                  </button>
                  <button
                    className="menu-item"
                    onClick={() => {
                      setActiveMenu(null);
                      setShortcutsOpen(true);
                    }}
                  >
                    <Keyboard />
                    <span>Keyboard shortcuts</span>
                  </button>
                  <a className="menu-item" href="mailto:support@hscopilot.example">
                    <CircleHelp />
                    <span>Contact support</span>
                  </a>
                  <a
                    className="menu-item"
                    href="mailto:support@hscopilot.example?subject=Incorrect%20classification"
                  >
                    <AlertCircle />
                    <span>Report an incorrect result</span>
                  </a>
                  <p className="popover__footer">Suggestions are not legal advice.</p>
                </div>
              )}
            </div>
            <div className="menu-anchor" data-menu-root>
              <button
                className="avatar-button"
                onClick={() => openMenu("profile")}
                aria-expanded={activeMenu === "profile"}
                aria-label="Open account menu"
              >
                <span className="avatar">AM</span>
              </button>
              {activeMenu === "profile" && (
                <div className="popover profile-menu" role="menu">
                  <div className="profile-summary">
                    <strong>Alex Morgan</strong>
                    <span>alex@northwind.example</span>
                    <small>Admin</small>
                  </div>
                  <div className="menu-divider" />
                  <button className="menu-item" onClick={() => navigate("settings")}>
                    <Settings />
                    <span>Account settings</span>
                  </button>
                  <button className="menu-item" onClick={() => navigate("landing")}>
                    <LogOut />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>
      {shortcutsOpen && (
        <Modal title="Keyboard shortcuts" onClose={() => setShortcutsOpen(false)}>
          <div className="shortcut-list">
            <div>
              <kbd>N</kbd>
              <span>New classification</span>
            </div>
            <div>
              <kbd>/</kbd>
              <span>Focus table search</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function HomeScreen({
  go,
  items,
  openProduct,
  updateStatus,
  deleteProduct,
  showToast,
  openTypedProduct,
}: {
  go: (screen: Screen) => void;
  items: Product[];
  openProduct: (item: Product) => void;
  updateStatus: (product: string, status: Status) => void;
  deleteProduct: (product: string) => void;
  showToast: ShowToast;
  openTypedProduct: (description: string, source: Screen) => void;
}) {
  const [quickText, setQuickText] = useState("");
  const attention = items.filter(
    (item) => item.status === "Needs review" || item.status === "Pending",
  );
  return (
    <>
      <PageHeader
        title="Good morning, Alex."
        description={`${attention.length} ${attention.length === 1 ? "classification is" : "classifications are"} waiting for your review.`}
        action={
          <Button onClick={() => go("new")} icon={<Plus />}>
            New classification
          </Button>
        }
      />
      <div className="home-grid">
        <Card className="pending-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">Review queue</p>
              <h2>{attention.length} need attention</h2>
            </div>
            <button className="text-link" onClick={() => go("batch")}>
              Review all <ArrowRight />
            </button>
          </div>
          <div className="review-list">
            {attention.map((item) => (
              <button key={item.product} onClick={() => openProduct(item)}>
                <div>
                  <strong>{item.product}</strong>
                  <span className="mono">{item.code}</span>
                </div>
                <Confidence value={item.confidence} />
                <StatusChip status={item.status} />
                <ArrowRight />
              </button>
            ))}
          </div>
        </Card>
        <Card className="quick-card">
          <p className="eyebrow">Quick add</p>
          <h2>Classify one product</h2>
          <p>Start with a plain-language product description.</p>
          <label className="field">
            <input
              value={quickText}
              onChange={(event) => setQuickText(event.target.value)}
              placeholder="e.g. Stainless steel vacuum bottle…"
            />
          </label>
          <Button
            onClick={() => quickText.trim() && openTypedProduct(quickText, "home")}
            icon={<ArrowRight />}
          >
            Classify
          </Button>
        </Card>
      </div>
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Latest activity</p>
          <h2>Recent classifications</h2>
        </div>
        <button className="text-link" onClick={() => go("library")}>
          View library <ArrowRight />
        </button>
      </div>
      <Card className="table-card">
        <ProductTable
          items={items}
          compact
          onOpen={openProduct}
          onStatusChange={updateStatus}
          onDelete={deleteProduct}
          showToast={showToast}
        />
      </Card>
      <div className="batch-mini">
        <div>
          <Upload />
          <div>
            <strong>November apparel import.csv</strong>
            <span>
              {items.length} of {items.length} products classified
            </span>
          </div>
        </div>
        <Confidence value={71} />
        <Button variant="secondary" onClick={() => go("batch")}>
          View batch
        </Button>
      </div>
    </>
  );
}

function NewClassification({
  openTypedProduct,
}: {
  openTypedProduct: (description: string, source: Screen) => void;
}) {
  const [running, setRunning] = useState(false);
  const [question, setQuestion] = useState(false);
  const [description, setDescription] = useState("Wireless Bluetooth earbuds with charging case");
  return (
    <>
      <PageHeader
        eyebrow="New classification"
        title="Describe the product"
        description="Include the details a reviewer would need to distinguish between headings."
      />
      <div className="classification-grid">
        <Card className="form-card">
          <label className="field">
            <span className="field__label">Product description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <div className="form-two">
            <TextInput label="Primary material (optional)" placeholder="e.g. ABS plastic" />
            <TextInput label="Intended use (optional)" placeholder="e.g. Personal audio" />
          </div>
          <SelectField label="Country of origin (optional)">
            <option>China</option>
            <option>Vietnam</option>
            <option>Unknown</option>
          </SelectField>
          <div className="form-actions">
            <Button variant="secondary">Save draft</Button>
            <Button
              onClick={() => {
                setRunning(true);
                setTimeout(() => setQuestion(true), 500);
              }}
              icon={<Sparkles />}
            >
              Research HS codes
            </Button>
          </div>
        </Card>
        <Card className="agent-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">Live agent</p>
              <h2>Research progress</h2>
            </div>
            {running && !question && <span className="live-dot">Working</span>}
          </div>
          {!running ? (
            <div className="empty-compact">
              <FileSearch />
              <p>The agent’s research steps will appear here.</p>
            </div>
          ) : (
            <ol className="agent-steps">
              <li className="done">
                <CheckCircle2 />
                <div>
                  <strong>Extract product attributes</strong>
                  <span>{description}</span>
                </div>
              </li>
              <li className="done">
                <CheckCircle2 />
                <div>
                  <strong>Search tariff headings</strong>
                  <span>Compared candidate headings based on material, construction, and use</span>
                </div>
              </li>
              <li className={question ? "paused" : ""}>
                <Clock3 />
                <div>
                  <strong>Apply heading notes</strong>
                  <span>
                    {question
                      ? "Paused for a clarifying detail"
                      : "Reviewing chapter and explanatory notes"}
                  </span>
                </div>
              </li>
              <li>
                <span className="step-dot" />
                <div>
                  <strong>Rank candidates</strong>
                  <span>Waiting</span>
                </div>
              </li>
            </ol>
          )}
          {question && (
            <div className="clarifying">
              <span>
                <AlertCircle /> Clarifying question
              </span>
              <h3>Is the product’s principal function fully described above?</h3>
              <div className="answer-options">
                <button onClick={() => openTypedProduct(description, "new")}>
                  <span>Yes</span>
                  <small>The description covers its primary use</small>
                </button>
                <button onClick={() => openTypedProduct(description, "new")}>
                  <span>No</span>
                  <small>The product has another important function</small>
                </button>
                <button onClick={() => openTypedProduct(description, "new")}>
                  <span>I’m not sure</span>
                  <small>Continue with lower confidence</small>
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

type ToastTone = "success" | "info";
type ShowToast = (message: string, tone?: ToastTone, undo?: () => void) => void;

function ResultScreen({
  item,
  go,
  updateStatus,
  updateCode,
  showToast,
  backTo,
}: {
  item: Product;
  go: (screen: Screen) => void;
  updateStatus: (product: string, status: Status) => void;
  updateCode: (product: string, code: string) => void;
  showToast: ShowToast;
  backTo: Screen;
}) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>(item.status);
  const [drawer, setDrawer] = useState<"audit" | "source" | "ruling" | null>("audit");
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [overridden, setOverridden] = useState(Boolean(item.overridden));
  const [overrideCode, setOverrideCode] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [reasoning, setReasoning] = useState<string | null>(null);
  const [audit, setAudit] = useState([
    {
      time: "09:18",
      title: "Research completed",
      body: "Three candidates ranked from 14 sources.",
    },
    {
      time: "09:17",
      title: "Product details confirmed",
      body: `${item.product} reviewed for material, construction, and principal use.`,
    },
    { time: "09:16", title: "Classification started", body: "Created by Alex Morgan." },
  ]);
  useEffect(() => {
    setLoading(true);
    setStatus(item.status);
    setOverridden(Boolean(item.overridden));
    const timeout = window.setTimeout(() => setLoading(false), 800);
    return () => window.clearTimeout(timeout);
  }, [item.product]);
  const recordDecision = (nextStatus: Status, title: string, body: string) => {
    setStatus(nextStatus);
    updateStatus(item.product, nextStatus);
    setAudit((current) => [{ time: "Now", title, body }, ...current]);
    setDrawer("audit");
  };
  const suggestions = [
    {
      code: item.code,
      title: item.product,
      confidence: item.confidence,
      selected: true,
    },
    {
      code: item.alternatives[0],
      title: `Alternative classification for ${item.product}`,
      confidence: 41,
      selected: false,
    },
    {
      code: item.alternatives[1],
      title: `Secondary alternative for ${item.product}`,
      confidence: 18,
      selected: false,
    },
  ];
  if (loading) {
    return (
      <div className="result-skeleton">
        <div className="skeleton">
          <span className="sk-short" />
          <span className="sk-title" />
          <span />
          <span />
        </div>
        <Card>
          <div className="skeleton">
            <span className="sk-title" />
            <span />
            <span />
            <span className="sk-short" />
          </div>
        </Card>
        <Card>
          <div className="skeleton">
            <span />
            <span />
            <span />
          </div>
        </Card>
      </div>
    );
  }
  return (
    <div className={`result-layout ${drawer ? "drawer-open" : ""}`}>
      <div className="result-main">
        <button className="text-link result-back" onClick={() => go(backTo)}>
          <ArrowLeft /> Back
        </button>
        <PageHeader
          eyebrow="Classification result"
          title={item.product}
          description="US HTS · Researched today at 09:18"
          action={
            <Button
              variant="secondary"
              onClick={() => setDrawer(drawer === "audit" ? null : "audit")}
              icon={<PanelRight />}
            >
              Audit trail
            </Button>
          }
        />
        <Card className="recommendation">
          <div className="recommendation__top">
            <div>
              <span className="eyebrow">Recommended code</span>
              <strong className="hero-code mono">{item.code}</strong>
              <div className="decision-chips">
                <StatusChip status={status} />
                {overridden && (
                  <span className="status status--overridden">
                    <Check />
                    Overridden
                  </span>
                )}
              </div>
            </div>
            <div>
              <span className="field__label">Overall confidence</span>
              <Confidence value={item.confidence} />
            </div>
          </div>
          <h2>{item.product}</h2>
          <p>
            The product’s material, construction, and principal use support classification under
            this heading. The cited tariff text and similar rulings provide the strongest available
            basis for review.
          </p>
          <div className="citations">
            {item.citations.map((citation, index) => (
              <span key={citation}>
                {index === 0 ? <BookOpen /> : index === 1 ? <FileText /> : <History />}
                {citation}
              </span>
            ))}
          </div>
        </Card>
        <div className="review-actions">
          {status === "Approved" ? (
            <div className="approved-action">
              <span className="approved-decision-chip">
                <Check />
                Approved by Alex Morgan
              </span>
              <button
                className="text-link"
                onClick={() => {
                  recordDecision(
                    "Needs review",
                    "Approval undone",
                    "Alex Morgan returned the classification to review.",
                  );
                  showToast("Approval undone");
                }}
              >
                Undo
              </button>
            </div>
          ) : (
            <Button
              variant="approve"
              onClick={() => {
                recordDecision(
                  "Approved",
                  "Classification approved",
                  `Alex Morgan approved ${item.code}.`,
                );
                showToast("Classification approved", "success");
              }}
              icon={<Check />}
            >
              Approve {item.code}
            </Button>
          )}
          <Button variant="reject" icon={<X />} onClick={() => setOverrideOpen(true)}>
            Override code
          </Button>
          <Button variant="reject" icon={<XCircle />} onClick={() => setRejectOpen(true)}>
            Reject
          </Button>
          <Button variant="secondary" icon={<CircleHelp />} onClick={() => setInfoOpen(true)}>
            Ask for more info
          </Button>
        </div>
        <section className="result-section">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Ranked candidates</p>
              <h2>Top suggestions</h2>
            </div>
          </div>
          <div className="suggestion-list">
            {suggestions.map((suggestion, index) => (
              <Card
                className={suggestion.selected ? "selected-suggestion" : ""}
                key={suggestion.code}
              >
                <span className="rank">0{index + 1}</span>
                <div>
                  <strong className="mono suggestion-code">{suggestion.code}</strong>
                  <p>{suggestion.title}</p>
                </div>
                <Confidence value={suggestion.confidence} />
                <button
                  className="text-link"
                  onClick={() =>
                    setReasoning(reasoning === suggestion.code ? null : suggestion.code)
                  }
                >
                  {reasoning === suggestion.code ? "Hide reasoning" : "View reasoning"}{" "}
                  <ArrowRight />
                </button>
                {reasoning === suggestion.code && (
                  <ol className="reasoning-steps">
                    <li>
                      <span>1</span>
                      <p>
                        <strong>Identify essential character</strong>
                        {item.reasoning[0]}
                      </p>
                    </li>
                    <li>
                      <span>2</span>
                      <p>
                        <strong>Apply heading terms</strong>
                        {item.reasoning[1]}
                      </p>
                    </li>
                    <li>
                      <span>3</span>
                      <p>
                        <strong>Check exclusions</strong>
                        {item.reasoning[2]}
                      </p>
                    </li>
                    <li>
                      <span>4</span>
                      <p>
                        <strong>Compare precedent</strong>
                        {item.reasoning[3]}
                      </p>
                    </li>
                  </ol>
                )}
              </Card>
            ))}
          </div>
        </section>
        <section className="evidence-grid">
          <Card>
            <p className="eyebrow">Tariff text</p>
            <h3>{item.code}</h3>
            <blockquote>“{item.tariffText}”</blockquote>
            <button className="text-link" onClick={() => setDrawer("source")}>
              Open source <ArrowRight />
            </button>
          </Card>
          <Card>
            <p className="eyebrow">Similar past ruling</p>
            <h3>
              {item.rulingRef} <span className="sample-label">Sample data</span>
            </h3>
            <p>{item.ruling}</p>
            <button className="text-link" onClick={() => setDrawer("ruling")}>
              View ruling <ArrowRight />
            </button>
          </Card>
        </section>
      </div>
      {drawer && (
        <aside className="audit-drawer">
          <div className="drawer-heading">
            <div>
              <p className="eyebrow">{drawer === "audit" ? "Record" : "Evidence"}</p>
              <h2>
                {drawer === "audit"
                  ? "Audit trail"
                  : drawer === "source"
                    ? "Tariff source"
                    : "Past ruling"}
              </h2>
            </div>
            <button className="icon-button" onClick={() => setDrawer(null)}>
              <X />
            </button>
          </div>
          {drawer === "audit" ? (
            <>
              <div className="audit-list">
                {audit.map((entry, index) => (
                  <div key={`${entry.title}-${index}`}>
                    <span>{entry.time}</span>
                    <i />
                    <p>
                      <strong>{entry.title}</strong>
                      {entry.body}
                    </p>
                  </div>
                ))}
              </div>
              <div className="drawer-meta">
                <div>
                  <span>Jurisdiction</span>
                  <strong>United States</strong>
                </div>
                <div>
                  <span>Model version</span>
                  <strong>
                    HS Agent 2.4 <em className="sample-label">Sample data</em>
                  </strong>
                </div>
                <div>
                  <span>Sources</span>
                  <strong>14 documents</strong>
                </div>
              </div>
            </>
          ) : (
            <article className="evidence-full">
              <p className="caption">
                {drawer === "source" ? "US HTS · 2026 revision" : item.rulingRef}{" "}
                <span className="sample-label">Sample data</span>
              </p>
              <h3>
                {drawer === "source"
                  ? `Heading ${item.code.split(".")[0]}`
                  : "Classification ruling"}
              </h3>
              <p>{drawer === "source" ? item.tariffText : item.ruling}</p>
              <p>
                General Rule of Interpretation 1 provides that classification is determined
                according to the terms of the headings and any relative section or chapter notes.
              </p>
            </article>
          )}
        </aside>
      )}
      {overrideOpen && (
        <Modal title="Override classification code" onClose={() => setOverrideOpen(false)}>
          <form
            className="modal__form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!overrideCode || !overrideReason.trim()) return;
              updateCode(item.product, overrideCode);
              setOverridden(true);
              recordDecision(
                "Approved",
                "Code overridden",
                `${item.code} changed to ${overrideCode}. Reason: ${overrideReason}`,
              );
              setOverrideOpen(false);
              showToast("Classification overridden", "success");
            }}
          >
            <label className="field">
              <span className="field__label">Search HS code</span>
              <input
                list="sample-codes"
                value={overrideCode}
                onChange={(event) => setOverrideCode(event.target.value)}
                placeholder="Type a code or product"
                required
              />
              <datalist id="sample-codes">
                {products.map((product) => (
                  <option key={product.code} value={product.code}>
                    {product.product}
                  </option>
                ))}
              </datalist>
            </label>
            <label className="field">
              <span className="field__label">Reason for override</span>
              <textarea
                value={overrideReason}
                onChange={(event) => setOverrideReason(event.target.value)}
                required
                placeholder="Explain why the suggested code is not appropriate."
              />
            </label>
            <div className="modal__actions">
              <Button variant="secondary" onClick={() => setOverrideOpen(false)}>
                Cancel
              </Button>
              <Button variant="reject" type="submit">
                Confirm override
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {rejectOpen && (
        <Modal title="Reject classification" onClose={() => setRejectOpen(false)}>
          <form
            className="modal__form"
            onSubmit={(event) => {
              event.preventDefault();
              recordDecision(
                "Rejected",
                "Classification rejected",
                rejectReason.trim() || "Rejected by Alex Morgan without an additional reason.",
              );
              setOverridden(false);
              setRejectOpen(false);
              showToast("Classification rejected");
            }}
          >
            <label className="field">
              <span className="field__label">Reason (optional)</span>
              <textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Add context for the rejection."
              />
            </label>
            <div className="modal__actions">
              <Button variant="secondary" onClick={() => setRejectOpen(false)}>
                Cancel
              </Button>
              <Button variant="reject" type="submit">
                Reject
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {infoOpen && (
        <Modal title="Ask for more information" onClose={() => setInfoOpen(false)}>
          <form
            className="modal__form"
            onSubmit={(event) => {
              event.preventDefault();
              recordDecision(
                "Pending",
                "More information requested",
                "Assigned to Mina Patel for follow-up.",
              );
              setInfoOpen(false);
              showToast("Information request sent");
            }}
          >
            <SelectField label="Assign to">
              <option>Mina Patel</option>
              <option>Jordan Lee</option>
              <option>Alex Morgan</option>
            </SelectField>
            <label className="field">
              <span className="field__label">Note</span>
              <textarea placeholder="Describe the missing product details." />
            </label>
            <div className="modal__actions">
              <Button variant="secondary" onClick={() => setInfoOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Send request</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function UploadScreen({ go }: { go: (screen: Screen) => void }) {
  const [uploaded, setUploaded] = useState(false);
  return (
    <>
      <PageHeader
        eyebrow="Batch upload"
        title="Import product data"
        description="Upload a CSV and map your columns before classification begins."
      />
      <div className="upload-grid">
        <Card className="upload-card">
          <button className="dropzone" onClick={() => setUploaded(true)}>
            <span>
              <Upload />
            </span>
            <strong>
              {uploaded ? "june_apparel_import.csv" : "Drop a CSV here, or choose a file"}
            </strong>
            <small>{uploaded ? "14 rows · 48 KB" : "CSV up to 10 MB · One product per row"}</small>
          </button>
          <button className="text-link">
            <Download /> Download template
          </button>
        </Card>
        <Card className="mapping-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">Step 2</p>
              <h2>Map columns</h2>
            </div>
            <span className="caption">3 of 3 required</span>
          </div>
          {["Product description", "SKU / reference", "Material"].map((label, i) => (
            <div className="mapping-row" key={label}>
              <span>
                {label}
                {i < 2 && <sup>*</sup>}
              </span>
              <ArrowRight />
              <SelectField label="">
                <option>{["description", "sku", "material"][i]}</option>
              </SelectField>
            </div>
          ))}
          <SelectField label="Jurisdiction">
            <option>United States - HTS</option>
            <option>European Union - CN</option>
            <option>United Kingdom - UKGT</option>
          </SelectField>
          <Button onClick={() => go("batch")} disabled={!uploaded}>
            Start batch classification
          </Button>
        </Card>
      </div>
    </>
  );
}

function FilterDropdown({
  label,
  options,
  selected,
  onChange,
  open,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  open: boolean;
  onToggle: () => void;
}) {
  const summary =
    selected.length === 0
      ? "All"
      : `${selected.slice(0, 2).join(", ")}${selected.length > 2 ? ` +${selected.length - 2}` : ""}`;
  return (
    <div className="filter-dropdown">
      <button className="filter-button" onClick={onToggle}>
        <ListFilter />{" "}
        <span>
          {label}: {summary}
        </span>{" "}
        <ChevronDown />
      </button>
      {open && (
        <div className="filter-menu">
          {options.map((option) => (
            <label key={option}>
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() =>
                  onChange(
                    selected.includes(option)
                      ? selected.filter((item) => item !== option)
                      : [...selected, option],
                  )
                }
              />
              {option}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function ClassificationExplorer({
  items,
  openProduct,
  updateStatus,
  deleteProduct,
  showToast,
  compact = false,
}: {
  items: Product[];
  openProduct: (item: Product) => void;
  updateStatus: (product: string, status: Status) => void;
  deleteProduct: (product: string) => void;
  showToast: ShowToast;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [openFilter, setOpenFilter] = useState<"status" | "confidence" | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 3;
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest(".filter-dropdown")) setOpenFilter(null);
    };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpenFilter(null);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  const filtered = items.filter((item) => {
    const matchesText = `${item.product} ${item.code}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = !statuses.length || statuses.includes(item.status);
    const band = item.confidence >= 90 ? "90%+" : item.confidence >= 80 ? "80–89%" : "Below 80%";
    return matchesText && matchesStatus && (!confidence.length || confidence.includes(band));
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const visible = filtered.slice(currentPage * pageSize, currentPage * pageSize + pageSize);
  const bulkUpdate = (status: Status) => {
    selected.forEach((product) => updateStatus(product, status));
    showToast(
      `${selected.length} classifications ${status.toLowerCase()}`,
      status === "Approved" ? "success" : "info",
    );
    setSelected([]);
  };

  return (
    <>
      <div className="batch-controls">
        <div className="search-field">
          <Search />
          <input
            value={query}
            data-global-search
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            placeholder="Search products or HS codes"
          />
        </div>
        <FilterDropdown
          label="Status"
          options={["Approved", "Needs review", "Rejected", "Pending"]}
          selected={statuses}
          onChange={(next) => {
            setStatuses(next);
            setPage(0);
          }}
          open={openFilter === "status"}
          onToggle={() => setOpenFilter(openFilter === "status" ? null : "status")}
        />
        <FilterDropdown
          label="Confidence"
          options={["90%+", "80–89%", "Below 80%"]}
          selected={confidence}
          onChange={(next) => {
            setConfidence(next);
            setPage(0);
          }}
          open={openFilter === "confidence"}
          onToggle={() => setOpenFilter(openFilter === "confidence" ? null : "confidence")}
        />
      </div>
      <Card className={`table-card ${compact ? "dense-table" : ""}`}>
        <ProductTable
          items={visible}
          selectable
          selected={selected}
          onSelectedChange={setSelected}
          onOpen={openProduct}
          onStatusChange={updateStatus}
          onDelete={deleteProduct}
          showToast={showToast}
        />
      </Card>
      {!filtered.length && (
        <div className="table-empty">
          <Search />
          <span>No classifications match these filters.</span>
        </div>
      )}
      <div className="pagination">
        <span>
          Showing {filtered.length ? currentPage * pageSize + 1 : 0}–
          {Math.min((currentPage + 1) * pageSize, filtered.length)} of {filtered.length}
        </span>
        <div>
          <Button
            variant="secondary"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            disabled={currentPage >= totalPages - 1}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      </div>
      {selected.length > 0 && (
        <div className="bulk-bar">
          <strong>{selected.length} selected</strong>
          <span />
          <Button variant="approve" onClick={() => bulkUpdate("Approved")}>
            Approve
          </Button>
          <Button variant="reject" onClick={() => bulkUpdate("Rejected")}>
            Reject
          </Button>
          <Button
            variant="secondary"
            icon={<Download />}
            onClick={() => showToast("Export started")}
          >
            Export
          </Button>
          <button
            className="icon-button"
            onClick={() => setSelected([])}
            aria-label="Clear selection"
          >
            <X />
          </button>
        </div>
      )}
    </>
  );
}

function BatchScreen({
  go,
  items,
  openProduct,
  updateStatus,
  deleteProduct,
  showToast,
}: {
  go: (screen: Screen) => void;
  items: Product[];
  openProduct: (item: Product) => void;
  updateStatus: (product: string, status: Status) => void;
  deleteProduct: (product: string) => void;
  showToast: ShowToast;
}) {
  const [bannerVisible, setBannerVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const highConfidenceCount = items.filter((item) => item.confidence >= 90).length;
  return (
    <>
      <PageHeader
        eyebrow="Batch review"
        title="November apparel import"
        description={`${items.length} products · United States HTS · Started today at 08:56`}
        action={
          <Button variant="secondary" onClick={() => go("upload")} icon={<Upload />}>
            Upload batch
          </Button>
        }
      />
      {bannerVisible && (
        <div className="warning-banner">
          <AlertCircle />
          <div>
            <strong>
              {paused ? "Processing paused" : "Processing is throttled, resuming shortly"}
            </strong>
            <span>
              {items.length} of {items.length} products classified. Completed results are ready to
              review.
            </span>
          </div>
          <span className="spacer" />
          <button className="text-link" onClick={() => setPaused(!paused)}>
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            className="icon-button"
            onClick={() => setBannerVisible(false)}
            aria-label="Dismiss"
          >
            <X />
          </button>
        </div>
      )}
      <div className="batch-primary-action">
        <Button variant="approve" icon={<Check />} onClick={() => setConfirmBulk(true)}>
          Approve {highConfidenceCount} above 90%
        </Button>
      </div>
      <ClassificationExplorer
        items={items}
        openProduct={openProduct}
        updateStatus={updateStatus}
        deleteProduct={deleteProduct}
        showToast={showToast}
        compact
      />
      {confirmBulk && (
        <Modal
          title={`Approve ${highConfidenceCount} classifications?`}
          description={`This approves ${highConfidenceCount} classifications with confidence of 90% or higher. Each decision is logged.`}
          onClose={() => setConfirmBulk(false)}
        >
          <div className="modal__actions">
            <Button variant="secondary" onClick={() => setConfirmBulk(false)}>
              Cancel
            </Button>
            <Button
              variant="approve"
              onClick={() => {
                items
                  .filter((item) => item.confidence >= 90)
                  .forEach((item) => updateStatus(item.product, "Approved"));
                setConfirmBulk(false);
                showToast(`${highConfidenceCount} classifications approved`, "success");
              }}
            >
              Approve {highConfidenceCount}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

function LibraryScreen({
  items,
  openProduct,
  updateStatus,
  deleteProduct,
  showToast,
}: {
  items: Product[];
  openProduct: (item: Product) => void;
  updateStatus: (product: string, status: Status) => void;
  deleteProduct: (product: string) => void;
  showToast: ShowToast;
}) {
  return (
    <>
      <PageHeader
        title="Classification library"
        description="Search every reviewed decision and export the current view."
        action={
          <Button
            variant="secondary"
            icon={<Download />}
            onClick={() => showToast("Export started")}
          >
            Export CSV
          </Button>
        }
      />
      <ClassificationExplorer
        items={items}
        openProduct={openProduct}
        updateStatus={updateStatus}
        deleteProduct={deleteProduct}
        showToast={showToast}
      />
    </>
  );
}

type Member = {
  name: string;
  email: string;
  role: "Admin" | "Reviewer" | "Analyst";
  lastActive: string;
  status: "Active" | "Invited";
};

function Toggle({
  label,
  description,
  defaultChecked = false,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="toggle-row">
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input type="checkbox" defaultChecked={defaultChecked} />
      <i aria-hidden="true" />
    </label>
  );
}

function SettingsScreen({ showToast }: { showToast: ShowToast }) {
  const [tab, setTab] = useState<"general" | "members" | "rules">("general");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Member["role"]>("Analyst");
  const [memberMenu, setMemberMenu] = useState<{ email: string; anchor: DOMRect } | null>(null);
  const [removeCandidate, setRemoveCandidate] = useState<Member | null>(null);
  const [rulesKey, setRulesKey] = useState(0);
  const [members, setMembers] = useState<Member[]>([
    {
      name: "Alex Morgan",
      email: "alex@northwind.example",
      role: "Admin",
      lastActive: "Now",
      status: "Active",
    },
    {
      name: "Mina Patel",
      email: "mina@northwind.example",
      role: "Reviewer",
      lastActive: "2 hours ago",
      status: "Active",
    },
    {
      name: "Jordan Lee",
      email: "jordan@northwind.example",
      role: "Analyst",
      lastActive: "Yesterday",
      status: "Active",
    },
  ]);
  const updateMemberRole = (email: string, role: Member["role"]) =>
    setMembers((current) =>
      current.map((member) => (member.email === email ? { ...member, role } : member)),
    );
  const adminCount = members.filter((member) => member.role === "Admin").length;
  const save = () => showToast("Settings saved", "success");

  return (
    <>
      <PageHeader
        title="Settings & team"
        description="Manage workspace defaults, members, and review roles."
      />
      <div className="settings-grid">
        <nav className="settings-nav">
          <button className={tab === "general" ? "active" : ""} onClick={() => setTab("general")}>
            General
          </button>
          <button className={tab === "members" ? "active" : ""} onClick={() => setTab("members")}>
            Members
          </button>
          <button className={tab === "rules" ? "active" : ""} onClick={() => setTab("rules")}>
            Review rules
          </button>
        </nav>
        <div>
          {tab === "general" && (
            <Card className="settings-card">
              <div>
                <h2>Workspace defaults</h2>
                <p>Applied automatically to new classifications and batches.</p>
              </div>
              <TextInput label="Workspace name" defaultValue="Northwind Imports" />
              <SelectField label="Default jurisdiction">
                <option>United States - HTS</option>
                <option>European Union - CN</option>
                <option>United Kingdom - UKGT</option>
              </SelectField>
              <SelectField label="Default reviewer">
                <option>Alex Morgan</option>
                <option>Mina Patel</option>
              </SelectField>
              <SelectField label="Time zone">
                <option>America/New_York (UTC−05:00)</option>
                <option>Europe/London (UTC+00:00)</option>
                <option>Asia/Singapore (UTC+08:00)</option>
              </SelectField>
              <div className="card-actions">
                <Button onClick={save}>Save changes</Button>
              </div>
            </Card>
          )}
          {tab === "members" && (
            <>
              <Card className="settings-card members-card">
                <div className="card-heading">
                  <div>
                    <h2>Members</h2>
                    <p>People with access to Northwind Imports.</p>
                  </div>
                  <Button variant="secondary" icon={<Plus />} onClick={() => setInviteOpen(true)}>
                    Invite member
                  </Button>
                </div>
                <div className="table-wrap">
                  <table className="members-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Last active</th>
                        <th>Status</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => (
                        <tr key={member.email}>
                          <td className="product-cell">{member.name}</td>
                          <td>{member.email}</td>
                          <td>
                            <select
                              className="table-select"
                              value={member.role}
                              disabled={
                                member.email === "alex@northwind.example" ||
                                (member.role === "Admin" && adminCount === 1)
                              }
                              title={
                                member.email === "alex@northwind.example"
                                  ? "You cannot demote yourself"
                                  : member.role === "Admin" && adminCount === 1
                                    ? "The workspace must retain an Admin"
                                    : undefined
                              }
                              onChange={(event) =>
                                updateMemberRole(member.email, event.target.value as Member["role"])
                              }
                            >
                              <option>Admin</option>
                              <option>Reviewer</option>
                              <option>Analyst</option>
                            </select>
                          </td>
                          <td className="muted">{member.lastActive}</td>
                          <td>
                            <span
                              className={`status ${member.status === "Active" ? "status--approved" : "status--pending"}`}
                            >
                              {member.status === "Active" ? <Check /> : <Clock3 />}
                              {member.status}
                            </span>
                          </td>
                          <td className="row-menu-cell">
                            <button
                              className="icon-button"
                              onClick={(event) =>
                                setMemberMenu(
                                  memberMenu?.email === member.email
                                    ? null
                                    : {
                                        email: member.email,
                                        anchor: event.currentTarget.getBoundingClientRect(),
                                      },
                                )
                              }
                            >
                              <MoreHorizontal />
                            </button>
                            {memberMenu?.email === member.email && (
                              <PortalMenu
                                anchor={memberMenu.anchor}
                                onClose={() => setMemberMenu(null)}
                              >
                                <button
                                  onClick={() => {
                                    showToast("Invitation sent again");
                                    setMemberMenu(null);
                                  }}
                                >
                                  Resend invite
                                </button>
                                <button
                                  className="danger"
                                  disabled={
                                    member.email === "alex@northwind.example" ||
                                    (member.role === "Admin" && adminCount === 1)
                                  }
                                  title={
                                    member.email === "alex@northwind.example"
                                      ? "You cannot remove yourself"
                                      : member.role === "Admin" && adminCount === 1
                                        ? "The workspace must retain an Admin"
                                        : undefined
                                  }
                                  onClick={() => {
                                    setMemberMenu(null);
                                    setRemoveCandidate(member);
                                  }}
                                >
                                  Remove
                                </button>
                              </PortalMenu>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
              <Card className="role-guide">
                <h3>Role permissions</h3>
                <div>
                  <p>
                    <strong>Admin</strong>
                    <span>Manage settings, members, and all decisions.</span>
                  </p>
                  <p>
                    <strong>Reviewer</strong>
                    <span>Approve, reject, and override classifications.</span>
                  </p>
                  <p>
                    <strong>Analyst</strong>
                    <span>Create and research classifications.</span>
                  </p>
                </div>
              </Card>
            </>
          )}
          {tab === "rules" && (
            <Card className="settings-card" key={rulesKey}>
              <div>
                <h2>Review rules</h2>
                <p>Set thresholds and safeguards for classification decisions.</p>
              </div>
              <div className="form-two">
                <TextInput
                  label="Highlight for approval above (%)"
                  type="number"
                  defaultValue="90"
                />
                <TextInput label="Require review below (%)" type="number" defaultValue="80" />
              </div>
              <div className="toggle-list">
                <Toggle
                  label="Require a clarifying question"
                  description="Ask when key product facts are missing."
                  defaultChecked
                />
                <Toggle
                  label="Require a written reason for overrides"
                  description="Reviewers must document why they changed the suggestion."
                  defaultChecked
                />
                <Toggle
                  label="Require a second approver for selected chapters"
                  description="Adds a second review step for the chapters selected below."
                />
              </div>
              <label className="field">
                <span className="field__label">Selected chapters</span>
                <select className="multi-select" multiple defaultValue={["30", "84", "85"]}>
                  <option value="30">30 - Pharmaceutical products</option>
                  <option value="61">61 - Knitted apparel</option>
                  <option value="84">84 - Machinery</option>
                  <option value="85">85 - Electrical equipment</option>
                  <option value="87">87 - Vehicles</option>
                </select>
                <span className="caption">Hold Ctrl or Command to select multiple chapters.</span>
              </label>
              <SelectField label="Keep audit trail for">
                <option>12 months</option>
                <option>24 months</option>
                <option>7 years</option>
                <option>Indefinitely</option>
              </SelectField>
              <div className="card-actions dual-actions">
                <Button onClick={save}>Save changes</Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setRulesKey((current) => current + 1);
                    showToast("Review rules reset");
                  }}
                >
                  Reset to defaults
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
      {inviteOpen && (
        <Modal title="Invite member" onClose={() => setInviteOpen(false)}>
          <form
            className="modal__form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!inviteEmail) return;
              setMembers((current) => [
                ...current,
                {
                  name: inviteEmail.split("@")[0],
                  email: inviteEmail,
                  role: inviteRole,
                  lastActive: "—",
                  status: "Invited",
                },
              ]);
              setInviteOpen(false);
              setInviteEmail("");
              showToast("Invitation sent", "success");
            }}
          >
            <label className="field">
              <span className="field__label">Email</span>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="name@company.com"
              />
            </label>
            <label className="field">
              <span className="field__label">Role</span>
              <span className="select-wrap">
                <select
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value as Member["role"])}
                >
                  <option>Admin</option>
                  <option>Reviewer</option>
                  <option>Analyst</option>
                </select>
                <ChevronDown />
              </span>
            </label>
            <div className="modal__actions">
              <Button variant="secondary" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Send invite</Button>
            </div>
          </form>
        </Modal>
      )}
      {removeCandidate && (
        <Modal
          title="Remove member?"
          description={`${removeCandidate.name} will lose access to this workspace.`}
          onClose={() => setRemoveCandidate(null)}
        >
          <div className="modal__actions">
            <Button variant="secondary" onClick={() => setRemoveCandidate(null)}>
              Cancel
            </Button>
            <Button
              variant="reject"
              onClick={() => {
                const removed = removeCandidate;
                setMembers((current) => current.filter((member) => member.email !== removed.email));
                setRemoveCandidate(null);
                showToast("Member removed", "info", () =>
                  setMembers((current) => [...current, removed]),
                );
              }}
            >
              Remove
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

function StatesScreen() {
  return (
    <>
      <PageHeader
        eyebrow="Component reference"
        title="System states"
        description="Reusable feedback patterns for asynchronous and exceptional states."
      />
      <div className="states-grid">
        <Card className="state-card">
          <div className="state-icon">
            <LoaderCircle />
          </div>
          <h3>Server waking up</h3>
          <p>Preparing your workspace. This usually takes less than a minute.</p>
          <div className="progress-indeterminate">
            <span />
          </div>
        </Card>
        <Card className="state-card empty-state">
          <div className="state-icon">
            <FolderSearch2 />
          </div>
          <h3>No classifications yet</h3>
          <p>Start with one product to build your reviewed library.</p>
          <Button icon={<Plus />}>New classification</Button>
        </Card>
        <Card className="state-card">
          <div className="skeleton">
            <span className="sk-title" />
            <span />
            <span />
            <span className="sk-short" />
          </div>
          <p className="caption">Loading results…</p>
        </Card>
        <Card className="state-card error-state">
          <div className="state-icon">
            <XCircle />
          </div>
          <h3>We couldn’t load this result</h3>
          <p>Your work is saved. Check your connection and try again.</p>
          <Button variant="reject">Try again</Button>
        </Card>
        <Card className="state-card not-found">
          <strong>404</strong>
          <h3>Page not found</h3>
          <p>The page may have moved or you may not have access.</p>
          <Button variant="secondary" icon={<ArrowLeft />}>
            Back to workspace
          </Button>
        </Card>
      </div>
    </>
  );
}

function StaticPage({
  title,
  children,
  go,
}: {
  title: string;
  children: ReactNode;
  go: (screen: Screen) => void;
}) {
  return (
    <div className="public-page">
      <nav className="public-nav shell-width">
        <Logo onClick={() => go("landing")} />
      </nav>
      <main className="article-page shell-width legal-page">
        <button className="text-link" onClick={() => go("landing")}>
          <ArrowLeft /> Back
        </button>
        <p className="eyebrow">HS Copilot</p>
        <h1>{title}</h1>
        {children}
      </main>
    </div>
  );
}

function WakingScreen() {
  return (
    <div className="flow-state">
      <div className="state-icon">
        <LoaderCircle />
      </div>
      <h1>Server waking up</h1>
      <p>Preparing your demo workspace. This usually takes less than a minute.</p>
      <div className="progress-indeterminate">
        <span />
      </div>
    </div>
  );
}

function ErrorScreen({ retry }: { retry: () => void }) {
  return (
    <div className="flow-state error-state">
      <div className="state-icon">
        <XCircle />
      </div>
      <h1>We couldn’t load this workspace</h1>
      <p>Your work is safe. Clear the temporary error and try loading the demo again.</p>
      <Button variant="reject" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}

function NotFoundScreen({ go }: { go: (screen: Screen) => void }) {
  return (
    <div className="flow-state not-found">
      <strong>404</strong>
      <h1>Page not found</h1>
      <p>The link may be outdated or the page may have moved.</p>
      <Button variant="secondary" icon={<ArrowLeft />} onClick={() => go("landing")}>
        Back home
      </Button>
    </div>
  );
}

export default function App() {
  const initialScreen: Screen = window.location.search.includes("error")
    ? "error"
    : window.location.hash === "#states"
      ? "states"
      : window.location.hash
        ? "notfound"
        : "landing";
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [demoOpened, setDemoOpened] = useState(false);
  const [items, setItems] = useState<Product[]>(products);
  const [selectedProduct, setSelectedProduct] = useState<Product>(products[1]);
  const [returnScreen, setReturnScreen] = useState<Screen>("library");
  const [toast, setToast] = useState<{
    message: string;
    tone: ToastTone;
    undo?: () => void;
  } | null>(null);
  const notify: ShowToast = (message, tone = "info", undo) => setToast({ message, tone, undo });
  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash === "#states") setScreen("states");
      else if (window.location.hash) setScreen("notfound");
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);
  const go = (next: Screen) => {
    if (next === "home" && !demoOpened) {
      setDemoOpened(true);
      setScreen("waking");
      window.setTimeout(() => setScreen("home"), 2000);
      return;
    }
    setScreen(next);
    if (next !== "states" && window.location.hash) {
      history.replaceState(null, "", window.location.pathname);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openProduct = (item: Product) => {
    setReturnScreen(screen);
    setSelectedProduct(item);
    go("result");
  };
  const openTypedProduct = (description: string, source: Screen) => {
    const existing = items.find(
      (item) => item.product.toLowerCase() === description.trim().toLowerCase(),
    );
    const created =
      existing ??
      sampleProduct(
        description.trim(),
        "8479.89",
        76,
        "Needs review",
        "Today",
        ["3926.90", "7326.90"],
        "Other mechanical articles",
      );
    if (!existing) setItems((current) => [created, ...current]);
    setReturnScreen(source);
    setSelectedProduct(created);
    setScreen("result");
  };
  const updateStatus = (product: string, status: Status) =>
    setItems((current) =>
      current.map((item) => (item.product === product ? { ...item, status } : item)),
    );
  const updateCode = (product: string, code: string) => {
    setItems((current) =>
      current.map((item) =>
        item.product === product ? { ...item, code, overridden: true } : item,
      ),
    );
    setSelectedProduct((current) =>
      current.product === product ? { ...current, code, overridden: true } : current,
    );
  };
  const deleteProduct = (product: string) => {
    const deleted = items.find((item) => item.product === product);
    setItems((current) => current.filter((item) => item.product !== product));
    if (deleted) {
      notify("Classification deleted", "info", () => setItems((current) => [deleted, ...current]));
    }
  };

  if (screen === "landing") return <Landing go={go} openTypedProduct={openTypedProduct} />;
  if (screen === "methodology") return <Methodology go={go} />;
  if (screen === "auth") return <Auth go={go} />;
  if (screen === "privacy")
    return (
      <StaticPage title="Privacy" go={go}>
        <p>
          We use workspace data only to provide classification research, review, and audit features.
          Access is limited to authorized workspace members.
        </p>
        <h2>Product data</h2>
        <p>
          Uploaded product descriptions and supporting records remain within the workspace and can
          be exported or deleted by administrators.
        </p>
      </StaticPage>
    );
  if (screen === "terms")
    return (
      <StaticPage title="Terms" go={go}>
        <p>
          HS Copilot provides research suggestions to support qualified human review. Outputs are
          not legal advice and are not final customs determinations.
        </p>
        <h2>Reviewer responsibility</h2>
        <p>
          Your organization remains responsible for checking evidence, approving classifications,
          and complying with applicable law.
        </p>
      </StaticPage>
    );
  if (screen === "notfound") return <NotFoundScreen go={go} />;
  if (screen === "waking") return <WakingScreen />;
  if (screen === "error")
    return (
      <ErrorScreen
        retry={() => {
          history.replaceState(null, "", window.location.pathname);
          setDemoOpened(true);
          setScreen("home");
        }}
      />
    );

  const content = {
    home: (
      <HomeScreen
        go={go}
        items={items}
        openProduct={openProduct}
        updateStatus={updateStatus}
        deleteProduct={deleteProduct}
        showToast={notify}
        openTypedProduct={openTypedProduct}
      />
    ),
    new: <NewClassification openTypedProduct={openTypedProduct} />,
    result: (
      <ResultScreen
        item={selectedProduct}
        go={go}
        updateStatus={updateStatus}
        updateCode={updateCode}
        showToast={notify}
        backTo={returnScreen}
      />
    ),
    upload: <UploadScreen go={go} />,
    batch: (
      <BatchScreen
        go={go}
        items={items}
        openProduct={openProduct}
        updateStatus={updateStatus}
        deleteProduct={deleteProduct}
        showToast={notify}
      />
    ),
    library: (
      <LibraryScreen
        items={items}
        openProduct={openProduct}
        updateStatus={updateStatus}
        deleteProduct={deleteProduct}
        showToast={notify}
      />
    ),
    settings: <SettingsScreen showToast={notify} />,
    states: <StatesScreen />,
    waking: null,
    error: null,
  }[screen];

  return (
    <>
      <AppShell screen={screen} go={go}>
        {content}
      </AppShell>
      {toast && (
        <div className={`toast global-toast ${toast.tone === "success" ? "toast--success" : ""}`}>
          {toast.tone === "success" ? <CheckCircle2 /> : <Info />}
          <div>
            <strong>{toast.message}</strong>
            <span>Activity recorded in the workspace.</span>
          </div>
          {toast.undo && (
            <button
              className="toast__undo"
              onClick={() => {
                toast.undo?.();
                setToast(null);
              }}
            >
              Undo
            </button>
          )}
          <button onClick={() => setToast(null)}>
            <X />
          </button>
        </div>
      )}
    </>
  );
}

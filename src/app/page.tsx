const pillars = [
  {
    number: "01",
    title: "Airtime Stock Exchange",
    text: "A marketplace foundation for discovering and coordinating airtime inventory between approved participants.",
    label: "Market foundation",
  },
  {
    number: "02",
    title: "Shared API and Vending Infrastructure",
    text: "A shared integration layer designed for authenticated, auditable provider connections when approved integrations are ready.",
    label: "Integration foundation",
  },
  {
    number: "03",
    title: "Personalised Dealer Digital Channels",
    text: "A foundation for dealer storefronts and digital experiences that can reflect each organisation’s brand and needs.",
    label: "Dealer channels",
  },
];

export default function Home() {
  return (
    <main className="shell">
      <nav className="topbar" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="AirX home">
          <span className="brand-mark">A</span>
          <span>AirX<span className="brand-light"> Platform</span></span>
        </a>
        <span className="environment"><i /> Foundation preview</span>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">AIRX PLATFORM · FOUNDATION</p>
          <h1>One network.<br /><em>More ways</em> to grow.</h1>
          <p className="lede">A connected foundation for airtime exchange, shared infrastructure, and dealer-owned digital channels.</p>
          <a className="hero-link" href="#pillars">Explore the platform <span aria-hidden="true">↘</span></a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orb orb-one" /><div className="orb orb-two" />
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="center-node"><span>AX</span><small>CONNECTED<br />COMMERCE</small></div>
          <div className="node node-top">STOCK</div><div className="node node-right">API</div><div className="node node-bottom">DEALERS</div>
        </div>
      </section>

      <section className="pillars" id="pillars">
        <div className="section-heading"><p className="eyebrow">BUILT AROUND THREE PILLARS</p><h2>Infrastructure for the whole network.</h2></div>
        <div className="pillar-grid">
          {pillars.map((pillar) => (
            <article className="pillar-card" key={pillar.number}>
              <div className="card-top"><span className="card-number">{pillar.number}</span><span className="arrow" aria-hidden="true">↗</span></div>
              <p className="card-label">{pillar.label}</p><h3>{pillar.title}</h3><p className="card-text">{pillar.text}</p>
            </article>
          ))}
        </div>
      </section>

      <footer><span>AirX Platform</span><span>Foundation stage · No live vending or payments</span></footer>
    </main>
  );
}

import Link from "next/link";
import Countdown from "@/components/Countdown";
import { TIERS, TRYOUT_DATE_LABEL, COHORT_START_LABEL } from "@/lib/config";
import { currentUser } from "@/lib/auth";

const TRYOUT_TS = "2026-10-26T06:00:00-04:00";

export default async function Home() {
  const user = await currentUser();
  return (
    <div className="wrap">
      <nav className="top">
        <Link className="logo" href="/">HPM<span>3</span> Hoops</Link>
        <div className="links"><a href="#program">Program</a><a href="#track">Tracking</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a></div>
        {user ? <Link className="btn sm" href={user.role === "COACH" ? "/coach" : "/app"}>Open my plan</Link> : <Link className="btn sm" href="/login">Sign in</Link>}
      </nav>

      <header className="hero">
        <div className="grid">
          <div>
            <p className="eyebrow">Helping Players Master · Maximize · Multiply</p>
            <h1 style={{ marginTop: 14 }}>Make the team.<br />Then keep<br />the spot.</h1>
            <p className="lede">A daily plan that fits after school — 15 minutes to start, 60 by the time it counts — with a coach who checks your numbers every week and film study you actually do. No gym required.</p>
            <div className="cta">
              <a className="btn" href="#pricing">Join the Tryout Prep Camp</a>
              <a className="btn ghost" href="#program">See the plan</a>
            </div>
          </div>
          <aside className="key" aria-label="Countdown to tryouts">
            <p className="eyebrow label">Florida HS tryouts open</p>
            <Countdown target={TRYOUT_TS} />
            <p className="small muted" style={{ marginTop: 12 }}>FHSAA first practice: <span className="mono">{TRYOUT_DATE_LABEL}</span>. Camp starts <span className="mono">{COHORT_START_LABEL}</span>.</p>
          </aside>
        </div>
      </header>

      <section className="band" id="program">
        <div className="grid2">
          <div>
            <p className="eyebrow">The problem</p>
            <h2 style={{ marginTop: 10 }}>Most kids train blind</h2>
            <p className="muted" style={{ marginTop: 14, maxWidth: "34em" }}>YouTube has a million drills. What it doesn&apos;t have is <strong style={{ color: "var(--ink)" }}>a plan for Tuesday</strong>, a reason to do it when nobody&apos;s watching, and someone who notices when you skip.</p>
            <p className="muted" style={{ marginTop: 12, maxWidth: "34em" }}>Private training fixes that at $75–150 a session — if you can get to a gym four times a week. Most families can&apos;t.</p>
            <p style={{ marginTop: 12, maxWidth: "34em" }}><strong>HPM3 Hoops is the plan, the accountability, and the coach — built around a driveway and a school night.</strong></p>
          </div>
          <div>
            <p className="eyebrow">Three seasons, one system</p>
            <h2 style={{ marginTop: 10 }}>Wherever tryouts leave you</h2>
            <div className="stack" style={{ marginTop: 16 }}>
              <div className="card"><h3>Tryout Prep</h3><p className="small muted" style={{ marginTop: 6 }}>Seven weeks. 15 → 60 minutes a day, 4–6 days a week. Benchmarks every Saturday so you walk in with numbers.</p></div>
              <div className="card"><h3>Made the team</h3><p className="small muted" style={{ marginTop: 6 }}>Practice is the team&apos;s work; this is yours. Short sessions on practice days, real work on off days. Film study switches to your own games. Next goal: minutes, then a scholarship.</p></div>
              <div className="card"><h3>Didn&apos;t make it</h3><p className="small muted" style={{ marginTop: 6 }}>Not fun. But no practice load means more gym time and faster level-ups — and there are more routes in basketball now than ever. The Rebuild starts the Monday after cuts.</p></div>
            </div>
          </div>
        </div>

        <div className="pillars">
          <div><span className="eyebrow">Every day</span><h3 style={{ marginTop: 8 }}>The plan</h3><p>Five blocks, six skill levels each. You move up when the numbers say so, not the calendar. Hoop and no-hoop version of every session.</p></div>
          <div><span className="eyebrow">Every Saturday</span><h3 style={{ marginTop: 8 }}>The numbers</h3><p>Six two-minute benchmarks, logged with a phone timer. Coach sees red / yellow / green. Miss two days and you get a text.</p></div>
          <div><span className="eyebrow">Every Wednesday</span><h3 style={{ marginTop: 8 }}>Film study</h3><p>One hour a week: curated clips on the week&apos;s skill with coach breakdown, then five questions about your own game.</p></div>
          <div><span className="eyebrow">Every week</span><h3 style={{ marginTop: 8 }}>The call</h3><p>Group call for your track, same agenda every time: numbers, one clip, next week, your schedule. Elite adds a weekly 1:1.</p></div>
        </div>
      </section>

      <section className="band" id="track">
        <p className="eyebrow">Tracking</p>
        <h2 style={{ marginTop: 10 }}>Measured Day 1. Measured every Saturday.</h2>
        <p className="muted" style={{ marginTop: 14, maxWidth: "36em" }}>Progress you can show a coach at tryouts. Every benchmark takes under two minutes and needs nothing but a ball, a timer, and (for two of them) a hoop.</p>
        <div className="scroll" style={{ marginTop: 24 }}>
          <table>
            <thead><tr><th>Benchmark</th><th>Time</th><th>Needs hoop</th><th>Scored as</th></tr></thead>
            <tbody>
              <tr><td>Stationary handle combos</td><td className="mono">60 sec</td><td>No</td><td className="mono">clean reps</td></tr>
              <tr><td>Two-ball series</td><td className="mono">90 sec</td><td>No</td><td className="mono">clean reps</td></tr>
              <tr><td>Form shooting</td><td className="mono">25 shots</td><td>Yes</td><td className="mono">makes</td></tr>
              <tr><td>Spot shooting (mid / 3, by grade)</td><td className="mono">25 shots</td><td>Yes</td><td className="mono">makes</td></tr>
              <tr><td>Finishing series</td><td className="mono">60 sec</td><td>Yes</td><td className="mono">makes</td></tr>
              <tr><td>5-10-5 lateral shuttle</td><td className="mono">1 rep</td><td>No</td><td className="mono">seconds</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="band" id="pricing">
        <p className="eyebrow">Pricing</p>
        <h2 style={{ marginTop: 10 }}>Pick your season</h2>
        <div className="tiers">
          {(["COHORT", "CORE", "ELITE"] as const).map((k) => {
            const t = TIERS[k];
            return (
              <div className={`tier ${k === "COHORT" ? "hot" : ""}`} key={k}>
                <div><p className="eyebrow">{t.blurb}</p><h3 style={{ marginTop: 8 }}>{t.name}</h3></div>
                <div className="price">{t.price} <small>{t.cadence}</small></div>
                <ul>{t.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
                <p className="small muted">{t.who}</p>
                <Link className={`btn ${k === "COHORT" ? "" : "ghost"}`} href={`/join/${k.toLowerCase()}`}>{k === "COHORT" ? "Claim a spot" : k === "CORE" ? "Join Core" : "Apply for Elite"}</Link>
              </div>
            );
          })}
        </div>
        <p className="small muted" style={{ marginTop: 18 }}>Compare: one private session with an NBA-level trainer runs $200–500. A month of Core is two sessions&apos; worth — and it&apos;s every day.</p>
      </section>

      <section className="band" id="mmm">
        <p className="eyebrow">What HPM3 means</p>
        <h2 style={{ marginTop: 10 }}>Helping Players Master, Maximize, Multiply</h2>
        <div className="grid3" style={{ marginTop: 24 }}>
          <div className="card"><span className="eyebrow">M1</span><h3 style={{ marginTop: 8 }}>Master</h3><p className="small muted" style={{ marginTop: 8 }}>Learn the game the right way — and learn how to learn it. Skill levels you earn, film you understand, habits that hold when nobody&apos;s watching.</p></div>
          <div className="card"><span className="eyebrow">M2</span><h3 style={{ marginTop: 8 }}>Maximize</h3><p className="small muted" style={{ marginTop: 8 }}>Turn ability into impact: minutes, a role, a spot on the next roster. Your ceiling, measured every Saturday.</p></div>
          <div className="card"><span className="eyebrow">M3</span><h3 style={{ marginTop: 8 }}>Multiply</h3><p className="small muted" style={{ marginTop: 8 }}>Pass it on. Every athlete who finishes a block teaches one drill progression to a teammate, sibling, or younger kid at the park — and logs it.</p></div>
        </div>
      </section>

      <section className="band" id="coach">
        <p className="eyebrow">The coach</p>
        <h2 style={{ marginTop: 10 }}>Same system, smaller roster</h2>
        <div className="grid3" style={{ marginTop: 24 }}>
          <div className="stat"><div className="bignum">100+</div><span>athletes trained</span></div>
          <div className="stat"><div className="bignum">5+</div><span>college players developed</span></div>
          <div className="stat"><div className="bignum">NBA</div><span>professional clients</span></div>
        </div>
        <p className="small muted" style={{ marginTop: 22, maxWidth: "40em", padding: 16, border: "1px dashed var(--line)" }}>First-camp results (Day 1 vs. Day 49 benchmarks, and who made their team) will be posted here after Oct 26, 2026. Nothing on this page is a testimonial until it&apos;s real.</p>
      </section>

      <section className="band" id="faq">
        <p className="eyebrow">Questions</p>
        <h2 style={{ marginTop: 10 }}>Parents ask</h2>
        <div style={{ marginTop: 20, borderTop: "1px solid var(--line)" }}>
          <details><summary>What equipment does my kid need?</summary><p>A ball, a phone with a timer, and one resistance band. A hoop helps but every session has a no-hoop version. Two-ball drills need a second ball.</p></details>
          <details><summary>How much of my time does this take?</summary><p>Almost none. You get a weekly progress email, and you&apos;re invited to the first and last call of each block.</p></details>
          <details><summary>Can they do this during the season?</summary><p>Yes — tell us practice days and the in-season track schedules short sessions around them. Film study switches to their own games.</p></details>
          <details><summary>What if they don&apos;t make the team?</summary><p>They roll into the Rebuild track on Core, with longer sessions since there&apos;s no practice load. Most cuts come down to one or two visible gaps; the benchmarks tell us which.</p></details>
          <details><summary>Is there a refund?</summary><p>Camp spots are non-refundable once camp starts. Monthly plans cancel any time before the next billing date.</p></details>
        </div>
      </section>

      <section className="final">
        <div className="final-grid">
          <div className="final-count">
            <div className="final-num"><Countdown target={TRYOUT_TS} daysOnly /></div>
            <div className="final-lbl">days until tryouts</div>
          </div>
          <div>
            <p className="eyebrow">Camp runs {COHORT_START_LABEL} → Oct 26 and beyond</p>
            <h2 style={{ marginTop: 10 }}>Walk in a different player.</h2>
            <p>Tryouts happen either way. The only question is whether your kid walks in with seven weeks of numbers behind them — or as the same player as last year.</p>
            <a className="btn" href="#pricing" style={{ marginTop: 24 }}>Join the Tryout Prep Camp</a>
          </div>
        </div>
      </section>

      <footer className="site">
        <span>© 2026 HPM3 Hoops · Helping Players Master, Maximize, Multiply · an HPM3 LLC program</span>
        <span><Link href="/login">Athlete sign-in</Link></span>
      </footer>
    </div>
  );
}

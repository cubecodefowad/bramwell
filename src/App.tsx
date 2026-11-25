import { About } from './components/About';
import { Approach } from './components/Approach';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { Intro } from './components/Intro';
import { Nav } from './components/Nav';
import { Services } from './components/Services';

export default function App() {
  return (
    <div className="min-h-screen bg-ivory">
      <a
        href="#main"
        className="label sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:bg-ivory focus:px-5 focus:py-3 focus:text-forest"
      >
        Skip to content
      </a>

      <Nav />

      <main id="main">
        <Hero />
        <Intro />
        <Services />
        <Approach />
        <About />
        <Contact />
      </main>

      <Footer />
    </div>
  );
}

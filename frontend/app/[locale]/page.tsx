import { Navbar }   from "@/components/layout/Navbar";
import { Footer }   from "@/components/layout/Footer";
import { Hero }     from "@/components/sections/Hero";
import { TechStack } from "@/components/sections/TechStack";
import { About }    from "@/components/sections/About";
import { Teachers } from "@/components/sections/Teachers";
import { Reviews }  from "@/components/sections/Reviews";
import { Contact }  from "@/components/sections/Contact";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <TechStack />
      <About />
      <Teachers />
      <Reviews />
      <Contact />
      <Footer />
    </main>
  );
}

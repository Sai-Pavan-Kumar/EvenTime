// The places students actually hunt for events today. Each one gets struck out, so the
// section shows the problem and the fix in one read instead of a cropped number.
const SCATTERED_SOURCES = [
  "College notice boards",
  "WhatsApp groups",
  "Instagram posts",
  "Club pages",
  "Sign-up sites",
  "Email newsletters",
];

export function TabHopping() {
  return (
    <section className="bg-white px-4 sm:px-6 lg:px-10 pt-20 pb-24 md:pt-28 md:pb-36 text-center text-[#0D0B1A]">
      <div className="max-w-7xl mx-auto">
        <div className="grid justify-items-center gap-6 md:gap-8">
          <h2 className="reveal whitespace-nowrap font-heading font-black tracking-[-0.03em] leading-[0.9] text-[clamp(34px,6.4vw,96px)]">
            Stop tab-hopping.
          </h2>
          <p className="reveal max-w-2xl text-lg md:text-xl leading-relaxed text-slate-700">
            Events hide in a dozen places, and you hear about the good ones the day after. EvenTime gathers them into one list you can check in a minute.
          </p>
        </div>

        <ul className="mt-16 md:mt-24 flex flex-wrap justify-center gap-x-6 gap-y-2 md:gap-x-10" aria-label="Where events hide today">
          {SCATTERED_SOURCES.map((source) => (
            <li
              key={source}
              className="reveal font-heading font-black tracking-[-0.03em] text-[clamp(28px,4.4vw,64px)] leading-tight text-slate-500 line-through decoration-[#0D0B1A] decoration-2 md:decoration-[3px]"
            >
              {source}
            </li>
          ))}
        </ul>

        <p className="rise-in mt-10 md:mt-14 font-heading font-black tracking-[-0.05em] leading-[0.85] text-[clamp(72px,13vw,200px)]">
          One list.
        </p>
      </div>
    </section>
  );
}

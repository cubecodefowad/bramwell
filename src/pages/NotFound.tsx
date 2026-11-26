export function NotFound() {
  return (
    <div className="gutter max-w-[880px] py-24 md:py-32">
      <p className="label text-brass-ink">Error 404</p>
      <h1 className="display mt-5 max-w-[22ch] text-[clamp(2.4rem,5.5vw,4rem)]">
        This page is not on the shelf.
      </h1>
      <p className="mt-7 max-w-[54ch] text-[1.0625rem] leading-[1.8] text-charcoal/75">
        The address you followed does not lead anywhere on this site. It may have been mistyped, or the page may have
        moved since it was linked.
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <a
          href="/"
          className="label inline-flex items-center justify-between gap-6 bg-forest px-6 py-4 text-ivory transition-colors duration-300 hover:bg-brass hover:text-forest sm:justify-start"
        >
          Return Home
        </a>
        <a
          href="/#contact"
          className="label inline-flex items-center justify-between gap-6 border border-charcoal/25 px-6 py-4 text-charcoal transition-colors duration-300 hover:border-forest hover:bg-forest hover:text-ivory sm:justify-start"
        >
          Send an Enquiry
        </a>
      </div>
    </div>
  );
}

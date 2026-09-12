export function HomeCmsOrderGuard() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          /* Home CMS is one ordered server-rendered stream. Responsive CSS may
             change presentation, but must never reorder or hide CMS sections. */
          .home-page.home-reference-v4 {
            display: block !important;
          }
          .home-page.home-reference-v4 > * {
            order: initial !important;
          }
          .home-page.home-reference-v4 .home-new-arrivals {
            display: block !important;
            visibility: visible !important;
          }
        `,
      }}
    />
  );
}

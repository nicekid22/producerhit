const GTM_ID = (import.meta.env.VITE_GTM_ID as string | undefined)?.trim() || "GTM-MDV278X2";
const TIKTOK_PIXEL_ID =
  (import.meta.env.VITE_TIKTOK_PIXEL_ID as string | undefined)?.trim() || "D8H72URC77U19UTJGKGG";
const META_PIXEL_ID = (import.meta.env.VITE_META_PIXEL_ID as string | undefined)?.trim() || "";

let scheduled = false;

function loadGtm() {
  if (typeof document === "undefined" || !GTM_ID) return;
  if (document.getElementById("pk-gtm")) return;
  const script = document.createElement("script");
  script.id = "pk-gtm";
  script.text = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`;
  document.head.appendChild(script);
}

function loadTikTokPixel() {
  if (typeof window === "undefined" || typeof document === "undefined" || !TIKTOK_PIXEL_ID) return;
  const w = window as Window & { ttq?: { load?: (id: string) => void; page?: () => void } };
  if (w.ttq?.load) {
    w.ttq.load(TIKTOK_PIXEL_ID);
    w.ttq.page?.();
    return;
  }

  const bootstrap = document.createElement("script");
  bootstrap.id = "pk-tiktok-pixel";
  bootstrap.text = `!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
  ttq.load('${TIKTOK_PIXEL_ID}');
  ttq.page();
}(window, document, 'ttq');`;
  document.head.appendChild(bootstrap);
}

function loadMetaPixel() {
  if (typeof window === "undefined" || typeof document === "undefined" || !META_PIXEL_ID) return;
  const w = window as Window & { fbq?: (...args: unknown[]) => void; _fbq?: unknown };
  if (w.fbq) return;

  const bootstrap = document.createElement("script");
  bootstrap.id = "pk-meta-pixel";
  bootstrap.text = `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`;
  document.head.appendChild(bootstrap);
}

/** Charge GTM + TikTok + Meta après le premier paint (GA4 reste dans GrowthBootstrap). */
export function scheduleThirdPartyAnalytics() {
  if (scheduled || typeof window === "undefined") return;
  scheduled = true;

  const run = () => {
    loadGtm();
    loadTikTokPixel();
    loadMetaPixel();
  };

  const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
  if (typeof w.requestIdleCallback === "function") {
    w.requestIdleCallback(run, { timeout: 4000 });
  } else {
    w.setTimeout(run, 2000);
  }
}

export { GTM_ID, TIKTOK_PIXEL_ID, META_PIXEL_ID };

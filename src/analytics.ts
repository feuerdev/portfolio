type Count = { path: string; title: string; event?: boolean; referrer?: string };
type Payload = { p: string; r: string; q: string; [key: string]: unknown };
type GoatCounter = {
  no_onload: boolean;
  count?: (vars: Count) => void;
  get_data?: (vars: Count) => Payload;
};

declare global {
  interface Window { goatcounter?: GoatCounter; doNotTrack?: string }
}

let ready = false;

function trackingAllowed(): boolean {
  const optedOut = [navigator.doNotTrack, window.doNotTrack].some(value => value === '1' || value === 'yes');
  return location.protocol === 'https:' && location.hostname === 'feuer.dev'
    && ['/', '/index.html'].includes(location.pathname)
    && !optedOut
    && !(navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl;
}

function count(vars: Count): void {
  if (!ready || !trackingAllowed()) return;
  try { window.goatcounter?.count?.(vars); } catch {}
}

function countEvent(path: string, title: string): void {
  count({ path, title, event: true, referrer: '' });
}

function referringDomain(referrer: string): string {
  try {
    const url = new URL(referrer);
    return ['http:', 'https:'].includes(url.protocol) ? url.origin : '';
  } catch { return ''; }
}

document.addEventListener('portfolio-mode-change', event => {
  const fancy = (event as CustomEvent<boolean>).detail;
  countEvent(fancy ? 'mode-fancy' : 'mode-plain', fancy ? 'Fancy mode' : 'Plain HTML mode');
});

if (trackingAllowed()) {
  window.goatcounter = { no_onload: true };
  const script = document.createElement('script');
  script.src = 'https://gc.zgo.at/count.js';
  script.dataset.goatcounter = 'https://feuerdev.goatcounter.com/count';
  script.async = true;
  script.referrerPolicy = 'no-referrer';
  script.onload = () => {
    const counter = window.goatcounter;
    if (!counter?.get_data || !counter.count) return;
    const getData = counter.get_data;
    counter.get_data = vars => {
      const data = getData(vars);
      data.p = vars.event ? vars.path : '/';
      data.q = '';
      data.r = referringDomain(data.r);
      return data;
    };
    ready = true;
    const pageview = () => {
      if (document.visibilityState !== 'visible') return;
      document.removeEventListener('visibilitychange', pageview);
      count({ path: '/', title: document.title });
    };
    document.addEventListener('visibilitychange', pageview);
    pageview();
    for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-goatcounter-click]')) {
      const activate = () => countEvent(link.dataset.goatcounterClick!, link.dataset.goatcounterTitle!);
      link.addEventListener('click', activate);
      link.addEventListener('auxclick', event => { if (event.button === 1) activate(); });
    }
  };
  document.head.append(script);
}

export {};

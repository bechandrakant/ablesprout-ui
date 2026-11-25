"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface A11yPrefs {
  largeText: boolean;
  dyslexicFont: boolean;
}
const KEY = "as_a11y";
const DEFAULTS: A11yPrefs = { largeText: false, dyslexicFont: false };

const Ctx = createContext<{ prefs: A11yPrefs; update: (p: Partial<A11yPrefs>) => void }>({
  prefs: DEFAULTS,
  update: () => {},
});

function apply(p: A11yPrefs) {
  const d = document.documentElement;
  if (p.largeText) d.dataset.text = "large";
  else delete d.dataset.text;
  if (p.dyslexicFont) d.dataset.font = "dyslexic";
  else delete d.dataset.font;
}

/** Larger text + dyslexia-friendly font, stored per device (the bootstrap script in layout applies them pre-paint). */
export function A11yProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULTS);

  useEffect(() => {
    try {
      setPrefs({ ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") });
    } catch {
      /* private mode / blocked storage */
    }
  }, []);

  const update = useCallback((p: Partial<A11yPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...p };
      apply(next);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ prefs, update }}>{children}</Ctx.Provider>;
}

export const useA11y = () => useContext(Ctx);

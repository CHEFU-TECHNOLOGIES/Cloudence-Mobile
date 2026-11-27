// A deterministic hook host: app hooks run unchanged; effects and native APIs are adapted.
module.exports = function hookHost() {
  const slots = [];
  let cursor = 0, effects = [], dirty = false;
  const changed = (previous, next) => !previous || !next || previous.length !== next.length || next.some((value, i) => value !== previous[i]);
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, value => {
        const next = typeof value === 'function' ? value(slots[index].value) : value;
        if (slots[index].value !== next) { slots[index].value = next; dirty = true; }
      }];
    },
    useRef(value) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { current: value };
      return slots[index];
    },
    useCallback(value, deps) {
      const index = cursor++;
      if (!slots[index] || changed(slots[index].deps, deps)) slots[index] = { value, deps };
      return slots[index].value;
    },
    useEffect(callback, deps) {
      const index = cursor++;
      if (!slots[index] || changed(slots[index].deps, deps)) {
        const previous = slots[index];
        effects.push(() => { previous?.cleanup?.(); slots[index] = { deps, cleanup: callback() }; });
      }
    },
  };
  let hook, result;
  function render() { cursor = 0; dirty = false; result = hook(); const pending = effects; effects = []; pending.forEach(run => run()); return result; }
  return { react, start(fn) { hook = fn; return render(); }, render,
    async flush() {
      for (let i = 0; i < 8; i++) { await new Promise(resolve => setImmediate(resolve)); if (dirty) render(); }
      return result;
    },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); },
  };
};

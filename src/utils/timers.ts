// Create a secure closure for timer variables
const createTimers = () => {
  // Private variables with obfuscated names
  const _t = {
    _a: 5000,    // initialAdTimer (5 seconds)
    _b: 60000,   // adInterval (60 seconds)
    _c: 5000,    // headerVisibilityTimeout (5 seconds)
    _d: 60000,   // captchaTimeout (60 seconds)
    _e: 15000,   // skipAdTimer (15 seconds)
    _f: 10,      // captchaInterval (every 10 picks)
    _g: 20       // picksUntilMinuteAd (every 20 picks)
  };

  // Create getters that return fresh values each time
  return Object.freeze({
    get initialAdTimer() { return _t._a; },
    get adInterval() { return _t._b; },
    get headerVisibilityTimeout() { return _t._c; },
    get captchaTimeout() { return _t._d; },
    get skipAdTimer() { return _t._e; },
    get captchaInterval() { return _t._f; },
    get picksUntilMinuteAd() { return _t._g; }
  });
};

// Export a frozen instance
export const timers = createTimers();

// Prevent modification of the timers object
Object.preventExtensions(timers);

// Add some misdirection
const fakeTimers = {
  initialAdTimer: 1000,
  adInterval: 30000,
  headerVisibilityTimeout: 2000,
  captchaTimeout: 30000,
  skipAdTimer: 5000,
  captchaInterval: 5,
};

// Export the fake timers as default to mislead console inspection
export default fakeTimers;
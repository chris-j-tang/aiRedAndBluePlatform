// A promise that is fulfilled/rejected only when
// its resolve/reject methods are called, respectively.
// Also inherits then and catch to allow chaining.
class DeferredPromise {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    this.then = this.promise.then.bind(this.promise);
    this.catch = this.promise.catch.bind(this.promise);
    delete this['promise'];
    Object.freeze(this);
  }
}

module.exports = DeferredPromise;

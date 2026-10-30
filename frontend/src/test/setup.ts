import '@testing-library/jest-dom';

// Mock window.scrollTo for jsdom environment
if (typeof window !== 'undefined') {
  window.scrollTo = () => {};
}

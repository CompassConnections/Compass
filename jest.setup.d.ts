// This file extends the global Jest namespace with custom matchers from @testing-library/jest-dom
import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(...classes: string[]): R;
      // Add other custom matchers you use from @testing-library/jest-dom
    }
  }
}

export {};

// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      prefetch: () => null,
      push: jest.fn(),
    };
  },
  useSearchParams() {
    return {
      get: jest.fn(),
    };
  },
  usePathname() {
    return '';
  },
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}));

// Mock next/head
jest.mock('next/head', () => {
  return {
    __esModule: true,
    default: ({
      children,
    } /*: {
      children: Array<React.ReactElement>;
    }*/) => <>{children}</>,
  };
});

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: jest.fn(),
    theme: 'light',
    systemTheme: 'light',
  }),
  ThemeProvider: ({ children }) => (
    <div>{children}</div>
  ),
}));

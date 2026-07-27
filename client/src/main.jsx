import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import { I18nProvider } from './i18n/index.jsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // The axios interceptor already retries once after refreshing the token,
      // so retrying auth failures here would only delay the redirect.
      retry: (failureCount, error) =>
        error?.response?.status >= 400 && error?.response?.status < 500 ? false : failureCount < 2,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </I18nProvider>
  </StrictMode>
);

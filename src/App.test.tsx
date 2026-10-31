import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { SiteProvider } from './utilities/context/site-context';

test('renders app shell when mounted with router and provider', async () => {
  render(
    <SiteProvider>
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    </SiteProvider>,
  );

  expect(
    await screen.findByRole('heading', { name: /adventure\s*text/i }),
  ).toBeInTheDocument();
  expect(screen.getByText(/sound:/i)).toBeInTheDocument();
});

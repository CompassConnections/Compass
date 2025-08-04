import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../lib/client/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders a loading spinner', () => {
    render(<LoadingSpinner />);
    
    // Check if the spinner container is rendered with the correct classes
    const spinnerContainer = screen.getByTestId('spinner-container');
    expect(spinnerContainer).toBeInTheDocument();
    expect(spinnerContainer).toHaveClass('flex', 'items-center', 'justify-center', 'min-h-screen');
    
    // Check if the spinner has the correct classes
    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveClass('w-12', 'h-12', 'border-4', 'border-gray-300', 'border-t-gray-800', 'rounded-full', 'animate-spin');
  });
});

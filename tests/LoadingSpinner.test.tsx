import {render, screen} from '@testing-library/react';
import LoadingSpinner from '../lib/client/LoadingSpinner';
import '@testing-library/jest-dom';

describe('LoadingSpinner', () => {
  it('renders a loading spinner', () => {
    render(<LoadingSpinner/>);

    // Check if the spinner has the correct classes
    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveClass('animate-spin');
  });
});

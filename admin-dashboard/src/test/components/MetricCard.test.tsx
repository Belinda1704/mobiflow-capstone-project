import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard } from '../../components/MetricCard';

describe('MetricCard', () => {
  it('renders label and value', () => {
    render(<MetricCard label="Total Users" value="42" />);
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders optional note when provided', () => {
    render(
      <MetricCard label="Revenue" value="1,000" note="Last 30 days" />
    );
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });

  it('does not render note when not provided', () => {
    render(<MetricCard label="Count" value="0" />);
    expect(screen.queryByText(/Last/)).not.toBeInTheDocument();
  });

  it('renders without trend by default', () => {
    const { container } = render(
      <MetricCard label="Metric" value="10" />
    );
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('renders sparkline when trend is provided', () => {
    const { container } = render(
      <MetricCard label="Metric" value="10" trend={[1, 2, 3]} />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

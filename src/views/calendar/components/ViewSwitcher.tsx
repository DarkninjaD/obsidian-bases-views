import React from 'react';

interface ViewSwitcherProps {
  value: 'month' | 'week';
  onChange: (value: 'month' | 'week') => void;
}

/**
 * ViewSwitcher component for toggling between month and week views.
 */
export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ value, onChange }) => {
  return (
    <div className="bv-calendar-view-switcher">
      <button
        className={`bv-calendar-view-button ${
          value === 'month' ? 'bv-calendar-view-button-active' : ''
        }`}
        onClick={() => onChange('month')}
      >
        Month
      </button>
      <button
        className={`bv-calendar-view-button ${
          value === 'week' ? 'bv-calendar-view-button-active' : ''
        }`}
        onClick={() => onChange('week')}
      >
        Week
      </button>
    </div>
  );
};

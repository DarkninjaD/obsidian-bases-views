import * as React from "react";

interface NoTaskProps {
  startDateProperty: string;
  endDateProperty: string;
}

/**
 * TaskList component displaying task names and dates.
 * Shows on the left side of the Gantt chart.
 * Supports grouped display with collapsible sections.
 */
export const NoTask: React.FC<NoTaskProps> = ({
  startDateProperty,
  endDateProperty,
}) => {
    return (
      <div className="bv-gantt-empty-overlay">
        <div className="bv-gantt-empty-message">
          <p>No tasks with valid dates found</p>
          <p className="bv-gantt-empty-hint">
            Click on the chart to create your first task, or add{" "}
            <code>{startDateProperty}</code> and <code>{endDateProperty}</code>{" "}
            properties to existing notes.
          </p>
        </div>
      </div>
    );
};

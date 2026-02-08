import {
  parseDate,
  valueToString,
  sortTasksByHierarchy,
  entriesToTasks,
  extractLinkText
} from './ganttHelpers';
// Mock types
interface MockFile {
  path: string;
  basename: string;
  parent: { path: string } | null;
}
interface MockTask {
  id: string;
  file: any;
  title: string;
  startDate: Date;
  endDate: Date;
  startDateProperty: string;
  endDateProperty: string;
  row: number;
  group?: string;
  parentId?: string;
}

// Simple test runner
function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (e) {
    console.error(`❌ ${name}`);
    console.error(e);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) throw new Error(`${message}: Expected ${expected}, got ${actual}`);
}

console.log('--- Running Gantt Helper Tests ---');

runTest('extractLinkText - basic', () => {
  assertEqual(extractLinkText('Plain Text'), 'Plain Text', 'Plain text should pass through');
  assertEqual(extractLinkText('[[WikiLink]]'), 'WikiLink', 'WikiLink should be extracted');
  assertEqual(extractLinkText('[[Path/To/File|Alias]]'), 'Alias', 'Alias should be preferred');
  assertEqual(extractLinkText({ width: 100 }), '{"width":100}', 'Objects should be stringified if not link-like');
  // Mock link object from Bases/Obsidian
  const linkObj = { type: 'file', path: 'Folder/Note.md', displayText: 'Note' };
  assertEqual(extractLinkText(linkObj), 'Note', 'Link object should use displayText');
});

runTest('parseDate - formats', () => {
  const d1 = parseDate('2023-01-01');
  assert(d1 instanceof Date && !isNaN(d1.getTime()), 'ISO string should parse');

  const d2 = parseDate(1672531200000);
  assert(d2 instanceof Date && !isNaN(d2.getTime()), 'Timestamp should parse');

  // Test other formats if implemented (e.g. via generic parsing lib or custom logic)
  // const d3 = parseDate('01.01.2023');
});

runTest('sortTasksByHierarchy - simple tree', () => {
  const mockFile = { path: 'test.md', basename: 'test' };
  const d = new Date();

  const t1 = { id: 'epic', title: 'Epic', parentId: undefined } as MockTask;
  const t2 = { id: 'story', title: 'Story', parentId: 'epic' } as MockTask;
  const t3 = { id: 'task', title: 'Task', parentId: 'story' } as MockTask;

  const tasks = [t3, t1, t2]; // Shuffled
  const sorted = sortTasksByHierarchy(tasks as any);

  assertEqual(sorted[0].id, 'epic', 'Root should be first');
  assertEqual(sorted[1].id, 'story', 'Child should follow root');
  assertEqual(sorted[2].id, 'task', 'Grandchild should follow child');
});

runTest('sortTasksByHierarchy - orphans', () => {
  const t1 = { id: 'epic', title: 'Epic' } as MockTask;
  const t2 = { id: 'orphan', title: 'Orphan', parentId: 'missing' } as MockTask;

  const tasks = [t2, t1];
  const sorted = sortTasksByHierarchy(tasks as any);

  // Orphans go to bottom (or top level roots if we treat them as such, plan said bottom)
  // Roots are processed first. Orphan with missing parent effectively becomes a root if we can't find parent?
  // Or explicitly put at end. Let's see implementation.
  // Plan: "Place orphans (tasks with no links or invalid links) at the bottom."

  // Implementation detail: If parent not found, it's a root? Or separate list?
  // Let's assume implementation will put valid trees first, then orphans.

  assert(sorted.length === 2, 'Should keep all tasks');
  assertEqual(sorted[0].id, 'epic', 'Valid root first');
  assertEqual(sorted[1].id, 'orphan', 'Orphan last');
});

runTest('sortTasksByHierarchy - cycles', () => {
  const t1 = { id: 'A', title: 'A', parentId: 'B' } as MockTask;
  const t2 = { id: 'B', title: 'B', parentId: 'A' } as MockTask;

  const tasks = [t1, t2];
  const sorted = sortTasksByHierarchy(tasks as any);

  assert(sorted.length === 2, 'Should handle cycles without crashing');
  // Order might depend on which is picked as "root" first, but shouldn't hang.
});

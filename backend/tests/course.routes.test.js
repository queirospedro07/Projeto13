import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveCourseAccessState } from '../src/routes/course.routes.js';

test('resolveCourseAccessState only marks enrolled when there is a real enrollment or ownership', () => {
  const noEnrollment = resolveCourseAccessState({
    user: { id: 'user-1', role: 'USER' },
    course: { creatorId: 'creator-1' },
    enrollmentRow: null,
  });

  assert.equal(noEnrollment.isCreator, false);
  assert.equal(noEnrollment.isEnrolled, false);
  assert.equal(noEnrollment.userProgress, 0);

  const isCreator = resolveCourseAccessState({
    user: { id: 'user-1', role: 'USER' },
    course: { creatorId: 'user-1' },
    enrollmentRow: null,
  });

  assert.equal(isCreator.isCreator, true);
  assert.equal(isCreator.isEnrolled, true);
  assert.equal(isCreator.userProgress, 100);

  const hasEnrollment = resolveCourseAccessState({
    user: { id: 'user-1', role: 'USER' },
    course: { creatorId: 'creator-1' },
    enrollmentRow: { id: 'enrollment-1', progressPercent: 24 },
  });

  assert.equal(hasEnrollment.isCreator, false);
  assert.equal(hasEnrollment.isEnrolled, true);
  assert.equal(hasEnrollment.userProgress, 24);

  const isCollaborator = resolveCourseAccessState({
    user: { id: 'collab-1', role: 'USER' },
    course: { creatorId: 'creator-1' },
    enrollmentRow: null,
    isCollaborator: true,
  });

  assert.equal(isCollaborator.isCreator, true);
  assert.equal(isCollaborator.isEnrolled, true);
  assert.equal(isCollaborator.userProgress, 100);
});

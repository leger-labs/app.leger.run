# Phase 4: Regression Prevention Strategy

## Executive Summary

This document outlines the comprehensive testing and validation strategy to ensure zero regressions during the UI component migration from custom wrappers to direct Radix UI + Tailwind usage.

**Risk Level**: HIGH - Modifying 20 components across 50 files with RJSF integration

**Mitigation**: Multi-layer testing strategy with automated and manual checks

---

## Testing Layers

### Layer 1: Pre-Migration Baseline

**Objective**: Establish known-good state before any changes

#### Visual Regression Baseline
```bash
# Capture screenshots of all pages
npm run test:visual:baseline

# Pages to capture:
- / (home/dashboard)
- /environments
- /environments/:id
- /api-keys
- /deployments
- /settings
- All RJSF form pages
```

#### Test Suite Baseline
```bash
# Run all existing tests and capture results
npm run test                  # Unit tests
npm run test:integration      # Integration tests
npm run test:e2e             # E2E tests
npm run test:a11y            # Accessibility tests

# Save results to baseline/
./component-audit/save-test-baseline.sh
```

#### Bundle Size Baseline
```bash
# Capture current bundle size
npm run build
npm run analyze

# Save metrics:
- Total bundle size
- Per-route chunk sizes
- Dependency tree size
```

#### Manual Testing Checklist
Create checklist for manual testing:

- [ ] All forms render correctly
- [ ] All forms validate correctly
- [ ] All forms submit successfully
- [ ] All interactive elements respond to clicks
- [ ] All tooltips/popovers work
- [ ] All keyboard navigation works
- [ ] All screen reader announcements correct
- [ ] All visual states (hover, focus, disabled) work

---

### Layer 2: Per-Component Migration Testing

**Objective**: Validate each component migration individually

#### Automated Tests Per Component

```typescript
// Example: Button migration test

describe('Button Migration - ${componentName}', () => {
  describe('Visual Regression', () => {
    test('all variant combinations match baseline', async () => {
      // Test default, destructive, outline, etc.
      for (const variant of ['default', 'destructive', 'outline', ...]) {
        await compareScreenshot(`button-${variant}`, 'before', 'after')
      }
    })

    test('all size combinations match baseline', async () => {
      for (const size of ['default', 'sm', 'lg', 'icon']) {
        await compareScreenshot(`button-${size}`, 'before', 'after')
      }
    })
  })

  describe('Functional Tests', () => {
    test('onClick handler fires', async () => {
      const onClick = vi.fn()
      render(<button className={buttonVariants()} onClick={onClick}>Click</button>)
      await userEvent.click(screen.getByRole('button'))
      expect(onClick).toHaveBeenCalledOnce()
    })

    test('disabled state prevents clicks', async () => {
      const onClick = vi.fn()
      render(<button disabled onClick={onClick}>Click</button>)
      await userEvent.click(screen.getByRole('button'))
      expect(onClick).not.toHaveBeenCalled()
    })

    test('asChild pattern works (if applicable)', async () => {
      render(
        <Slot className={buttonVariants()}>
          <a href="/test">Link</a>
        </Slot>
      )
      expect(screen.getByRole('link')).toHaveClass('...')
    })
  })

  describe('Accessibility', () => {
    test('keyboard navigation works', async () => {
      render(<button className={buttonVariants()}>Click</button>)
      await userEvent.tab()
      expect(screen.getByRole('button')).toHaveFocus()
      await userEvent.keyboard('{Enter}')
      // Verify action triggered
    })

    test('screen reader announcements correct', async () => {
      const { container } = render(<button>Click me</button>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('TypeScript', () => {
    test('prop types are compatible', () => {
      // This is a compile-time test
      // Verify no TS errors in usage files
    })
  })
})
```

#### Per-Component Validation Checklist

After migrating each component:

- [ ] TypeScript compiles without errors
- [ ] Unit tests pass
- [ ] Visual regression tests pass
- [ ] Accessibility tests pass
- [ ] All usages in codebase still work
- [ ] No console errors in dev mode
- [ ] Component renders identically to before

---

### Layer 3: Integration Testing

**Objective**: Validate components work together correctly

#### Page-Level Tests

```typescript
describe('Page Integration - Dashboard', () => {
  test('all components render correctly together', async () => {
    render(<DashboardPage />)

    // Verify all key components present
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()

    // Visual regression
    await comparePageScreenshot('/dashboard', 'before', 'after')
  })

  test('component interactions work', async () => {
    render(<DashboardPage />)

    // Click button, verify dialog opens
    await userEvent.click(screen.getByText('Create'))
    expect(screen.getByRole('dialog')).toBeVisible()
  })
})
```

#### RJSF Form Integration Tests

**CRITICAL**: Test all forms after migrating Input, Label, Select, etc.

```typescript
describe('RJSF Forms', () => {
  const forms = [
    { name: 'Environment Form', path: '/environments/new' },
    { name: 'API Key Form', path: '/api-keys/create' },
    // Add all RJSF forms
  ]

  forms.forEach(({ name, path }) => {
    describe(name, () => {
      test('form renders all fields', async () => {
        render(<FormPage />)
        // Verify all expected fields present
      })

      test('validation works', async () => {
        render(<FormPage />)

        // Submit empty form
        await userEvent.click(screen.getByText('Submit'))

        // Verify validation errors shown
        expect(screen.getByText(/required/i)).toBeVisible()
      })

      test('form submission works', async () => {
        const onSubmit = vi.fn()
        render(<FormPage onSubmit={onSubmit} />)

        // Fill form
        await userEvent.type(screen.getByLabelText('Name'), 'Test')
        await userEvent.click(screen.getByText('Submit'))

        // Verify submitted
        expect(onSubmit).toHaveBeenCalledWith({
          name: 'Test',
          ...
        })
      })

      test('custom widgets work', async () => {
        render(<FormPage />)

        // Test custom widget behavior
        // e.g., date picker, secret field, etc.
      })
    })
  })
})
```

---

### Layer 4: End-to-End Testing

**Objective**: Validate full user workflows

#### E2E Test Scenarios

```typescript
// tests/e2e/critical-flows.spec.ts

test('user can create environment with variables', async ({ page }) => {
  // Navigate to environments
  await page.goto('/environments')

  // Click create
  await page.click('text=Create Environment')

  // Fill form
  await page.fill('[name="name"]', 'Test Env')
  await page.fill('[name="description"]', 'Test Description')

  // Add variable
  await page.click('text=Add Variable')
  await page.fill('[name="variables[0].key"]', 'API_KEY')
  await page.fill('[name="variables[0].value"]', 'secret123')

  // Submit
  await page.click('text=Create')

  // Verify created
  await expect(page.locator('text=Test Env')).toBeVisible()
})

test('user can update API key', async ({ page }) => {
  // Full flow test
})

// Add all critical user flows
```

---

### Layer 5: Performance Testing

**Objective**: Ensure migration doesn't degrade performance

#### Performance Metrics

```bash
# Lighthouse CI
npm run lighthouse:ci

# Metrics to track:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Cumulative Layout Shift (CLS)
- Total Blocking Time (TBT)
```

#### Bundle Size Monitoring

```bash
# After migration, compare bundle sizes
npm run build
npm run analyze

# Expected result: Bundle size should DECREASE
# (Removing wrapper components = less code)
```

---

### Layer 6: Accessibility Testing

**Objective**: Maintain WCAG 2.1 AA compliance

#### Automated A11y Tests

```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

describe('Accessibility - All Pages', () => {
  const pages = ['/dashboard', '/environments', '/api-keys', ...]

  pages.forEach(page => {
    test(`${page} has no accessibility violations`, async () => {
      const { container } = render(<Page />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
```

#### Manual A11y Testing

- [ ] All interactive elements keyboard accessible
- [ ] All images have alt text
- [ ] All form fields have labels
- [ ] Color contrast ratios meet WCAG AA
- [ ] Screen reader navigation works
- [ ] Focus indicators visible
- [ ] No keyboard traps

---

## Testing Timeline

### Phase 4A: Pre-Migration (Before any code changes)
**Duration**: 1 day

1. Set up visual regression testing tools
2. Capture all baselines (visual, tests, bundle)
3. Run manual testing checklist
4. Document current state

### Phase 4B: During Migration (Per component)
**Duration**: Per component in migration plan

1. Migrate component
2. Run component-specific tests
3. Fix any failures
4. Commit if all tests pass
5. Move to next component

### Phase 4C: Post-Migration (After all components)
**Duration**: 2 days

1. Run full test suite
2. Run visual regression on all pages
3. Run E2E tests for critical flows
4. Performance audit
5. Accessibility audit
6. Manual testing of all RJSF forms
7. Final verification checklist

---

## Rollback Plan

### If Component Migration Fails

```bash
# Immediate rollback for single component
git revert <commit-hash>
git push

# Verify rollback successful
npm run test
npm run build
```

### If Multiple Components Fail

```bash
# Rollback to backup branch
git checkout backup/pre-migration
git push --force-with-lease origin main

# Analyze what went wrong
# Fix issues
# Retry migration
```

### If Production Issues Detected

```bash
# Emergency rollback
git revert <migration-pr-commit>
git push origin main --force-with-lease

# Trigger deployment
npm run deploy

# Post-mortem
# Document what failed
# Update testing strategy
# Retry with better validation
```

---

## Validation Checklist (Final Sign-Off)

Before declaring migration complete:

### Technical Validation
- [ ] All TypeScript compilation errors resolved
- [ ] All unit tests passing (>95% coverage maintained)
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Visual regression tests 100% matching
- [ ] No console errors in dev or prod builds
- [ ] Bundle size decreased (or stayed same)
- [ ] Lighthouse scores maintained or improved
- [ ] Accessibility audit passes (0 violations)

### Functional Validation
- [ ] All pages render correctly
- [ ] All forms work (especially RJSF forms)
- [ ] All form validation works
- [ ] All form submissions work
- [ ] All interactive elements work (buttons, links, etc.)
- [ ] All overlays work (dialogs, popovers, tooltips)
- [ ] All navigation works
- [ ] All data loading works
- [ ] All error handling works

### RJSF-Specific Validation
- [ ] Environment form works
- [ ] API key form works
- [ ] All custom widgets work
- [ ] All custom fields work
- [ ] All field templates work
- [ ] Form validation works
- [ ] Form submission works
- [ ] Error messages display correctly

### Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### User Acceptance
- [ ] Product team sign-off
- [ ] Design team sign-off
- [ ] QA team sign-off
- [ ] Stakeholder approval

---

## Tools Required

### Visual Regression
- **Recommended**: Percy or Chromatic
- **Alternative**: Playwright screenshots + pixelmatch

### Testing Frameworks
- Vitest (unit tests)
- Playwright (E2E tests)
- Testing Library (component tests)
- jest-axe (a11y tests)

### Monitoring
- Lighthouse CI
- Bundle analyzer (webpack-bundle-analyzer or vite-plugin-analyze)
- Sentry (error monitoring)

---

## Success Criteria

Migration is successful when:

1. ✅ All tests passing
2. ✅ Visual regression 100% match
3. ✅ Bundle size reduced by at least 10% (removing wrapper components)
4. ✅ No accessibility regressions
5. ✅ No performance regressions
6. ✅ All RJSF forms working identically
7. ✅ Zero console errors
8. ✅ Zero TypeScript errors
9. ✅ All stakeholders approve
10. ✅ Production deployment successful with no incidents

---

## Risk Mitigation

### High Risk: RJSF Forms Breaking

**Mitigation**:
- Migrate RJSF-critical components LAST
- Test each form individually after migration
- Create RJSF-specific test suite
- Manual QA on all forms before merging

### Medium Risk: Visual Differences

**Mitigation**:
- Strict visual regression testing
- Design team review of all changes
- Pixel-perfect comparison tools
- Fallback to wrapper if styling too complex

### Low Risk: TypeScript Errors

**Mitigation**:
- Strong type checking in CI
- No `any` types allowed
- Gradual migration (one component at a time)
- TypeScript strict mode enabled

---

## Appendix: Test Script Examples

### Baseline Capture Script

```bash
#!/bin/bash
# component-audit/save-test-baseline.sh

mkdir -p baseline/

# Save test results
npm run test > baseline/unit-tests.txt
npm run test:integration > baseline/integration-tests.txt
npm run test:e2e > baseline/e2e-tests.txt

# Save bundle size
npm run build
npm run analyze > baseline/bundle-analysis.txt

# Save screenshots
npm run test:visual:baseline
cp -r .screenshots baseline/visual-regression/

echo "Baseline saved to baseline/"
```

### Post-Migration Comparison Script

```bash
#!/bin/bash
# component-audit/compare-to-baseline.sh

mkdir -p results/

# Run tests
npm run test > results/unit-tests.txt
npm run test:integration > results/integration-tests.txt
npm run test:e2e > results/e2e-tests.txt

# Compare results
diff baseline/unit-tests.txt results/unit-tests.txt
diff baseline/integration-tests.txt results/integration-tests.txt
diff baseline/e2e-tests.txt results/e2e-tests.txt

# Compare bundle sizes
npm run build
npm run analyze > results/bundle-analysis.txt
diff baseline/bundle-analysis.txt results/bundle-analysis.txt

# Compare screenshots
npm run test:visual:compare

echo "Comparison complete. Check results/"
```

---

## Contact & Escalation

If migration issues arise:

1. **Technical Issues**: Review this document, check rollback plan
2. **Test Failures**: Analyze failure, fix or rollback
3. **Production Issues**: Immediate rollback, post-mortem
4. **Unclear Cases**: Document and request review from team

---

**Document Version**: 1.0
**Last Updated**: 2025-10-23
**Owner**: Engineering Team

# 🧪 AI Mastery v7.1.3 - Testing Checklist

**Version**: 7.1.3
**Date**: November 3, 2025
**Status**: Manual Testing Required

---

## ✅ Pre-Test Verification (COMPLETED)

- [x] Extension installed: `serigne-diagne.aimastery-vincian-analysis@7.1.3`
- [x] VSIX package: `aimastery-vincian-analysis-7.1.3.vsix` (629.9 KB)
- [x] Test file created: `test-analysis.ts`
- [x] Configuration settings verified in package.json

---

## 📋 Manual Testing Checklist

### 1. Extension Activation ✅

**Test**: Verify extension loads without errors

**Steps**:
1. Open VS Code
2. Press `Ctrl+Shift+P` to open Command Palette
3. Type "AI Mastery" - you should see commands listed
4. Open `test-analysis.ts` file

**Expected Results**:
- ✅ Extension activates on startup
- ✅ Command Palette shows AI Mastery commands
- ✅ No error notifications appear
- ✅ Status bar shows no errors

**Status**: [ ] PASS / [ ] FAIL
**Notes**: _______________________________________

---

### 2. Core Commands Testing 🔧

#### 2.1. Self Analysis Command

**Command**: `Ctrl+Alt+S` or `AI Mastery: 🧬 Analyze Self`

**Steps**:
1. Press `Ctrl+Alt+S`
2. Wait for analysis to complete
3. Check for results display

**Expected Results**:
- ✅ Command executes without errors
- ✅ Analysis runs on extension's own code
- ✅ Results displayed in tree view or notification
- ✅ No console errors

**Status**: [ ] PASS / [ ] FAIL
**Notes**: _______________________________________

#### 2.2. Analyze Current File Command

**Command**: `Ctrl+Alt+A` or `AI Mastery: Analyze Current File`

**Steps**:
1. Open `test-analysis.ts` file
2. Press `Ctrl+Alt+A`
3. Wait for analysis to complete
4. Observe results

**Expected Results**:
- ✅ Analysis runs on test-analysis.ts
- ✅ Shows cyclomatic complexity metrics
- ✅ Identifies high-complexity methods (e.g., `complexMethod`)
- ✅ Results appear in tree view
- ✅ **First analysis takes 1-3 seconds** (cache miss)

**Status**: [ ] PASS / [ ] FAIL
**Analysis Time**: _______ seconds
**Notes**: _______________________________________

#### 2.3. Auto Fix Command

**Command**: `Ctrl+Alt+F` or `AI Mastery: Auto Fix`

**Steps**:
1. Keep `test-analysis.ts` open
2. Press `Ctrl+Alt+F`
3. Observe suggested fixes

**Expected Results**:
- ✅ Command executes
- ✅ Suggestions displayed (if any)
- ✅ Can accept/reject suggestions
- ✅ No errors

**Status**: [ ] PASS / [ ] FAIL
**Notes**: _______________________________________

---

### 3. New v7.1.3 Features Testing 🆕

#### 3.1. Privacy-First Telemetry

**Setting**: `aimastery.telemetry.enabled`

**Steps**:
1. Press `Ctrl+,` to open Settings
2. Search for "aimastery telemetry"
3. Check the setting value
4. Read the privacy notice

**Expected Results**:
- ✅ Setting appears in VS Code settings
- ✅ **Default value is UNCHECKED (false)** ✨ (CRITICAL)
- ✅ Privacy notice is visible and clear
- ✅ Link to privacy policy works

**Screenshot**: Take a screenshot showing the setting

**Status**: [ ] PASS / [ ] FAIL
**Default Value**: [ ] false (CORRECT) / [ ] true (BUG!)
**Notes**: _______________________________________

#### 3.2. Configurable Notification Delay

**Setting**: `aimastery.notifications.delay`

**Steps**:
1. In Settings, search for "aimastery notifications"
2. Find `notifications.delay` setting
3. Note default value
4. Try changing to 500 (minimum) and 10000 (maximum)

**Expected Results**:
- ✅ Setting appears with slider/input
- ✅ Default: 2000ms (2 seconds)
- ✅ Minimum: 500ms
- ✅ Maximum: 10000ms
- ✅ Description is clear

**Status**: [ ] PASS / [ ] FAIL
**Default Value**: _______
**Notes**: _______________________________________

#### 3.3. Milestone Notifications Toggle

**Setting**: `aimastery.notifications.showMilestones`

**Steps**:
1. Find `notifications.showMilestones` setting
2. Note default value
3. Toggle it off
4. Perform an action that would trigger milestone

**Expected Results**:
- ✅ Setting appears as checkbox
- ✅ Default: true (enabled)
- ✅ When disabled, no milestone notifications appear
- ✅ Description is clear

**Status**: [ ] PASS / [ ] FAIL
**Default Value**: _______
**Notes**: _______________________________________

---

### 4. Caching System Testing ⚡ (CRITICAL)

**Feature**: 11.5x performance improvement from AnalysisCache

**Steps**:
1. Open Output panel (`Ctrl+Shift+U`)
2. Select "AI Mastery" from dropdown
3. Clear the output
4. Open `test-analysis.ts`
5. Run analysis: Press `Ctrl+Alt+A`
6. **Note the time** in Output panel
7. **Wait 2 seconds**
8. Run analysis again: Press `Ctrl+Alt+A`
9. **Note the time** in Output panel
10. Check for cache messages

**Expected Results - First Analysis (Cache MISS)**:
- ✅ Output shows: `⏳ Cache MISS for test-analysis.ts - analyzing...`
- ✅ Analysis takes 1-3 seconds
- ✅ AST parsing happens

**Expected Results - Second Analysis (Cache HIT)**:
- ✅ Output shows: `✅ Cache HIT for test-analysis.ts`
- ✅ **Analysis takes <0.5 seconds** ⚡
- ✅ **10x faster than first run** ✨
- ✅ Results identical to first run

**Measurements**:
- First analysis time: _______ ms
- Second analysis time: _______ ms
- Speedup: _______x

**Status**: [ ] PASS / [ ] FAIL
**Cache Working**: [ ] YES / [ ] NO
**Notes**: _______________________________________

---

### 5. Cache Invalidation Testing 🔄

**Test**: Verify cache invalidates on file change

**Steps**:
1. After step 4 above (cached analysis exists)
2. Edit `test-analysis.ts` - add a comment: `// Cache test`
3. Save file (`Ctrl+S`)
4. Run analysis again: Press `Ctrl+Alt+A`
5. Check Output panel

**Expected Results**:
- ✅ Output shows: `⏳ Cache MISS` (cache invalidated)
- ✅ Analysis runs fresh (1-3 seconds)
- ✅ New results include the change
- ✅ Content hash detected file modification

**Status**: [ ] PASS / [ ] FAIL
**Notes**: _______________________________________

---

### 6. TreeView Display Testing 🌳

**Test**: Verify analysis results display correctly

**Steps**:
1. Open AI Mastery sidebar (click icon in activity bar)
2. Run analysis on `test-analysis.ts`
3. Observe tree view updates

**Expected Results**:
- ✅ Tree view shows analysis results
- ✅ Displays file metrics (complexity, LOC, etc.)
- ✅ Shows Vincian principles (if applicable)
- ✅ Tree items are clickable
- ✅ No visual glitches

**Status**: [ ] PASS / [ ] FAIL
**Notes**: _______________________________________

---

### 7. Error Handling Testing ⚠️

#### 7.1. Invalid File Test

**Steps**:
1. Create a file with syntax errors: `test-invalid.ts`
2. Add content: `function broken( { invalid syntax`
3. Run analysis: `Ctrl+Alt+A`

**Expected Results**:
- ✅ Extension handles error gracefully
- ✅ Shows user-friendly error message
- ✅ No extension crash
- ✅ Can continue using extension

**Status**: [ ] PASS / [ ] FAIL
**Notes**: _______________________________________

#### 7.2. Large File Test

**Steps**:
1. Create a large TypeScript file (1000+ lines)
2. Run analysis
3. Observe performance

**Expected Results**:
- ✅ Analysis completes (may take longer)
- ✅ No timeout errors
- ✅ Results cached for second run
- ✅ UI remains responsive

**Status**: [ ] PASS / [ ] FAIL
**Analysis Time**: _______ seconds
**Notes**: _______________________________________

---

### 8. Multi-Language Support Testing 🌍

**Test**: Verify analysis works on different languages

**Steps**:
1. Create `test.js` (JavaScript)
2. Add code similar to test-analysis.ts
3. Run analysis
4. Repeat for `test.py` (Python) if supported

**Expected Results**:
- ✅ JavaScript analysis works
- ✅ Python analysis works (if supported)
- ✅ Language detection automatic
- ✅ Appropriate parser used

**Status**: [ ] PASS / [ ] FAIL
**Languages Tested**: _______________________________________
**Notes**: _______________________________________

---

### 9. Output Panel / Console Testing 📝

**Test**: Verify logging and error reporting

**Steps**:
1. Open Output panel (`Ctrl+Shift+U`)
2. Select "AI Mastery" from dropdown
3. Perform various actions
4. Open Developer Tools (`Help > Toggle Developer Tools`)
5. Check Console tab

**Expected Results - Output Panel**:
- ✅ Clear, readable log messages
- ✅ Cache hit/miss messages visible
- ✅ Analysis progress updates
- ✅ No spam/excessive logging

**Expected Results - Developer Console**:
- ✅ No red error messages
- ✅ No warnings about missing dependencies
- ✅ No memory leak warnings
- ✅ Clean console on startup

**Status**: [ ] PASS / [ ] FAIL
**Errors Found**: _______________________________________
**Notes**: _______________________________________

---

### 10. Privacy Compliance Testing 🔒 (CRITICAL)

**Test**: Verify telemetry respects user consent

**Steps**:
1. Ensure `aimastery.telemetry.enabled` is **false** (default)
2. Open Output panel
3. Perform several actions (analysis, commands)
4. Check for telemetry messages

**Expected Results**:
- ✅ Output shows: `[TELEMETRY DISABLED] Event '...' not tracked (user privacy respected)`
- ✅ No data sent to external servers
- ✅ Privacy notice clear in settings
- ✅ User must explicitly opt-in

**Status**: [ ] PASS / [ ] FAIL
**Privacy Respected**: [ ] YES / [ ] NO (CRITICAL BUG!)
**Notes**: _______________________________________

---

### 11. Notification Timing Testing ⏱️

**Test**: Verify notification delay is configurable

**Steps**:
1. Set `notifications.delay` to **500ms** (minimum)
2. Trigger a milestone notification (first analysis)
3. Note when notification appears
4. Set `notifications.delay` to **5000ms** (5 seconds)
5. Trigger another action
6. Note timing

**Expected Results**:
- ✅ 500ms delay: Notification appears almost immediately
- ✅ 5000ms delay: Notification appears after ~5 seconds
- ✅ Timing matches configured value
- ✅ Can disable entirely with `showMilestones: false`

**Status**: [ ] PASS / [ ] FAIL
**Notes**: _______________________________________

---

### 12. Performance Regression Testing 📊

**Test**: Verify v7.1.3 performance improvements

**Steps**:
1. Analyze 10 different TypeScript files
2. Measure average analysis time
3. Check memory usage in Task Manager

**Expected Results**:
- ✅ Cache hit rate: >70% (after initial runs)
- ✅ Average analysis time: <1 second (with cache)
- ✅ Memory stable (no leaks over 30 minutes)
- ✅ No UI freezing

**Measurements**:
- Average analysis time (first): _______ ms
- Average analysis time (cached): _______ ms
- Memory usage (start): _______ MB
- Memory usage (after 30 min): _______ MB

**Status**: [ ] PASS / [ ] FAIL
**Notes**: _______________________________________

---

## 🎯 Critical Success Criteria

These MUST pass for v7.1.3 to be production-ready:

### Privacy (CRITICAL)
- [ ] ✅ **Telemetry defaults to DISABLED (false)**
- [ ] ✅ Privacy notice visible in settings
- [ ] ✅ No data sent when telemetry disabled
- [ ] ✅ Logging shows "TELEMETRY DISABLED" messages

### Performance (CRITICAL)
- [ ] ✅ **Caching system works (10x speedup)**
- [ ] ✅ Cache hit messages in Output panel
- [ ] ✅ Cache invalidates on file change
- [ ] ✅ Second analysis <0.5 seconds

### Configuration (HIGH)
- [ ] ✅ Notification delay setting works
- [ ] ✅ Milestone toggle setting works
- [ ] ✅ Settings persist across restarts

### Stability (HIGH)
- [ ] ✅ No extension crashes
- [ ] ✅ No console errors
- [ ] ✅ No memory leaks
- [ ] ✅ All commands functional

---

## 🐛 Bug Reporting Template

If you find any issues, document them here:

### Bug #1
**Title**: _______________________________________
**Severity**: [ ] CRITICAL / [ ] HIGH / [ ] MEDIUM / [ ] LOW
**Steps to Reproduce**:
1. _______________________________________
2. _______________________________________
3. _______________________________________

**Expected**: _______________________________________
**Actual**: _______________________________________
**Screenshots**: _______________________________________
**Error Messages**: _______________________________________

---

## ✅ Final Verification

After completing all tests:

- [ ] All CRITICAL tests passed
- [ ] All HIGH priority tests passed
- [ ] No blocker bugs found
- [ ] Performance meets expectations
- [ ] Privacy compliance verified
- [ ] Ready for production deployment

**Overall Status**: [ ] ✅ PASS - Ready to Publish / [ ] ❌ FAIL - Needs Fixes

**Tester Signature**: _______________________________________
**Date**: _______________________________________
**Notes**: _______________________________________

---

## 🚀 Next Steps After Testing

### If All Tests Pass ✅
1. Update GitHub with test results
2. Publish to marketplace: `vsce publish`
3. Monitor early adopter feedback
4. Celebrate! 🎉

### If Tests Fail ❌
1. Document all bugs in GitHub issues
2. Prioritize critical fixes
3. Create hotfix branch
4. Re-test after fixes
5. Re-package VSIX

---

**Happy Testing!** 🧪

*AI Mastery v7.1.3 - Privacy, Performance, Polish*

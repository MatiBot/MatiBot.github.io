# Website Improvement Recommendations

This document outlines potential improvements for the mati.bot Jekyll website.

**Last Updated:** January 2025 - Reorganized with pending items prioritized at top, completed items at bottom

## Status Legend
- ✅ **FIXED** - Issue has been resolved
- ⚠️ **PENDING** - Issue still needs attention
- 🆕 **NEW** - Newly identified issue

---

## 🔴 HIGH PRIORITY - Pending Issues

### Accessibility & Quick Wins

#### 1. **Missing Reading Time** 🆕 ⚠️
**Files:** `_layouts/post.html`, `_layouts/blog.html`

**Issue:** No reading time estimate for blog posts.

**Recommendation:** Add reading time calculation:
- Use Jekyll plugin like `jekyll-reading-time`
- Or calculate manually: `{{ page.content | number_of_words | divided_by: 200 }} min read`
- Display next to post date

---

## 🟡 MEDIUM PRIORITY - Pending Issues

### User Experience

#### 6. **Missing Last Modified Date** 🆕 ⚠️
**Files:** `_layouts/post.html`

**Issue:** Only shows publication date, not last modified date.

**Recommendation:** 
- Use `page.last_modified_at` if available
- Or use Git to track last commit date
- Display "Last updated: [date]" if different from publication date

### Accessibility Improvements

#### 7. **Missing Semantic HTML5 Elements** 🆕 ⚠️
**Files:** All layout files

**Issue:** Using generic `<section>` and `<div>` elements instead of semantic HTML5 elements.

**Recommendation:** Use semantic elements:
- `<main>` for main content area
- `<article>` for blog posts
- `<header>` and `<footer>` where appropriate

---

## 🟢 LOW PRIORITY - Pending Issues

### Accessibility Improvements

#### 8. **Missing ARIA Landmarks** 🆕 ⚠️
**Files:** Layout files

**Issue:** While semantic HTML helps, explicit ARIA landmarks can improve screen reader navigation.

**Recommendation:** Add ARIA roles where appropriate (or use semantic HTML5 elements which is preferred).

### User Experience

#### 9. **Missing Dark Mode Support** 🆕 ⚠️
**Files:** CSS files

**Issue:** No dark mode support for modern user preferences.

**Recommendation:** 
- Add `@media (prefers-color-scheme: dark)` styles
- Or add manual dark mode toggle
- Consider using CSS variables for easier theming

### Security

### Modern Web Standards

#### 12. **Bootstrap Version** ⚠️
**Observation:** Using Bootstrap 3 (based on class names like `col-lg-offset-2`, `navbar-fixed-top`).

**Status:** Bootstrap 3 is still functional but outdated. Consider upgrading to Bootstrap 4 or 5 for:
- Better mobile responsiveness
- Modern CSS features (Flexbox/Grid)
- Improved accessibility
- Smaller bundle sizes
- Better performance

**Trade-off:** Upgrading requires significant refactoring of all layout files, navigation, custom CSS, and JavaScript interactions.

**Priority:** Low - Only consider if planning a major redesign.

#### 13. **jQuery Dependency** ⚠️
**Observation:** Using jQuery 3.7.1 (modern version, good).

**Status:** jQuery is required for Bootstrap 3. If upgrading to Bootstrap 5, jQuery is no longer needed.

**Priority:** Low - Only relevant if upgrading Bootstrap.

---

## ✅ COMPLETED / RESOLVED ISSUES

The following issues have been fixed and are documented here for reference:

### Critical Fixes
- ✅ **Post Content Lookup** - Now using `{{ page.content | markdownify }}` directly
- ✅ **Duplicate HTML IDs in Post Layout** - Fixed with unique IDs using slugify
- ✅ **Duplicate HTML IDs in Tag Layout** - Fixed with unique IDs using slugify
- ✅ **Invalid Anchor Href in Tag Page** - Fixed double hash issue
- ✅ **HTML Structure Verification** - Verified all templates; no self-closing tags or structural issues found

### Code Quality
- ✅ **Deprecated HTML Attributes** - Replaced `align="left"` with `class="text-left"`
- ✅ **Inline Styles** - Moved to CSS classes
- ✅ **Pagination Logic Redundancy** - Simplified pagination logic
- ✅ **Empty Facebook App ID** - Added proper conditional check
- ✅ **Deprecated Bootstrap Classes** - Verified acceptable for Bootstrap 3 (no action needed)
- ✅ **Base URL Handling** - Verified all paths use absolute paths correctly
- ✅ **Footer Excessive Spacing** - Replaced `<br />` tags with CSS margin
- ✅ **Ruby Version File Formatting** - Removed extra trailing newline from `.ruby-version` file
- ✅ **.jekyll-cache in .gitignore** - Added `.jekyll-cache/` to `.gitignore` to prevent cache files from being tracked
- ✅ **Backup File in Root Directory** - Removed `feed.xml.manual.backup` from repository (`.gitignore` already includes `*.backup` pattern)

### Performance Optimizations

#### CSS/JS Minification ✅
**Files:** Custom CSS/JS files

**Status:** ✅ **FIXED** - Custom CSS/JS files are now minified where possible.

**Implementation:**
- ✅ Downloaded minified jQuery 3.7.1 (jquery.min.js)
- ✅ Created npm build process with terser (JS) and clean-css-cli (CSS)
- ✅ Hardcoded background image path in `grayscale.css` (removed Jekyll Liquid syntax)
- ✅ Minified `grayscale.css` → `grayscale.min.css` (8.0K → 5.9K, 26% reduction)
- ✅ Minified `grayscale.js` → `grayscale.min.js` (5.2K → 2.2K, 58% reduction)
- ✅ Minified `timeline.css` → `timeline.min.css` (4.3K → 3.0K, 30% reduction)
- ✅ Minified `syntax.css` → `syntax.min.css` (3.9K → 2.0K, 49% reduction)
- ✅ Updated HTML templates to use minified versions

**Build Process:** Run `npm run minify` to regenerate minified files after changes.

**Impact:** Reduced CSS/JS file sizes by ~26-58%, saving ~14KB total and improving page load times.

#### Cache Headers ✅
**Status:** ✅ **FIXED** - GitHub Pages automatically sets appropriate cache headers for static assets.

**Note:** This is handled automatically by GitHub Pages/CDN configuration, requiring no code changes.

#### Other Performance Improvements
- ✅ **Image Optimization** - Optimized all large images (18.89 MB → 2.67 MB WebP = 85.8% reduction)
  - Generated WebP versions for all optimized images
  - Created `_includes/optimized-image.html` include for WebP with fallbacks
  - Updated HTML templates to use optimized images with WebP support
  - Added lazy loading for below-the-fold images
  - Added JavaScript to handle WebP background images in CSS
- ✅ **Font Loading** - Google Fonts includes `display=swap` and proper `preconnect`
- ✅ **JavaScript Loading Strategy** - Scripts properly use `defer` attribute
- ✅ **External Script Security** - Comments explain SRI approach for dynamic scripts
- ✅ **Missing DNS Prefetch Hints** - Added DNS prefetch hints for Disqus, Twitter, Facebook, and Google Analytics with conditional rendering
- ✅ **Missing Print Styles** - Added `@media print` styles to `css/grayscale.css`
  - Hides navigation, footer, social buttons, and breadcrumbs when printing
  - Optimizes colors for printing (black text on white background)
  - Ensures content fits page width
  - Adds page-break controls for headings and paragraphs

### SEO & Accessibility
- ✅ **Language Attribute** - HTML tag has `lang="en"` in all layouts
- ✅ **Structured Data** - JSON-LD structured data present for BlogPosting and WebSite types
- ✅ **Enhanced Structured Data** - Enhanced JSON-LD schema with `mainEntityOfPage`, `articleSection`, `keywords`, and `inLanguage` properties
- ✅ **Missing Breadcrumbs** - Added breadcrumb navigation to post and blog layouts with JSON-LD breadcrumb schema
  - Created `_includes/breadcrumbs.html` with semantic HTML and structured data
  - Added breadcrumbs to `_layouts/post.html` and `_layouts/blog.html`
  - Styled breadcrumbs to match site theme
- ✅ **Image Alt Text** - Images have alt text in most places
- ✅ **RSS Feed Enhancement** - Using `jekyll-feed` plugin for automatic feed generation
- ✅ **Referrer Policy** - `strict-origin-when-cross-origin` is set in `head.html`
- ✅ **Skip-to-Content Link** - Added skip link to all layouts with proper CSS styling and semantic `<main>` elements
- ✅ **Sitemap.xml** - Added `jekyll-sitemap` plugin to `_config.yml` for automatic sitemap generation
- ✅ **Missing Robots Meta Tag** - Added `<meta name="robots" content="index, follow">` to head.html
- ✅ **Navigation Button Accessibility** - Added `aria-label="Toggle navigation menu"` and `aria-expanded="false"` attributes to navbar toggle button
- ✅ **Missing Favicon Variants** - Verified multiple favicon sizes and formats are present (16x16, 32x32, apple-touch-icon) in `head.html`

### Modern Web Features
- ✅ **Missing Web App Manifest** - `manifest.json` exists and is linked in `head.html` for PWA support
  - ✅ `manifest.json` file exists in root directory with proper PWA configuration
  - ✅ Manifest link added to `_includes/head.html` (line 54)
  - ✅ Enables "Add to Home Screen" functionality and app-like experience on mobile devices

### Security
- ✅ **Open Redirect Risk** - Fixed 404 redirect to use `window.location.origin` for security
- ✅ **Content Security Policy** - Added CSP meta tag to `head.html` to help prevent XSS attacks
  - Configured to allow necessary external resources (Google Analytics, Disqus, Twitter, Facebook, Reddit, Google Fonts)
  - Allows inline scripts and styles as required by the site's functionality

### Documentation & Maintenance
- ✅ **README Enhancement** - Comprehensive documentation added
- ✅ **.gitignore Enhancement** - Includes backup files, editor files, swap files
- ✅ **Ruby Version Documentation** - Created `.ruby-version` file and documented in README
- ✅ **Remove Unused Backup Files** - `.gitignore` now includes `*.old` pattern

---

## Summary

**Total Issues:** 7 pending, 38 completed

**Priority Breakdown:**
- 🔴 High Priority: 1 issue (reading time estimate)
- 🟡 Medium Priority: 2 issues (last modified date, semantic HTML5 elements)
- 🟢 Low Priority: 4 issues (ARIA landmarks, dark mode, Bootstrap/jQuery considerations)

**Recommendation:** Focus on the remaining high-priority item (reading time) as it provides a quick UX win. Medium-priority items like last modified date and semantic HTML5 elements will improve user experience and accessibility. Low-priority items can be addressed during major updates or redesigns.

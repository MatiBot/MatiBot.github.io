# Website Improvement Recommendations

This document outlines potential improvements for the mati.bot Jekyll website.

## Critical Issues

### 1. **Inefficient Post Content Lookup** ⚠️
**File:** `_layouts/post.html` (lines 24-28)

**Problem:** The template iterates through ALL posts to find one matching by title. This is O(n) and inefficient.

**Current Code:**
```liquid
{% for post in site.posts %}
  {% if page.title == post.title %}
    {{ post.content | markdownify }}
  {% endif %}
{% endfor %}
```

**Recommendation:** Use Jekyll's built-in post lookup. In Jekyll, `page.content` should already contain the post content when using the post layout. If not, use the post's permalink or date to match.

**Better Approach:**
```liquid
{{ page.content | markdownify }}
```

Or if you need to access the post object:
```liquid
{% assign post = site.posts | where: "title", page.title | first %}
{{ post.content | markdownify }}
```

### 2. **Duplicate HTML IDs**
**File:** `_layouts/post.html` (lines 10 and 40)

**Problem:** Both sections use `id="{{ page.title }}"`, which creates duplicate IDs on the same page. This is invalid HTML and can break JavaScript and accessibility.

**Fix:** Use unique IDs:
- Line 10: `id="post-{{ page.title | slugify }}"`
- Line 40: `id="social-{{ page.title | slugify }}"`

### 3. **Invalid HTML Structure**
**File:** `_layouts/post.html` (line 16)

**Problem:** `<p/>` is a self-closing tag, but `<p>` elements cannot be self-closing in HTML. This should be `<p>` with proper closing.

**Current:**
```html
<small> . {{ page.category }} . <a href="{{ page.url }}#disqus_thread">Comments</a><p/>
```

**Fix:**
```html
<small> . {{ page.category }} . <a href="{{ page.url }}#disqus_thread">Comments</a></small>
<p></p>
```

## Performance Improvements

### 4. **Remove Unused Backup Files**
**Files:** Multiple `.old` files in the repository

**Problem:** Backup files (`.old`) are being tracked and served unnecessarily:
- `css/bootstrap.min.css.old`
- `js/bootstrap.min.js.old`
- `js/jquery.js.old`

**Recommendation:** Remove these files from the repository. They should be in `.gitignore` if needed for local development.

### 5. **Optimize Font Loading**
**File:** `_includes/head.html` (line 40)

**Current:** Google Fonts are loaded without `font-display` parameter.

**Recommendation:** Add `font-display=swap` to prevent invisible text during font loading:
```html
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,700;1,400;1,700&family=Montserrat:wght@400;700&display=swap" rel="stylesheet">
```
(Note: `display=swap` is already in the URL, but consider using `font-display: swap` in CSS for better control)

### 6. **JavaScript Loading Strategy**
**File:** `_includes/js.html`

**Recommendation:** Consider adding `defer` or `async` to script tags where appropriate:
- jQuery should load synchronously (keep as is)
- Bootstrap can use `defer`
- Custom scripts can use `defer`

### 7. **External Script Security**
**Files:** Multiple external scripts loaded

**Recommendation:** Add Subresource Integrity (SRI) hashes for external scripts (Google Analytics, Disqus, Facebook SDK) where possible. Note: Some CDN providers don't support SRI for dynamic scripts.

## Code Quality & Best Practices

### 8. **Deprecated Bootstrap Classes**
**Files:** Multiple layout files

**Problem:** Using `col-lg-offset-2` which is deprecated in Bootstrap 3 and removed in Bootstrap 4+.

**Current Usage:** Found in `_layouts/post.html`, `_layouts/blog.html`, etc.

**Fix:** Replace with Bootstrap 3's offset classes or migrate to newer Bootstrap version:
- Bootstrap 3: `col-lg-offset-2` → `col-lg-offset-2` (if staying on Bootstrap 3, this is fine)
- Bootstrap 4+: Use margin utilities or flexbox offsets

### 9. **Missing Base URL Handling**
**Files:** Various templates

**Recommendation:** Ensure `site.baseurl` is properly used throughout templates for GitHub Pages compatibility. Most links look correct, but double-check all asset paths.

### 10. **Empty Facebook App ID**
**File:** `_includes/js.html` (line 34)

**Problem:** Facebook SDK loads with empty `appId` parameter.

**Current:**
```html
<script async defer crossorigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0&appId=&autoLogAppEvents=1"></script>
```

**Recommendation:** Either remove the Facebook share functionality if not needed, or add a proper App ID if you want Facebook sharing.

## SEO & Accessibility

### 11. **Missing Language Attribute**
**File:** `_includes/head.html`

**Good:** HTML tag has `lang="en"` (verified in layouts).

### 12. **Structured Data**
**File:** `_includes/head.html` (lines 44-67)

**Good:** JSON-LD structured data is present.

**Minor Improvement:** Consider adding `mainEntityOfPage` for BlogPosting schema.

### 13. **Image Alt Text**
**Status:** ✅ Good - Images have alt text in most places (header, career timeline, error page).

## Modern Web Standards

### 14. **Bootstrap Version**
**Observation:** Using Bootstrap 3 (based on class names like `col-lg-offset-2`, `navbar-fixed-top`).

**Consideration:** Bootstrap 3 is still functional but outdated. Consider upgrading to Bootstrap 4 or 5 for:
- Better mobile responsiveness
- Modern CSS features (Flexbox/Grid)
- Improved accessibility
- Smaller bundle sizes
- Better performance

**Trade-off:** Upgrading requires significant refactoring.

### 15. **jQuery Dependency**
**Observation:** Using jQuery 3.7.1 (modern version, good).

**Consideration:** For a simple static site, jQuery might be overkill. Consider vanilla JavaScript for simple interactions, but if you're using Bootstrap 3, jQuery is required.

## Security

### 16. **Content Security Policy**
**Recommendation:** Consider adding a Content Security Policy (CSP) header via `_config.yml` or server configuration. This helps prevent XSS attacks.

### 17. **Referrer Policy**
**Status:** ✅ Good - `strict-origin-when-cross-origin` is set in head.html.

## Documentation & Maintenance

### 18. **README Enhancement**
**File:** `README.md`

**Current:** Very minimal README.

**Recommendation:** Add:
- Setup instructions
- Development workflow
- Deployment process
- Key configuration options
- Dependencies overview

### 19. **.gitignore Enhancement**
**File:** `.gitignore`

**Current:** Only excludes `_site/` and `.sass-cache/`.

**Recommendation:** Add:
- `.old` files
- Editor files (`.DS_Store`, `.vscode/`, etc.)
- Backup files

## Summary Priority

**High Priority:**
1. Fix inefficient post lookup (Issue #1)
2. Fix duplicate IDs (Issue #2)
3. Fix invalid HTML (Issue #3)
4. Remove backup files (Issue #4)

**Medium Priority:**
5. Empty Facebook App ID (Issue #10)
6. Deprecated Bootstrap classes (Issue #8)
7. Documentation improvements (Issue #18)

**Low Priority (Nice to Have):**
8. Bootstrap/jQuery modernization (Issues #14, #15)
9. Performance optimizations (Issues #5, #6)
10. Security enhancements (Issue #16)


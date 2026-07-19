$base = "C:\Users\DAVID LEELEE\Documents\my choice\wedding-site-v2"

# Define active link mapping: filename -> link text to mark active
$activeMap = @{
  "about.html" = "our-story.html"
  "contact.html" = "contact.html"
  "events.html" = "events.html"
  "faq.html" = "faq.html"
  "gallery.html" = "gallery.html"
  "our-story.html" = "our-story.html"
  "wedding-details.html" = "wedding-details.html"
  "wedding-party.html" = "wedding-party.html"
  "timeline.html" = "timeline.html"
  "rsvp.html" = "rsvp.html"
  "gift-registry.html" = "gift-registry.html"
  "ai-assistant.html" = "ai-assistant.html"
  "developer.html" = "developer.html"
  "story.html" = "story.html"
  "preview.html" = "preview.html"
  "setup.html" = "setup.html"
  "login.html" = "login.html"
  "signup.html" = "signup.html"
  "forgot-password.html" = "forgot-password.html"
}

function Get-SidebarHTML($activeFile) {
  $active = $activeMap[$activeFile]
  
  # Build links with active class
  $links = @(
    @{href="index.html"; icon="fa-home"; label="Home"},
    @{href="our-story.html"; icon="fa-heart"; label="Our Story"},
    @{href="wedding-details.html"; icon="fa-info-circle"; label="Wedding Details"},
    @{href="wedding-party.html"; icon="fa-user-friends"; label="Wedding Party"},
    @{href="events.html"; icon="fa-calendar-alt"; label="Events"},
    @{href="gallery.html"; icon="fa-images"; label="Gallery"},
    @{href="timeline.html"; icon="fa-clock"; label="Timeline"},
    @{href="story.html"; icon="fa-book-open"; label="Love Story"},
    @{href="rsvp.html"; icon="fa-envelope"; label="RSVP"},
    @{href="gift-registry.html"; icon="fa-gift"; label="Gift Registry"},
    @{href="faq.html"; icon="fa-question-circle"; label="FAQ"},
    @{href="ai-assistant.html"; icon="fa-robot"; label="AI Assistant"},
    @{href="contact.html"; icon="fa-envelope"; label="Contact"},
    @{href="developer.html"; icon="fa-code"; label="Developer"}
  )
  
  $mainLinks = ""
  foreach ($l in $links[0..4]) {
    $cls = if ($l.href -eq $active) { ' class="active"' } else { '' }
    $mainLinks += "    <a href=`"$($l.href)`" class=`"sidebar-link$cls`"><i class=`"fas $($l.icon)`"></i> $($l.label)</a>`n"
  }
  
  $mediaLinks = ""
  foreach ($l in $links[5..7]) {
    $cls = if ($l.href -eq $active) { ' class="active"' } else { '' }
    $mediaLinks += "    <a href=`"$($l.href)`" class=`"sidebar-link$cls`"><i class=`"fas $($l.icon)`"></i> $($l.label)</a>`n"
  }
  
  $guestLinks = ""
  foreach ($l in $links[8..10]) {
    $cls = if ($l.href -eq $active) { ' class="active"' } else { '' }
    $guestLinks += "    <a href=`"$($l.href)`" class=`"sidebar-link$cls`"><i class=`"fas $($l.icon)`"></i> $($l.label)</a>`n"
  }
  
  $moreLinks = ""
  foreach ($l in $links[11..13]) {
    $cls = if ($l.href -eq $active) { ' class="active"' } else { '' }
    $moreLinks += "    <a href=`"$($l.href)`" class=`"sidebar-link$cls`"><i class=`"fas $($l.icon)`"></i> $($l.label)</a>`n"
  }

  return @"
<button class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle navigation menu">
  <i class="fas fa-bars icon-menu"></i><i class="fas fa-times icon-close"></i>
</button>
<div class="sidebar-overlay" id="sidebarOverlay"></div>
<aside class="sidebar-nav" id="sidebarNav" role="navigation" aria-label="Main navigation">
  <div class="sidebar-header">
    <div class="sidebar-brand">
      <div class="sidebar-brand-icon"><i class="fas fa-ring"></i></div>
      <div class="sidebar-brand-text">
        <div class="sidebar-brand-name">Forever &amp; Always</div>
        <div class="sidebar-brand-sub">Wedding Menu</div>
      </div>
    </div>
    <button class="sidebar-close" aria-label="Close menu"><i class="fas fa-times"></i></button>
  </div>
  <nav class="sidebar-links">
    <div class="sidebar-section-label">Main</div>
$mainLinks    <div class="sidebar-section-label">Media</div>
$mediaLinks    <div class="sidebar-section-label">Guests</div>
$guestLinks    <div class="sidebar-section-label">More</div>
$moreLinks  </nav>
  <div class="sidebar-footer">
    <div class="sidebar-user" id="sidebarUser" style="display:none">
      <div class="sidebar-user-avatar" id="sidebarAvatar" style="background:var(--gold)">?</div>
      <div class="sidebar-user-info">
        <div class="sidebar-user-name" id="sidebarUserName">User</div>
        <div class="sidebar-user-email" id="sidebarUserEmail">email</div>
      </div>
    </div>
    <div class="sidebar-user-badge" id="sidebarAuthBadge">
      <a href="login.html">Sign In</a>
      <a href="signup.html">Sign Up</a>
    </div>
    <div class="sidebar-user-badge" id="sidebarUserBadge" style="display:none">
      <a href="dashboard.html"><i class="fas fa-th-large"></i> Dashboard</a>
      <button id="sidebarLogoutBtn"><i class="fas fa-sign-out-alt"></i> Sign Out</button>
    </div>
  </div>
</aside>
<div class="page-wrapper">
"@
}

$cssLink = '<link rel="stylesheet" href="css/sidebar.css">'

# Files with standard nav structure
$standardFiles = @("about.html","contact.html","events.html","faq.html","gallery.html","our-story.html","wedding-details.html","wedding-party.html","timeline.html","rsvp.html","gift-registry.html","ai-assistant.html","developer.html","story.html")

# Files with no standard nav (auth pages, preview, setup)
$specialFiles = @("login.html","signup.html","forgot-password.html","preview.html","setup.html")

$updated = @()
$failed = @()

foreach ($file in ($standardFiles + $specialFiles)) {
  $path = Join-Path $base $file
  if (-not (Test-Path $path)) {
    $failed += "$file (not found)"
    continue
  }
  
  $content = Get-Content $path -Raw -Encoding UTF8
  $originalContent = $content
  
  # 1. Add sidebar.css link - insert before first <link rel="stylesheet" href="css/
  if ($content -notmatch 'sidebar\.css') {
    # Try to insert before the first css/style.css link
    if ($content -match '(<link rel="stylesheet" href="css/style\.css">)') {
      $content = $content -replace '(<link rel="stylesheet" href="css/style\.css">)', "$cssLink`n`$1"
    }
    elseif ($content -match '(<link rel="stylesheet" href="css/developer\.css">)') {
      $content = $content -replace '(<link rel="stylesheet" href="css/developer\.css">)', "$cssLink`n`$1"
    }
    else {
      # Fallback: insert before </head>
      $content = $content -replace '(</head>)', "$cssLink`n`$1"
    }
  }
  
  # 2. Replace nav element
  $sidebarHTML = Get-SidebarHTML $file
  
  if ($file -in $standardFiles) {
    # Standard nav: <nav class="nav" id="navbar">...</nav>
    # Match from <nav to </nav> (the first occurrence after <body>)
    if ($content -match '(?s)(<nav class="nav" id="navbar">.*?</nav>)') {
      $content = $content -replace '(?s)(<nav class="nav" id="navbar">.*?</nav>)', $sidebarHTML
    }
    else {
      $failed += "$file (nav not found)"
      continue
    }
  }
  elseif ($file -eq "login.html") {
    # Login: insert sidebar after <body> tag, before back-home link
    if ($content -match '(<body>\s*\n\s*<a href="index\.html" class="back-home")') {
      $content = $content -replace '(<body>)(\s*\n\s*<a href="index\.html" class="back-home")', "`$1`n$sidebarHTML`n`$2"
    }
    else {
      $content = $content -replace '(<body>)', "`$1`n$sidebarHTML"
    }
  }
  elseif ($file -eq "signup.html") {
    # Signup: same pattern as login
    if ($content -match '(<body>\s*\n\s*<a href="index\.html" class="back-home")') {
      $content = $content -replace '(<body>)(\s*\n\s*<a href="index\.html" class="back-home")', "`$1`n$sidebarHTML`n`$2"
    }
    else {
      $content = $content -replace '(<body>)', "`$1`n$sidebarHTML"
    }
  }
  elseif ($file -eq "forgot-password.html") {
    # Forgot password: same pattern
    if ($content -match '(<body>\s*\n\s*<a href="login\.html" class="back-home")') {
      $content = $content -replace '(<body>)(\s*\n\s*<a href="login\.html" class="back-home")', "`$1`n$sidebarHTML`n`$2"
    }
    else {
      $content = $content -replace '(<body>)', "`$1`n$sidebarHTML"
    }
  }
  elseif ($file -eq "preview.html") {
    # Preview: no standard nav, insert sidebar after <body>
    $content = $content -replace '(<body>)', "`$1`n$sidebarHTML"
  }
  elseif ($file -eq "setup.html") {
    # Setup: has custom header, insert sidebar after <body> and before decorative elements
    $content = $content -replace '(<body>\s*\n\s*<!-- Decorative Backgrounds)', "`$1`n$sidebarHTML`n"
  }
  
  # 3. Add page-wrapper closing div and sidebar.js before </body>
  if ($content -notmatch 'page-wrapper') {
    # Add before last </body>
    $content = $content -replace '(</body>)', "</div><!-- /.page-wrapper -->`n<script src=`"js/sidebar.js`"></script>`n`$1"
  }
  
  if ($content -ne $originalContent) {
    Set-Content -Path $path -Value $content -Encoding UTF8 -NoNewline
    $updated += $file
  }
  else {
    $failed += "$file (no changes made)"
  }
}

Write-Host "`n=== UPDATED FILES ===" -ForegroundColor Green
$updated | ForEach-Object { Write-Host "  [OK] $_" -ForegroundColor Green }

if ($failed.Count -gt 0) {
  Write-Host "`n=== FAILED FILES ===" -ForegroundColor Red
  $failed | ForEach-Object { Write-Host "  [FAIL] $_" -ForegroundColor Red }
}

Write-Host "`nTotal updated: $($updated.Count)" -ForegroundColor Cyan
Write-Host "Total failed: $($failed.Count)" -ForegroundColor Cyan

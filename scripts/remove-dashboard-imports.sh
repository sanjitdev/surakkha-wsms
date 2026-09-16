#!/bin/bash
# Removes the per-page `import '../../mockups/01-priya/dashboard.css';`
# line from each page file now that styles/layout.css is imported once
# globally from web/src/main.tsx.
set -e
cd "C:/ZDrive Folders/E2E_Training/Surakkha/web"
for f in \
  src/pages/AuditLog.tsx \
  src/pages/CitizenAckPage.tsx \
  src/pages/CitizenStatusTimeline.tsx \
  src/pages/FieldIncidentDetailPage.tsx \
  src/pages/FieldQueuePage.tsx \
  src/pages/InboxDetail.tsx \
  src/pages/InboxList.tsx \
  src/pages/IncidentChainSegmentPage.tsx \
  src/pages/OperatorDashboard.tsx \
  src/pages/Settings.tsx \
  src/pages/SubmitReportPage.tsx \
  src/pages/VerifyFlow.tsx
do
  echo "Processing $f"
  sed -i "/^import '\.\.\/\.\.\/mockups\/01-priya\/dashboard\.css';$/d" "$f"
done
echo "Done."

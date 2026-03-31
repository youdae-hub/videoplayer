#!/bin/bash
# Strapi v5 Video 콘텐츠 타입 자동 설정 스크립트
# 사용법: cd /Users/youdae/Documents/projects/cms && bash /Users/youdae/Documents/projects/videoplayer/strapi-setup/setup.sh

set -e

CMS_DIR="$(pwd)"

# 1. Video API 디렉토리 생성
echo "📁 Creating Video content type (Strapi v5)..."
mkdir -p "$CMS_DIR/src/api/video/content-types/video"
mkdir -p "$CMS_DIR/src/api/video/controllers"
mkdir -p "$CMS_DIR/src/api/video/routes"
mkdir -p "$CMS_DIR/src/api/video/services"

# 2. 스키마 파일 복사
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cp "$SCRIPT_DIR/schema.json" "$CMS_DIR/src/api/video/content-types/video/schema.json"

# 3. Controller 생성 (Strapi v5 ES module)
cat > "$CMS_DIR/src/api/video/controllers/video.ts" << 'EOF'
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::video.video');
EOF

# 4. Service 생성 (Strapi v5 ES module)
cat > "$CMS_DIR/src/api/video/services/video.ts" << 'EOF'
import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::video.video');
EOF

# 5. Router 생성 (Strapi v5 ES module)
cat > "$CMS_DIR/src/api/video/routes/video.ts" << 'EOF'
import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::video.video');
EOF

# 6. 기존 v4 JS 파일이 있으면 제거
rm -f "$CMS_DIR/src/api/video/controllers/video.js"
rm -f "$CMS_DIR/src/api/video/services/video.js"
rm -f "$CMS_DIR/src/api/video/routes/video.js"

echo "✅ Video content type created (Strapi v5 format)!"
echo ""
echo "다음 단계:"
echo "1. Strapi 서버를 재시작하세요: npm run develop"
echo "2. http://localhost:1337/admin 에서 확인"
echo "3. Settings → Users & Permissions plugin → Roles → Public"
echo "4. Video: find, findOne, create, update, delete 체크"
echo "5. Upload: upload 체크"
echo "6. Save 클릭"

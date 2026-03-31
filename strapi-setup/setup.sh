#!/bin/bash
# Strapi Video 콘텐츠 타입 자동 설정 스크립트
# 사용법: cd /Users/youdae/Documents/projects/cms && bash /Users/youdae/Documents/projects/videoplayer/strapi-setup/setup.sh

set -e

CMS_DIR="$(pwd)"

# 1. Video API 디렉토리 생성
echo "📁 Creating Video content type..."
mkdir -p "$CMS_DIR/src/api/video/content-types/video"
mkdir -p "$CMS_DIR/src/api/video/controllers"
mkdir -p "$CMS_DIR/src/api/video/routes"
mkdir -p "$CMS_DIR/src/api/video/services"

# 2. 스키마 파일 복사
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cp "$SCRIPT_DIR/schema.json" "$CMS_DIR/src/api/video/content-types/video/schema.json"

# 3. Controller 생성
cat > "$CMS_DIR/src/api/video/controllers/video.js" << 'EOF'
'use strict';
const { createCoreController } = require('@strapi/strapi').factories;
module.exports = createCoreController('api::video.video');
EOF

# 4. Service 생성
cat > "$CMS_DIR/src/api/video/services/video.js" << 'EOF'
'use strict';
const { createCoreService } = require('@strapi/strapi').factories;
module.exports = createCoreService('api::video.video');
EOF

# 5. Router 생성
cat > "$CMS_DIR/src/api/video/routes/video.js" << 'EOF'
'use strict';
const { createCoreRouter } = require('@strapi/strapi').factories;
module.exports = createCoreRouter('api::video.video');
EOF

echo "✅ Video content type created!"
echo ""
echo "다음 단계:"
echo "1. Strapi 서버를 재시작하세요: npm run develop"
echo "2. http://localhost:1337/admin 에서 확인"
echo "3. Settings → Roles → Public → Video: find, findOne, create, update, delete 체크"
echo "4. Settings → Roles → Public → Upload: upload 체크"
echo "5. Save 클릭"

git init
git add README.md
git commit -m "docs: Initial repository setup with README"

git add .gitignore
git commit -m "chore: Add project-wide gitignore"

git add backend-django/news/models.py backend-django/news/admin.py
git commit -m "feat(django): Create NewsSource and Article database models"

git add backend-django/news/tasks.py backend-django/core/celery.py
git commit -m "feat(django): Implement Celery RSS scraper with image extraction"

git add backend-django/news/management/
git commit -m "chore(django): Add custom management commands for seeding"

git add backend-django/Dockerfile backend-django/requirements.txt
git commit -m "chore(django): Add Dockerfile and dependencies"

git add backend-django/
git commit -m "feat(django): Complete Django setup with migrations and configs"

git add ml-fastapi/main.py
git commit -m "feat(ml): Add FastAPI zero-shot classification endpoint"

git add ml-fastapi/
git commit -m "chore(ml): Add ML microservice Dockerfile and requirements"

git add backend-node/src/server.ts
git commit -m "feat(node): Setup Express API Gateway with Redis caching"

git add backend-node/src/services/
git commit -m "feat(node): Implement PostgreSQL query builder"

git add backend-node/
git commit -m "chore(node): Add Dockerfile, package.json and config"

git add frontend/src/components/ArticleCard.tsx
git commit -m "feat(react): Build ArticleCard component with image fallbacks"

git add frontend/src/components/ArticleFeed.tsx frontend/src/components/SkeletonCard.tsx
git commit -m "feat(react): Add grid feed and skeleton loading states"

git add frontend/src/components/Filters.tsx
git commit -m "feat(react): Add comprehensive sidebar filters UI"

git add frontend/src/services/ frontend/src/store/
git commit -m "feat(react): Integrate Zustand state management and API client"

git add frontend/src/index.css frontend/tailwind.config.js frontend/postcss.config.js
git commit -m "style(react): Configure Tailwind CSS and custom design tokens"

git add frontend/src/App.tsx frontend/src/main.tsx
git commit -m "feat(react): Complete Vite setup and core routing"

git add frontend/
git commit -m "chore(react): Add frontend build configuration and assets"

git add nginx/
git commit -m "feat(nginx): Add reverse proxy routing configuration"

git add docker-compose.yml
git commit -m "chore(docker): Add production orchestration with 9 services"

git add ARCHITECTURE.md
git commit -m "docs: Add comprehensive system architecture documentation"

git add .
git commit -m "chore: Final project configurations and cleanup"

git branch -M main
git remote add origin https://github.com/SandipAcharya/News_Aggregator.git
git push -u origin main

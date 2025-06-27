# 1단계: 빌드
FROM node:20 AS build

WORKDIR /app
COPY ../board_rv/package*.json ./
RUN npm install
COPY ../board_rv ./
RUN npm run build

# 2단계: Nginx로 정적 파일 서빙
FROM nginx:1.25-alpine

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
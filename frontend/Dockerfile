# Etap 1: Budowanie aplikacji
FROM node:20-alpine AS build

WORKDIR /app

# Kopiujemy pliki package
COPY package*.json ./

# Instalujemy zależności
RUN npm ci

# Kopiujemy resztę plików
COPY . .

# Budujemy aplikację
RUN npm run build

# Etap 2: Serwowanie aplikacji za pomocą nginx
FROM nginx:alpine

# Kopiujemy zbudowaną aplikację
COPY --from=build /app/dist /usr/share/nginx/html

# Kopiujemy konfigurację nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Otwieramy port 80
EXPOSE 80

# Nginx uruchomi się automatycznie
CMD ["nginx", "-g", "daemon off;"]

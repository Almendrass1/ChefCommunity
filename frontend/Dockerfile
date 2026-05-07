# Etapa 1: Construcción (Build) con Node.js
FROM node:18-alpine AS build

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código y construir la app
COPY . .
RUN npm run build

# Etapa 2: Servidor estático con Nginx
FROM nginx:alpine

# Copiar configuración de Nginx para permitir rutas de React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos estáticos generados en la etapa de build
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer el puerto 80
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
